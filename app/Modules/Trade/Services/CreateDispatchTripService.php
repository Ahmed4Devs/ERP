<?php

namespace App\Modules\Trade\Services;

use App\Modules\Inventory\Models\DeliveryNote;
use App\Modules\Trade\Models\DeliveryDriver;
use App\Modules\Trade\Models\DeliveryTrip;
use App\Modules\Trade\Models\DeliveryTripStop;
use App\Modules\Trade\Models\DeliveryVehicle;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class CreateDispatchTripService
{
    /**
     * Plan and bundle multiple delivery stops into a dispatch trip.
     */
    public function execute(
        string $tenantId,
        string $companyId,
        ?string $branchId,
        string $driverId,
        string $vehicleId,
        ?string $warehouseId,
        string $scheduledDate,
        array $stops,
        ?string $routeNotes = null
    ): DeliveryTrip {
        $driver = DeliveryDriver::where('company_id', $companyId)->findOrFail($driverId);
        $vehicle = DeliveryVehicle::where('company_id', $companyId)->findOrFail($vehicleId);

        if ($driver->status === 'off_duty') {
            throw new InvalidArgumentException(__('Driver :name is currently off-duty.', ['name' => $driver->name]));
        }

        if ($vehicle->status === 'maintenance') {
            throw new InvalidArgumentException(__('Vehicle :plate is currently in maintenance.', ['plate' => $vehicle->plate_number]));
        }

        if (empty($stops)) {
            throw new InvalidArgumentException(__('A dispatch trip must have at least one delivery stop.'));
        }

        return DB::transaction(function () use ($tenantId, $companyId, $branchId, $driver, $vehicle, $warehouseId, $scheduledDate, $stops, $routeNotes) {
            $year = Carbon::parse($scheduledDate)->format('Y');
            $count = DeliveryTrip::where('company_id', $companyId)
                ->whereYear('scheduled_date', $year)
                ->count() + 1;
            $tripNumber = sprintf('TRIP-%s-%04d', $year, $count);

            $trip = DeliveryTrip::create([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'branch_id' => $branchId,
                'driver_id' => $driver->id,
                'vehicle_id' => $vehicle->id,
                'departure_warehouse_id' => $warehouseId,
                'trip_number' => $tripNumber,
                'scheduled_date' => $scheduledDate,
                'status' => 'scheduled',
                'route_notes' => $routeNotes,
                'total_deliveries_count' => count($stops),
                'completed_deliveries_count' => 0,
                'total_cod_expected' => 0,
                'total_cod_collected' => 0,
                'cod_settlement_status' => 'pending',
            ]);

            $totalCodExpected = 0.0;
            $sequence = 1;

            foreach ($stops as $stopData) {
                $codDue = isset($stopData['cod_amount_due']) ? (float) $stopData['cod_amount_due'] : 0.0;
                $totalCodExpected += $codDue;

                DeliveryTripStop::create([
                    'delivery_trip_id' => $trip->id,
                    'delivery_note_id' => $stopData['delivery_note_id'] ?? null,
                    'sales_order_id' => $stopData['sales_order_id'] ?? null,
                    'customer_id' => $stopData['customer_id'],
                    'stop_sequence' => $sequence++,
                    'destination_address' => $stopData['destination_address'] ?? 'Customer Delivery Address',
                    'recipient_contact_phone' => $stopData['recipient_contact_phone'] ?? null,
                    'cod_amount_due' => number_format($codDue, 6, '.', ''),
                    'cod_amount_collected' => '0.000000',
                    'status' => 'pending',
                ]);

                // Update Delivery Note if linked
                if (! empty($stopData['delivery_note_id'])) {
                    DeliveryNote::where('id', $stopData['delivery_note_id'])->update([
                        'status' => 'dispatched',
                        'driver_name' => $driver->name,
                        'vehicle_plate' => $vehicle->plate_number,
                    ]);
                }
            }

            $trip->total_cod_expected = number_format($totalCodExpected, 6, '.', '');
            $trip->save();

            // Mark driver as on trip
            $driver->update(['status' => 'on_trip']);

            return $trip->load(['stops.customer', 'driver', 'vehicle', 'departureWarehouse']);
        });
    }
}
