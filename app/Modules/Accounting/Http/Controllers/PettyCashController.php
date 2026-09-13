<?php

namespace App\Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\PettyCashFund;
use App\Modules\Accounting\Models\PettyCashSettlement;
use App\Modules\Accounting\Models\PettyCashSettlementLine;
use App\Modules\Accounting\Services\PostPettyCashSettlementAction;
use App\Modules\Localization\Services\QrCodeSvgService;
use App\Modules\Localization\Services\TafqeetService;
use App\Modules\Organization\Models\Branch;
use App\Modules\Organization\Models\Company;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PettyCashController extends Controller
{
    public function index(Request $request): Response
    {
        $companyId = app(CurrentCompany::class)->id();
        $tenantId = app(CurrentTenant::class)->id();

        $funds = PettyCashFund::where('company_id', $companyId)
            ->with(['custodian', 'account', 'branch'])
            ->latest()
            ->get();

        $settlementsQuery = PettyCashSettlement::where('company_id', $companyId)
            ->with(['fund', 'branch'])
            ->latest();

        if ($request->filled('status')) {
            $settlementsQuery->where('status', $request->query('status'));
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $settlementsQuery->where(function ($q) use ($search): void {
                $q->where('settlement_number', 'like', "%{$search}%")
                    ->orWhereHas('fund', function ($fq) use ($search): void {
                        $fq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $settlements = $settlementsQuery->paginate(15)->withQueryString();

        $metrics = [
            'total_funds' => $funds->count(),
            'total_fund_limits' => $funds->sum('fund_limit'),
            'total_current_balance' => $funds->sum('current_balance'),
            'posted_settlements_total' => PettyCashSettlement::where('company_id', $companyId)->where('status', 'posted')->sum('total'),
        ];

        $users = User::whereHas('memberships', fn ($q) => $q->where('tenant_id', $tenantId))->get(['id', 'name', 'email']);
        $custodyAccounts = Account::where('company_id', $companyId)
            ->where('type', 'asset')
            ->get(['id', 'code', 'name', 'name_ar']);
        $branches = Branch::where('company_id', $companyId)->get(['id', 'name']);

        return Inertia::render('Accounting/PettyCash/Index', [
            'funds' => $funds,
            'settlements' => $settlements,
            'metrics' => $metrics,
            'users' => $users,
            'custodyAccounts' => $custodyAccounts,
            'branches' => $branches,
            'filters' => $request->only(['status', 'search']),
        ]);
    }

    public function storeFund(Request $request): RedirectResponse
    {
        $companyId = app(CurrentCompany::class)->id();
        $tenantId = app(CurrentTenant::class)->id();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'name_ar' => ['nullable', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50'],
            'custodian_id' => ['nullable', 'integer'],
            'account_id' => ['required', 'string', 'uuid'],
            'branch_id' => ['nullable', 'string', 'uuid'],
            'fund_limit' => ['required', 'numeric', 'min:0'],
            'current_balance' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        PettyCashFund::create([
            'tenant_id' => $tenantId,
            'company_id' => $companyId,
            'branch_id' => $validated['branch_id'] ?? null,
            'custodian_id' => $validated['custodian_id'] ?? null,
            'account_id' => $validated['account_id'],
            'name' => $validated['name'],
            'name_ar' => $validated['name_ar'] ?? null,
            'code' => $validated['code'],
            'fund_limit' => $validated['fund_limit'],
            'current_balance' => $validated['current_balance'] ?? $validated['fund_limit'],
            'status' => 'active',
            'notes' => $validated['notes'] ?? null,
        ]);

        return redirect()->route('accounting.petty-cash.index')
            ->with('success', 'تم إنشاء صندوق العهدة النقدية بنجاح.');
    }

    public function createSettlement(): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $funds = PettyCashFund::where('company_id', $companyId)
            ->where('status', 'active')
            ->get(['id', 'name', 'code', 'current_balance', 'fund_limit', 'account_id']);

        $expenseAccounts = Account::where('company_id', $companyId)
            ->where('type', 'expense')
            ->get(['id', 'code', 'name', 'name_ar']);

        $bankAccounts = Account::where('company_id', $companyId)
            ->where('type', 'asset')
            ->where(function ($q): void {
                $q->whereIn('code', ['1010', '1020'])
                    ->orWhere('subtype', 'like', '%bank%')
                    ->orWhere('subtype', 'like', '%cash%');
            })
            ->get(['id', 'code', 'name', 'name_ar']);

        $branches = Branch::where('company_id', $companyId)->get(['id', 'name']);

        return Inertia::render('Accounting/PettyCash/CreateSettlement', [
            'funds' => $funds,
            'expenseAccounts' => $expenseAccounts,
            'bankAccounts' => $bankAccounts,
            'branches' => $branches,
        ]);
    }

    public function storeSettlement(Request $request): RedirectResponse
    {
        $companyId = app(CurrentCompany::class)->id();
        $tenantId = app(CurrentTenant::class)->id();

        $validated = $request->validate([
            'fund_id' => ['required', 'string', 'uuid'],
            'branch_id' => ['nullable', 'string', 'uuid'],
            'date' => ['required', 'date'],
            'reimbursement_type' => ['required', 'string', 'in:replenish_bank,deduct_custody'],
            'bank_account_id' => ['nullable', 'string', 'uuid'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.expense_account_id' => ['required', 'string', 'uuid'],
            'lines.*.description' => ['required', 'string'],
            'lines.*.receipt_ref' => ['nullable', 'string', 'max:100'],
            'lines.*.receipt_date' => ['nullable', 'date'],
            'lines.*.subtotal' => ['required', 'numeric', 'min:0.01'],
            'lines.*.tax_rate' => ['nullable', 'numeric', 'min:0', 'max:1'],
        ]);

        $settlementNumber = 'PCS-'.date('Ymd').'-'.strtoupper(bin2hex(random_bytes(3)));

        $settlement = DB::transaction(function () use ($tenantId, $companyId, $validated, $settlementNumber, $request) {
            $subtotal = '0.000000';
            $taxAmount = '0.000000';
            $total = '0.000000';

            $note = PettyCashSettlement::create([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'branch_id' => $validated['branch_id'] ?? null,
                'fund_id' => $validated['fund_id'],
                'settlement_number' => $settlementNumber,
                'date' => $validated['date'],
                'reimbursement_type' => $validated['reimbursement_type'],
                'bank_account_id' => $validated['bank_account_id'] ?? null,
                'subtotal' => '0.000000',
                'tax_amount' => '0.000000',
                'total' => '0.000000',
                'status' => 'draft',
                'notes' => $validated['notes'] ?? null,
                'created_by' => $request->user()?->id,
            ]);

            foreach ($validated['lines'] as $line) {
                $lineSub = (string) $line['subtotal'];
                $taxRate = isset($line['tax_rate']) ? (string) $line['tax_rate'] : '0.1500';
                $lineTax = bcmul($lineSub, $taxRate, 6);
                $lineTot = bcadd($lineSub, $lineTax, 6);

                PettyCashSettlementLine::create([
                    'tenant_id' => $tenantId,
                    'company_id' => $companyId,
                    'settlement_id' => $note->id,
                    'expense_account_id' => $line['expense_account_id'],
                    'description' => $line['description'],
                    'receipt_ref' => $line['receipt_ref'] ?? null,
                    'receipt_date' => $line['receipt_date'] ?? null,
                    'subtotal' => $lineSub,
                    'tax_rate' => $taxRate,
                    'tax_amount' => $lineTax,
                    'total' => $lineTot,
                ]);

                $subtotal = bcadd($subtotal, $lineSub, 6);
                $taxAmount = bcadd($taxAmount, $lineTax, 6);
                $total = bcadd($total, $lineTot, 6);
            }

            $note->update([
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'total' => $total,
            ]);

            return $note;
        });

        return redirect()->route('accounting.petty-cash.settlements.show', $settlement->id)
            ->with('success', 'تم إنشاء سند تسوية العهدة كمسودة بنجاح.');
    }

    public function showSettlement(PettyCashSettlement $settlement): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        if ($settlement->company_id !== $companyId) {
            abort(403);
        }

        $settlement->load([
            'fund.custodian',
            'branch',
            'bankAccount',
            'lines.expenseAccount',
            'journalEntry.lines.account',
        ]);

        return Inertia::render('Accounting/PettyCash/ShowSettlement', [
            'settlement' => $settlement,
        ]);
    }

    public function postSettlement(Request $request, PettyCashSettlement $settlement, PostPettyCashSettlementAction $action): RedirectResponse
    {
        $companyId = app(CurrentCompany::class)->id();

        if ($settlement->company_id !== $companyId) {
            abort(403);
        }

        $action->execute($settlement, $request->user()?->id);

        return redirect()->route('accounting.petty-cash.settlements.show', $settlement->id)
            ->with('success', 'تم ترحيل سند تسوية العهدة وتسجيل القيود المحاسبية بنجاح.');
    }

    public function printSettlement(PettyCashSettlement $settlement, QrCodeSvgService $qrSvgService, TafqeetService $tafqeetService): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        if ($settlement->company_id !== $companyId) {
            abort(403);
        }

        $settlement->load(['fund.custodian', 'branch', 'lines.expenseAccount']);
        $company = Company::findOrFail($companyId);

        $qrPayload = "PCS: {$settlement->settlement_number} | Fund: {$settlement->fund?->name} | Total: {$settlement->total} SAR | VAT: {$settlement->tax_amount} SAR | Date: {$settlement->date}";
        $qrCodeDataUri = $qrSvgService->generateDataUri($qrPayload, 160);

        $totalVal = (float) $settlement->total;

        return Inertia::render('Accounting/PettyCash/PrintSettlement', [
            'settlement' => $settlement,
            'company' => $company,
            'qrCodeDataUri' => $qrCodeDataUri,
            'amountInWords' => [
                'ar' => $tafqeetService->inArabic($totalVal),
                'en' => $tafqeetService->inEnglish($totalVal),
            ],
        ]);
    }
}
