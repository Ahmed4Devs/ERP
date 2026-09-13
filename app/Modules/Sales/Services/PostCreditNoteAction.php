<?php

namespace App\Modules\Sales\Services;

use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Services\PostingEngine;
use App\Modules\Inventory\Services\InventoryCostingEngine;
use App\Modules\Platform\Services\AuditLogger;
use App\Modules\Sales\Models\CreditNote;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class PostCreditNoteAction
{
    public function __construct(
        protected PostingEngine $postingEngine,
        protected InventoryCostingEngine $costingEngine
    ) {}

    /**
     * Post a Credit Note, reversing sales revenue & tax liability, restoring returned inventory, and updating customer balance.
     */
    public function execute(CreditNote $creditNote, ?int $userId = null): CreditNote
    {
        if ($creditNote->status === 'posted') {
            throw new InvalidArgumentException('Credit note is already posted.');
        }

        return DB::transaction(function () use ($creditNote, $userId): CreditNote {
            $companyId = $creditNote->company_id;
            $tenantId = $creditNote->tenant_id;
            $customer = $creditNote->customer;
            $date = $creditNote->date->toDateString();

            // Locate required GL accounts
            $arAccount = Account::where('company_id', $companyId)->where('code', '1200')->firstOrFail();
            $taxAccount = Account::where('company_id', $companyId)->where('code', '2150')->first();
            $revAccount = Account::where('company_id', $companyId)->whereIn('code', ['4100', '4000'])->firstOrFail();

            $subtotal = (string) $creditNote->subtotal;
            $taxAmount = (string) $creditNote->tax_amount;
            $total = (string) $creditNote->total;

            $glLines = [];

            // Debit: Revenue Reversal
            if (bccomp($subtotal, '0.000000', 6) > 0) {
                $glLines[] = [
                    'account_id' => $revAccount->id,
                    'debit' => $subtotal,
                    'credit' => '0.000000',
                    'description' => "Sales Return / Credit Note - {$creditNote->credit_note_number}",
                ];
            }

            // Debit: Tax Liability Reversal (Output Tax deduction)
            if (bccomp($taxAmount, '0.000000', 6) > 0 && $taxAccount) {
                $glLines[] = [
                    'account_id' => $taxAccount->id,
                    'debit' => $taxAmount,
                    'credit' => '0.000000',
                    'description' => "VAT Reversal on Credit Note - {$creditNote->credit_note_number}",
                ];
            }

            // Credit: Accounts Receivable (Customer balance reduction)
            if (bccomp($total, '0.000000', 6) > 0) {
                $glLines[] = [
                    'account_id' => $arAccount->id,
                    'debit' => '0.000000',
                    'credit' => $total,
                    'description' => "Credit Note Allocation to {$customer->name} - {$creditNote->credit_note_number}",
                ];
            }

            $revenueJournal = $this->postingEngine->post([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'date' => $date,
                'description' => "Credit Note {$creditNote->credit_note_number} for customer {$customer->name}",
                'source_type' => 'credit_note',
                'source_id' => $creditNote->id,
                'idempotency_key' => "cn_rev_{$creditNote->id}",
                'lines' => $glLines,
            ]);

            // Stock Restoration & COGS Reversal (if items returned to warehouse)
            $totalCostRestored = '0.000000';
            $invAccount = Account::where('company_id', $companyId)->where('code', '1300')->first();
            $cogsAccount = Account::where('company_id', $companyId)->where('code', '5000')->first();

            foreach ($creditNote->lines as $line) {
                if ($line->product_id && $line->warehouse_id && (float) $line->quantity > 0) {
                    $product = $line->product;
                    $unitCost = (string) ($product?->standard_cost ?: $product?->moving_average_cost ?: $product?->list_price ?: '0.000000');

                    $this->costingEngine->receiveStock([
                        'tenant_id' => $tenantId,
                        'company_id' => $companyId,
                        'product_id' => $line->product_id,
                        'warehouse_id' => $line->warehouse_id,
                        'quantity' => (string) $line->quantity,
                        'unit_cost' => $unitCost,
                        'reference_type' => 'credit_note',
                        'reference_id' => $creditNote->id,
                        'date' => $date,
                    ]);

                    $lineCost = bcmul((string) $line->quantity, $unitCost, 6);
                    $totalCostRestored = bcadd($totalCostRestored, $lineCost, 6);
                }
            }

            $costingJournal = null;
            if (bccomp($totalCostRestored, '0.000000', 6) > 0 && $invAccount && $cogsAccount) {
                $costingJournal = $this->postingEngine->post([
                    'tenant_id' => $tenantId,
                    'company_id' => $companyId,
                    'date' => $date,
                    'description' => "Stock Return & COGS Reversal for Credit Note {$creditNote->credit_note_number}",
                    'source_type' => 'credit_note_cogs',
                    'source_id' => $creditNote->id,
                    'idempotency_key' => "cn_cogs_{$creditNote->id}",
                    'lines' => [
                        [
                            'account_id' => $invAccount->id,
                            'debit' => $totalCostRestored,
                            'credit' => '0.000000',
                            'description' => "Inventory Return Restored - {$creditNote->credit_note_number}",
                        ],
                        [
                            'account_id' => $cogsAccount->id,
                            'debit' => '0.000000',
                            'credit' => $totalCostRestored,
                            'description' => "COGS Reversal on Return - {$creditNote->credit_note_number}",
                        ],
                    ],
                ]);
            }

            $creditNote->update([
                'status' => 'posted',
                'journal_entry_id' => $revenueJournal->id,
                'costing_journal_entry_id' => $costingJournal?->id,
                'posted_at' => now(),
                'posted_by' => $userId,
            ]);

            AuditLogger::log(
                action: 'credit_note.posted',
                entityType: CreditNote::class,
                entityId: $creditNote->id,
                newValues: [
                    'credit_note_number' => $creditNote->credit_note_number,
                    'total' => $creditNote->total,
                    'journal_entry_id' => $revenueJournal->id,
                    'costing_journal_entry_id' => $costingJournal?->id,
                ]
            );

            return $creditNote->fresh(['customer', 'lines.product', 'lines.warehouse', 'journalEntry.lines.account']);
        });
    }
}
