<?php

namespace App\Modules\Assets\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Assets\Models\FixedAsset;
use App\Modules\Assets\Services\ZatcaTaxDepreciationService;
use App\Shared\Context\CurrentCompany;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ZatcaTaxAssetScheduleController extends Controller
{
    /**
     * Display ZATCA Statutory Asset Tax Depreciation & Zakat Schedule.
     */
    public function index(Request $request, ZatcaTaxDepreciationService $taxService): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $taxYear = (int) $request->query('tax_year', date('Y'));
        $schedule = $taxService->computeSchedule($companyId, $taxYear);

        // Fetch assets with their tax group classification
        $assets = FixedAsset::where('company_id', $companyId)
            ->with(['category', 'branch'])
            ->when($request->search, function ($q, $search): void {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('asset_tag', 'ilike', "%{$search}%");
            })
            ->when($request->group, fn ($q, $grp) => $q->where('zatca_tax_group', $grp))
            ->orderBy('purchase_date', 'desc')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Assets/ZatcaTaxSchedule/Index', [
            'taxYear' => $taxYear,
            'schedule' => $schedule,
            'groupsDefinition' => ZatcaTaxDepreciationService::GROUPS,
            'assets' => $assets,
            'filters' => [
                'tax_year' => $taxYear,
                'search' => $request->search,
                'group' => $request->group,
            ],
        ]);
    }

    /**
     * Update asset ZATCA statutory tax group classification.
     */
    public function updateAssetTaxGroup(Request $request, FixedAsset $asset): RedirectResponse
    {
        $companyId = app(CurrentCompany::class)->id();
        abort_if($asset->company_id !== $companyId, 403);

        $validated = $request->validate([
            'zatca_tax_group' => 'required|string|in:group_1,group_2,group_3,group_4,group_5',
            'zatca_tax_base' => 'nullable|numeric|min:0',
        ]);

        $asset->update($validated);

        return back()->with('success', "Asset {$asset->asset_tag} ZATCA tax group updated successfully.");
    }

    /**
     * Export ZATCA Statutory Asset Schedule as CSV.
     */
    public function exportCsv(Request $request, ZatcaTaxDepreciationService $taxService): StreamedResponse
    {
        $companyId = app(CurrentCompany::class)->id();
        $taxYear = (int) $request->query('tax_year', date('Y'));

        $content = $taxService->generateScheduleCsv($companyId, $taxYear);
        $filename = "ZATCA_Asset_Tax_Schedule_{$taxYear}.csv";

        return response()->streamDownload(function () use ($content): void {
            echo $content;
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }
}
