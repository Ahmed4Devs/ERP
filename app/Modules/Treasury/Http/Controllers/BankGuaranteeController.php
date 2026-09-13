<?php

namespace App\Modules\Treasury\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Models\Account;
use App\Modules\Projects\Models\Project;
use App\Modules\Treasury\Models\BankGuarantee;
use App\Modules\Treasury\Services\BankGuaranteeService;
use App\Shared\Context\CurrentCompany;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BankGuaranteeController extends Controller
{
    public function __construct(
        protected BankGuaranteeService $guaranteeService
    ) {}

    public function index(Request $request): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $query = BankGuarantee::where('company_id', $companyId)
            ->with(['bankAccount', 'marginAccount', 'project'])
            ->when($request->filled('type'), fn ($q) => $q->where('type', $request->type))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->status))
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = $request->search;
                $q->where(function ($sub) use ($search) {
                    $sub->where('guarantee_number', 'ilike', "%{$search}%")
                        ->orWhere('beneficiary_name', 'ilike', "%{$search}%")
                        ->orWhere('issuing_bank', 'ilike', "%{$search}%");
                });
            });

        $guarantees = $query->latest('issue_date')->paginate(15)->withQueryString();

        $metrics = [
            'total_active_amount' => (float) BankGuarantee::where('company_id', $companyId)->whereIn('status', ['active', 'renewed'])->sum('amount'),
            'total_margin_amount' => (float) BankGuarantee::where('company_id', $companyId)->whereIn('status', ['active', 'renewed'])->sum('margin_amount'),
            'active_count' => BankGuarantee::where('company_id', $companyId)->whereIn('status', ['active', 'renewed'])->count(),
            'expiring_soon_count' => BankGuarantee::where('company_id', $companyId)
                ->whereIn('status', ['active', 'renewed'])
                ->where('expiry_date', '<=', now()->addDays(30))
                ->where('expiry_date', '>=', now())
                ->count(),
        ];

        return Inertia::render('Treasury/BankGuarantees/Index', [
            'guarantees' => $guarantees,
            'metrics' => $metrics,
            'filters' => [
                'type' => $request->type ?? '',
                'status' => $request->status ?? '',
                'search' => $request->search ?? '',
            ],
        ]);
    }

    public function create(): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $bankAccounts = Account::where('company_id', $companyId)
            ->where(function ($q) {
                $q->where('subtype', 'bank')
                    ->orWhere(fn ($sq) => $sq->where('type', 'asset')->where('code', 'like', '102%'));
            })
            ->where('is_postable', true)
            ->orderBy('code')
            ->get(['id', 'code', 'name', 'name_ar']);

        $marginAccounts = Account::where('company_id', $companyId)
            ->where('type', 'asset')
            ->where('is_postable', true)
            ->orderBy('code')
            ->get(['id', 'code', 'name', 'name_ar']);

        $projects = Project::where('company_id', $companyId)
            ->orderBy('name')
            ->get(['id', 'project_number', 'name', 'name_ar']);

        return Inertia::render('Treasury/BankGuarantees/Create', [
            'bankAccounts' => $bankAccounts,
            'marginAccounts' => $marginAccounts,
            'projects' => $projects,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $company = app(CurrentCompany::class)->get();

        $validated = $request->validate([
            'guarantee_number' => ['required', 'string', 'max:100'],
            'type' => ['required', 'in:bid_bond,performance_bond,advance_payment,retention'],
            'beneficiary_name' => ['required', 'string', 'max:255'],
            'issuing_bank' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'margin_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'margin_amount' => ['nullable', 'numeric', 'min:0'],
            'commission_amount' => ['nullable', 'numeric', 'min:0'],
            'bank_account_id' => ['nullable', 'uuid'],
            'margin_account_id' => ['nullable', 'uuid'],
            'issue_date' => ['required', 'date'],
            'expiry_date' => ['required', 'date', 'after_or_equal:issue_date'],
            'project_id' => ['nullable', 'uuid'],
            'notes' => ['nullable', 'string'],
        ]);

        $payload = array_merge($validated, [
            'company_id' => $company->id,
            'tenant_id' => $company->tenant_id,
        ]);

        $guarantee = $this->guaranteeService->issueGuarantee($payload);

        return redirect()->route('treasury.bank-guarantees.index')
            ->with('success', "تم إصدار خطاب الضمان البنكي رقم {$guarantee->guarantee_number} بنجاح وقيد التأمين.");
    }

    public function release(Request $request, BankGuarantee $bankGuarantee): RedirectResponse
    {
        $validated = $request->validate([
            'release_date' => ['nullable', 'date'],
        ]);

        $this->guaranteeService->releaseGuarantee($bankGuarantee->id, $validated['release_date'] ?? null);

        return back()->with('success', 'تم الإفراج عن خطاب الضمان واسترداد الغطاء النقدي بنجاح.');
    }

    public function renew(Request $request, BankGuarantee $bankGuarantee): RedirectResponse
    {
        $validated = $request->validate([
            'expiry_date' => ['required', 'date', 'after:'.$bankGuarantee->expiry_date->toDateString()],
            'renewal_fee' => ['nullable', 'numeric', 'min:0'],
        ]);

        $this->guaranteeService->renewGuarantee(
            $bankGuarantee->id,
            $validated['expiry_date'],
            (float) ($validated['renewal_fee'] ?? 0)
        );

        return back()->with('success', 'تم تجديد خطاب الضمان وتحديث تاريخ الصلاحية بنجاح.');
    }
}
