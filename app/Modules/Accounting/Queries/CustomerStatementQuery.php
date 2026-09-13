<?php

namespace App\Modules\Accounting\Queries;

use App\Modules\Accounting\Models\Receipt;
use App\Modules\Accounting\Models\ServiceInvoice;
use App\Modules\MasterData\Models\Party;
use App\Shared\Context\CurrentCompany;

class CustomerStatementQuery
{
    /**
     * Compute a customer statement of account with opening balance, transactions, and running balances.
     *
     * @return array{
     *     customer: Party|null,
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
    public function execute(string $customerId, ?string $startDate = null, ?string $endDate = null): array
    {
        $customer = Party::find($customerId);
        $companyId = app(CurrentCompany::class)->id();
        if (! $companyId && $customer) {
            $profile = $customer->customerProfiles()->first();
            $companyId = $profile ? $profile->company_id : null;
        }

        $startDate = $startDate ?: now()->startOfMonth()->toDateString();
        $endDate = $endDate ?: now()->toDateString();

        // 1. Calculate Opening Balance before $startDate:
        // Invoices posted before startDate (Debit)
        $priorInvoices = (float) ServiceInvoice::when($companyId, fn ($q) => $q->where('company_id', $companyId))
            ->where('party_id', $customerId)
            ->whereIn('status', ['posted', 'partially_paid', 'paid'])
            ->where('date', '<', $startDate)
            ->sum('total');

        // Receipts posted before startDate (Credit)
        $priorReceipts = (float) Receipt::when($companyId, fn ($q) => $q->where('company_id', $companyId))
            ->where('party_id', $customerId)
            ->where('date', '<', $startDate)
            ->sum('amount');

        $openingBalance = $priorInvoices - $priorReceipts;

        // 2. Fetch period transactions
        $invoices = ServiceInvoice::when($companyId, fn ($q) => $q->where('company_id', $companyId))
            ->where('party_id', $customerId)
            ->whereIn('status', ['posted', 'partially_paid', 'paid'])
            ->whereBetween('date', [$startDate, $endDate])
            ->get();

        $receipts = Receipt::when($companyId, fn ($q) => $q->where('company_id', $companyId))
            ->where('party_id', $customerId)
            ->whereBetween('date', [$startDate, $endDate])
            ->get();

        $txs = [];

        foreach ($invoices as $inv) {
            $txs[] = [
                'date' => $inv->date->toDateString(),
                'type' => 'Invoice',
                'type_ar' => 'فاتورة مبيعات / خدمات',
                'reference' => $inv->invoice_number,
                'debit' => (float) $inv->total,
                'credit' => 0.0,
                'notes' => $inv->notes,
                'timestamp' => strtotime($inv->date->toDateString().' 00:00:00'),
            ];
        }

        foreach ($receipts as $rec) {
            $txs[] = [
                'date' => $rec->date->toDateString(),
                'type' => 'Receipt Voucher',
                'type_ar' => 'سند قبض مالي',
                'reference' => $rec->receipt_number,
                'debit' => 0.0,
                'credit' => (float) $rec->amount,
                'notes' => $rec->notes,
                'timestamp' => strtotime($rec->date->toDateString().' 12:00:00'),
            ];
        }

        // Sort chronologically
        usort($txs, fn ($a, $b) => $a['timestamp'] <=> $b['timestamp']);

        // Calculate running balances
        $runningBalance = $openingBalance;
        $totalDebit = 0.0;
        $totalCredit = 0.0;
        $finalTransactions = [];

        foreach ($txs as $item) {
            $runningBalance += ($item['debit'] - $item['credit']);
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
            'customer' => $customer,
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
