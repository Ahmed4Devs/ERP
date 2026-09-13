<?php

namespace App\Modules\Treasury\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Models\Account;
use App\Modules\MasterData\Models\Party;
use App\Modules\Treasury\Models\Cheque;
use App\Modules\Treasury\Services\ChequeService;
use App\Shared\Context\CurrentCompany;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ChequeController extends Controller
{
    public function __construct(
        protected ChequeService $chequeService
    ) {}

    public function index(Request $request): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $query = Cheque::where('company_id', $companyId)
            ->with(['party', 'bankAccount', 'pdcAccount'])
            ->when($request->filled('type'), fn ($q) => $q->where('type', $request->type))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->status))
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = $request->search;
                $q->where(function ($sub) use ($search) {
                    $sub->where('cheque_number', 'ilike', "%{$search}%")
                        ->orWhere('drawer_name', 'ilike', "%{$search}%")
                        ->orWhere('payee_name', 'ilike', "%{$search}%")
                        ->orWhere('bank_name', 'ilike', "%{$search}%");
                });
            });

        $cheques = $query->latest('issue_date')->paginate(15)->withQueryString();

        $bankAccounts = Account::where('company_id', $companyId)
            ->where(function ($q) {
                $q->where('subtype', 'bank')
                    ->orWhere(fn ($sq) => $sq->where('type', 'asset')->where('code', 'like', '102%'));
            })
            ->where('is_postable', true)
            ->orderBy('code')
            ->get(['id', 'code', 'name', 'name_ar']);

        $metrics = [
            'total_received_amount' => (float) Cheque::where('company_id', $companyId)->where('type', 'received')->sum('amount'),
            'total_issued_amount' => (float) Cheque::where('company_id', $companyId)->where('type', 'issued')->sum('amount'),
            'in_safe_count' => Cheque::where('company_id', $companyId)->where('status', 'in_safe')->count(),
            'under_collection_count' => Cheque::where('company_id', $companyId)->where('status', 'under_collection')->count(),
            'collected_count' => Cheque::where('company_id', $companyId)->where('status', 'collected')->count(),
            'bounced_count' => Cheque::where('company_id', $companyId)->where('status', 'bounced')->count(),
            'issued_pending_count' => Cheque::where('company_id', $companyId)->where('type', 'issued')->where('status', 'issued')->count(),
            'cleared_count' => Cheque::where('company_id', $companyId)->where('status', 'cleared')->count(),
        ];

        return Inertia::render('Treasury/Cheques/Index', [
            'cheques' => $cheques,
            'bankAccounts' => $bankAccounts,
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

        $parties = Party::orderBy('name')
            ->get(['id', 'name', 'type']);

        $bankAccounts = Account::where('company_id', $companyId)
            ->where(function ($q) {
                $q->where('subtype', 'bank')
                    ->orWhere(fn ($sq) => $sq->where('type', 'asset')->where('code', 'like', '102%'));
            })
            ->where('is_postable', true)
            ->orderBy('code')
            ->get(['id', 'code', 'name', 'name_ar']);

        return Inertia::render('Treasury/Cheques/Create', [
            'parties' => $parties,
            'bankAccounts' => $bankAccounts,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $company = app(CurrentCompany::class)->get();

        $validated = $request->validate([
            'type' => ['required', 'in:received,issued'],
            'cheque_number' => ['required', 'string', 'max:100'],
            'bank_name' => ['required', 'string', 'max:255'],
            'drawer_name' => ['required', 'string', 'max:255'],
            'payee_name' => ['nullable', 'string', 'max:255'],
            'issue_date' => ['required', 'date'],
            'due_date' => ['required', 'date'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'currency' => ['nullable', 'string', 'max:3'],
            'party_id' => ['nullable', 'uuid'],
            'bank_account_id' => ['nullable', 'uuid'],
            'notes' => ['nullable', 'string'],
        ]);

        $payload = array_merge($validated, [
            'company_id' => $company->id,
            'tenant_id' => $company->tenant_id,
            'currency' => $validated['currency'] ?? 'SAR',
        ]);

        if ($validated['type'] === 'received') {
            $cheque = $this->chequeService->registerReceivedCheque($payload);
        } else {
            $cheque = $this->chequeService->registerIssuedCheque($payload);
        }

        return redirect()->route('treasury.cheques.show', $cheque->id)
            ->with('success', "تم تسجيل الشيك رقم {$cheque->cheque_number} بنجاح وقيد السند المحاسبي.");
    }

    public function show(Cheque $cheque): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $cheque->load([
            'party',
            'bankAccount',
            'pdcAccount',
            'journalEntry.lines.account',
            'settlementJournalEntry.lines.account',
        ]);

        $bankAccounts = Account::where('company_id', $companyId)
            ->where(function ($q) {
                $q->where('subtype', 'bank')
                    ->orWhere(fn ($sq) => $sq->where('type', 'asset')->where('code', 'like', '102%'));
            })
            ->where('is_postable', true)
            ->orderBy('code')
            ->get(['id', 'code', 'name', 'name_ar']);

        return Inertia::render('Treasury/Cheques/Show', [
            'cheque' => $cheque,
            'bankAccounts' => $bankAccounts,
        ]);
    }

    public function deposit(Request $request, Cheque $cheque): RedirectResponse
    {
        $validated = $request->validate([
            'bank_account_id' => ['required', 'uuid'],
        ]);

        $this->chequeService->depositReceivedCheque($cheque->id, $validated['bank_account_id']);

        return back()->with('success', 'تم إيداع الشيك برسم التحصيل لدى البنك بنجاح.');
    }

    public function collect(Request $request, Cheque $cheque): RedirectResponse
    {
        $validated = $request->validate([
            'date' => ['nullable', 'date'],
        ]);

        $this->chequeService->collectReceivedCheque($cheque->id, $validated['date'] ?? null);

        return back()->with('success', 'تم تحصيل الشيك وإيداع القيمة في الحساب البنكي وإقفال القيد.');
    }

    public function bounce(Request $request, Cheque $cheque): RedirectResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $this->chequeService->bounceReceivedCheque($cheque->id, $validated['reason']);

        return back()->with('success', 'تم تسجيل ارتداد الشيك وعكس القيود المحاسبية بنجاح.');
    }

    public function clear(Request $request, Cheque $cheque): RedirectResponse
    {
        $validated = $request->validate([
            'date' => ['nullable', 'date'],
        ]);

        $this->chequeService->clearIssuedCheque($cheque->id, $validated['date'] ?? null);

        return back()->with('success', 'تم خصم ومقاصة الشيك الصادر من الحساب البنكي وتسجيل القيد المحاسبي.');
    }
}
