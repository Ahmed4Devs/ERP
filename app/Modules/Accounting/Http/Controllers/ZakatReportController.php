<?php

namespace App\Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Services\PostZakatProvisionAction;
use App\Modules\Accounting\Services\ZakatCalculationService;
use App\Shared\Context\CurrentCompany;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ZakatReportController extends Controller
{
    /**
     * Display the interactive Saudi Zakat Base & Annual Liability Schedule.
     */
    public function index(Request $request, ZakatCalculationService $zakatService): Response
    {
        $companyId = app(CurrentCompany::class)->id();
        $taxYear = (int) $request->query('tax_year', (int) now()->format('Y'));
        $calendarType = $request->query('calendar_type', 'gregorian');
        $carriedLosses = $request->query('carried_forward_losses') !== null ? (float) $request->query('carried_forward_losses') : null;
        $nonDeductible = $request->query('non_deductible_provisions') !== null ? (float) $request->query('non_deductible_provisions') : null;

        $options = [
            'calendar_type' => $calendarType,
            'carried_forward_losses' => $carriedLosses,
            'non_deductible_provisions' => $nonDeductible,
        ];

        $schedule = $zakatService->calculateZakatSchedule($companyId, $taxYear, $options);

        return Inertia::render('Accounting/Zakat/Index', [
            'schedule' => $schedule,
            'taxYear' => $taxYear,
            'calendarType' => $calendarType,
            'filters' => [
                'tax_year' => $taxYear,
                'calendar_type' => $calendarType,
                'carried_forward_losses' => $carriedLosses,
                'non_deductible_provisions' => $nonDeductible,
            ],
        ]);
    }

    /**
     * Post the calculated or custom annual Zakat provision to the General Ledger.
     */
    public function postProvision(Request $request, PostZakatProvisionAction $action): RedirectResponse
    {
        $companyId = app(CurrentCompany::class)->id();
        $validated = $request->validate([
            'tax_year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'amount' => ['nullable', 'numeric', 'min:0.01'],
            'calendar_type' => ['nullable', 'string', 'in:gregorian,hijri'],
        ]);

        $taxYear = (int) $validated['tax_year'];
        $amount = isset($validated['amount']) ? (float) $validated['amount'] : null;
        $options = [
            'calendar_type' => $validated['calendar_type'] ?? 'gregorian',
        ];

        try {
            $journalEntry = $action->execute($companyId, $taxYear, $amount, $options);

            return back()->with('success', "تم ترحيل قيد مخصص الزكاة الشرعية بنجاح (سند قيد رقم #{$journalEntry->entry_number}).");
        } catch (\Throwable $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Export the official ZATCA Zakat Schedule as CSV for tax returns.
     */
    public function export(Request $request, ZakatCalculationService $zakatService): StreamedResponse
    {
        $companyId = app(CurrentCompany::class)->id();
        $taxYear = (int) $request->query('tax_year', (int) now()->format('Y'));
        $calendarType = $request->query('calendar_type', 'gregorian');
        $carriedLosses = $request->query('carried_forward_losses') !== null ? (float) $request->query('carried_forward_losses') : null;
        $nonDeductible = $request->query('non_deductible_provisions') !== null ? (float) $request->query('non_deductible_provisions') : null;

        $options = [
            'calendar_type' => $calendarType,
            'carried_forward_losses' => $carriedLosses,
            'non_deductible_provisions' => $nonDeductible,
        ];

        $csvContent = $zakatService->generateZakatScheduleCsv($companyId, $taxYear, $options);
        $filename = "ZATCA_Zakat_Schedule_{$taxYear}.csv";

        return response()->streamDownload(function () use ($csvContent): void {
            echo $csvContent;
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }
}
