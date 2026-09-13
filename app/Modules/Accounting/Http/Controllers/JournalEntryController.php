<?php

namespace App\Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Models\JournalEntry;
use App\Modules\Localization\Services\QrCodeSvgService;
use App\Modules\Localization\Services\TafqeetService;
use App\Shared\Context\CurrentCompany;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class JournalEntryController extends Controller
{
    public function index(Request $request): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $entries = JournalEntry::where('company_id', $companyId)
            ->with(['postedBy', 'lines.account'])
            ->when($request->search, function ($q, $search): void {
                $q->where(function ($sq) use ($search): void {
                    $sq->where('entry_number', 'ilike', "%{$search}%")
                        ->orWhere('description', 'ilike', "%{$search}%");
                });
            })
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->start_date, fn ($q) => $q->where('date', '>=', $request->start_date))
            ->when($request->end_date, fn ($q) => $q->where('date', '<=', $request->end_date))
            ->latest('date')
            ->paginate(15)
            ->withQueryString();

        // Attach computed amounts
        $entries->getCollection()->transform(function (JournalEntry $entry) {
            $totalDebit = 0.0;
            $totalCredit = 0.0;
            foreach ($entry->lines as $line) {
                $totalDebit += (float) $line->debit;
                $totalCredit += (float) $line->credit;
            }

            return [
                'id' => $entry->id,
                'entry_number' => $entry->entry_number,
                'date' => $entry->date->toDateString(),
                'description' => $entry->description,
                'status' => $entry->status,
                'source_type' => $entry->source_type,
                'total_debit' => $totalDebit,
                'total_credit' => $totalCredit,
                'is_balanced' => abs($totalDebit - $totalCredit) < 0.0001,
                'posted_by' => $entry->postedBy?->name,
                'posted_at' => $entry->posted_at?->toDateTimeString(),
            ];
        });

        return Inertia::render('Accounting/JournalEntries/Index', [
            'entries' => $entries,
            'filters' => [
                'search' => $request->search,
                'status' => $request->status,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
            ],
        ]);
    }

    public function show(string $id): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $entry = JournalEntry::where('company_id', $companyId)
            ->with([
                'postedBy',
                'lines.account',
                'company',
                'reversalOf',
                'reversedBy',
            ])
            ->findOrFail($id);

        $totalDebit = 0.0;
        $totalCredit = 0.0;
        foreach ($entry->lines as $line) {
            $totalDebit += (float) $line->debit;
            $totalCredit += (float) $line->credit;
        }

        return Inertia::render('Accounting/JournalEntries/Show', [
            'entry' => $entry,
            'totals' => [
                'total_debit' => $totalDebit,
                'total_credit' => $totalCredit,
                'is_balanced' => abs($totalDebit - $totalCredit) < 0.0001,
            ],
        ]);
    }

    public function print(string $id, TafqeetService $tafqeetService, QrCodeSvgService $qrSvgService): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $entry = JournalEntry::where('company_id', $companyId)
            ->with([
                'postedBy',
                'lines.account',
                'company',
            ])
            ->findOrFail($id);

        $company = $entry->company ?: $currentCompany->get();

        $totalDebit = 0.0;
        $totalCredit = 0.0;
        foreach ($entry->lines as $line) {
            $totalDebit += (float) $line->debit;
            $totalCredit += (float) $line->credit;
        }

        $currency = $company->currency ?? 'SAR';
        $qrPayload = "Journal Voucher: {$entry->entry_number} | Date: {$entry->date->toDateString()} | Total: {$totalDebit} {$currency} | Status: {$entry->status}";
        $qrCodeDataUri = $qrSvgService->generateDataUri($qrPayload, 160);

        return Inertia::render('Accounting/JournalEntries/Print', [
            'entry' => $entry,
            'company' => $company,
            'totals' => [
                'total_debit' => $totalDebit,
                'total_credit' => $totalCredit,
                'is_balanced' => abs($totalDebit - $totalCredit) < 0.0001,
            ],
            'amountInWords' => [
                'ar' => $tafqeetService->inArabic($totalDebit),
                'en' => $tafqeetService->inEnglish($totalDebit),
            ],
            'qrCodeDataUri' => $qrCodeDataUri,
        ]);
    }
}
