<?php

namespace App\Modules\HR\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Models\Account;
use App\Modules\HR\Actions\DisburseEmployeeCustodyAction;
use App\Modules\HR\Actions\PostEmployeeCustodySettlementAction;
use App\Modules\HR\Models\Employee;
use App\Modules\HR\Models\EmployeeCustody;
use App\Modules\HR\Models\EmployeeCustodyExpenseLine;
use App\Modules\HR\Models\EmployeeCustodySettlement;
use App\Modules\Localization\Services\TafqeetService;
use App\Modules\Organization\Models\Branch;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeCustodyController extends Controller
{
    public function index(Request $request): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $custodies = EmployeeCustody::where('company_id', $companyId)
            ->with(['employee', 'branch', 'disbursementAccount'])
            ->when($request->status, fn ($q, $status) => $q->where('status', $status))
            ->when($request->employee_id, fn ($q, $empId) => $q->where('employee_id', $empId))
            ->when($request->type, fn ($q, $type) => $q->where('type', $type))
            ->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        $employees = Employee::where('company_id', $companyId)->where('status', 'active')->get();

        $stats = [
            'total_custodies' => EmployeeCustody::where('company_id', $companyId)->count(),
            'active_custodies' => EmployeeCustody::where('company_id', $companyId)->whereIn('status', ['approved', 'disbursed', 'partially_settled'])->count(),
            'total_disbursed' => (float) EmployeeCustody::where('company_id', $companyId)->whereIn('status', ['disbursed', 'partially_settled', 'closed'])->sum('amount'),
            'total_outstanding' => (float) EmployeeCustody::where('company_id', $companyId)->whereIn('status', ['disbursed', 'partially_settled'])->sum('current_balance'),
            'total_closed' => EmployeeCustody::where('company_id', $companyId)->where('status', 'closed')->count(),
        ];

        return Inertia::render('HR/Custodies/Index', [
            'custodies' => $custodies,
            'employees' => $employees,
            'stats' => $stats,
            'filters' => [
                'status' => $request->status,
                'employee_id' => $request->employee_id,
                'type' => $request->type,
            ],
        ]);
    }

    public function create(): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $employees = Employee::where('company_id', $companyId)->where('status', 'active')->get();
        $branches = Branch::where('company_id', $companyId)->get();
        $accounts = Account::where('company_id', $companyId)
            ->where('type', 'asset')
            ->where('is_postable', true)
            ->get();

        return Inertia::render('HR/Custodies/Create', [
            'employees' => $employees,
            'branches' => $branches,
            'accounts' => $accounts,
        ]);
    }

    public function store(Request $request, DisburseEmployeeCustodyAction $disburseAction): RedirectResponse
    {
        $companyId = app(CurrentCompany::class)->id();
        $tenantId = app(CurrentTenant::class)->id();

        $validated = $request->validate([
            'employee_id' => 'required|uuid|exists:employees,id',
            'branch_id' => 'nullable|uuid|exists:branches,id',
            'type' => 'required|in:temporary,permanent',
            'purpose' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0.01',
            'disbursement_method' => 'required|in:bank_transfer,cash',
            'disbursement_account_id' => 'nullable|uuid|exists:accounts,id',
            'auto_disburse' => 'nullable|boolean',
            'notes' => 'nullable|string|max:500',
        ]);

        $nextSeq = EmployeeCustody::where('company_id', $companyId)->count() + 1;
        $custodyNumber = sprintf('CUST-%s-%04d', now()->format('Y'), $nextSeq);

        $custody = EmployeeCustody::create([
            'tenant_id' => $tenantId,
            'company_id' => $companyId,
            'branch_id' => $validated['branch_id'] ?? null,
            'employee_id' => $validated['employee_id'],
            'custody_number' => $custodyNumber,
            'type' => $validated['type'],
            'purpose' => $validated['purpose'],
            'amount' => $validated['amount'],
            'current_balance' => $validated['amount'],
            'status' => 'draft',
            'disbursement_method' => $validated['disbursement_method'],
            'disbursement_account_id' => $validated['disbursement_account_id'] ?? null,
            'created_by' => auth()->id(),
            'notes' => $validated['notes'] ?? null,
        ]);

        if (! empty($validated['auto_disburse'])) {
            $disburseAction->execute($custody, auth()->id());
        }

        return redirect()->route('hr.custodies.show', $custody->id)
            ->with('success', "تم إنشاء العهدة (#{$custody->custody_number}) بنجاح.");
    }

    public function show(EmployeeCustody $custody): Response
    {
        $custody->load([
            'employee.department',
            'branch',
            'disbursementAccount',
            'custodyAccount',
            'journalEntry.lines.account',
            'settlements.lines.expenseAccount',
            'settlements.journalEntry',
        ]);

        return Inertia::render('HR/Custodies/Show', [
            'custody' => $custody,
        ]);
    }

    public function disburse(EmployeeCustody $custody, DisburseEmployeeCustodyAction $disburseAction): RedirectResponse
    {
        $disburseAction->execute($custody, auth()->id());

        return redirect()->route('hr.custodies.show', $custody->id)
            ->with('success', "تم صرف العهدة (#{$custody->custody_number}) وترحيل القيد المحاسبي بنجاح.");
    }

    public function createSettlement(EmployeeCustody $custody): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $custody->load(['employee', 'disbursementAccount']);

        $expenseAccounts = Account::where('company_id', $companyId)
            ->where('type', 'expense')
            ->where('is_postable', true)
            ->get();

        return Inertia::render('HR/Custodies/Settle', [
            'custody' => $custody,
            'expenseAccounts' => $expenseAccounts,
        ]);
    }

    public function storeSettlement(
        Request $request,
        EmployeeCustody $custody,
        PostEmployeeCustodySettlementAction $postAction
    ): RedirectResponse {
        $companyId = app(CurrentCompany::class)->id();
        $tenantId = app(CurrentTenant::class)->id();

        $validated = $request->validate([
            'settlement_date' => 'required|date',
            'refund_amount' => 'nullable|numeric|min:0',
            'reimbursement_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:500',
            'lines' => 'required|array|min:1',
            'lines.*.expense_account_id' => 'required|uuid|exists:accounts,id',
            'lines.*.vendor_name' => 'required|string|max:200',
            'lines.*.vendor_tax_number' => 'nullable|string|max:50',
            'lines.*.invoice_number' => 'nullable|string|max:100',
            'lines.*.invoice_date' => 'nullable|date',
            'lines.*.subtotal' => 'required|numeric|min:0.01',
            'lines.*.tax_rate' => 'nullable|numeric|min:0|max:1',
            'lines.*.description' => 'required|string|max:255',
        ]);

        $settlement = DB::transaction(function () use ($validated, $custody, $companyId, $tenantId) {
            $totalSubtotal = '0.000000';
            $totalTax = '0.000000';
            $totalClaimed = '0.000000';

            $processedLines = [];

            foreach ($validated['lines'] as $l) {
                $sub = number_format((float) $l['subtotal'], 6, '.', '');
                $taxRate = isset($l['tax_rate']) ? number_format((float) $l['tax_rate'], 6, '.', '') : '0.150000';
                $tax = bcmul($sub, $taxRate, 6);
                $tot = bcadd($sub, $tax, 6);

                $totalSubtotal = bcadd($totalSubtotal, $sub, 6);
                $totalTax = bcadd($totalTax, $tax, 6);
                $totalClaimed = bcadd($totalClaimed, $tot, 6);

                $processedLines[] = [
                    'tenant_id' => $tenantId,
                    'company_id' => $companyId,
                    'expense_account_id' => $l['expense_account_id'],
                    'vendor_name' => $l['vendor_name'],
                    'vendor_tax_number' => $l['vendor_tax_number'] ?? null,
                    'invoice_number' => $l['invoice_number'] ?? null,
                    'invoice_date' => $l['invoice_date'] ?? null,
                    'subtotal' => $sub,
                    'tax_rate' => $taxRate,
                    'tax_amount' => $tax,
                    'total' => $tot,
                    'description' => $l['description'],
                ];
            }

            $refundAmount = number_format((float) ($validated['refund_amount'] ?? 0), 6, '.', '');
            $reimbursementAmount = number_format((float) ($validated['reimbursement_amount'] ?? 0), 6, '.', '');

            $seq = EmployeeCustodySettlement::where('company_id', $companyId)->count() + 1;
            $settlementNumber = sprintf('ST-%s-%04d', now()->format('Y'), $seq);

            $settlement = EmployeeCustodySettlement::create([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'custody_id' => $custody->id,
                'settlement_number' => $settlementNumber,
                'settlement_date' => $validated['settlement_date'],
                'total_expenses_amount' => $totalSubtotal,
                'total_tax_amount' => $totalTax,
                'total_claimed_amount' => $totalClaimed,
                'refund_amount' => $refundAmount,
                'reimbursement_amount' => $reimbursementAmount,
                'status' => 'draft',
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($processedLines as $pLine) {
                $pLine['settlement_id'] = $settlement->id;
                EmployeeCustodyExpenseLine::create($pLine);
            }

            return $settlement;
        });

        // Post accounting entries immediately
        $postAction->execute($settlement, auth()->id());

        return redirect()->route('hr.custodies.show', $custody->id)
            ->with('success', "تم ترحيل واعتماد تسوية العهدة (#{$settlement->settlement_number}) بنجاح.");
    }

    public function printSettlement(
        EmployeeCustodySettlement $settlement,
        TafqeetService $tafqeetService
    ): Response {
        $settlement->load([
            'custody.employee.department',
            'custody.branch',
            'lines.expenseAccount',
            'journalEntry.lines.account',
            'postedByUser',
        ]);

        $company = app(CurrentCompany::class)->get();

        $tafqeet = $tafqeetService->inArabic((float) $settlement->total_claimed_amount, 'SAR');

        return Inertia::render('HR/Custodies/Print', [
            'settlement' => $settlement,
            'company' => $company,
            'tafqeet' => $tafqeet,
        ]);
    }
}
