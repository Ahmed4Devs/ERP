<?php

namespace App\Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Models\Account;
use App\Modules\Inventory\Models\GoodsReceipt;
use App\Modules\Inventory\Models\GoodsReceiptLine;
use App\Modules\Inventory\Models\LandedCost;
use App\Modules\Inventory\Models\LandedCostCharge;
use App\Modules\Inventory\Services\LandedCostService;
use App\Modules\MasterData\Models\Party;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LandedCostController extends Controller
{
    public function __construct(
        protected LandedCostService $landedCostService
    ) {}

    public function index(Request $request): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $landedCosts = LandedCost::where('company_id', $companyId)
            ->with(['receipts', 'journalEntry'])
            ->latest('date')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Inventory/LandedCosts/Index', [
            'landedCosts' => $landedCosts,
        ]);
    }

    public function create(): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $currentTenant = app(CurrentTenant::class);
        $companyId = $currentCompany->id();
        $tenantId = $currentTenant->id();

        // Fetch posted goods receipts that can have landed costs allocated
        $goodsReceipts = GoodsReceipt::where('company_id', $companyId)
            ->where('status', 'posted')
            ->with(['warehouse', 'party', 'lines.product'])
            ->latest('date')
            ->take(50)
            ->get();

        $accounts = Account::where('company_id', $companyId)
            ->where('is_postable', true)
            ->whereIn('type', ['liability', 'expense', 'asset'])
            ->orderBy('code')
            ->get();

        $vendors = Party::where('tenant_id', $tenantId)
            ->whereIn('type', ['vendor', 'supplier'])
            ->orderBy('name')
            ->get();

        $saudiPorts = [
            ['code' => 'JIP', 'name_ar' => 'ميناء جدة الإسلامي', 'name_en' => 'Jeddah Islamic Port', 'type' => 'sea'],
            ['code' => 'KAP_DAM', 'name_ar' => 'ميناء الملك عبد العزيز بالدمام', 'name_en' => 'King Abdulaziz Port Dammam', 'type' => 'sea'],
            ['code' => 'KAP_RAB', 'name_ar' => 'ميناء الملك عبد الله برابغ', 'name_en' => 'King Abdullah Port Rabigh', 'type' => 'sea'],
            ['code' => 'JUB_PORT', 'name_ar' => 'ميناء الجبيل التجاري', 'name_en' => 'Jubail Commercial Port', 'type' => 'sea'],
            ['code' => 'YAN_PORT', 'name_ar' => 'ميناء ينبع التجاري', 'name_en' => 'Yanbu Commercial Port', 'type' => 'sea'],
            ['code' => 'RUH_AIR', 'name_ar' => 'مطار الملك خالد الدولي بالرياض', 'name_en' => 'King Khalid Intl Airport Riyadh', 'type' => 'air'],
            ['code' => 'JED_AIR', 'name_ar' => 'مطار الملك عبد العزيز الدولي بجدة', 'name_en' => 'King Abdulaziz Intl Airport Jeddah', 'type' => 'air'],
            ['code' => 'DMM_AIR', 'name_ar' => 'مطار الملك فهد الدولي بالدمام', 'name_en' => 'King Fahd Intl Airport Dammam', 'type' => 'air'],
            ['code' => 'KFC_LAND', 'name_ar' => 'منفذ جسر الملك فهد (البحرين)', 'name_en' => 'King Fahd Causeway', 'type' => 'land'],
            ['code' => 'BAT_LAND', 'name_ar' => 'منفذ البطحاء البري (الإمارات)', 'name_en' => 'Al Batha Land Port', 'type' => 'land'],
            ['code' => 'SAL_LAND', 'name_ar' => 'منفذ سلوى البري (قطر)', 'name_en' => 'Salwa Land Port', 'type' => 'land'],
            ['code' => 'HAD_LAND', 'name_ar' => 'منفذ الحديثة البري (الأردن)', 'name_en' => 'Al Haditha Land Port', 'type' => 'land'],
        ];

        return Inertia::render('Inventory/LandedCosts/Create', [
            'goodsReceipts' => $goodsReceipts,
            'accounts' => $accounts,
            'vendors' => $vendors,
            'saudiPorts' => $saudiPorts,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'date' => ['required', 'date'],
            'allocation_method' => ['required', 'in:by_value,by_quantity,by_weight,by_volume'],
            'goods_receipt_ids' => ['required', 'array', 'min:1'],
            'goods_receipt_ids.*' => ['required', 'exists:goods_receipts,id'],
            'customs_declaration_number' => ['nullable', 'string', 'max:100'],
            'customs_declaration_date' => ['nullable', 'date'],
            'port_of_entry' => ['nullable', 'string', 'max:150'],
            'bill_of_lading' => ['nullable', 'string', 'max:100'],
            'customs_broker_id' => ['nullable', 'exists:parties,id'],
            'customs_broker_name' => ['nullable', 'string', 'max:150'],
            'customs_duty_amount' => ['nullable', 'numeric', 'min:0'],
            'customs_vat_amount' => ['nullable', 'numeric', 'min:0'],
            'freight_amount' => ['nullable', 'numeric', 'min:0'],
            'port_handling_amount' => ['nullable', 'numeric', 'min:0'],
            'insurance_amount' => ['nullable', 'numeric', 'min:0'],
            'other_charges_amount' => ['nullable', 'numeric', 'min:0'],
            'charges' => ['nullable', 'array'],
            'charges.*.cost_type' => ['required_with:charges', 'string'],
            'charges.*.amount' => ['required_with:charges', 'numeric', 'min:0.01'],
            'charges.*.description' => ['nullable', 'string'],
            'charges.*.vendor_party_id' => ['nullable', 'exists:parties,id'],
            'charges.*.expense_account_id' => ['nullable', 'exists:accounts,id'],
            'line_weights' => ['nullable', 'array'],
            'line_volumes' => ['nullable', 'array'],
            'notes' => ['nullable', 'string'],
        ]);

        $currentTenant = app(CurrentTenant::class);
        $currentCompany = app(CurrentCompany::class);

        $voucherNumber = 'LCV-'.date('Ymd').'-'.strtoupper(substr(uniqid(), -4));

        $dutyAmt = (float) ($request->input('customs_duty_amount') ?? 0);
        $vatAmt = (float) ($request->input('customs_vat_amount') ?? 0);
        $freightAmt = (float) ($request->input('freight_amount') ?? 0);
        $portAmt = (float) ($request->input('port_handling_amount') ?? 0);
        $insuranceAmt = (float) ($request->input('insurance_amount') ?? 0);
        $otherAmt = (float) ($request->input('other_charges_amount') ?? 0);

        $landedCost = LandedCost::create([
            'tenant_id' => $currentTenant->id(),
            'company_id' => $currentCompany->id(),
            'branch_id' => $request->user()->branch_id,
            'voucher_number' => $voucherNumber,
            'date' => $request->input('date'),
            'status' => 'draft',
            'allocation_method' => $request->input('allocation_method'),
            'customs_declaration_number' => $request->input('customs_declaration_number'),
            'customs_declaration_date' => $request->input('customs_declaration_date'),
            'port_of_entry' => $request->input('port_of_entry'),
            'bill_of_lading' => $request->input('bill_of_lading'),
            'customs_broker_id' => $request->input('customs_broker_id'),
            'customs_broker_name' => $request->input('customs_broker_name'),
            'customs_duty_amount' => $dutyAmt,
            'customs_vat_amount' => $vatAmt,
            'freight_amount' => $freightAmt,
            'port_handling_amount' => $portAmt,
            'insurance_amount' => $insuranceAmt,
            'other_charges_amount' => $otherAmt,
            'total_charges' => 0,
            'notes' => $request->input('notes'),
            'created_by_id' => $request->user()->id,
        ]);

        $landedCost->receipts()->attach($request->input('goods_receipt_ids'));

        // Update line weights and volumes if provided
        if ($request->filled('line_weights')) {
            foreach ($request->input('line_weights') as $lineId => $weight) {
                GoodsReceiptLine::where('id', $lineId)->update(['weight_kg' => (float) $weight]);
            }
        }

        if ($request->filled('line_volumes')) {
            foreach ($request->input('line_volumes') as $lineId => $volume) {
                GoodsReceiptLine::where('id', $lineId)->update(['volume_cbm' => (float) $volume]);
            }
        }

        // Create user-specified charges
        $inputCharges = $request->input('charges', []);

        if (empty($inputCharges)) {
            // Auto-populate charges from structured customs amounts
            $brokerPartyId = $request->input('customs_broker_id');
            if ($dutyAmt > 0) {
                $inputCharges[] = [
                    'cost_type' => 'customs_duty',
                    'description' => 'رسوم جمركية - بيان فاسح '.$request->input('customs_declaration_number'),
                    'amount' => $dutyAmt,
                    'vendor_party_id' => $brokerPartyId,
                ];
            }
            if ($vatAmt > 0) {
                $inputCharges[] = [
                    'cost_type' => 'customs_vat',
                    'description' => 'ضريبة القيمة المضافة على الواردات الجمركية 15% (ZATCA Box 8)',
                    'amount' => $vatAmt,
                    'vendor_party_id' => $brokerPartyId,
                ];
            }
            if ($freightAmt > 0) {
                $inputCharges[] = [
                    'cost_type' => 'freight',
                    'description' => 'أجور الشحن الدولي - بوليصة '.$request->input('bill_of_lading'),
                    'amount' => $freightAmt,
                    'vendor_party_id' => $brokerPartyId,
                ];
            }
            if ($portAmt > 0) {
                $inputCharges[] = [
                    'cost_type' => 'port_handling',
                    'description' => 'رسوم المناولة والموانئ ومحطة الحاويات',
                    'amount' => $portAmt,
                    'vendor_party_id' => $brokerPartyId,
                ];
            }
            if ($insuranceAmt > 0) {
                $inputCharges[] = [
                    'cost_type' => 'insurance',
                    'description' => 'التأمين البحري/الجوي للشحنة',
                    'amount' => $insuranceAmt,
                    'vendor_party_id' => $brokerPartyId,
                ];
            }
            if ($otherAmt > 0) {
                $inputCharges[] = [
                    'cost_type' => 'other',
                    'description' => 'مصاريف تخليص وتفريغ إضافية',
                    'amount' => $otherAmt,
                    'vendor_party_id' => $brokerPartyId,
                ];
            }
        }

        foreach ($inputCharges as $chargeData) {
            LandedCostCharge::create([
                'landed_cost_id' => $landedCost->id,
                'cost_type' => $chargeData['cost_type'],
                'description' => $chargeData['description'] ?? null,
                'amount' => $chargeData['amount'],
                'vendor_party_id' => $chargeData['vendor_party_id'] ?? null,
                'expense_account_id' => $chargeData['expense_account_id'] ?? null,
            ]);
        }

        $this->landedCostService->computeAllocations($landedCost);

        return redirect()->route('inventory.landed-costs.show', $landedCost->id)
            ->with('success', 'تم إنشاء قسيمة تكاليف الاستيراد والبيان الجمركي بنجاح.');
    }

    public function show(LandedCost $landedCost): Response
    {
        $currentCompany = app(CurrentCompany::class);
        if ($landedCost->company_id !== $currentCompany->id()) {
            abort(403);
        }

        $landedCost->load([
            'receipts.warehouse',
            'receipts.party',
            'customsBroker',
            'charges.vendor',
            'charges.expenseAccount',
            'allocations.product',
            'allocations.goodsReceiptLine',
            'journalEntry.lines.account',
            'createdBy',
        ]);

        return Inertia::render('Inventory/LandedCosts/Show', [
            'landedCost' => $landedCost,
        ]);
    }

    public function post(LandedCost $landedCost): RedirectResponse
    {
        $currentCompany = app(CurrentCompany::class);
        if ($landedCost->company_id !== $currentCompany->id()) {
            abort(403);
        }

        $this->landedCostService->post($landedCost);

        return redirect()->route('inventory.landed-costs.show', $landedCost->id)
            ->with('success', 'Landed cost voucher posted successfully.');
    }
}
