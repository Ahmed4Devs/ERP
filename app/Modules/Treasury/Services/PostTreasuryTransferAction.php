<?php

namespace App\Modules\Treasury\Services;

use App\Modules\Accounting\Exceptions\PostingException;
use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Services\PostingEngine;
use App\Modules\Platform\Services\AuditLogger;
use App\Modules\Treasury\Models\TreasuryTransfer;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Support\Facades\DB;

class PostTreasuryTransferAction
{
    public function __construct(
        protected PostingEngine $postingEngine
    ) {}

    /**
     * Post an internal bank/cash fund transfer atomically.
     *
     * @param array{
     *     from_account_id: string,
     *     to_account_id: string,
     *     date: string,
     *     amount: numeric|string,
     *     reference?: string|null,
     *     notes?: string|null
     * } $data
     *
     * @throws PostingException
     */
    public function execute(array $data): TreasuryTransfer
    {
        $currentTenant = app(CurrentTenant::class);
        $currentCompany = app(CurrentCompany::class);

        $tenantId = $currentTenant->id();
        $companyId = $currentCompany->id();

        if (! $tenantId || ! $companyId) {
            throw new PostingException('Active tenant and company context required to execute treasury transfer.');
        }

        $fromId = $data['from_account_id'];
        $toId = $data['to_account_id'];
        $date = $data['date'];
        $amount = number_format((float) $data['amount'], 6, '.', '');
        $reference = $data['reference'] ?? null;
        $notes = $data['notes'] ?? null;

        if ($fromId === $toId) {
            throw new PostingException('Source and destination accounts must be distinct.');
        }

        if (bccomp($amount, '0.000000', 6) <= 0) {
            throw new PostingException('Transfer amount must be strictly positive.');
        }

        $fromAccount = Account::where('company_id', $companyId)->findOrFail($fromId);
        $toAccount = Account::where('company_id', $companyId)->findOrFail($toId);

        return DB::transaction(function () use (
            $tenantId,
            $companyId,
            $fromAccount,
            $toAccount,
            $date,
            $amount,
            $reference,
            $notes
        ): TreasuryTransfer {
            $year = date('Y', strtotime($date));
            $count = TreasuryTransfer::where('company_id', $companyId)
                ->whereYear('date', $year)
                ->count();
            $seq = str_pad((string) ($count + 1), 6, '0', STR_PAD_LEFT);
            $transferNumber = "TRF-{$year}-{$seq}";

            // Balanced GL Posting:
            // Debit: Destination Account (Cash/Bank)
            // Credit: Source Account (Cash/Bank)
            $journalEntry = $this->postingEngine->post([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'date' => $date,
                'description' => "Treasury Transfer {$transferNumber}: {$fromAccount->name} -> {$toAccount->name}",
                'source_type' => 'treasury_transfer',
                'lines' => [
                    [
                        'account_id' => $toAccount->id,
                        'debit' => $amount,
                        'credit' => '0.000000',
                        'description' => "Transfer In to {$toAccount->name} ({$transferNumber})",
                    ],
                    [
                        'account_id' => $fromAccount->id,
                        'debit' => '0.000000',
                        'credit' => $amount,
                        'description' => "Transfer Out from {$fromAccount->name} ({$transferNumber})",
                    ],
                ],
            ]);

            $transfer = TreasuryTransfer::create([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'from_account_id' => $fromAccount->id,
                'to_account_id' => $toAccount->id,
                'journal_entry_id' => $journalEntry->id,
                'transfer_number' => $transferNumber,
                'date' => $date,
                'amount' => $amount,
                'currency' => $fromAccount->currency,
                'status' => 'posted',
                'reference' => $reference,
                'notes' => $notes,
            ]);

            AuditLogger::log(
                action: 'treasury_transfer.posted',
                entityType: TreasuryTransfer::class,
                entityId: $transfer->id,
                companyId: $companyId,
                tenantId: $tenantId
            );

            return $transfer;
        });
    }
}
