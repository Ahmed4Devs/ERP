<?php

namespace App\Modules\Purchasing\Queries;

use App\Modules\MasterData\Models\Party;
use App\Modules\Purchasing\Models\VendorBill;
use App\Modules\Purchasing\Models\VendorPayment;
use App\Shared\Context\CurrentCompany;

class VendorStatementQuery
{
    /**
     * Compute a vendor statement of account with opening balance, transactions, and running balances.
     *
     * @return array{
     *     vendor: Party|null,
     *     start_date: string,
     *     end_date: string,
     *     opening_balance: float,
     *     transactions: array<int, array{
     *         date: string,
     *         type: string,
     *         type_ar: string,
     *         reference: string,
     *         debit: float,
     *         credit: float,
     *         balance: float,
     *         notes: string|null
     *     }>,
     *     total_debit: float,
     *     total_credit: float,
     *     closing_balance: float
     * }
     */
    public function execute(string $vendorId, ?string $startDate = null, ?string $endDate = null): array
    {
        $vendor = Party::find($vendorId);
        $companyId = app(CurrentCompany::class)->id();
        if (! $companyId && $vendor) {
            $profile = $vendor->vendorProfiles()->first();
            $companyId = $profile ? $profile->company_id : null;
        }

        // 1. Calculate Opening Balance before $startDate:
        // Bills posted before startDate (Credit to vendor / Liability)
        $priorBills = (float) VendorBill::when($companyId, fn ($q) => $q->where('company_id', $companyId))
            ->where('party_id', $vendorId)
            ->whereIn('status', ['posted', 'partially_paid', 'paid'])
            ->where('date', '<', $startDate)
            ->sum('total');

        // Payments made before startDate (Debit to vendor)
        $priorPayments = (float) VendorPayment::when($companyId, fn ($q) => $q->where('company_id', $companyId))
            ->where('party_id', $vendorId)
            ->where('date', '<', $startDate)
            ->sum('amount');

        $openingBalance = $priorBills - $priorPayments;

        // 2. Fetch period transactions
        $bills = VendorBill::when($companyId, fn ($q) => $q->where('company_id', $companyId))
            ->where('party_id', $vendorId)
            ->whereIn('status', ['posted', 'partially_paid', 'paid'])
            ->whereBetween('date', [$startDate, $endDate])
            ->get();

        $payments = VendorPayment::when($companyId, fn ($q) => $q->where('company_id', $companyId))
            ->where('party_id', $vendorId)
            ->whereBetween('date', [$startDate, $endDate])
            ->get();

        $txs = [];

        foreach ($bills as $bill) {
            $billDate = $bill->date ? $bill->date->toDateString() : now()->toDateString();
            $txs[] = [
                'date' => $billDate,
                'type' => 'Vendor Bill',
                'type_ar' => 'فاتورة شراء / مورد',
                'reference' => $bill->bill_number,
                'debit' => 0.0,
                'credit' => (float) $bill->total,
                'notes' => $bill->vendor_invoice_ref ?: $bill->notes,
                'timestamp' => strtotime($billDate.' 00:00:00'),
            ];
        }

        foreach ($payments as $pay) {
            $payDate = $pay->date ? $pay->date->toDateString() : now()->toDateString();
            $txs[] = [
                'date' => $payDate,
                'type' => 'Payment Voucher',
                'type_ar' => 'سند صرف مالي',
                'reference' => $pay->payment_number,
                'debit' => (float) $pay->amount,
                'credit' => 0.0,
                'notes' => $pay->notes,
                'timestamp' => strtotime($payDate.' 12:00:00'),
            ];
        }

        // Sort chronologically
        usort($txs, fn ($a, $b) => $a['timestamp'] <=> $b['timestamp']);

        // Calculate running balances: Liability balance = opening + (credits - debits)
        $runningBalance = $openingBalance;
        $totalDebit = 0.0;
        $totalCredit = 0.0;
        $finalTransactions = [];

        foreach ($txs as $item) {
            $runningBalance += ($item['credit'] - $item['debit']);
            $totalDebit += $item['debit'];
            $totalCredit += $item['credit'];

            $finalTransactions[] = [
                'date' => $item['date'],
                'type' => $item['type'],
                'type_ar' => $item['type_ar'],
                'reference' => $item['reference'],
                'debit' => $item['debit'],
                'credit' => $item['credit'],
                'balance' => $runningBalance,
                'notes' => $item['notes'],
            ];
        }

        return [
            'vendor' => $vendor,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'opening_balance' => $openingBalance,
            'transactions' => $finalTransactions,
            'total_debit' => $totalDebit,
            'total_credit' => $totalCredit,
            'closing_balance' => $runningBalance,
        ];
    }
}
