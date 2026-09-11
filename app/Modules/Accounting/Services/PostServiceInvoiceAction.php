<?php

namespace App\Modules\Accounting\Services;

use App\Modules\Accounting\Exceptions\PostingException;
use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\ServiceInvoice;
use App\Modules\Accounting\Models\ServiceInvoiceLine;
use App\Modules\Platform\Services\AuditLogger;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Support\Facades\DB;

class PostServiceInvoiceAction
{
    public function __construct(
        protected PostingEngine $postingEngine
    ) {}

    /**
     * Create and post a service invoice atomically.
     *
     * @param array{
     *     party_id: string,
     *     date: string,
     *     due_date: string,
     *     branch_id?: string|null,
     *     notes?: string|null,
     *     idempotency_key?: string|null,
     *     lines: array<int, array{
     *         description: string,
     *         quantity: numeric|string,
     *         unit_price: numeric|string,
     *         revenue_account_id?: string|null
     *     }>
     * } $data
     */
    public function execute(array $data): ServiceInvoice
    {
        $currentTenant = app(CurrentTenant::class);
        $currentCompany = app(CurrentCompany::class);

        $tenantId = $currentTenant->id();
        $companyId = $currentCompany->id();

        if (! $tenantId || ! $companyId) {
            throw new PostingException('Active tenant and company context required to post invoice.');
        }

        $partyId = $data['party_id'];
        $date = $data['date'];
        $dueDate = $data['due_date'];
        $notes = $data['notes'] ?? null;
        $idempotencyKey = $data['idempotency_key'] ?? null;
        $inputLines = $data['lines'];

        if (empty($inputLines)) {
            throw new PostingException('Invoice must have at least one line item.');
        }

        // 1. Resolve Accounts
        $arAccount = Account::where('company_id', $companyId)
            ->where(function ($q): void {
                $q->where('subtype', 'receivable')->orWhere('code', '1200');
            })
            ->first();

        if (! $arAccount) {
            throw new PostingException("Accounts Receivable control account not found for company {$companyId}.");
        }

        $taxAccount = Account::where('company_id', $companyId)
            ->where(function ($q): void {
                $q->where('subtype', 'tax_payable')->orWhere('code', '2150');
            })
            ->first();

        if (! $taxAccount) {
            throw new PostingException("Tax liability account not found for company {$companyId}.");
        }

        $defaultRevenueAccount = Account::where('company_id', $companyId)
            ->where(function ($q): void {
                $q->where('type', 'revenue')->orWhere('code', '4100');
            })
            ->first();

        // 2. Exact financial calculations with 10% test tax
        $taxRate = '0.100000'; // Clearly labeled 10% Test Tax
        $subtotal = '0.000000';
        $computedLines = [];

        foreach ($inputLines as $line) {
            $qty = number_format((float) ($line['quantity'] ?? 1), 6, '.', '');
            $price = number_format((float) ($line['unit_price'] ?? 0), 6, '.', '');
            $lineSubtotal = bcmul($qty, $price, 6);
            $lineTax = bcmul($lineSubtotal, $taxRate, 6);
            $lineTotal = bcadd($lineSubtotal, $lineTax, 6);

            $revAccount = ! empty($line['revenue_account_id'])
                ? Account::where('company_id', $companyId)->findOrFail($line['revenue_account_id'])
                : $defaultRevenueAccount;

            if (! $revAccount) {
                throw new PostingException('Revenue account is required for invoice lines.');
            }

            $computedLines[] = [
                'description' => $line['description'],
                'quantity' => $qty,
                'unit_price' => $price,
                'tax_rate' => $taxRate,
                'tax_amount' => $lineTax,
                'line_total' => $lineTotal,
                'revenue_account_id' => $revAccount->id,
            ];

            $subtotal = bcadd($subtotal, $lineSubtotal, 6);
        }

        $taxAmount = bcmul($subtotal, $taxRate, 6);
        $total = bcadd($subtotal, $taxAmount, 6);

        // 3. Atomically create invoice, journal entry, and lines
        return DB::transaction(function () use (
            $tenantId,
            $companyId,
            $currentCompany,
            $partyId,
            $date,
            $dueDate,
            $notes,
            $idempotencyKey,
            $subtotal,
            $taxRate,
            $taxAmount,
            $total,
            $computedLines,
            $arAccount,
            $taxAccount
        ): ServiceInvoice {
            // Allocate Invoice Number safely
            $year = date('Y', strtotime($date));
            $latestInv = ServiceInvoice::where('company_id', $companyId)
                ->whereYear('date', $year)
                ->count();
            $seq = str_pad((string) ($latestInv + 1), 6, '0', STR_PAD_LEFT);
            $invoiceNumber = "INV-{$year}-{$seq}";

            $invoice = ServiceInvoice::create([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'branch_id' => $currentCompany->branchId(),
                'party_id' => $partyId,
                'invoice_number' => $invoiceNumber,
                'date' => $date,
                'due_date' => $dueDate,
                'status' => 'posted',
                'subtotal' => $subtotal,
                'tax_rate' => $taxRate,
                'tax_amount' => $taxAmount,
                'total' => $total,
                'amount_paid' => '0.000000',
                'balance_due' => $total,
                'currency' => $currentCompany->get()?->currency ?? 'USD',
                'notes' => $notes,
            ]);

            foreach ($computedLines as $cl) {
                ServiceInvoiceLine::create([
                    'tenant_id' => $tenantId,
                    'company_id' => $companyId,
                    'service_invoice_id' => $invoice->id,
                    'description' => $cl['description'],
                    'quantity' => $cl['quantity'],
                    'unit_price' => $cl['unit_price'],
                    'tax_rate' => $cl['tax_rate'],
                    'tax_amount' => $cl['tax_amount'],
                    'line_total' => $cl['line_total'],
                    'revenue_account_id' => $cl['revenue_account_id'],
                ]);
            }

            // 4. Prepare Journal Entry lines
            // Debit: Accounts Receivable for Total
            // Credit: Revenue Account(s) for Subtotal
            // Credit: Test Tax Liability for Tax Amount
            $journalLines = [
                [
                    'account_id' => $arAccount->id,
                    'debit' => $total,
                    'credit' => '0.000000',
                    'description' => "Invoice {$invoiceNumber} - Accounts Receivable",
                ],
            ];

            foreach ($computedLines as $cl) {
                $lineSubtotal = bcmul((string) $cl['quantity'], (string) $cl['unit_price'], 6);
                $journalLines[] = [
                    'account_id' => $cl['revenue_account_id'],
                    'debit' => '0.000000',
                    'credit' => $lineSubtotal,
                    'description' => "Invoice {$invoiceNumber} - Revenue: {$cl['description']}",
                ];
            }

            if (bccomp($taxAmount, '0.000000', 6) > 0) {
                $journalLines[] = [
                    'account_id' => $taxAccount->id,
                    'debit' => '0.000000',
                    'credit' => $taxAmount,
                    'description' => "Invoice {$invoiceNumber} - 10% Test Tax Liability",
                ];
            }

            // Post journal atomically
            $journalEntry = $this->postingEngine->post([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'date' => $date,
                'description' => "Service Invoice {$invoiceNumber}",
                'source_type' => 'invoice',
                'source_id' => $invoice->id,
                'idempotency_key' => $idempotencyKey,
                'lines' => $journalLines,
            ]);

            $invoice->update(['journal_entry_id' => $journalEntry->id]);

            AuditLogger::log(
                action: 'invoice.posted',
                entityType: ServiceInvoice::class,
                entityId: $invoice->id,
                companyId: $companyId,
                tenantId: $tenantId
            );

            return $invoice;
        });
    }
}
