<?php

namespace App\Modules\Purchasing\Services;

use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Services\PostingEngine;
use App\Modules\Inventory\Services\InventoryCostingEngine;
use App\Modules\Platform\Services\AuditLogger;
use App\Modules\Purchasing\Models\DebitNote;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class PostDebitNoteAction
{
    public function __construct(
        protected PostingEngine $postingEngine,
        protected InventoryCostingEngine $costingEngine
    ) {}

    /**
     * Post a Debit Note, reducing vendor liability, reversing input tax, and issuing returned stock.
     */
    public function execute(DebitNote $debitNote, ?int $userId = null): DebitNote
    {
        if ($debitNote->status === 'posted') {
            throw new InvalidArgumentException('Debit note is already posted.');
        }

        return DB::transaction(function () use ($debitNote, $userId): DebitNote {
            $companyId = $debitNote->company_id;
            $tenantId = $debitNote->tenant_id;
            $vendor = $debitNote->vendor;
            $date = $debitNote->date->toDateString();

            // Locate required GL accounts
            $apAccount = Account::where('company_id', $companyId)->where('code', '2010')->firstOrFail();
            $taxAccount = Account::where('company_id', $companyId)->where('code', '1150')->first();
            $invAccount = Account::where('company_id', $companyId)->where('code', '1300')->first();
            $expAccount = Account::where('company_id', $companyId)->whereIn('code', ['5000', '5100'])->first();

            $subtotal = (string) $debitNote->subtotal;
            $taxAmount = (string) $debitNote->tax_amount;
            $total = (string) $debitNote->total;

            $glLines = [];

            // Debit: Accounts Payable (Reduce vendor liability)
            if (bccomp($total, '0.000000', 6) > 0) {
                $glLines[] = [
                    'account_id' => $apAccount->id,
                    'debit' => $total,
                    'credit' => '0.000000',
                    'description' => "Purchase Return / Debit Note to {$vendor->name} - {$debitNote->debit_note_number}",
                ];
            }

            // Credit: Tax Recoverable Reversal (Reduce input tax)
            if (bccomp($taxAmount, '0.000000', 6) > 0 && $taxAccount) {
                $glLines[] = [
                    'account_id' => $taxAccount->id,
                    'debit' => '0.000000',
                    'credit' => $taxAmount,
                    'description' => "Input Tax Reversal on Debit Note - {$debitNote->debit_note_number}",
                ];
            }

            // Credit: Inventory or Expense for subtotal
            $targetAccount = $invAccount ?? $expAccount;
            if (bccomp($subtotal, '0.000000', 6) > 0 && $targetAccount) {
                $glLines[] = [
                    'account_id' => $targetAccount->id,
                    'debit' => '0.000000',
                    'credit' => $subtotal,
                    'description' => "Returned Inventory / Expense Deduction - {$debitNote->debit_note_number}",
                ];
            }

            $journal = $this->postingEngine->post([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'date' => $date,
                'description' => "Debit Note {$debitNote->debit_note_number} to vendor {$vendor->name}",
                'source_type' => 'debit_note',
                'source_id' => $debitNote->id,
                'idempotency_key' => "dbn_{$debitNote->id}",
                'lines' => $glLines,
            ]);

            // Issue returned items from warehouse
            foreach ($debitNote->lines as $line) {
                if ($line->product_id && $line->warehouse_id && (float) $line->quantity > 0) {
                    $this->costingEngine->issueStock([
                        'tenant_id' => $tenantId,
                        'company_id' => $companyId,
                        'product_id' => $line->product_id,
                        'warehouse_id' => $line->warehouse_id,
                        'quantity' => (string) $line->quantity,
                        'reference_type' => 'debit_note',
                        'reference_id' => $debitNote->id,
                        'date' => $date,
                    ]);
                }
            }

            $debitNote->update([
                'status' => 'posted',
                'journal_entry_id' => $journal->id,
                'posted_at' => now(),
                'posted_by' => $userId,
            ]);

            AuditLogger::log(
                action: 'debit_note.posted',
                entityType: DebitNote::class,
                entityId: $debitNote->id,
                newValues: [
                    'debit_note_number' => $debitNote->debit_note_number,
                    'total' => $debitNote->total,
                    'journal_entry_id' => $journal->id,
                ]
            );

            return $debitNote->fresh(['vendor', 'lines.product', 'lines.warehouse', 'journalEntry.lines.account']);
        });
    }
}
