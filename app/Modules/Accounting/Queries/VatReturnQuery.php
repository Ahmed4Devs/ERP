<?php

namespace App\Modules\Accounting\Queries;

use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\JournalEntryLine;
use App\Modules\Accounting\Models\ServiceInvoice;
use App\Modules\Contracting\Models\ContractingClaim;
use App\Modules\Purchasing\Models\VendorBill;
use App\Modules\Retail\Models\PosOrder;
use App\Shared\Context\CurrentCompany;

class VatReturnQuery
{
    /**
     * Aggregate all VAT sales, purchases, and GL liability for a date period.
     *
     * @return array{
     *     start_date: string,
     *     end_date: string,
     *     summary: array<string, mixed>,
     *     sales_details: array<int, array<string, mixed>>,
     *     purchases_details: array<int, array<string, mixed>>,
     *     gl_tax_balance: string
     * }
     */
    public function execute(string $startDate, string $endDate, ?string $companyId = null): array
    {
        $companyId = $companyId ?: app(CurrentCompany::class)->id();

        // 1. Sales Invoices
        $invoices = ServiceInvoice::where('company_id', $companyId)
            ->whereBetween('date', [$startDate, $endDate])
            ->whereIn('status', ['posted', 'paid'])
            ->with('party')
            ->get();

        $invoiceSalesAmount = '0.000000';
        $invoiceVatAmount = '0.000000';
        $salesDetails = [];

        foreach ($invoices as $inv) {
            $sub = (string) $inv->subtotal;
            $tax = (string) $inv->tax_amount;

            $invoiceSalesAmount = bcadd($invoiceSalesAmount, $sub, 6);
            $invoiceVatAmount = bcadd($invoiceVatAmount, $tax, 6);

            $salesDetails[] = [
                'type' => 'service_invoice',
                'reference' => $inv->invoice_number,
                'party' => $inv->party?->name_ar ?: $inv->party?->name,
                'tax_id' => $inv->party?->tax_id,
                'date' => $inv->date->toDateString(),
                'taxable_amount' => (float) $sub,
                'tax_rate' => (float) $inv->tax_rate * 100,
                'tax_amount' => (float) $tax,
                'total_amount' => (float) $inv->total,
            ];
        }

        // 2. Retail POS Orders
        $posOrders = PosOrder::where('company_id', $companyId)
            ->whereBetween('created_at', [$startDate.' 00:00:00', $endDate.' 23:59:59'])
            ->with('customer')
            ->get();

        $posSalesAmount = '0.000000';
        $posVatAmount = '0.000000';

        foreach ($posOrders as $order) {
            $sub = (string) $order->subtotal;
            $tax = (string) $order->tax_amount;

            $posSalesAmount = bcadd($posSalesAmount, $sub, 6);
            $posVatAmount = bcadd($posVatAmount, $tax, 6);

            $salesDetails[] = [
                'type' => 'pos_sale',
                'reference' => $order->receipt_number,
                'party' => $order->customer?->name_ar ?: ($order->customer?->name ?: 'Cash Customer / عميل نقدي'),
                'tax_id' => $order->customer?->tax_id,
                'date' => $order->created_at->toDateString(),
                'taxable_amount' => (float) $sub,
                'tax_rate' => (float) $order->tax_rate * 100,
                'tax_amount' => (float) $tax,
                'total_amount' => (float) $order->total_amount,
            ];
        }

        // 3. Contracting Claims (Billed)
        if (class_exists(ContractingClaim::class)) {
            $claims = ContractingClaim::where('company_id', $companyId)
                ->where('status', 'billed')
                ->whereBetween('claim_date', [$startDate, $endDate])
                ->with('customer')
                ->get();

            foreach ($claims as $claim) {
                $sub = (string) $claim->net_payable_amount;
                $tax = (string) $claim->tax_amount;

                $invoiceSalesAmount = bcadd($invoiceSalesAmount, $sub, 6);
                $invoiceVatAmount = bcadd($invoiceVatAmount, $tax, 6);

                $salesDetails[] = [
                    'type' => 'contracting_claim',
                    'reference' => $claim->claim_number,
                    'party' => $claim->customer?->name_ar ?: $claim->customer?->name,
                    'tax_id' => $claim->customer?->tax_id,
                    'date' => $claim->claim_date->toDateString(),
                    'taxable_amount' => (float) $sub,
                    'tax_rate' => 10.0,
                    'tax_amount' => (float) $tax,
                    'total_amount' => (float) $claim->total_with_tax,
                ];
            }
        }

        $totalSalesAmount = bcadd($invoiceSalesAmount, $posSalesAmount, 6);
        $totalOutputVat = bcadd($invoiceVatAmount, $posVatAmount, 6);

        // 4. Vendor Bills (Purchases & Input VAT)
        $bills = VendorBill::where('company_id', $companyId)
            ->whereBetween('date', [$startDate, $endDate])
            ->whereIn('status', ['posted', 'paid'])
            ->with('party')
            ->get();

        $totalPurchasesAmount = '0.000000';
        $totalInputVat = '0.000000';
        $purchasesDetails = [];

        foreach ($bills as $bill) {
            $sub = (string) $bill->subtotal;
            $tax = (string) $bill->tax_amount;

            $totalPurchasesAmount = bcadd($totalPurchasesAmount, $sub, 6);
            $totalInputVat = bcadd($totalInputVat, $tax, 6);

            $purchasesDetails[] = [
                'type' => 'vendor_bill',
                'reference' => $bill->bill_number,
                'vendor_ref' => $bill->vendor_invoice_ref,
                'party' => $bill->party?->name_ar ?: $bill->party?->name,
                'tax_id' => $bill->party?->tax_id,
                'date' => $bill->date->toDateString(),
                'taxable_amount' => (float) $sub,
                'tax_rate' => (float) $bill->tax_rate * 100,
                'tax_amount' => (float) $tax,
                'total_amount' => (float) $bill->total,
            ];
        }

        // Net VAT Due: Output VAT - Input VAT
        $netVatDue = bcsub($totalOutputVat, $totalInputVat, 6);

        // GL Tax Account 2150 activity for reconciliation
        $taxAccount = Account::where('company_id', $companyId)
            ->where(function ($q): void {
                $q->where('code', '2150')->orWhere('subtype', 'tax_payable');
            })
            ->first();

        $glTaxBalance = '0.000000';
        if ($taxAccount) {
            $glCredits = JournalEntryLine::where('account_id', $taxAccount->id)
                ->whereHas('journalEntry', function ($q) use ($startDate, $endDate): void {
                    $q->where('status', 'posted')->whereBetween('date', [$startDate, $endDate]);
                })
                ->sum('credit');

            $glDebits = JournalEntryLine::where('account_id', $taxAccount->id)
                ->whereHas('journalEntry', function ($q) use ($startDate, $endDate): void {
                    $q->where('status', 'posted')->whereBetween('date', [$startDate, $endDate]);
                })
                ->sum('debit');

            $glTaxBalance = bcsub((string) $glCredits, (string) $glDebits, 6);
        }

        return [
            'start_date' => $startDate,
            'end_date' => $endDate,
            'summary' => [
                'standard_sales_amount' => $totalSalesAmount,
                'standard_sales_vat' => $totalOutputVat,
                'standard_sales_adjustment' => '0.000000',
                'zero_rated_sales_amount' => '0.000000',
                'exempt_sales_amount' => '0.000000',
                'total_sales_amount' => $totalSalesAmount,
                'total_output_vat' => $totalOutputVat,
                'standard_purchases_amount' => $totalPurchasesAmount,
                'standard_purchases_vat' => $totalInputVat,
                'standard_purchases_adjustment' => '0.000000',
                'imports_vat_amount' => '0.000000',
                'zero_rated_purchases_amount' => '0.000000',
                'exempt_purchases_amount' => '0.000000',
                'total_purchases_amount' => $totalPurchasesAmount,
                'total_input_vat' => $totalInputVat,
                'net_vat_due' => $netVatDue,
                'previous_period_credit' => '0.000000',
                'final_net_payable' => $netVatDue,
            ],
            'sales_details' => $salesDetails,
            'purchases_details' => $purchasesDetails,
            'gl_tax_balance' => $glTaxBalance,
        ];
    }
}
