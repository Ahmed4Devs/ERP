<?php

namespace App\Modules\Retail\Actions;

use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Services\PostingEngine;
use App\Modules\Platform\Services\AuditLogger;
use App\Modules\Retail\Models\PosSession;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class ClosePosSessionAction
{
    public function __construct(
        protected PostingEngine $postingEngine
    ) {}

    /**
     * Close and reconcile a POS Session with full drawer reconciliation,
     * Z-Report generation, and automated GL shortage/surplus journal adjustments.
     *
     * @param array{
     *     session_id: string,
     *     closing_cash: numeric|string,
     *     closed_by?: int|null,
     *     notes?: string|null
     * } $data
     */
    public function execute(array $data): PosSession
    {
        return DB::transaction(function () use ($data) {
            /** @var PosSession $session */
            $session = PosSession::with(['terminal', 'orders'])->lockForUpdate()->findOrFail($data['session_id']);

            if ($session->status !== 'open') {
                throw new InvalidArgumentException("Session (#{$session->session_number}) is already closed.");
            }

            $terminal = $session->terminal;
            $companyId = $session->company_id;
            $tenantId = $session->tenant_id;

            // 1. Calculate orders financial breakdown
            $orders = $session->orders;
            $totalOrdersCount = $orders->count();
            $totalGrossSales = '0.000000';
            $totalDiscounts = '0.000000';
            $totalNetSales = '0.000000';
            $totalTax = '0.000000';
            $totalCashSales = '0.000000';
            $totalCardSales = '0.000000';

            foreach ($orders as $order) {
                $subtotal = (string) $order->subtotal;
                $taxAmount = (string) $order->tax_amount;
                $discountAmount = (string) $order->discount_amount;
                $gross = bcadd($subtotal, $discountAmount, 6);

                $totalGrossSales = bcadd($totalGrossSales, $gross, 6);
                $totalDiscounts = bcadd($totalDiscounts, $discountAmount, 6);
                $totalNetSales = bcadd($totalNetSales, $subtotal, 6);
                $totalTax = bcadd($totalTax, $taxAmount, 6);

                $paymentMethod = $order->payment_method;
                $orderTotal = (string) $order->total_amount;

                if ($paymentMethod === 'cash') {
                    $totalCashSales = bcadd($totalCashSales, $orderTotal, 6);
                } elseif ($paymentMethod === 'card') {
                    $totalCardSales = bcadd($totalCardSales, $orderTotal, 6);
                } else {
                    // Default fallback or split
                    $totalCashSales = bcadd($totalCashSales, $orderTotal, 6);
                }
            }

            // 2. Drawer reconciliation
            $openingCash = (string) $session->opening_cash;
            $expectedCash = bcadd($openingCash, $totalCashSales, 6);
            $closingCash = number_format((float) $data['closing_cash'], 6, '.', '');
            $cashDifference = bcsub($closingCash, $expectedCash, 6);

            // 3. Generate Sequential Z-Report Number
            $maxSeq = PosSession::where('terminal_id', $session->terminal_id)
                ->whereNotNull('z_report_sequence')
                ->max('z_report_sequence') ?? 0;
            $zSequence = $maxSeq + 1;
            $zReportNumber = sprintf('Z-%s-%s-%04d', $terminal->code, now()->format('Ymd'), $zSequence);

            // 4. Automatic Accounting Posting for Cash Difference
            $differenceJournalId = null;
            if (bccomp($cashDifference, '0.000000', 6) !== 0) {
                $terminalCashAccount = Account::find($terminal->cash_account_id)
                    ?? Account::where('company_id', $companyId)->where('code', '1010')->first();

                if (! $terminalCashAccount) {
                    $terminalCashAccount = Account::where('company_id', $companyId)->where('type', 'asset')->firstOrFail();
                }

                $glLines = [];
                $date = now()->toDateString();

                if (bccomp($cashDifference, '0.000000', 6) < 0) {
                    // Shortage (عجز) - Expense
                    $absDifference = bcmul($cashDifference, '-1', 6);
                    $shortageAccount = Account::where('company_id', $companyId)->where('code', '5350')->first();
                    if (! $shortageAccount) {
                        $shortageAccount = Account::create([
                            'tenant_id' => $tenantId,
                            'company_id' => $companyId,
                            'code' => '5350',
                            'name' => 'Cash Drawer Shortage & Variance',
                            'name_ar' => 'مصروف عجز وفروقات الصندوق ونقاط البيع',
                            'type' => 'expense',
                            'subtype' => 'operating_expense',
                            'currency' => $terminalCashAccount->currency ?? 'SAR',
                            'is_postable' => true,
                            'is_system' => false,
                            'current_balance' => '0.000000',
                        ]);
                    }

                    // DR Shortage Expense / CR Cash Drawer
                    $glLines[] = [
                        'account_id' => $shortageAccount->id,
                        'debit' => $absDifference,
                        'credit' => '0.000000',
                        'description' => "POS Cash Drawer Shortage - Session {$session->session_number} ({$zReportNumber})",
                    ];
                    $glLines[] = [
                        'account_id' => $terminalCashAccount->id,
                        'debit' => '0.000000',
                        'credit' => $absDifference,
                        'description' => "Cash Drawer Shortage Adjustment - Terminal {$terminal->code}",
                    ];

                    $journalDescription = "POS Cash Drawer Shortage Adjustment {$session->session_number} ({$zReportNumber})";
                } else {
                    // Surplus (زيادة) - Other Income
                    $surplusAccount = Account::where('company_id', $companyId)->where('code', '4350')->first();
                    if (! $surplusAccount) {
                        $surplusAccount = Account::create([
                            'tenant_id' => $tenantId,
                            'company_id' => $companyId,
                            'code' => '4350',
                            'name' => 'Cash Drawer Surplus & Variance',
                            'name_ar' => 'إيرادات زيادة وفروقات الصندوق ونقاط البيع',
                            'type' => 'revenue',
                            'subtype' => 'operating_revenue',
                            'currency' => $terminalCashAccount->currency ?? 'SAR',
                            'is_postable' => true,
                            'is_system' => false,
                            'current_balance' => '0.000000',
                        ]);
                    }

                    // DR Cash Drawer / CR Surplus Revenue
                    $glLines[] = [
                        'account_id' => $terminalCashAccount->id,
                        'debit' => $cashDifference,
                        'credit' => '0.000000',
                        'description' => "Cash Drawer Surplus Adjustment - Terminal {$terminal->code}",
                    ];
                    $glLines[] = [
                        'account_id' => $surplusAccount->id,
                        'debit' => '0.000000',
                        'credit' => $cashDifference,
                        'description' => "POS Cash Drawer Surplus - Session {$session->session_number} ({$zReportNumber})",
                    ];

                    $journalDescription = "POS Cash Drawer Surplus Adjustment {$session->session_number} ({$zReportNumber})";
                }

                $journal = $this->postingEngine->post([
                    'tenant_id' => $tenantId,
                    'company_id' => $companyId,
                    'date' => $date,
                    'description' => $journalDescription,
                    'source_type' => 'pos_session_reconciliation',
                    'source_id' => $session->id,
                    'idempotency_key' => "pos_recon_{$session->id}",
                    'lines' => $glLines,
                ]);

                $differenceJournalId = $journal->id;
            }

            // 5. Update and seal the session
            $session->closing_cash = $closingCash;
            $session->expected_cash = $expectedCash;
            $session->cash_difference = $cashDifference;
            $session->total_orders_count = $totalOrdersCount;
            $session->total_gross_sales = $totalGrossSales;
            $session->total_discounts = $totalDiscounts;
            $session->total_net_sales = $totalNetSales;
            $session->total_tax = $totalTax;
            $session->total_cash_sales = $totalCashSales;
            $session->total_card_sales = $totalCardSales;
            $session->z_report_number = $zReportNumber;
            $session->z_report_sequence = $zSequence;
            $session->difference_journal_entry_id = $differenceJournalId;
            $session->status = 'closed';
            $session->closed_at = now();
            $session->closed_by = $data['closed_by'] ?? auth()->id();

            if (! empty($data['notes'])) {
                $session->notes = $session->notes ? ($session->notes."\n".$data['notes']) : $data['notes'];
            }

            $session->save();

            AuditLogger::log(
                action: 'pos_session.closed_and_reconciled',
                entityType: PosSession::class,
                entityId: $session->id,
                newValues: [
                    'session_number' => $session->session_number,
                    'z_report_number' => $zReportNumber,
                    'z_report_sequence' => $zSequence,
                    'closing_cash' => $closingCash,
                    'expected_cash' => $expectedCash,
                    'cash_difference' => $cashDifference,
                    'total_orders_count' => $totalOrdersCount,
                    'difference_journal_entry_id' => $differenceJournalId,
                ]
            );

            return $session->fresh(['terminal', 'user', 'closedByUser', 'differenceJournalEntry']);
        });
    }
}
