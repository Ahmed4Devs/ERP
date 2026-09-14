<?php

namespace App\Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Models\CurrencyExchangeRate;
use App\Modules\Accounting\Services\FxRevaluationService;
use App\Modules\Accounting\Services\SamaExchangeRateService;
use App\Shared\Context\CurrentCompany;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CurrencyRateController extends Controller
{
    public function __construct(
        protected FxRevaluationService $fxService,
        protected SamaExchangeRateService $samaService
    ) {}

    public function index(Request $request): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();
        $today = now()->toDateString();

        $rates = CurrencyExchangeRate::where('company_id', $companyId)
            ->when($request->filled('currency'), fn ($q) => $q->where('from_currency', $request->currency))
            ->latest('effective_date')
            ->paginate(20)
            ->withQueryString();

        $popularCurrencies = ['USD', 'EUR', 'GBP', 'AED', 'KWD', 'BHD', 'OMR', 'QAR', 'CNY', 'JPY', 'CHF', 'INR', 'EGP'];

        $latestRates = [];
        foreach ($popularCurrencies as $curr) {
            $latestRates[$curr] = $this->fxService->getClosingRate($companyId, $curr);
        }

        $samaCurrencies = $this->samaService->getSupportedCurrencies();
        $isSamaSyncedToday = CurrencyExchangeRate::where('company_id', $companyId)
            ->where('effective_date', $today)
            ->where('source', 'LIKE', '%SAMA%')
            ->exists();

        $latestSamaSync = CurrencyExchangeRate::where('company_id', $companyId)
            ->where('source', 'LIKE', '%SAMA%')
            ->latest('effective_date')
            ->value('effective_date');

        return Inertia::render('Accounting/FxRates/Index', [
            'rates' => $rates,
            'latestRates' => $latestRates,
            'popularCurrencies' => $popularCurrencies,
            'samaCurrencies' => $samaCurrencies,
            'isSamaSyncedToday' => $isSamaSyncedToday,
            'latestSamaSync' => $latestSamaSync,
            'todayDate' => $today,
            'filters' => [
                'currency' => $request->currency ?? '',
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $company = app(CurrentCompany::class)->get();

        $validated = $request->validate([
            'from_currency' => ['required', 'string', 'size:3'],
            'rate' => ['required', 'numeric', 'min:0.000001'],
            'effective_date' => ['required', 'date'],
            'source' => ['nullable', 'string', 'max:50'],
        ]);

        $this->fxService->recordExchangeRate(
            $company->id,
            $company->tenant_id,
            $validated['from_currency'],
            (float) $validated['rate'],
            $validated['effective_date'],
            $validated['source'] ?? 'manual'
        );

        return back()->with('success', "تم تحديث سعر صرف {$validated['from_currency']}/SAR بتاريخ {$validated['effective_date']} بنجاح.");
    }

    public function syncSama(Request $request): RedirectResponse
    {
        $company = app(CurrentCompany::class)->get();
        $effectiveDate = $request->input('effective_date', now()->toDateString());

        $result = $this->samaService->syncCompanyRates($company->id, $company->tenant_id, $effectiveDate);

        return back()->with('success', "تمت مزامنة {$result['currencies_synced_count']} أسعار صرف رسمية من البنك المركزي السعودي (SAMA) بنجاح (سعر الدولار 3.750000 مثبت نظاماً).");
    }

    public function convert(Request $request): JsonResponse
    {
        $company = app(CurrentCompany::class)->get();

        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0'],
            'from_currency' => ['required', 'string', 'size:3'],
            'to_currency' => ['required', 'string', 'size:3'],
            'effective_date' => ['nullable', 'date'],
        ]);

        $result = $this->samaService->convert(
            (float) $validated['amount'],
            $validated['from_currency'],
            $validated['to_currency'],
            $validated['effective_date'] ?? now()->toDateString(),
            $company->id
        );

        return response()->json($result);
    }
}
