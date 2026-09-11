<?php

namespace App\Modules\Purchasing\Services;

use App\Modules\Accounting\Exceptions\PostingException;
use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Services\PostingEngine;
use App\Modules\Platform\Services\AuditLogger;
use App\Modules\Purchasing\Models\VendorBill;
use App\Modules\Purchasing\Models\VendorPayment;
use App\Modules\Purchasing\Models\VendorPaymentAllocation;
use App\Modules\Purchasing\Models\VendorProfile;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Support\Facades\DB;

class PostVendorPaymentAndAllocateAction
{
    public function __construct(
        protected PostingEngine $postingEngine
    ) {}

    /**
     * Create, post, and allocate a vendor payment atomically.
     *
     * @param array{
     *     party_id: string,
     *     payment_account_id: string,
     *     date: string,
     *     amount: numeric|string,
     *     payment_method?: string|null,
     *     notes?: string|null,
     *     idempotency_key?: string|null,
     *     allocations?: array<int, array{
     *         vendor_bill_id: string,
     *         amount: numeric|string
     *     }>
     * } $data
     *
     * @throws PostingException
     */
    public function execute(array $data): VendorPayment
    {
        $currentTenant = app(CurrentTenant::class);
        $currentCompany = app(CurrentCompany::class);

        $tenantId = $currentTenant->id();
        $companyId = $currentCompany->id();

        if (! $tenantId || ! $companyId) {
            throw new PostingException('Active tenant and company context required to post vendor payment.');
        }

        $partyId = $data['party_id'] ?? null;
        if (! $partyId && ! empty($data['vendor_id'])) {
            $vendorProfile = VendorProfile::find($data['vendor_id']);
            $partyId = $vendorProfile ? $vendorProfile->party_id : $data['vendor_id'];
        }

        if (! $partyId) {
            throw new PostingException('Valid vendor party ID is required.');
        }

        $paymentAccountId = $data['payment_account_id'] ?? $data['bank_account_id'] ?? null;
        if (! $paymentAccountId) {
            throw new PostingException('Payment account ID is required.');
        }

        $date = $data['date'] ?? $data['payment_date'] ?? now()->toDateString();
        $totalAmount = number_format((float) $data['amount'], 6, '.', '');
        $paymentMethod = $data['payment_method'] ?? 'bank_transfer';
        $notes = $data['notes'] ?? null;
        $idempotencyKey = $data['idempotency_key'] ?? null;
        $allocationsInput = $data['allocations'] ?? [];

        if (bccomp($totalAmount, '0.000000', 6) <= 0) {
            throw new PostingException('Payment amount must be strictly positive.');
        }

        // 1. Resolve Accounts
        $paymentAccount = Account::where('company_id', $companyId)->findOrFail($paymentAccountId);
        $apAccount = Account::where('company_id', $companyId)
            ->where(function ($q): void {
                $q->where('subtype', 'payable')->orWhere('code', '2010');
            })
            ->first();

        if (! $apAccount) {
            throw new PostingException("Accounts Payable control account (2010) not found for company {$companyId}.");
        }

        // 2. Execute atomic transaction
        return DB::transaction(function () use (
            $tenantId,
            $companyId,
            $partyId,
            $paymentAccount,
            $apAccount,
            $date,
            $totalAmount,
            $paymentMethod,
            $notes,
            $idempotencyKey,
            $allocationsInput
        ): VendorPayment {
            // Allocate Payment Number safely
            $year = date('Y', strtotime($date));
            $count = VendorPayment::where('company_id', $companyId)
                ->whereYear('date', $year)
                ->count();
            $seq = str_pad((string) ($count + 1), 6, '0', STR_PAD_LEFT);
            $paymentNumber = "PAY-{$year}-{$seq}";

            // 3. Balanced Journal Entry:
            // Debit: Accounts Payable Control (2010) for Total Amount
            // Credit: Bank / Cash Account for Total Amount
            $journalEntry = $this->postingEngine->post([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'date' => $date,
                'description' => "Vendor Payment {$paymentNumber} to Vendor",
                'source_type' => 'vendor_payment',
                'idempotency_key' => $idempotencyKey,
                'lines' => [
                    [
                        'account_id' => $apAccount->id,
                        'debit' => $totalAmount,
                        'credit' => '0.000000',
                        'description' => "Payment {$paymentNumber} - AP Settlement",
                    ],
                    [
                        'account_id' => $paymentAccount->id,
                        'debit' => '0.000000',
                        'credit' => $totalAmount,
                        'description' => "Payment {$paymentNumber} - Bank/Cash Disbursement",
                    ],
                ],
            ]);

            $allocatedSum = '0.000000';

            $payment = VendorPayment::create([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'party_id' => $partyId,
                'payment_account_id' => $paymentAccount->id,
                'journal_entry_id' => $journalEntry->id,
                'payment_number' => $paymentNumber,
                'date' => $date,
                'payment_method' => $paymentMethod,
                'amount' => $totalAmount,
                'unallocated_amount' => $totalAmount,
                'status' => 'posted',
                'notes' => $notes,
            ]);

            // 4. Allocate against Vendor Bills
            foreach ($allocationsInput as $alloc) {
                $allocAmount = number_format((float) $alloc['amount'], 6, '.', '');
                if (bccomp($allocAmount, '0.000000', 6) <= 0) {
                    continue;
                }

                $bill = VendorBill::where('company_id', $companyId)
                    ->where('id', $alloc['vendor_bill_id'])
                    ->lockForUpdate()
                    ->firstOrFail();

                if (bccomp($allocAmount, (string) $bill->balance_due, 6) > 0) {
                    throw new PostingException("Allocation amount ({$allocAmount}) exceeds bill {$bill->bill_number} remaining balance ({$bill->balance_due}).");
                }

                VendorPaymentAllocation::create([
                    'tenant_id' => $tenantId,
                    'company_id' => $companyId,
                    'vendor_payment_id' => $payment->id,
                    'vendor_bill_id' => $bill->id,
                    'amount' => $allocAmount,
                    'allocated_at' => now(),
                ]);

                $newPaid = bcadd((string) $bill->amount_paid, $allocAmount, 6);
                $newBalance = bcsub((string) $bill->balance_due, $allocAmount, 6);
                $newStatus = bccomp($newBalance, '0.000000', 6) === 0 ? 'paid' : 'partially_paid';

                $bill->update([
                    'amount_paid' => $newPaid,
                    'balance_due' => $newBalance,
                    'status' => $newStatus,
                ]);

                $allocatedSum = bcadd($allocatedSum, $allocAmount, 6);
            }

            if (bccomp($allocatedSum, $totalAmount, 6) > 0) {
                throw new PostingException("Total allocated sum ({$allocatedSum}) exceeds payment total amount ({$totalAmount}).");
            }

            $unallocated = bcsub($totalAmount, $allocatedSum, 6);
            $payment->update(['unallocated_amount' => $unallocated]);

            AuditLogger::log(
                action: 'vendor_payment.posted',
                entityType: VendorPayment::class,
                entityId: $payment->id,
                companyId: $companyId,
                tenantId: $tenantId
            );

            return $payment;
        });
    }
}
