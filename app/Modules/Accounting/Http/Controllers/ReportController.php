<?php

namespace App\Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Queries\AccountsReceivableAgingQuery;
use App\Modules\Accounting\Queries\GeneralLedgerQuery;
use App\Modules\Accounting\Queries\TrialBalanceQuery;
use App\Shared\Context\CurrentCompany;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

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
}
