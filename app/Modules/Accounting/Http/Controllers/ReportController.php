<?php

namespace App\Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Queries\AccountsReceivableAgingQuery;
use App\Modules\Accounting\Queries\GeneralLedgerQuery;
use App\Modules\Accounting\Queries\TrialBalanceQuery;
use App\Modules\Platform\Services\CsvExportService;
use App\Modules\Purchasing\Queries\AccountsPayableAgingQuery;
use App\Shared\Context\CurrentCompany;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function trialBalance(Request $request, TrialBalanceQuery $query): Response
    {
        $asOfDate = $request->as_of_date ?? now()->toDateString();
        $reportData = $query->execute($asOfDate);

        return Inertia::render('Accounting/Reports/TrialBalance', [
            'report' => $reportData,
            'asOfDate' => $asOfDate,
        ]);
    }

    public function generalLedger(Request $request, GeneralLedgerQuery $query): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $accountId = $request->account_id;
        $startDate = $request->start_date;
        $endDate = $request->end_date ?? now()->toDateString();

        $reportData = $query->execute($accountId, $startDate, $endDate);

        $accounts = Account::where('company_id', $companyId)
            ->where('is_postable', true)
            ->orderBy('code', 'asc')
            ->get(['id', 'code', 'name', 'name_ar']);

        return Inertia::render('Accounting/Reports/GeneralLedger', [
            'report' => $reportData,
            'accounts' => $accounts,
            'filters' => [
                'account_id' => $accountId,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ]);
    }

    public function aging(Request $request, AccountsReceivableAgingQuery $query): Response
    {
        $asOfDate = $request->as_of_date ?? now()->toDateString();
        $reportData = $query->execute($asOfDate);

        return Inertia::render('Accounting/Reports/Aging', [
            'report' => $reportData,
            'asOfDate' => $asOfDate,
        ]);
    }

    public function apAging(Request $request, AccountsPayableAgingQuery $query): Response
    {
        $asOfDate = $request->as_of_date ?? now()->toDateString();
        $reportData = $query->execute($asOfDate);

        return Inertia::render('Accounting/Reports/ApAging', [
            'report' => $reportData,
            'asOfDate' => $asOfDate,
        ]);
    }

    public function exportTrialBalance(
        Request $request,
        TrialBalanceQuery $query,
        CsvExportService $csvService
    ): StreamedResponse {
        $asOfDate = $request->as_of_date ?? now()->toDateString();
        $reportData = $query->execute($asOfDate);

        $headers = [
            'رمز الحساب / Code',
            'اسم الحساب / Name',
            'اسم الحساب (عربي) / Name AR',
            'نوع الحساب / Type',
            'إجمالي المدين / Total Debit',
            'إجمالي الدائن / Total Credit',
            'صافي مدين / Net Debit',
            'صافي دائن / Net Credit',
        ];

        $rows = [];
        foreach ($reportData['accounts'] as $acc) {
            $rows[] = [
                $acc['code'],
                $acc['name'],
                $acc['name_ar'] ?? '',
                $acc['type'],
                number_format((float) $acc['debit_total'], 2),
                number_format((float) $acc['credit_total'], 2),
                number_format((float) $acc['net_debit'], 2),
                number_format((float) $acc['net_credit'], 2),
            ];
        }

        // Summary row
        $rows[] = [
            'المجموع العام / Total',
            '',
            '',
            '',
            '',
            '',
            number_format((float) $reportData['total_debit'], 2),
            number_format((float) $reportData['total_credit'], 2),
        ];

        return $csvService->stream("trial-balance-{$asOfDate}.csv", $headers, $rows);
    }

    public function exportGeneralLedger(
        Request $request,
        GeneralLedgerQuery $query,
        CsvExportService $csvService
    ): StreamedResponse {
        $accountId = $request->account_id;
        $startDate = $request->start_date;
        $endDate = $request->end_date ?? now()->toDateString();

        $reportData = $query->execute($accountId, $startDate, $endDate);

        $headers = [
            'التاريخ / Date',
            'رقم القيد / Entry #',
            'البيان / Description',
            'مدين / Debit',
            'دائن / Credit',
            'الرصيد التراكمي / Running Balance',
        ];

        $rows = [];
        foreach ($reportData['lines'] as $line) {
            $rows[] = [
                $line['date'],
                $line['entry_number'],
                $line['description'],
                number_format((float) $line['debit'], 2),
                number_format((float) $line['credit'], 2),
                number_format((float) $line['running_balance'], 2),
            ];
        }

        $rows[] = [
            'الإجمالي / Total',
            '',
            '',
            number_format((float) $reportData['total_debit'], 2),
            number_format((float) $reportData['total_credit'], 2),
            '',
        ];

        $accountCode = $reportData['account'] ? $reportData['account']->code : 'all';

        return $csvService->stream("general-ledger-{$accountCode}-{$endDate}.csv", $headers, $rows);
    }

    public function exportArAging(
        Request $request,
        AccountsReceivableAgingQuery $query,
        CsvExportService $csvService
    ): StreamedResponse {
        $asOfDate = $request->as_of_date ?? now()->toDateString();
        $reportData = $query->execute($asOfDate);

        $headers = [
            'اسم العميل / Customer Name',
            'الاسم بالعربي / Customer Name AR',
            'الحالي (أقل من 30 يوم) / Current (0-30)',
            '31-60 يوم / Days 31-60',
            '61-90 يوم / Days 61-90',
            'أكثر من 90 يوم / Over 90 Days',
            'إجمالي المستحق / Total Due',
        ];

        $rows = [];
        foreach ($reportData as $row) {
            $rows[] = [
                $row['party_name'],
                $row['party_name_ar'] ?? '',
                number_format((float) $row['current'], 2),
                number_format((float) $row['days_31_60'], 2),
                number_format((float) $row['days_61_90'], 2),
                number_format((float) $row['days_over_90'], 2),
                number_format((float) $row['total'], 2),
            ];
        }

        return $csvService->stream("ar-aging-{$asOfDate}.csv", $headers, $rows);
    }

    public function exportApAging(
        Request $request,
        AccountsPayableAgingQuery $query,
        CsvExportService $csvService
    ): StreamedResponse {
        $asOfDate = $request->as_of_date ?? now()->toDateString();
        $reportData = $query->execute($asOfDate);

        $headers = [
            'اسم المورد / Vendor Name',
            'الاسم بالعربي / Vendor Name AR',
            'الحالي (أقل من 30 يوم) / Current (0-30)',
            '31-60 يوم / Days 31-60',
            '61-90 يوم / Days 61-90',
            'أكثر من 90 يوم / Over 90 Days',
            'إجمالي المستحق / Total Due',
        ];

        $rows = [];
        foreach ($reportData as $row) {
            $rows[] = [
                $row['party_name'],
                $row['party_name_ar'] ?? '',
                number_format((float) $row['current'], 2),
                number_format((float) $row['days_31_60'], 2),
                number_format((float) $row['days_61_90'], 2),
                number_format((float) $row['days_over_90'], 2),
                number_format((float) $row['total'], 2),
            ];
        }

        return $csvService->stream("ap-aging-{$asOfDate}.csv", $headers, $rows);
    }
}
