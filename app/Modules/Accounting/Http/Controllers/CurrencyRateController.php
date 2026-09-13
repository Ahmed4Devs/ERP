<?php

namespace App\Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Models\CurrencyExchangeRate;
use App\Modules\Accounting\Services\FxRevaluationService;
use App\Shared\Context\CurrentCompany;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CurrencyRateController extends Controller
{
    public function __construct(
        protected FxRevaluationService $fxService
    ) {}

    public function index(Request $request): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $rates = CurrencyExchangeRate::where('company_id', $companyId)
            ->when($request->filled('currency'), fn ($q) => $q->where('from_currency', $request->currency))
            ->latest('effective_date')
            ->paginate(20)
            ->withQueryString();

        $popularCurrencies = ['USD', 'EUR', 'GBP', 'AED', 'KWD', 'BHD', 'OMR', 'QAR', 'CNY', 'JPY'];

        $latestRates = [];
        foreach ($popularCurrencies as $curr) {
            $latestRates[$curr] = $this->fxService->getClosingRate($companyId, $curr);
        }

        return Inertia::render('Accounting/FxRates/Index', [
            'rates' => $rates,
            'latestRates' => $latestRates,
            'popularCurrencies' => $popularCurrencies,
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
}
