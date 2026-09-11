<?php

namespace App\Modules\Accounting\Services;

use App\Modules\Accounting\Exceptions\PostingException;
use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\Receipt;
use App\Modules\Accounting\Models\ReceiptAllocation;
use App\Modules\Accounting\Models\ServiceInvoice;
use App\Modules\Platform\Services\AuditLogger;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Support\Facades\DB;

class PostReceiptAndAllocateAction
{
    public function __construct(
        protected PostingEngine $postingEngine
    ) {}

    /**
     * Create and post a receipt, generate balancing journal, and allocate against invoices atomically.
     *
     * @param array{
     *     party_id: string,
     *     deposit_account_id: string,
     *     date: string,
     *     amount: numeric|string,
     *     payment_method?: string|null,
     *     notes?: string|null,
     *     idempotency_key?: string|null,
     *     allocations?: array<int, array{
     *         service_invoice_id: string,
     *         amount: numeric|string
     *     }>
     * } $data
     */
    public function execute(array $data): Receipt
    {
        $currentTenant = app(CurrentTenant::class);
        $currentCompany = app(CurrentCompany::class);

        $tenantId = $currentTenant->id();
        $companyId = $currentCompany->id();

        if (! $tenantId || ! $companyId) {
            throw new PostingException('Active tenant and company context required to post receipt.');
        }

        $partyId = $data['party_id'];
        $depositAccountId = $data['deposit_account_id'];
        $date = $data['date'];
        $totalAmount = number_format((float) $data['amount'], 6, '.', '');
        $paymentMethod = $data['payment_method'] ?? 'bank_transfer';
        $notes = $data['notes'] ?? null;
        $idempotencyKey = $data['idempotency_key'] ?? null;
        $allocationsInput = $data['allocations'] ?? [];

        if (bccomp($totalAmount, '0.000000', 6) <= 0) {
            throw new PostingException('Receipt amount must be strictly positive.');
        }

        // 1. Resolve Accounts
        $depositAccount = Account::where('company_id', $companyId)->findOrFail($depositAccountId);
        $arAccount = Account::where('company_id', $companyId)
            ->where(function ($q): void {
                $q->where('subtype', 'receivable')->orWhere('code', '1200');
            })
            ->first();

        if (! $arAccount) {
            throw new PostingException("Accounts Receivable control account not found for company {$companyId}.");
        }

        // 2. Execute atomic transaction
        return DB::transaction(function () use (
            $tenantId,
            $companyId,
            $partyId,
            $depositAccount,
            $arAccount,
            $date,
            $totalAmount,
            $paymentMethod,
            $notes,
            $idempotencyKey,
            $allocationsInput
        ): Receipt {
            // Allocate Receipt Number safely
            $year = date('Y', strtotime($date));
            $latestRec = Receipt::where('company_id', $companyId)
                ->whereYear('date', $year)
                ->count();
            $seq = str_pad((string) ($latestRec + 1), 6, '0', STR_PAD_LEFT);
            $receiptNumber = "REC-{$year}-{$seq}";

            // 3. Prepare Balancing Journal Entry
            // Debit: Deposit Account (Bank or Cash) for Total Amount
            // Credit: Accounts Receivable Control Account for Total Amount
            $journalEntry = $this->postingEngine->post([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'date' => $date,
                'description' => "Receipt {$receiptNumber} - Payment Collection",
                'source_type' => 'receipt',
                'idempotency_key' => $idempotencyKey,
                'lines' => [
                    [
                        'account_id' => $depositAccount->id,
                        'debit' => $totalAmount,
                        'credit' => '0.000000',
                        'description' => "Receipt {$receiptNumber} - Cash/Bank Deposit",
                    ],
                    [
                        'account_id' => $arAccount->id,
                        'debit' => '0.000000',
                        'credit' => $totalAmount,
                        'description' => "Receipt {$receiptNumber} - AR Settlement",
                    ],
                ],
            ]);

            $allocatedSum = '0.000000';

            $receipt = Receipt::create([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'party_id' => $partyId,
                'deposit_account_id' => $depositAccount->id,
                'receipt_number' => $receiptNumber,
                'date' => $date,
                'payment_method' => $paymentMethod,
                'amount' => $totalAmount,
                'unallocated_amount' => $totalAmount,
                'status' => 'posted',
                'journal_entry_id' => $journalEntry->id,
                'notes' => $notes,
            ]);

            // 4. Process Allocations against Invoices
            foreach ($allocationsInput as $alloc) {
                $allocAmount = number_format((float) $alloc['amount'], 6, '.', '');
                if (bccomp($allocAmount, '0.000000', 6) <= 0) {
                    continue;
                }

                $invoice = ServiceInvoice::where('company_id', $companyId)
                    ->where('id', $alloc['service_invoice_id'])
                    ->lockForUpdate()
                    ->firstOrFail();

                if (bccomp($allocAmount, (string) $invoice->balance_due, 6) > 0) {
                    throw new PostingException("Allocation amount ({$allocAmount}) exceeds invoice {$invoice->invoice_number} remaining balance ({$invoice->balance_due}).");
                }

                ReceiptAllocation::create([
                    'tenant_id' => $tenantId,
                    'company_id' => $companyId,
                    'receipt_id' => $receipt->id,
                    'service_invoice_id' => $invoice->id,
                    'amount' => $allocAmount,
                    'allocated_at' => now(),
                ]);

                $newPaid = bcadd((string) $invoice->amount_paid, $allocAmount, 6);
                $newBalance = bcsub((string) $invoice->balance_due, $allocAmount, 6);
                $newStatus = bccomp($newBalance, '0.000000', 6) === 0 ? 'paid' : 'partially_paid';

                $invoice->update([
                    'amount_paid' => $newPaid,
                    'balance_due' => $newBalance,
                    'status' => $newStatus,
                ]);

                $allocatedSum = bcadd($allocatedSum, $allocAmount, 6);
            }

            if (bccomp($allocatedSum, $totalAmount, 6) > 0) {
                throw new PostingException("Total allocated sum ({$allocatedSum}) exceeds receipt total amount ({$totalAmount}).");
            }

            $unallocated = bcsub($totalAmount, $allocatedSum, 6);
            $receipt->update(['unallocated_amount' => $unallocated]);

            AuditLogger::log(
                action: 'receipt.posted',
                entityType: Receipt::class,
                entityId: $receipt->id,
                companyId: $companyId,
                tenantId: $tenantId
            );

            return $receipt;
        });
    }
}
