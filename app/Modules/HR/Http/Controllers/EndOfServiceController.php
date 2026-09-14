<?php

namespace App\Modules\HR\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\HR\Models\Employee;
use App\Modules\HR\Models\EndOfServiceSettlement;
use App\Modules\HR\Services\EndOfServiceCalculator;
use App\Modules\HR\Services\PostEndOfServiceAccrualAction;
use App\Modules\HR\Services\SaudiEosbCalculatorService;
use App\Modules\HR\Services\SettleEndOfServiceAction;
use App\Modules\Localization\Services\QrCodeSvgService;
use App\Modules\Localization\Services\TafqeetService;
use App\Modules\Organization\Models\Branch;
use App\Modules\Organization\Models\Company;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class EndOfServiceController extends Controller
{
    public function index(Request $request, SaudiEosbCalculatorService $saudiEosbService): Response
    {
        $companyId = app(CurrentCompany::class)->id();
        $asOfDate = $request->query('as_of_date', now()->toDateString());

        $liabilitySchedule = $saudiEosbService->getCompanyLiabilitySchedule($companyId, $asOfDate);

        $query = EndOfServiceSettlement::where('company_id', $companyId)
            ->with(['employee.designation', 'employee.department', 'branch'])
            ->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search): void {
                $q->where('settlement_number', 'like', "%{$search}%")
                    ->orWhereHas('employee', function ($eq) use ($search): void {
                        $eq->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('first_name_ar', 'like', "%{$search}%")
                            ->orWhere('last_name_ar', 'like', "%{$search}%")
                            ->orWhere('employee_number', 'like', "%{$search}%");
                    });
            });
        }

        $settlements = $query->paginate(15)->withQueryString();

        $metrics = [
            'total_settlements' => EndOfServiceSettlement::where('company_id', $companyId)->count(),
            'settled_count' => EndOfServiceSettlement::where('company_id', $companyId)->where('status', 'settled')->count(),
            'total_payout' => (float) EndOfServiceSettlement::where('company_id', $companyId)->where('status', 'settled')->sum('net_settlement_amount'),
        ];

        return Inertia::render('HR/EndOfService/Index', [
            'settlements' => $settlements,
            'metrics' => $metrics,
            'liabilitySchedule' => $liabilitySchedule,
            'filters' => $request->only(['status', 'search', 'as_of_date']),
        ]);
    }

    public function postAccrual(Request $request, PostEndOfServiceAccrualAction $action): RedirectResponse
    {
        $companyId = app(CurrentCompany::class)->id();
        $validated = $request->validate([
            'as_of_date' => 'nullable|date',
            'amount' => 'nullable|numeric|min:0.01',
        ]);

        try {
            $journalEntry = $action->execute(
                $companyId,
                $validated['as_of_date'] ?? null,
                isset($validated['amount']) ? (float) $validated['amount'] : null
            );

            return back()->with('success', "End of Service provision posted to General Ledger successfully (Journal #{$journalEntry->entry_number}).");
        } catch (\Throwable $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function exportSchedule(Request $request, SaudiEosbCalculatorService $saudiEosbService): StreamedResponse
    {
        $companyId = app(CurrentCompany::class)->id();
        $asOfDate = $request->query('as_of_date', now()->toDateString());
        $content = $saudiEosbService->generateScheduleCsv($companyId, $asOfDate);
        $filename = "EOSB_Liability_Schedule_{$asOfDate}.csv";

        return response()->streamDownload(function () use ($content): void {
            echo $content;
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    public function create(): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $employees = Employee::where('company_id', $companyId)
            ->whereIn('status', ['active', 'on_leave'])
            ->with(['department', 'designation'])
            ->get()
            ->map(function ($emp) {
                return [
                    'id' => $emp->id,
                    'name' => $emp->full_name,
                    'name_ar' => $emp->full_name_ar,
                    'employee_number' => $emp->employee_number,
                    'hire_date' => $emp->hire_date?->toDateString(),
                    'gross_salary' => $emp->getGrossSalary(),
                    'department' => $emp->department?->name,
                    'designation' => $emp->designation?->name,
                ];
            });

        $branches = Branch::where('company_id', $companyId)->get(['id', 'name']);

        return Inertia::render('HR/EndOfService/Create', [
            'employees' => $employees,
            'branches' => $branches,
        ]);
    }

    public function previewCalculation(Request $request, EndOfServiceCalculator $calculator): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => ['required', 'string', 'uuid'],
            'termination_type' => ['required', 'string', 'in:resignation,contract_end,employer_termination,article_87'],
            'last_working_date' => ['required', 'date'],
            'unused_leave_days' => ['nullable', 'numeric', 'min:0'],
            'other_entitlements' => ['nullable', 'numeric', 'min:0'],
            'deductions_amount' => ['nullable', 'numeric', 'min:0'],
        ]);

        $employee = Employee::findOrFail($validated['employee_id']);

        $result = $calculator->calculate(
            $employee,
            $validated['termination_type'],
            $validated['last_working_date'],
            $validated['unused_leave_days'] ?? 0,
            $validated['other_entitlements'] ?? 0,
            $validated['deductions_amount'] ?? 0
        );

        return response()->json($result);
    }

    public function store(Request $request, EndOfServiceCalculator $calculator): RedirectResponse
    {
        $companyId = app(CurrentCompany::class)->id();
        $tenantId = app(CurrentTenant::class)->id();

        $validated = $request->validate([
            'employee_id' => ['required', 'string', 'uuid'],
            'branch_id' => ['nullable', 'string', 'uuid'],
            'termination_type' => ['required', 'string', 'in:resignation,contract_end,employer_termination,article_87'],
            'last_working_date' => ['required', 'date'],
            'unused_leave_days' => ['nullable', 'numeric', 'min:0'],
            'other_entitlements' => ['nullable', 'numeric', 'min:0'],
            'deductions_amount' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $employee = Employee::where('company_id', $companyId)->findOrFail($validated['employee_id']);

        $calc = $calculator->calculate(
            $employee,
            $validated['termination_type'],
            $validated['last_working_date'],
            $validated['unused_leave_days'] ?? 0,
            $validated['other_entitlements'] ?? 0,
            $validated['deductions_amount'] ?? 0
        );

        $settlementNumber = 'EOS-'.date('Ymd').'-'.strtoupper(bin2hex(random_bytes(3)));

        $settlement = EndOfServiceSettlement::create([
            'tenant_id' => $tenantId,
            'company_id' => $companyId,
            'branch_id' => $validated['branch_id'] ?? $employee->branch_id,
            'employee_id' => $employee->id,
            'settlement_number' => $settlementNumber,
            'termination_type' => $validated['termination_type'],
            'hire_date' => $calc['hire_date'],
            'last_working_date' => $calc['last_working_date'],
            'service_years' => $calc['service_years'],
            'base_salary_amount' => $calc['monthly_wage'],
            'gratuity_entitlement_rate' => $calc['entitlement_rate'],
            'gratuity_amount' => $calc['gratuity_amount'],
            'unused_leave_days' => $calc['unused_leave_days'],
            'leave_compensation_amount' => $calc['leave_compensation_amount'],
            'other_entitlements' => $calc['other_entitlements'],
            'deductions_amount' => $calc['deductions_amount'],
            'net_settlement_amount' => $calc['net_settlement_amount'],
            'status' => 'draft',
            'prepared_by' => $request->user()?->id,
            'notes' => $validated['notes'] ?? null,
        ]);

        return redirect()->route('hr.end-of-service.show', $settlement->id)
            ->with('success', 'تم إنشاء سجل تسوية نهاية الخدمة بنجاح.');
    }

    public function show(EndOfServiceSettlement $settlement): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        if ($settlement->company_id !== $companyId) {
            abort(403);
        }

        $settlement->load(['employee.department', 'employee.designation', 'branch', 'journalEntry.lines.account', 'preparer', 'approver']);

        return Inertia::render('HR/EndOfService/Show', [
            'settlement' => $settlement,
        ]);
    }

    public function settle(Request $request, EndOfServiceSettlement $settlement, SettleEndOfServiceAction $action): RedirectResponse
    {
        $companyId = app(CurrentCompany::class)->id();

        if ($settlement->company_id !== $companyId) {
            abort(403);
        }

        $action->execute($settlement, $request->user()?->id);

        return redirect()->route('hr.end-of-service.show', $settlement->id)
            ->with('success', 'تم اعتماد وتسوية مستحقات نهاية الخدمة وترحيل قيد اليومية بنجاح.');
    }

    public function print(EndOfServiceSettlement $settlement, QrCodeSvgService $qrSvgService, TafqeetService $tafqeetService): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        if ($settlement->company_id !== $companyId) {
            abort(403);
        }

        $settlement->load(['employee.department', 'employee.designation', 'branch', 'preparer', 'approver']);
        $company = Company::findOrFail($companyId);

        $qrPayload = "EOS: {$settlement->settlement_number} | Emp: {$settlement->employee?->full_name} | Date: {$settlement->last_working_date} | Net: {$settlement->net_settlement_amount} SAR";
        $qrCodeDataUri = $qrSvgService->generateDataUri($qrPayload, 160);

        $netAmount = (float) $settlement->net_settlement_amount;

        return Inertia::render('HR/EndOfService/Print', [
            'settlement' => $settlement,
            'company' => $company,
            'qrCodeDataUri' => $qrCodeDataUri,
            'amountInWords' => [
                'ar' => $tafqeetService->inArabic($netAmount),
                'en' => $tafqeetService->inEnglish($netAmount),
            ],
        ]);
    }
}
