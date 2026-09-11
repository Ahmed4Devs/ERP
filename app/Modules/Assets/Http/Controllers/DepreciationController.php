<?php

namespace App\Modules\Assets\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Assets\Models\AssetDepreciationRun;
use App\Modules\Assets\Services\PostAssetDepreciationRunAction;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DepreciationController extends Controller
{
    public function index(): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $runs = AssetDepreciationRun::where('company_id', $companyId)
            ->with(['entries.fixedAsset', 'journalEntry'])
            ->orderBy('period_year', 'desc')
            ->orderBy('period_month', 'desc')
            ->paginate(15);

        return Inertia::render('Assets/Depreciation/Index', [
            'runs' => $runs,
        ]);
    }

    public function store(Request $request, PostAssetDepreciationRunAction $action): RedirectResponse
    {
        $companyId = app(CurrentCompany::class)->id();
        $tenantId = app(CurrentTenant::class)->id();

        $validated = $request->validate([
            'period_year' => ['required', 'integer', 'min:2020', 'max:2050'],
            'period_month' => ['required', 'integer', 'min:1', 'max:12'],
            'date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        $run = $action->execute(
            companyId: $companyId,
            tenantId: $tenantId,
            year: (int) $validated['period_year'],
            month: (int) $validated['period_month'],
            date: $validated['date'],
            notes: $validated['notes'] ?? null,
        );

        return redirect()->route('assets.depreciation.index')->with('success', "Depreciation run {$run->run_number} posted successfully.");
    }
}
