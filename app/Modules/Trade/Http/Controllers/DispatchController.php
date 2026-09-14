<?php

namespace App\Modules\Trade\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\Models\DeliveryNote;
use App\Modules\Inventory\Models\Warehouse;
use App\Modules\Localization\Services\QrCodeSvgService;
use App\Modules\Trade\Models\DeliveryDriver;
use App\Modules\Trade\Models\DeliveryTrip;
use App\Modules\Trade\Models\DeliveryTripStop;
use App\Modules\Trade\Models\DeliveryVehicle;
use App\Modules\Trade\Services\CreateDispatchTripService;
use App\Modules\Trade\Services\RecordTripStopPodAction;
use App\Modules\Trade\Services\SettleTripCodAction;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DispatchController extends Controller
{
    public function index(Request $request): Response
    {
        $company = app(CurrentCompany::class)->get();

        $activeTripsCount = DeliveryTrip::where('company_id', $company->id)
            ->whereIn('status', ['scheduled', 'in_transit'])
            ->count();

        $completedTodayCount = DeliveryTrip::where('company_id', $company->id)
            ->where('status', 'completed')
            ->whereDate('updated_at', now()->toDateString())
            ->count();

        $activeVehiclesCount = DeliveryVehicle::where('company_id', $company->id)
            ->where('status', 'active')
            ->count();

        $pendingCodTotal = (float) DeliveryTrip::where('company_id', $company->id)
            ->where('cod_settlement_status', 'pending')
            ->sum('total_cod_collected');

        $statusFilter = $request->input('status');
        $search = $request->input('search');

        $tripsQuery = DeliveryTrip::with(['driver', 'vehicle', 'departureWarehouse', 'stops.customer'])
            ->where('company_id', $company->id);

        if ($statusFilter) {
            $tripsQuery->where('status', $statusFilter);
        }

        if ($search) {
            $tripsQuery->where(function ($q) use ($search) {
                $q->where('trip_number', 'like', "%{$search}%")
                    ->orWhereHas('driver', fn ($dq) => $dq->where('name', 'like', "%{$search}%")->orWhere('name_ar', 'like', "%{$search}%"))
                    ->orWhereHas('vehicle', fn ($vq) => $vq->where('plate_number', 'like', "%{$search}%"));
            });
        }

        $trips = $tripsQuery->orderBy('scheduled_date', 'desc')->paginate(15)->withQueryString();

        $vehicles = DeliveryVehicle::where('company_id', $company->id)->get();
        $drivers = DeliveryDriver::where('company_id', $company->id)->get();

        return Inertia::render('Trade/Dispatch/Index', [
            'metrics' => [
                'active_trips_count' => $activeTripsCount,
                'completed_today_count' => $completedTodayCount,
                'active_vehicles_count' => $activeVehiclesCount,
                'pending_cod_total' => number_format($pendingCodTotal, 2, '.', ''),
            ],
            'trips' => $trips,
            'vehicles' => $vehicles,
            'drivers' => $drivers,
            'filters' => [
                'status' => $statusFilter,
                'search' => $search,
            ],
        ]);
    }

    public function create(): Response
    {
        $company = app(CurrentCompany::class)->get();

        $drivers = DeliveryDriver::where('company_id', $company->id)
            ->where('status', '!=', 'off_duty')
            ->get();

        $vehicles = DeliveryVehicle::where('company_id', $company->id)
            ->where('status', 'active')
            ->get();

        $warehouses = Warehouse::where('company_id', $company->id)->get();

        $pendingDeliveries = DeliveryNote::with(['customer', 'warehouse'])
            ->where('company_id', $company->id)
            ->whereIn('status', ['draft', 'approved', 'pending'])
            ->orderBy('date', 'desc')
            ->limit(50)
            ->get();

        return Inertia::render('Trade/Dispatch/Create', [
            'drivers' => $drivers,
            'vehicles' => $vehicles,
            'warehouses' => $warehouses,
            'pendingDeliveries' => $pendingDeliveries,
        ]);
    }

    public function store(Request $request, CreateDispatchTripService $service): RedirectResponse
    {
        $company = app(CurrentCompany::class)->get();
        $tenant = app(CurrentTenant::class)->get();

        $validated = $request->validate([
            'driver_id' => 'required|uuid|exists:delivery_drivers,id',
            'vehicle_id' => 'required|uuid|exists:delivery_vehicles,id',
            'departure_warehouse_id' => 'nullable|uuid|exists:warehouses,id',
            'scheduled_date' => 'required|date',
            'route_notes' => 'nullable|string|max:1000',
            'stops' => 'required|array|min:1',
            'stops.*.customer_id' => 'required|uuid|exists:parties,id',
            'stops.*.delivery_note_id' => 'nullable|uuid|exists:delivery_notes,id',
            'stops.*.sales_order_id' => 'nullable|uuid|exists:sales_orders,id',
            'stops.*.destination_address' => 'required|string|max:255',
            'stops.*.recipient_contact_phone' => 'nullable|string|max:50',
            'stops.*.cod_amount_due' => 'nullable|numeric|min:0',
        ]);

        $trip = $service->execute(
            tenantId: $tenant->id,
            companyId: $company->id,
            branchId: null,
            driverId: $validated['driver_id'],
            vehicleId: $validated['vehicle_id'],
            warehouseId: $validated['departure_warehouse_id'] ?? null,
            scheduledDate: $validated['scheduled_date'],
            stops: $validated['stops'],
            routeNotes: $validated['route_notes'] ?? null
        );

        return redirect()->route('trade.dispatch.show', $trip->id)
            ->with('success', __('Trip :number dispatched successfully.', ['number' => $trip->trip_number]));
    }

    public function show(DeliveryTrip $trip): Response
    {
        $trip->load([
            'driver',
            'vehicle',
            'departureWarehouse',
            'stops.customer',
            'stops.deliveryNote',
            'settlementJournalEntry.lines.account',
        ]);

        return Inertia::render('Trade/Dispatch/Show', [
            'trip' => $trip,
        ]);
    }

    public function dispatchTrip(DeliveryTrip $trip): RedirectResponse
    {
        if ($trip->status === 'draft' || $trip->status === 'scheduled') {
            $trip->update([
                'status' => 'in_transit',
                'dispatched_at' => now(),
            ]);
        }

        return back()->with('success', __('Trip :num is now in-transit.', ['num' => $trip->trip_number]));
    }

    public function recordPod(
        Request $request,
        DeliveryTripStop $stop,
        RecordTripStopPodAction $action
    ): JsonResponse|RedirectResponse {
        $validated = $request->validate([
            'success' => 'required|boolean',
            'recipient_name' => 'required_if:success,true|nullable|string|max:150',
            'recipient_national_id' => 'nullable|string|max:50',
            'recipient_signature_svg' => 'nullable|string',
            'gps_latitude' => 'nullable|numeric',
            'gps_longitude' => 'nullable|numeric',
            'cod_amount_collected' => 'nullable|numeric|min:0',
            'cod_payment_method' => 'nullable|string|in:cash,pos_terminal,none',
            'failure_reason' => 'required_if:success,false|nullable|string|max:100',
            'pod_notes' => 'nullable|string|max:500',
        ]);

        $updatedStop = $action->execute(
            stop: $stop,
            success: $validated['success'],
            recipientName: $validated['recipient_name'] ?? null,
            recipientNationalId: $validated['recipient_national_id'] ?? null,
            signatureSvg: $validated['recipient_signature_svg'] ?? null,
            gpsLatitude: $validated['gps_latitude'] ?? null,
            gpsLongitude: $validated['gps_longitude'] ?? null,
            codAmountCollected: $validated['cod_amount_collected'] ?? 0,
            codPaymentMethod: $validated['cod_payment_method'] ?? 'cash',
            failureReason: $validated['failure_reason'] ?? null,
            podNotes: $validated['pod_notes'] ?? null
        );

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => __('Proof of delivery recorded.'),
                'stop' => $updatedStop,
            ]);
        }

        return back()->with('success', __('Proof of delivery recorded successfully.'));
    }

    public function settleCod(DeliveryTrip $trip, SettleTripCodAction $action): RedirectResponse
    {
        $action->execute($trip, auth()->id());

        return back()->with('success', __('Driver COD collections settled to treasury and GL posted.'));
    }

    public function printManifest(DeliveryTrip $trip, QrCodeSvgService $qrSvgService): Response
    {
        $trip->load(['driver', 'vehicle', 'departureWarehouse', 'stops.customer', 'stops.deliveryNote', 'company']);
        $company = $trip->company ?: app(CurrentCompany::class)->get();

        $qrPayload = json_encode([
            'trip' => $trip->trip_number,
            'driver' => $trip->driver->name,
            'vehicle' => $trip->vehicle->plate_number,
            'stops' => $trip->total_deliveries_count,
            'cod' => (float) $trip->total_cod_expected,
        ], JSON_UNESCAPED_UNICODE);

        $qrSvg = $qrSvgService->render($qrPayload, 150);

        return Inertia::render('Trade/Dispatch/PrintManifest', [
            'trip' => $trip,
            'company' => $company,
            'qrSvg' => $qrSvg,
        ]);
    }

    public function storeVehicle(Request $request): RedirectResponse
    {
        $company = app(CurrentCompany::class)->get();
        $tenant = app(CurrentTenant::class)->get();

        $validated = $request->validate([
            'plate_number' => 'required|string|max:50',
            'model' => 'required|string|max:100',
            'vehicle_type' => 'required|string|in:van,pickup,truck_medium,truck_heavy,motorcycle',
            'max_weight_capacity_kg' => 'required|numeric|min:1',
            'max_volume_capacity_cbm' => 'nullable|numeric|min:0.1',
            'notes' => 'nullable|string|max:500',
        ]);

        DeliveryVehicle::create(array_merge($validated, [
            'tenant_id' => $tenant->id,
            'company_id' => $company->id,
            'status' => 'active',
        ]));

        return back()->with('success', __('Vehicle added to fleet successfully.'));
    }

    public function storeDriver(Request $request): RedirectResponse
    {
        $company = app(CurrentCompany::class)->get();
        $tenant = app(CurrentTenant::class)->get();

        $validated = $request->validate([
            'code' => 'required|string|max:50',
            'name' => 'required|string|max:150',
            'name_ar' => 'nullable|string|max:150',
            'phone' => 'required|string|max:50',
            'license_number' => 'nullable|string|max:50',
            'license_type' => 'required|string|in:light,medium,heavy',
        ]);

        DeliveryDriver::create(array_merge($validated, [
            'tenant_id' => $tenant->id,
            'company_id' => $company->id,
            'status' => 'available',
        ]));

        return back()->with('success', __('Driver registered successfully.'));
    }
}
