<?php

namespace App\Modules\Purchasing\Services;

use App\Modules\Accounting\Exceptions\PostingConflictException;
use App\Modules\Accounting\Exceptions\PostingException;
use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Services\PostingEngine;
use App\Modules\Platform\Services\AuditLogger;
use App\Modules\Purchasing\Models\PurchaseOrder;
use App\Modules\Purchasing\Models\VendorBill;
use App\Modules\Purchasing\Models\VendorBillLine;
use App\Modules\Purchasing\Models\VendorProfile;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Support\Facades\DB;

class PostVendorBillAction
{
    public function __construct(
        protected PostingEngine $postingEngine
    ) {}

    /**
     * Create and post a vendor bill atomically with input tax and balanced double-entry GL.
     *
     * @param array{
     *     party_id: string,
     *     date: string,
     *     due_date: string,
     *     vendor_invoice_ref?: string|null,
     *     purchase_order_id?: string|null,
     *     notes?: string|null,
     *     idempotency_key?: string|null,
     *     lines: array<int, array{
     *         description: string,
     *         quantity: numeric|string,
     *         unit_price: numeric|string,
     *         expense_account_id?: string|null
     *     }>
     * } $data
     *
     * @throws PostingException
     */
    public function execute(array $data): VendorBill
    {
        $currentTenant = app(CurrentTenant::class);
        $currentCompany = app(CurrentCompany::class);

        $tenantId = $currentTenant->id();
        $companyId = $currentCompany->id();

        if (! empty($data['id'])) {
            $existingBill = VendorBill::where('company_id', $companyId)->find($data['id']);
            if ($existingBill && in_array($existingBill->status, ['posted', 'partially_paid', 'paid'])) {
                throw new PostingConflictException("Vendor bill {$existingBill->bill_number} has already been posted.");
            }
        }

        $partyId = $data['party_id'] ?? null;
        if (! $partyId && ! empty($data['vendor_id'])) {
            $vendorProfile = VendorProfile::find($data['vendor_id']);
            $partyId = $vendorProfile ? $vendorProfile->party_id : $data['vendor_id'];
        }

        if (! $partyId) {
            throw new PostingException('Valid vendor party ID is required.');
        }

        $date = $data['date'] ?? $data['bill_date'] ?? now()->toDateString();
        $dueDate = $data['due_date'] ?? now()->addDays(30)->toDateString();
        $vendorRef = $data['vendor_invoice_ref'] ?? $data['vendor_bill_number'] ?? null;
        $poId = $data['purchase_order_id'] ?? null;
        $notes = $data['notes'] ?? null;
        $idempotencyKey = $data['idempotency_key'] ?? null;
        $inputLines = $data['lines'] ?? [];

        if (empty($inputLines)) {
            throw new PostingException('Vendor bill must contain at least one line item.');
        }

        // 1. Resolve Required Accounts
        $apAccount = Account::where('company_id', $companyId)
            ->where(function ($q): void {
                $q->where('subtype', 'payable')->orWhere('code', '2010');
            })
            ->first();

        if (! $apAccount) {
            throw new PostingException("Accounts Payable control account (2010) not found for company {$companyId}.");
        }

        $inputTaxAccount = Account::where('company_id', $companyId)
            ->where(function ($q): void {
                $q->where('subtype', 'tax_receivable')->orWhere('code', '1150');
            })
            ->first();

        if (! $inputTaxAccount) {
            throw new PostingException("Input Tax Recoverable account (1150) not found for company {$companyId}.");
        }

        $defaultExpenseAccount = Account::where('company_id', $companyId)
            ->where(function ($q): void {
                $q->where('type', 'expense')->orWhere('code', '5100');
            })
            ->first();

        // 2. Compute exact finances using bcmath
        $taxRate = '0.100000'; // 10% Test Input Tax
        $subtotal = '0.000000';
        $computedLines = [];

        foreach ($inputLines as $line) {
            $qty = number_format((float) ($line['quantity'] ?? 1), 6, '.', '');
            $price = number_format((float) ($line['unit_price'] ?? 0), 6, '.', '');
            $lineSubtotal = bcmul($qty, $price, 6);
            $lineTax = bcmul($lineSubtotal, $taxRate, 6);
            $lineTotal = bcadd($lineSubtotal, $lineTax, 6);

            $expAccountId = $line['expense_account_id'] ?? $data['expense_account_id'] ?? null;
            $expAccount = ! empty($expAccountId)
                ? Account::where('company_id', $companyId)->findOrFail($expAccountId)
                : $defaultExpenseAccount;

            if (! $expAccount) {
                throw new PostingException('Expense account is required for vendor bill lines.');
            }

            $computedLines[] = [
                'description' => $line['description'],
                'quantity' => $qty,
                'unit_price' => $price,
                'tax_rate' => $taxRate,
                'tax_amount' => $lineTax,
                'line_total' => $lineTotal,
                'expense_account_id' => $expAccount->id,
            ];

            $subtotal = bcadd($subtotal, $lineSubtotal, 6);
        }

        $taxAmount = bcmul($subtotal, $taxRate, 6);
        $total = bcadd($subtotal, $taxAmount, 6);

        // 3. Execute atomic transaction
        return DB::transaction(function () use (
            $tenantId,
            $companyId,
            $currentCompany,
            $partyId,
            $poId,
            $date,
            $dueDate,
            $vendorRef,
            $notes,
            $idempotencyKey,
            $subtotal,
            $taxRate,
            $taxAmount,
            $total,
            $computedLines,
            $apAccount,
            $inputTaxAccount
        ): VendorBill {
            // Allocate Bill Number safely
            $year = date('Y', strtotime($date));
            $count = VendorBill::where('company_id', $companyId)
                ->whereYear('date', $year)
                ->count();
            $seq = str_pad((string) ($count + 1), 6, '0', STR_PAD_LEFT);
            $billNumber = "BILL-{$year}-{$seq}";

            $bill = VendorBill::create([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'branch_id' => $currentCompany->branchId(),
                'party_id' => $partyId,
                'purchase_order_id' => $poId,
                'bill_number' => $billNumber,
                'vendor_invoice_ref' => $vendorRef,
                'date' => $date,
                'due_date' => $dueDate,
                'status' => 'posted',
                'subtotal' => $subtotal,
                'tax_rate' => $taxRate,
                'tax_amount' => $taxAmount,
                'total' => $total,
                'amount_paid' => '0.000000',
                'balance_due' => $total,
                'currency' => $currentCompany->get()?->currency ?? 'SAR',
                'notes' => $notes,
            ]);

            foreach ($computedLines as $cl) {
                VendorBillLine::create([
                    'tenant_id' => $tenantId,
                    'company_id' => $companyId,
                    'vendor_bill_id' => $bill->id,
                    'description' => $cl['description'],
                    'quantity' => $cl['quantity'],
                    'unit_price' => $cl['unit_price'],
                    'tax_rate' => $cl['tax_rate'],
                    'tax_amount' => $cl['tax_amount'],
                    'line_total' => $cl['line_total'],
                    'expense_account_id' => $cl['expense_account_id'],
                ]);
            }

            // 4. Balanced Journal Entry lines:
            // Debit: Expense Account(s) for Subtotal
            // Debit: Input Tax Recoverable (1150) for Tax Amount
            // Credit: Accounts Payable Control (2010) for Grand Total
            $journalLines = [];

            foreach ($computedLines as $cl) {
                $lineSubtotal = bcmul((string) $cl['quantity'], (string) $cl['unit_price'], 6);
                $journalLines[] = [
                    'account_id' => $cl['expense_account_id'],
                    'debit' => $lineSubtotal,
                    'credit' => '0.000000',
                    'description' => "Vendor Bill {$billNumber} - Expense: {$cl['description']}",
                ];
            }

            if (bccomp($taxAmount, '0.000000', 6) > 0) {
                $journalLines[] = [
                    'account_id' => $inputTaxAccount->id,
                    'debit' => $taxAmount,
                    'credit' => '0.000000',
                    'description' => "Vendor Bill {$billNumber} - 10% Test Input Tax Recoverable",
                ];
            }

            $journalLines[] = [
                'account_id' => $apAccount->id,
                'debit' => '0.000000',
                'credit' => $total,
                'description' => "Vendor Bill {$billNumber} - Accounts Payable",
            ];

            $journalEntry = $this->postingEngine->post([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'date' => $date,
                'description' => "Vendor Bill {$billNumber}",
                'source_type' => 'vendor_bill',
                'source_id' => $bill->id,
                'idempotency_key' => $idempotencyKey,
                'lines' => $journalLines,
            ]);

            $bill->update(['journal_entry_id' => $journalEntry->id]);

            // Update PO status if billed
            if ($poId) {
                $po = PurchaseOrder::where('company_id', $companyId)->find($poId);
                if ($po && in_array($po->status, ['approved', 'received'], true)) {
                    $po->update(['status' => 'billed']);
                }
            }

            AuditLogger::log(
                action: 'vendor_bill.posted',
                entityType: VendorBill::class,
                entityId: $bill->id,
                companyId: $companyId,
                tenantId: $tenantId
            );

            return $bill;
        });
    }
}
