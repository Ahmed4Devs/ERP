<?php

namespace App\Modules\Accounting\Services;

use App\Modules\Accounting\Models\BankReconciliation;
use App\Modules\Accounting\Models\BankStatementLine;
use App\Modules\Accounting\Models\JournalEntryLine;
use App\Modules\Platform\Services\AuditLogger;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class BankReconciliationService
{
    /**
     * Recalculate cleared balances and discrepancy for a bank reconciliation.
     * Cleared Balance = Opening Balance + Cleared Deposits - Cleared Withdrawals
     * Difference = Statement Closing Balance - Cleared Balance
     */
    public function recalculate(BankReconciliation $recon): BankReconciliation
    {
        $recon->loadMissing('statementLines');

        $clearedDeposits = '0.000000';
        $clearedWithdrawals = '0.000000';

        foreach ($recon->statementLines as $line) {
            if ($line->is_reconciled) {
                if ($line->type === 'deposit') {
                    $clearedDeposits = bcadd($clearedDeposits, (string) $line->amount, 6);
                } else {
                    $clearedWithdrawals = bcadd($clearedWithdrawals, (string) $line->amount, 6);
                }
            }
        }

        $opening = (string) $recon->opening_balance;
        $closing = (string) $recon->closing_balance;

        $clearedBalance = bcsub(bcadd($opening, $clearedDeposits, 6), $clearedWithdrawals, 6);
        $difference = bcsub($closing, $clearedBalance, 6);

        $recon->cleared_balance = $clearedBalance;
        $recon->difference = $difference;

        if ($recon->status === 'draft' && $recon->statementLines->where('is_reconciled', true)->isNotEmpty()) {
            $recon->status = 'in_progress';
        }

        $recon->save();

        return $recon;
    }

    /**
     * Heuristic auto-match statement lines with General Ledger bank journal lines.
     * Note: In accounting, a Bank Deposit is a DEBIT on the company's ledger.
     * A Bank Withdrawal is a CREDIT on the company's ledger.
     *
     * @return array{matched_count: int, difference: string, cleared_balance: string}
     */
    public function autoMatch(BankReconciliation $recon): array
    {
        return DB::transaction(function () use ($recon) {
            $unmatchedLines = BankStatementLine::where('bank_reconciliation_id', $recon->id)
                ->where('is_reconciled', false)
                ->orderBy('line_date')
                ->get();

            if ($unmatchedLines->isEmpty()) {
                $this->recalculate($recon);

                return [
                    'matched_count' => 0,
                    'difference' => (string) $recon->difference,
                    'cleared_balance' => (string) $recon->cleared_balance,
                ];
            }

            // Already matched journal entry lines across all statement lines
            $alreadyMatchedGlIds = BankStatementLine::whereNotNull('matched_journal_entry_line_id')
                ->pluck('matched_journal_entry_line_id')
                ->toArray();

            // Candidate GL transactions for this bank account up to reconciliation end date
            $candidateGlLines = JournalEntryLine::where('account_id', $recon->bank_account_id)
                ->whereHas('journalEntry', function ($q) use ($recon): void {
                    $q->where('status', 'posted')
                        ->where('date', '<=', $recon->end_date);
                })
                ->whereNotIn('id', $alreadyMatchedGlIds)
                ->with('journalEntry')
                ->get();

            $matchedCount = 0;
            $usedGlIds = [];

            foreach ($unmatchedLines as $stmtLine) {
                $stmtAmount = number_format((float) $stmtLine->amount, 6, '.', '');
                $stmtDate = Carbon::parse($stmtLine->line_date);
                $isDeposit = $stmtLine->type === 'deposit';

                // Look for candidate match:
                // If deposit -> GL line must have debit == stmtAmount
                // If withdrawal -> GL line must have credit == stmtAmount
                $bestMatch = null;
                $smallestDateDiff = 999999;

                foreach ($candidateGlLines as $glLine) {
                    if (in_array($glLine->id, $usedGlIds, true)) {
                        continue;
                    }

                    $glAmount = $isDeposit ? (string) $glLine->debit : (string) $glLine->credit;
                    if (bccomp($glAmount, $stmtAmount, 6) === 0) {
                        $glDate = Carbon::parse($glLine->journalEntry->date);
                        $dateDiff = abs($stmtDate->diffInDays($glDate));

                        // If reference number matches, immediate high-confidence match
                        if ($stmtLine->reference_number && $glLine->journalEntry->entry_number === $stmtLine->reference_number) {
                            $bestMatch = $glLine;
                            break;
                        }

                        // Otherwise prefer closest date within 30 days
                        if ($dateDiff <= 30 && $dateDiff < $smallestDateDiff) {
                            $smallestDateDiff = $dateDiff;
                            $bestMatch = $glLine;
                        }
                    }
                }

                if ($bestMatch) {
                    $stmtLine->is_reconciled = true;
                    $stmtLine->matched_journal_entry_line_id = $bestMatch->id;
                    $stmtLine->reconciled_at = now();
                    $stmtLine->save();

                    $usedGlIds[] = $bestMatch->id;
                    $matchedCount++;
                }
            }

            $this->recalculate($recon);

            AuditLogger::log(
                'accounting.bank_reconciliation.auto_matched',
                BankReconciliation::class,
                $recon->id,
                [
                    'matched_count' => $matchedCount,
                    'difference' => (string) $recon->difference,
                ]
            );

            return [
                'matched_count' => $matchedCount,
                'difference' => (string) $recon->difference,
                'cleared_balance' => (string) $recon->cleared_balance,
            ];
        });
    }

    /**
     * Manually match a bank statement line to a posted GL journal line.
     */
    public function manualMatch(BankReconciliation $recon, string $statementLineId, string $journalLineId): void
    {
        DB::transaction(function () use ($recon, $statementLineId, $journalLineId) {
            $stmtLine = BankStatementLine::where('bank_reconciliation_id', $recon->id)
                ->findOrFail($statementLineId);

            $glLine = JournalEntryLine::where('account_id', $recon->bank_account_id)
                ->whereHas('journalEntry', fn ($q) => $q->where('status', 'posted'))
                ->findOrFail($journalLineId);

            // Check that GL line isn't matched elsewhere
            $alreadyMatched = BankStatementLine::where('matched_journal_entry_line_id', $glLine->id)
                ->where('id', '!=', $stmtLine->id)
                ->exists();

            if ($alreadyMatched) {
                throw new InvalidArgumentException('This GL transaction is already matched with another statement line.');
            }

            $stmtLine->is_reconciled = true;
            $stmtLine->matched_journal_entry_line_id = $glLine->id;
            $stmtLine->reconciled_at = now();
            $stmtLine->save();

            $this->recalculate($recon);
        });
    }

    /**
     * Unmatch a bank statement line.
     */
    public function unmatch(BankReconciliation $recon, string $statementLineId): void
    {
        $stmtLine = BankStatementLine::where('bank_reconciliation_id', $recon->id)
            ->findOrFail($statementLineId);

        $stmtLine->is_reconciled = false;
        $stmtLine->matched_journal_entry_line_id = null;
        $stmtLine->reconciled_at = null;
        $stmtLine->save();

        $this->recalculate($recon);
    }

    /**
     * Import statement lines from raw CSV content.
     */
    public function importCsv(BankReconciliation $recon, string $csvContent): int
    {
        $rows = array_map('str_getcsv', explode("\n", trim($csvContent)));
        if (empty($rows)) {
            return 0;
        }

        $header = array_map(fn ($col) => strtolower(trim($col)), $rows[0]);
        unset($rows[0]);

        // Find column indices
        $dateIdx = false;
        $descIdx = false;
        $refIdx = false;
        $amountIdx = false;
        $depIdx = false;
        $withIdx = false;
        $typeIdx = false;

        foreach ($header as $i => $col) {
            if (in_array($col, ['date', 'تاريخ', 'transaction_date', 'value_date'])) {
                $dateIdx = $i;
            } elseif (in_array($col, ['description', 'desc', 'details', 'بيان', 'الوصف', 'narration'])) {
                $descIdx = $i;
            } elseif (in_array($col, ['reference', 'ref', 'reference_number', 'مرجع', 'رقم المرجع', 'cheque_no'])) {
                $refIdx = $i;
            } elseif (in_array($col, ['amount', 'المبلغ', 'net_amount'])) {
                $amountIdx = $i;
            } elseif (in_array($col, ['deposit', 'credit', 'إيداع', 'له'])) {
                $depIdx = $i;
            } elseif (in_array($col, ['withdrawal', 'debit', 'سحب', 'منه'])) {
                $withIdx = $i;
            } elseif (in_array($col, ['type', 'النوع'])) {
                $typeIdx = $i;
            }
        }

        $importedCount = 0;

        DB::transaction(function () use (
            $recon,
            $rows,
            $dateIdx,
            $descIdx,
            $refIdx,
            $amountIdx,
            $depIdx,
            $withIdx,
            $typeIdx,
            &$importedCount
        ) {
            foreach ($rows as $row) {
                if (empty($row) || (count($row) === 1 && $row[0] === null)) {
                    continue;
                }

                $rawDate = $dateIdx !== false && isset($row[$dateIdx]) ? trim($row[$dateIdx]) : null;
                if (! $rawDate) {
                    continue;
                }

                try {
                    $parsedDate = Carbon::parse($rawDate)->toDateString();
                } catch (\Throwable) {
                    $parsedDate = now()->toDateString();
                }

                $desc = $descIdx !== false && isset($row[$descIdx]) ? trim($row[$descIdx]) : 'Bank Transaction';
                $ref = $refIdx !== false && isset($row[$refIdx]) ? trim($row[$refIdx]) : null;

                $type = 'deposit';
                $amount = 0.0;

                if ($depIdx !== false && $withIdx !== false) {
                    $depVal = isset($row[$depIdx]) ? (float) str_replace([',', ' '], '', $row[$depIdx]) : 0;
                    $withVal = isset($row[$withIdx]) ? (float) str_replace([',', ' '], '', $row[$withIdx]) : 0;

                    if ($depVal > 0) {
                        $type = 'deposit';
                        $amount = $depVal;
                    } elseif ($withVal > 0) {
                        $type = 'withdrawal';
                        $amount = $withVal;
                    }
                } elseif ($amountIdx !== false && isset($row[$amountIdx])) {
                    $val = (float) str_replace([',', ' '], '', $row[$amountIdx]);
                    if ($typeIdx !== false && isset($row[$typeIdx])) {
                        $tStr = strtolower(trim($row[$typeIdx]));
                        $type = in_array($tStr, ['withdrawal', 'debit', 'سحب', 'out', 'dr']) ? 'withdrawal' : 'deposit';
                        $amount = abs($val);
                    } else {
                        if ($val < 0) {
                            $type = 'withdrawal';
                            $amount = abs($val);
                        } else {
                            $type = 'deposit';
                            $amount = $val;
                        }
                    }
                }

                if ($amount <= 0) {
                    continue;
                }

                BankStatementLine::create([
                    'tenant_id' => $recon->tenant_id,
                    'company_id' => $recon->company_id,
                    'bank_reconciliation_id' => $recon->id,
                    'line_date' => $parsedDate,
                    'description' => substr($desc, 0, 255),
                    'reference_number' => $ref ? substr($ref, 0, 100) : null,
                    'type' => $type,
                    'amount' => number_format($amount, 6, '.', ''),
                    'is_reconciled' => false,
                ]);

                $importedCount++;
            }

            $this->recalculate($recon);
        });

        return $importedCount;
    }

    /**
     * Finalize and seal the bank reconciliation.
     */
    public function finalize(BankReconciliation $recon, int $userId): void
    {
        $this->recalculate($recon);

        if (bccomp((string) $recon->difference, '0.000000', 2) !== 0) {
            throw new InvalidArgumentException(
                "Cannot finalize bank reconciliation with remaining discrepancy of {$recon->difference} SAR. Difference must equal 0.00 SAR."
            );
        }

        $recon->status = 'reconciled';
        $recon->reconciled_at = now();
        $recon->reconciled_by = $userId;
        $recon->save();

        AuditLogger::log(
            'accounting.bank_reconciliation.finalized',
            BankReconciliation::class,
            $recon->id,
            [
                'statement_number' => $recon->statement_number,
                'closing_balance' => (string) $recon->closing_balance,
                'cleared_balance' => (string) $recon->cleared_balance,
                'reconciled_by' => $userId,
            ]
        );
    }
}
