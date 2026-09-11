<?php

namespace App\Modules\Accounting\Queries;

use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\JournalEntryLine;
use App\Shared\Context\CurrentCompany;

class GeneralLedgerQuery
{
    /**
     * Get General Ledger entries with running balance for a given account or company.
     *
     * @return array{
     *     account: Account|null,
     *     lines: array<int, array{
     *         date: string,
     *         entry_number: string,
     *         description: string,
     *         debit: string,
     *         credit: string,
     *         running_balance: string
     *     }>,
     *     total_debit: string,
     *     total_credit: string
     * }
     */
    public function execute(?string $accountId = null, ?string $startDate = null, ?string $endDate = null): array
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $account = $accountId ? Account::where('company_id', $companyId)->findOrFail($accountId) : null;

        $query = JournalEntryLine::where('journal_entry_lines.company_id', $companyId)
            ->join('journal_entries', 'journal_entries.id', '=', 'journal_entry_lines.journal_entry_id')
            ->where('journal_entries.status', 'posted')
            ->when($accountId, fn ($q) => $q->where('journal_entry_lines.account_id', $accountId))
            ->when($startDate, fn ($q) => $q->where('journal_entries.date', '>=', $startDate))
            ->when($endDate, fn ($q) => $q->where('journal_entries.date', '<=', $endDate))
            ->select([
                'journal_entries.date',
                'journal_entries.entry_number',
                'journal_entry_lines.description',
                'journal_entry_lines.debit',
                'journal_entry_lines.credit',
            ])
            ->orderBy('journal_entries.date', 'asc')
            ->orderBy('journal_entries.created_at', 'asc')
            ->orderBy('journal_entry_lines.id', 'asc');

        $rows = $query->get();

        $lines = [];
        $runningBalance = '0.000000';
        $totalDebit = '0.000000';
        $totalCredit = '0.000000';

        foreach ($rows as $row) {
            $debit = (string) $row->debit;
            $credit = (string) $row->credit;

            $totalDebit = bcadd($totalDebit, $debit, 6);
            $totalCredit = bcadd($totalCredit, $credit, 6);

            if ($account && in_array($account->type, ['asset', 'expense'], true)) {
                $runningBalance = bcadd($runningBalance, $debit, 6);
                $runningBalance = bcsub($runningBalance, $credit, 6);
            } else {
                $runningBalance = bcadd($runningBalance, $credit, 6);
                $runningBalance = bcsub($runningBalance, $debit, 6);
            }

            $lines[] = [
                'date' => $row->date,
                'entry_number' => $row->entry_number,
                'description' => $row->description ?? '',
                'debit' => $debit,
                'credit' => $credit,
                'running_balance' => $runningBalance,
            ];
        }

        return [
            'account' => $account,
            'lines' => $lines,
            'total_debit' => $totalDebit,
            'total_credit' => $totalCredit,
        ];
    }
}
