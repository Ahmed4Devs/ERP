<?php

namespace App\Modules\Assets\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Models\Account;
use App\Modules\Assets\Models\FixedAsset;
use App\Modules\Assets\Models\FixedAssetDisposal;
use App\Modules\Assets\Services\PostAssetDisposalAction;
use App\Modules\Localization\Services\QrCodeSvgService;
use App\Modules\Localization\Services\TafqeetService;
use App\Modules\Organization\Models\Branch;
use App\Modules\Organization\Models\Company;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FixedAssetDisposalController extends Controller
{
    public function index(Request $request): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $query = FixedAssetDisposal::where('company_id', $companyId)
            ->with(['asset.category', 'branch'])
            ->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('disposal_type')) {
            $query->where('disposal_type', $request->query('disposal_type'));
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search): void {
                $q->where('disposal_number', 'like', "%{$search}%")
                    ->orWhereHas('asset', function ($aq) use ($search): void {
                        $aq->where('name', 'like', "%{$search}%")
                            ->orWhere('asset_tag', 'like', "%{$search}%");
                    });
            });
        }

        $disposals = $query->paginate(15)->withQueryString();

        $metrics = [
            'total_disposals' => FixedAssetDisposal::where('company_id', $companyId)->count(),
            'total_proceeds' => FixedAssetDisposal::where('company_id', $companyId)->where('status', 'posted')->sum('proceeds'),
            'total_gain' => FixedAssetDisposal::where('company_id', $companyId)->where('status', 'posted')->where('gain_loss_type', 'gain')->sum('gain_loss_amount'),
            'total_loss' => FixedAssetDisposal::where('company_id', $companyId)->where('status', 'posted')->where('gain_loss_type', 'loss')->sum('gain_loss_amount'),
        ];

        return Inertia::render('Assets/Disposals/Index', [
            'disposals' => $disposals,
            'metrics' => $metrics,
            'filters' => $request->only(['status', 'disposal_type', 'search']),
        ]);
    }

    public function create(): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $assets = FixedAsset::where('company_id', $companyId)
            ->whereIn('status', ['active', 'fully_depreciated'])
            ->with(['category', 'branch'])
            ->get([
                'id',
                'name',
                'asset_tag',
                'serial_number',
                'acquisition_cost',
                'accumulated_depreciation',
                'net_book_value',
                'branch_id',
            ]);

        $bankAccounts = Account::where('company_id', $companyId)
            ->where('type', 'asset')
            ->where(function ($q): void {
                $q->whereIn('code', ['1010', '1020'])
                    ->orWhere('subtype', 'like', '%bank%')
                    ->orWhere('subtype', 'like', '%cash%');
            })
            ->get(['id', 'code', 'name', 'name_ar']);

        $branches = Branch::where('company_id', $companyId)->get(['id', 'name']);

        return Inertia::render('Assets/Disposals/Create', [
            'assets' => $assets,
            'bankAccounts' => $bankAccounts,
            'branches' => $branches,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $companyId = app(CurrentCompany::class)->id();
        $tenantId = app(CurrentTenant::class)->id();

        $validated = $request->validate([
            'fixed_asset_id' => ['required', 'string', 'uuid'],
            'disposal_date' => ['required', 'date'],
            'disposal_type' => ['required', 'string', 'in:sale,scrap,donation,stolen'],
            'proceeds' => ['nullable', 'numeric', 'min:0'],
            'bank_account_id' => ['nullable', 'string', 'uuid'],
            'buyer_name' => ['nullable', 'string', 'max:255'],
            'reason' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $asset = FixedAsset::where('company_id', $companyId)->findOrFail($validated['fixed_asset_id']);

        $cost = (string) $asset->acquisition_cost;
        $accumDep = (string) $asset->accumulated_depreciation;
        $nbv = (string) $asset->net_book_value;
        $proceeds = isset($validated['proceeds']) ? (string) $validated['proceeds'] : '0.000000';

        // Calculate gain or loss
        $diff = bcsub($proceeds, $nbv, 6);
        $cmp = bccomp($diff, '0.000000', 6);

        if ($cmp > 0) {
            $gainLossType = 'gain';
            $gainLossAmount = $diff;
        } elseif ($cmp < 0) {
            $gainLossType = 'loss';
            $gainLossAmount = bcmul($diff, '-1', 6);
        } else {
            $gainLossType = 'none';
            $gainLossAmount = '0.000000';
        }

        $disposalNumber = 'FAD-'.date('Ymd').'-'.strtoupper(bin2hex(random_bytes(3)));

        $disposal = FixedAssetDisposal::create([
            'tenant_id' => $tenantId,
            'company_id' => $companyId,
            'branch_id' => $asset->branch_id,
            'fixed_asset_id' => $asset->id,
            'disposal_number' => $disposalNumber,
            'disposal_date' => $validated['disposal_date'],
            'disposal_type' => $validated['disposal_type'],
            'acquisition_cost' => $cost,
            'accumulated_depreciation' => $accumDep,
            'net_book_value' => $nbv,
            'proceeds' => $proceeds,
            'tax_amount' => '0.000000',
            'gain_loss_amount' => $gainLossAmount,
            'gain_loss_type' => $gainLossType,
            'bank_account_id' => $validated['bank_account_id'] ?? null,
            'buyer_name' => $validated['buyer_name'] ?? null,
            'reason' => $validated['reason'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'status' => 'draft',
            'created_by' => $request->user()?->id,
        ]);

        return redirect()->route('assets.disposals.show', $disposal->id)
            ->with('success', 'تم تسجيل مسودة استبعاد/تخريد الأصل بنجاح.');
    }

    public function show(FixedAssetDisposal $disposal): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        if ($disposal->company_id !== $companyId) {
            abort(403);
        }

        $disposal->load([
            'asset.category',
            'branch',
            'bankAccount',
            'journalEntry.lines.account',
        ]);

        return Inertia::render('Assets/Disposals/Show', [
            'disposal' => $disposal,
        ]);
    }

    public function post(Request $request, FixedAssetDisposal $disposal, PostAssetDisposalAction $action): RedirectResponse
    {
        $companyId = app(CurrentCompany::class)->id();

        if ($disposal->company_id !== $companyId) {
            abort(403);
        }

        $action->execute($disposal, $request->user()?->id);

        return redirect()->route('assets.disposals.show', $disposal->id)
            ->with('success', 'تم ترحيل استبعاد الأصل، عكس مجمع الإهلاك، وإثبات الأرباح/الخسائر الرأسمالية بنجاح.');
    }

    public function print(FixedAssetDisposal $disposal, QrCodeSvgService $qrSvgService, TafqeetService $tafqeetService): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        if ($disposal->company_id !== $companyId) {
            abort(403);
        }

        $disposal->load(['asset.category', 'branch', 'bankAccount']);
        $company = Company::findOrFail($companyId);

        $qrPayload = "FAD: {$disposal->disposal_number} | Asset: {$disposal->asset?->name} ({$disposal->asset?->asset_tag}) | Type: {$disposal->disposal_type} | NBV: {$disposal->net_book_value} SAR | Proceeds: {$disposal->proceeds} SAR | Date: {$disposal->disposal_date}";
        $qrCodeDataUri = $qrSvgService->generateDataUri($qrPayload, 160);

        $proceedsVal = (float) $disposal->proceeds;
        $nbvVal = (float) $disposal->net_book_value;

        return Inertia::render('Assets/Disposals/Print', [
            'disposal' => $disposal,
            'company' => $company,
            'qrCodeDataUri' => $qrCodeDataUri,
            'amountInWords' => [
                'proceeds_ar' => $tafqeetService->inArabic($proceedsVal),
                'proceeds_en' => $tafqeetService->inEnglish($proceedsVal),
                'nbv_ar' => $tafqeetService->inArabic($nbvVal),
                'nbv_en' => $tafqeetService->inEnglish($nbvVal),
            ],
        ]);
    }
}
