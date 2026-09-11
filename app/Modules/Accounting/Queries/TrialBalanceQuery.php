<?php

namespace App\Modules\Accounting\Queries;

use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\JournalEntryLine;
use App\Shared\Context\CurrentCompany;
use Illuminate\Support\Facades\DB;

class TrialBalanceQuery
{
    /**
     * Compute Trial Balance summary for the current company.
     *
     * @return array{
     *     accounts: array<int, array{
     *         id: string,
     *         code: string,
     *         name: string,
     *         name_ar: string|null,
     *         type: string,
     *         debit_total: string,
     *         credit_total: string,
     *         net_debit: string,
     *         net_credit: string
     *     }>,
     *     total_debit: string,
     *     total_credit: string,
     *     is_balanced: bool
     * }
     */
    public function execute(?string $asOfDate = null): array
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $accounts = Account::where('company_id', $companyId)
            ->where('is_postable', true)
            ->orderBy('code', 'asc')
            ->get();

        $aggregates = JournalEntryLine::where('journal_entry_lines.company_id', $companyId)
            ->join('journal_entries', 'journal_entries.id', '=', 'journal_entry_lines.journal_entry_id')
            ->where('journal_entries.status', 'posted')
            ->when($asOfDate, fn ($q) => $q->where('journal_entries.date', '<=', $asOfDate))
            ->groupBy('journal_entry_lines.account_id')
            ->select([
                'journal_entry_lines.account_id',
                DB::raw('SUM(journal_entry_lines.debit) as total_debit'),
                DB::raw('SUM(journal_entry_lines.credit) as total_credit'),
            ])
            ->get()
            ->keyBy('account_id');

        $resultAccounts = [];
        $grandTotalDebit = '0.000000';
        $grandTotalCredit = '0.000000';

        foreach ($accounts as $acc) {
            $agg = $aggregates->get($acc->id);
            $debit = $agg ? number_format((float) $agg->total_debit, 6, '.', '') : '0.000000';
            $credit = $agg ? number_format((float) $agg->total_credit, 6, '.', '') : '0.000000';

            $netDebit = '0.000000';
            $netCredit = '0.000000';

            $cmp = bccomp($debit, $credit, 6);
            if ($cmp > 0) {
                $netDebit = bcsub($debit, $credit, 6);
            } elseif ($cmp < 0) {
                $netCredit = bcsub($credit, $debit, 6);
            }

            $grandTotalDebit = bcadd($grandTotalDebit, $netDebit, 6);
            $grandTotalCredit = bcadd($grandTotalCredit, $netCredit, 6);

            $resultAccounts[] = [
                'id' => $acc->id,
                'code' => $acc->code,
                'name' => $acc->name,
                'name_ar' => $acc->name_ar,
                'type' => $acc->type,
                'debit_total' => $debit,
                'credit_total' => $credit,
                'net_debit' => $netDebit,
                'net_credit' => $netCredit,
            ];
        }

        return [
            'accounts' => $resultAccounts,
            'total_debit' => $grandTotalDebit,
            'total_credit' => $grandTotalCredit,
            'is_balanced' => bccomp($grandTotalDebit, $grandTotalCredit, 6) === 0,
        ];
    }
}
