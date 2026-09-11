<?php

namespace App\Modules\Retail\Actions;

use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Services\PostingEngine;
use App\Modules\Inventory\Models\Product;
use App\Modules\Inventory\Services\InventoryCostingEngine;
use App\Modules\Localization\Services\ZatcaQrCodeService;
use App\Modules\Organization\Models\Company;
use App\Modules\Retail\Models\PosOrder;
use App\Modules\Retail\Models\PosOrderLine;
use App\Modules\Retail\Models\PosSession;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;

class CompletePosSaleAction
{
    public function __construct(
        protected InventoryCostingEngine $costingEngine,
        protected PostingEngine $postingEngine,
        protected ZatcaQrCodeService $zatcaQrService
    ) {}

    /**
     * Complete a POS sale atomically:
     * - Relieve inventory using moving-average unit cost
     * - Compute tax, subtotals, and ZATCA QR code
     * - Post balanced double-entry GL journal entry
     * - Increment session expected cash
     *
     * @param array{
     *     session_id: string,
     *     customer_id?: string|null,
     *     payment_method: 'cash'|'card'|'split',
     *     cash_tendered?: numeric|string|null,
     *     items: array<int, array{
     *         product_id: string,
     *         quantity: numeric|string,
     *         unit_price: numeric|string,
     *         description?: string|null
     *     }>
     * } $data
     */
    public function execute(array $data): PosOrder
    {
        return DB::transaction(function () use ($data) {
            $session = PosSession::with('terminal')->lockForUpdate()->findOrFail($data['session_id']);

            if ($session->status !== 'open') {
                throw new InvalidArgumentException("Cannot process sale in a closed session (#{$session->session_number}).");
            }

            $terminal = $session->terminal;
            $companyId = $session->company_id;
            $tenantId = $session->tenant_id;
            $warehouseId = $terminal->warehouse_id;

            if (empty($data['items'])) {
                throw new InvalidArgumentException('POS sale must contain at least one item.');
            }

            $company = Company::findOrFail($companyId);
            $paymentMethod = $data['payment_method'] ?? 'cash';

            $totalSubtotal = '0.000000';
            $totalTax = '0.000000';
            $totalAmount = '0.000000';
            $totalCogs = '0.000000';

            $processedLines = [];

            // 1. Process inventory relief and line calculations
            foreach ($data['items'] as $itemData) {
                $productId = $itemData['product_id'];
                $product = Product::withoutGlobalScopes()->findOrFail($productId);
                $quantity = number_format((float) $itemData['quantity'], 6, '.', '');
                $unitPrice = number_format((float) $itemData['unit_price'], 6, '.', '');

                if (bccomp($quantity, '0.000000', 6) <= 0) {
                    throw new InvalidArgumentException("Quantity for product [{$product->sku}] must be greater than zero.");
                }

                // Relieve inventory using moving average cost engine
                $issueResult = $this->costingEngine->issueStock([
                    'tenant_id' => $tenantId,
                    'company_id' => $companyId,
                    'warehouse_id' => $warehouseId,
                    'product_id' => $productId,
                    'quantity' => $quantity,
                    'movement_type' => 'pos_sale',
                    'notes' => "POS sale terminal {$terminal->code} session {$session->session_number}",
                ]);

                $unitCost = (string) $issueResult['stock_movement']->unit_cost;
                $lineCogs = (string) $issueResult['stock_movement']->total_cost;
                $totalCogs = bcadd($totalCogs, $lineCogs, 6);

                // Line subtotal
                $lineSubtotal = bcmul($quantity, $unitPrice, 6);
                $taxRate = '0.100000'; // 10% test tax
                $lineTax = bcmul($lineSubtotal, $taxRate, 6);
                $lineTotal = bcadd($lineSubtotal, $lineTax, 6);

                $totalSubtotal = bcadd($totalSubtotal, $lineSubtotal, 6);
                $totalTax = bcadd($totalTax, $lineTax, 6);
                $totalAmount = bcadd($totalAmount, $lineTotal, 6);

                $processedLines[] = [
                    'product' => $product,
                    'description' => $itemData['description'] ?? ($product->name_ar ?: $product->name),
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'unit_cost' => $unitCost,
                    'tax_amount' => $lineTax,
                    'line_total' => $lineTotal,
                ];
            }

            // 2. Validate Payment Tender
            $cashTendered = number_format((float) ($data['cash_tendered'] ?? 0), 6, '.', '');
            $changeDue = '0.000000';

            if ($paymentMethod === 'cash') {
                if (bccomp($cashTendered, $totalAmount, 6) < 0) {
                    throw new InvalidArgumentException("Cash tendered ({$cashTendered}) is less than total amount ({$totalAmount}).");
                }
                $changeDue = bcsub($cashTendered, $totalAmount, 6);

                // Update session expected cash
                $session->expected_cash = bcadd((string) $session->expected_cash, $totalAmount, 6);
                $session->save();
            } else {
                $cashTendered = $totalAmount;
                $changeDue = '0.000000';
            }

            // 3. Generate ZATCA QR Code Payload (TLV Base64)
            $timestamp = now()->toIso8601String();
            $sellerName = $company->legal_name ?: $company->name;
            $vatNumber = $company->tax_number ?: '300000000000003';
            $qrPayload = $this->zatcaQrService->generateBase64Tlv(
                sellerName: $sellerName,
                vatNumber: $vatNumber,
                timestamp: $timestamp,
                totalWithVat: $totalAmount,
                vatTotal: $totalTax
            );

            // 4. Resolve Accounts for GL Posting
            $cashAccountId = $terminal->cash_account_id;
            if ($paymentMethod === 'card') {
                $bankAccount = Account::where('company_id', $companyId)->where('code', '1020')->first();
                $debitAccountId = $bankAccount ? $bankAccount->id : $cashAccountId;
            } else {
                $debitAccountId = $cashAccountId;
            }

            $revenueAccount = Account::where('company_id', $companyId)->where('code', '4100')->firstOrFail();
            $taxAccount = Account::where('company_id', $companyId)->where('code', '2150')->firstOrFail();
            $cogsAccount = Account::where('company_id', $companyId)->where('code', '5000')->firstOrFail();
            $inventoryAccount = Account::where('company_id', $companyId)->where('code', '1300')->firstOrFail();

            // 5. Build GL Journal Lines
            $journalLines = [
                // DR Cash/Bank
                [
                    'account_id' => $debitAccountId,
                    'debit' => $totalAmount,
                    'credit' => '0.000000',
                    'description' => "POS Sale {$paymentMethod} settlement",
                ],
                // CR Revenue
                [
                    'account_id' => $revenueAccount->id,
                    'debit' => '0.000000',
                    'credit' => $totalSubtotal,
                    'description' => 'POS Sales Revenue',
                ],
                // CR Tax Liability
                [
                    'account_id' => $taxAccount->id,
                    'debit' => '0.000000',
                    'credit' => $totalTax,
                    'description' => 'POS Sales Tax (10%)',
                ],
            ];

            // If COGS > 0, add perpetual inventory entries
            if (bccomp($totalCogs, '0.000000', 6) > 0) {
                $journalLines[] = [
                    'account_id' => $cogsAccount->id,
                    'debit' => $totalCogs,
                    'credit' => '0.000000',
                    'description' => 'Cost of Goods Sold (Perpetual)',
                ];
                $journalLines[] = [
                    'account_id' => $inventoryAccount->id,
                    'debit' => '0.000000',
                    'credit' => $totalCogs,
                    'description' => 'Merchandise Inventory relief',
                ];
            }

            $receiptNumber = 'REC-'.date('Ymd').'-'.strtoupper(Str::random(6));

            $journalEntry = $this->postingEngine->post([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'date' => now()->toDateString(),
                'description' => "POS Order {$receiptNumber} [{$paymentMethod}]",
                'source_type' => PosOrder::class,
                'idempotency_key' => 'pos-sale-'.$receiptNumber,
                'lines' => $journalLines,
            ]);

            // 6. Create PosOrder & Lines
            $order = PosOrder::create([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'session_id' => $session->id,
                'customer_id' => $data['customer_id'] ?? null,
                'receipt_number' => $receiptNumber,
                'subtotal' => $totalSubtotal,
                'tax_rate' => '0.100000',
                'tax_amount' => $totalTax,
                'discount_amount' => '0.000000',
                'total_amount' => $totalAmount,
                'payment_method' => $paymentMethod,
                'cash_tendered' => $cashTendered,
                'change_due' => $changeDue,
                'journal_entry_id' => $journalEntry->id,
                'qr_payload' => $qrPayload,
            ]);

            foreach ($processedLines as $line) {
                PosOrderLine::create([
                    'tenant_id' => $tenantId,
                    'company_id' => $companyId,
                    'pos_order_id' => $order->id,
                    'product_id' => $line['product']->id,
                    'description' => $line['description'],
                    'quantity' => $line['quantity'],
                    'unit_price' => $line['unit_price'],
                    'unit_cost' => $line['unit_cost'],
                    'tax_amount' => $line['tax_amount'],
                    'line_total' => $line['line_total'],
                ]);
            }

            return $order->load(['lines.product', 'session.terminal', 'journalEntry']);
        });
    }
}
