<?php

namespace App\Modules\Trade\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Localization\Services\QrCodeSvgService;
use App\Modules\Localization\Services\TafqeetService;
use App\Modules\Organization\Models\Company;
use App\Modules\Trade\Models\CommissionPlan;
use App\Modules\Trade\Models\SalesCommissionRun;
use App\Modules\Trade\Models\SalesCommissionRunLine;
use App\Modules\Trade\Models\SalesRepresentative;
use App\Modules\Trade\Services\CalculateCommissionsService;
use App\Modules\Trade\Services\SettleCommissionRunAction;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CommissionController extends Controller
{
    public function index(Request $request): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $runsQuery = SalesCommissionRun::where('company_id', $companyId)
            ->with(['lines.representative', 'approver'])
            ->latest();

        if ($request->filled('status')) {
            $runsQuery->where('status', $request->query('status'));
        }

        $runs = $runsQuery->paginate(15)->withQueryString();

        $representatives = SalesRepresentative::where('company_id', $companyId)
            ->with(['plan', 'branch'])
            ->get();

        $plans = CommissionPlan::where('company_id', $companyId)
            ->withCount('representatives')
            ->get();

        $metrics = [
            'total_runs' => SalesCommissionRun::where('company_id', $companyId)->count(),
            'settled_runs' => SalesCommissionRun::where('company_id', $companyId)->where('status', 'settled')->count(),
            'total_commissions_paid' => (float) SalesCommissionRun::where('company_id', $companyId)->where('status', 'settled')->sum('total_net_payable'),
            'active_representatives' => SalesRepresentative::where('company_id', $companyId)->where('is_active', true)->count(),
        ];

        return Inertia::render('Trade/Commissions/Index', [
            'runs' => $runs,
            'representatives' => $representatives,
            'plans' => $plans,
            'metrics' => $metrics,
            'filters' => $request->only(['status']),
        ]);
    }

    public function create(Request $request, CalculateCommissionsService $calcService): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $periodStart = $request->query('period_start', Carbon::now()->startOfMonth()->toDateString());
        $periodEnd = $request->query('period_end', Carbon::now()->endOfMonth()->toDateString());
        $basis = $request->query('basis', 'invoiced_sales');

        $preview = $calcService->calculate($companyId, $periodStart, $periodEnd, $basis);

        return Inertia::render('Trade/Commissions/Create', [
            'preview' => $preview,
            'initialFilters' => [
                'period_start' => $periodStart,
                'period_end' => $periodEnd,
                'basis' => $basis,
            ],
        ]);
    }

    public function preview(Request $request, CalculateCommissionsService $calcService): JsonResponse
    {
        $companyId = app(CurrentCompany::class)->id();
        $validated = $request->validate([
            'period_start' => ['required', 'date'],
            'period_end' => ['required', 'date', 'after_or_equal:period_start'],
            'basis' => ['required', 'string', 'in:invoiced_sales,collected_cash'],
        ]);

        $preview = $calcService->calculate(
            $companyId,
            $validated['period_start'],
            $validated['period_end'],
            $validated['basis']
        );

        return response()->json($preview);
    }

    public function store(Request $request, CalculateCommissionsService $calcService): RedirectResponse
    {
        $companyId = app(CurrentCompany::class)->id();
        $tenantId = app(CurrentTenant::class)->id();

        $validated = $request->validate([
            'period_start' => ['required', 'date'],
            'period_end' => ['required', 'date', 'after_or_equal:period_start'],
            'basis' => ['required', 'string', 'in:invoiced_sales,collected_cash'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $calculation = $calcService->calculate(
            $companyId,
            $validated['period_start'],
            $validated['period_end'],
            $validated['basis']
        );

        $runNumber = 'COMM-'.date('Ym').'-'.strtoupper(bin2hex(random_bytes(3)));

        $run = SalesCommissionRun::create([
            'tenant_id' => $tenantId,
            'company_id' => $companyId,
            'run_number' => $runNumber,
            'period_start' => $validated['period_start'],
            'period_end' => $validated['period_end'],
            'basis' => $validated['basis'],
            'status' => 'draft',
            'total_eligible_sales' => $calculation['total_eligible_sales'],
            'total_commission_amount' => $calculation['total_commission_amount'],
            'total_bonus_amount' => $calculation['total_bonus_amount'],
            'total_deductions' => $calculation['total_deductions'],
            'total_net_payable' => $calculation['total_net_payable'],
            'created_by' => $request->user()?->id,
            'notes' => $validated['notes'] ?? null,
        ]);

        foreach ($calculation['lines'] as $line) {
            SalesCommissionRunLine::create([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'sales_commission_run_id' => $run->id,
                'sales_representative_id' => $line['sales_representative_id'],
                'sales_target' => $line['sales_target'],
                'achieved_sales' => $line['achieved_sales'],
                'achievement_rate' => $line['achievement_rate'],
                'commission_amount' => $line['commission_amount'],
                'bonus_amount' => $line['bonus_amount'],
                'deductions_amount' => $line['deductions_amount'],
                'net_payable' => $line['net_payable'],
                'notes' => null,
            ]);
        }

        return redirect()->route('trade.commissions.show', $run->id)
            ->with('success', "تم إنشاء مسير العمولات {$run->run_number} بنجاح.");
    }

    public function show(SalesCommissionRun $commissionRun): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        if ($commissionRun->company_id !== $companyId) {
            abort(403);
        }

        $commissionRun->load([
            'lines.representative.plan',
            'lines.representative.branch',
            'journalEntry.lines.account',
            'paymentJournal.lines.account',
            'creator',
            'approver',
        ]);

        return Inertia::render('Trade/Commissions/Show', [
            'run' => $commissionRun,
        ]);
    }

    public function settle(Request $request, SalesCommissionRun $commissionRun, SettleCommissionRunAction $action): RedirectResponse
    {
        $companyId = app(CurrentCompany::class)->id();

        if ($commissionRun->company_id !== $companyId) {
            abort(403);
        }

        $disburseFromBank = $request->boolean('disburse_from_bank', true);
        $action->execute($commissionRun, $request->user()?->id, $disburseFromBank);

        return redirect()->route('trade.commissions.show', $commissionRun->id)
            ->with('success', 'تم اعتماد مسير العمولات وترحيل القيود المحاسبية لدفتر الأستاذ بنجاح.');
    }

    public function printStatement(
        SalesCommissionRun $commissionRun,
        SalesCommissionRunLine $line,
        QrCodeSvgService $qrSvgService,
        TafqeetService $tafqeetService
    ): Response {
        $companyId = app(CurrentCompany::class)->id();

        if ($commissionRun->company_id !== $companyId || $line->sales_commission_run_id !== $commissionRun->id) {
            abort(403);
        }

        $line->load(['representative.plan', 'representative.branch']);
        $company = Company::findOrFail($companyId);

        $netAmount = (float) $line->net_payable;
        $qrPayload = "Commission: {$commissionRun->run_number} | Rep: {$line->representative?->name} | Net: {$netAmount} SAR | Period: {$commissionRun->period_start} to {$commissionRun->period_end}";
        $qrCodeDataUri = $qrSvgService->generateDataUri($qrPayload, 150);

        return Inertia::render('Trade/Commissions/PrintStatement', [
            'run' => $commissionRun,
            'line' => $line,
            'company' => $company,
            'qrCodeDataUri' => $qrCodeDataUri,
            'amountInWords' => [
                'ar' => $tafqeetService->inArabic($netAmount),
                'en' => $tafqeetService->inEnglish($netAmount),
            ],
        ]);
    }

    public function storePlan(Request $request): RedirectResponse
    {
        $companyId = app(CurrentCompany::class)->id();
        $tenantId = app(CurrentTenant::class)->id();

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50'],
            'name' => ['required', 'string', 'max:150'],
            'name_ar' => ['nullable', 'string', 'max:150'],
            'basis' => ['required', 'string', 'in:invoiced_sales,collected_cash'],
            'tiers' => ['nullable', 'array'],
            'target_bonus_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        CommissionPlan::create([
            'tenant_id' => $tenantId,
            'company_id' => $companyId,
            'code' => $validated['code'],
            'name' => $validated['name'],
            'name_ar' => $validated['name_ar'] ?? null,
            'basis' => $validated['basis'],
            'tiers' => $validated['tiers'] ?? [
                ['min' => 0, 'max' => 50000, 'rate' => 2.0],
                ['min' => 50000, 'max' => 100000, 'rate' => 3.5],
                ['min' => 100000, 'max' => null, 'rate' => 5.0],
            ],
            'target_bonus_rate' => $validated['target_bonus_rate'] ?? 0,
            'is_active' => true,
            'notes' => $validated['notes'] ?? null,
        ]);

        return back()->with('success', 'تم حفظ خطة العمولات بنجاح.');
    }

    public function storeRepresentative(Request $request): RedirectResponse
    {
        $companyId = app(CurrentCompany::class)->id();
        $tenantId = app(CurrentTenant::class)->id();

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50'],
            'name' => ['required', 'string', 'max:150'],
            'name_ar' => ['nullable', 'string', 'max:150'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:150'],
            'commission_plan_id' => ['required', 'string', 'uuid'],
            'branch_id' => ['nullable', 'string', 'uuid'],
            'monthly_target' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        SalesRepresentative::create([
            'tenant_id' => $tenantId,
            'company_id' => $companyId,
            'code' => $validated['code'],
            'name' => $validated['name'],
            'name_ar' => $validated['name_ar'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'email' => $validated['email'] ?? null,
            'commission_plan_id' => $validated['commission_plan_id'],
            'branch_id' => $validated['branch_id'] ?? null,
            'monthly_target' => $validated['monthly_target'] ?? 0,
            'is_active' => true,
            'notes' => $validated['notes'] ?? null,
        ]);

        return back()->with('success', 'تم إضافة مندوب المبيعات بنجاح.');
    }
}
