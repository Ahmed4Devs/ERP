<?php

namespace App\Modules\Accounting\Services;

use App\Modules\Accounting\Exceptions\PostingConflictException;
use App\Modules\Accounting\Exceptions\PostingException;
use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\FiscalPeriod;
use App\Modules\Accounting\Models\JournalEntry;
use App\Modules\Accounting\Models\JournalEntryLine;
use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Services\AuditLogger;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Support\Facades\DB;

class PostingEngine
{
    /**
     * Post a balanced journal entry atomically.
     *
     * @param array{
     *     tenant_id: string,
     *     company_id: string,
     *     date: string,
     *     description: string,
     *     source_type?: string|null,
     *     source_id?: string|null,
     *     idempotency_key?: string|null,
     *     lines: array<int, array{
     *         account_id: string,
     *         debit?: string|numeric|null,
     *         credit?: string|numeric|null,
     *         description?: string|null
     *     }>
     * } $data
     *
     * @throws PostingException
     * @throws PostingConflictException
     */
    public function post(array $data): JournalEntry
    {
        $companyId = $data['company_id'] ?? app(CurrentCompany::class)->id();
        $company = Company::find($companyId);
        $tenantId = $data['tenant_id'] ?? ($company ? $company->tenant_id : app(CurrentTenant::class)->id());
        $date = $data['date'];
        $description = $data['description'];
        $idempotencyKey = $data['idempotency_key'] ?? null;
        $lines = $data['lines'];

        if (empty($lines)) {
            throw new PostingException('Journal entry must have at least one line.');
        }

        // 1. Calculate payload hash for idempotency validation
        $normalizedPayload = [
            'company_id' => $companyId,
            'date' => $date,
            'lines' => array_map(function ($l) {
                return [
                    'account_id' => $l['account_id'],
                    'debit' => number_format((float) ($l['debit'] ?? 0), 6, '.', ''),
                    'credit' => number_format((float) ($l['credit'] ?? 0), 6, '.', ''),
                ];
            }, $lines),
        ];
        $payloadHash = hash('sha256', json_encode($normalizedPayload, JSON_THROW_ON_ERROR));

        // 2. Check for existing idempotency key
        if ($idempotencyKey) {
            $existing = JournalEntry::where('company_id', $companyId)
                ->where('idempotency_key', $idempotencyKey)
                ->first();

            if ($existing) {
                if ($existing->payload_hash === $payloadHash) {
                    // Idempotent replay: return identical outcome
                    return $existing;
                }

                // Conflict: same key with altered payload
                throw new PostingConflictException("Idempotency key '{$idempotencyKey}' was already used with a different financial payload.");
            }
        }

        // 3. Verify fiscal period is open
        if (FiscalPeriod::isDateLocked($companyId, $date)) {
            throw new PostingException("Fiscal period for date {$date} is locked.");
        }

        // 4. Validate exact debit and credit balance using bcmath
        $totalDebit = '0.000000';
        $totalCredit = '0.000000';

        foreach ($lines as $index => $line) {
            $debit = number_format((float) ($line['debit'] ?? 0), 6, '.', '');
            $credit = number_format((float) ($line['credit'] ?? 0), 6, '.', '');

            if (bccomp($debit, '0.000000', 6) < 0 || bccomp($credit, '0.000000', 6) < 0) {
                throw new PostingException("Journal line {$index} has negative amount.");
            }

            if (bccomp($debit, '0.000000', 6) > 0 && bccomp($credit, '0.000000', 6) > 0) {
                throw new PostingException("Journal line {$index} cannot have both debit and credit.");
            }

            if (bccomp($debit, '0.000000', 6) === 0 && bccomp($credit, '0.000000', 6) === 0) {
                throw new PostingException("Journal line {$index} has zero amount.");
            }

            $totalDebit = bcadd($totalDebit, $debit, 6);
            $totalCredit = bcadd($totalCredit, $credit, 6);
        }

        if (bccomp($totalDebit, $totalCredit, 6) !== 0) {
            throw new PostingException("Journal entry is not balanced: Total Debits ({$totalDebit}) != Total Credits ({$totalCredit}).");
        }

        // 5. Execute atomic transaction
        return DB::transaction(function () use (
            $tenantId,
            $companyId,
            $date,
            $description,
            $data,
            $idempotencyKey,
            $payloadHash,
            $lines
        ): JournalEntry {
            // Allocate sequence number safely
            $year = date('Y', strtotime($date));
            $latestEntry = JournalEntry::where('company_id', $companyId)
                ->whereYear('date', $year)
                ->count();
            $seq = str_pad((string) ($latestEntry + 1), 6, '0', STR_PAD_LEFT);
            $entryNumber = "JE-{$year}-{$seq}";

            $entry = JournalEntry::create([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'entry_number' => $entryNumber,
                'date' => $date,
                'description' => $description,
                'status' => 'posted',
                'source_type' => $data['source_type'] ?? null,
                'source_id' => $data['source_id'] ?? null,
                'idempotency_key' => $idempotencyKey,
                'payload_hash' => $payloadHash,
                'reversal_of_id' => $data['reversal_of_id'] ?? null,
                'posted_at' => now(),
                'posted_by' => auth()->id(),
            ]);

            foreach ($lines as $line) {
                $account = Account::where('company_id', $companyId)
                    ->where('id', $line['account_id'])
                    ->lockForUpdate()
                    ->first();

                if (! $account) {
                    throw new PostingException("Account {$line['account_id']} not found or does not belong to company {$companyId}.");
                }

                if (! $account->is_postable) {
                    throw new PostingException("Account {$account->code} - {$account->name} is not marked as postable.");
                }

                $debit = number_format((float) ($line['debit'] ?? 0), 6, '.', '');
                $credit = number_format((float) ($line['credit'] ?? 0), 6, '.', '');

                JournalEntryLine::create([
                    'tenant_id' => $tenantId,
                    'company_id' => $companyId,
                    'journal_entry_id' => $entry->id,
                    'account_id' => $account->id,
                    'debit' => $debit,
                    'credit' => $credit,
                    'description' => $line['description'] ?? $description,
                ]);

                // Update account current balance based on normal account balance nature
                $currentBalance = (string) $account->current_balance;
                if (in_array($account->type, ['asset', 'expense'], true)) {
                    // Normal debit balance
                    $currentBalance = bcadd($currentBalance, $debit, 6);
                    $currentBalance = bcsub($currentBalance, $credit, 6);
                } else {
                    // Normal credit balance (liability, equity, revenue)
                    $currentBalance = bcadd($currentBalance, $credit, 6);
                    $currentBalance = bcsub($currentBalance, $debit, 6);
                }

                $account->update(['current_balance' => $currentBalance]);
            }

            AuditLogger::log(
                action: 'journal_entry.posted',
                entityType: JournalEntry::class,
                entityId: $entry->id,
                companyId: $companyId,
                tenantId: $tenantId
            );

            return $entry;
        });
    }
}
