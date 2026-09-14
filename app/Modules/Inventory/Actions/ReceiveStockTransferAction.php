<?php

namespace App\Modules\Inventory\Actions;

use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Services\PostingEngine;
use App\Modules\Inventory\Models\StockTransfer;
use App\Modules\Inventory\Services\InventoryCostingEngine;
use App\Modules\Platform\Services\AuditLogger;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class ReceiveStockTransferAction
{
    public function __construct(
        protected InventoryCostingEngine $costingEngine,
        protected PostingEngine $postingEngine
    ) {}

    /**
     * Receive an in-transit stock transfer at the destination warehouse:
     * - Verify actual received quantities per line
     * - Record received stock into destination warehouse
     * - Calculate and record any transit shortage / transit damage
     * - Post balanced double-entry GL journal:
     *   DR 1300 (Destination Warehouse Inventory Asset / بضاعة المخزون) [for received qty]
     *   DR 5260 (Loss on Transit Damage & Shortage / خسائر وعجز نقل وشحن) [for shortage qty, if any]
     *   CR 1350 (Goods In-Transit / بضاعة بالطريق) [for total dispatched value]
     *
     * @param array{
     *     transfer_id: string,
     *     received_lines: array<int, array{
     *         line_id: string,
     *         received_quantity: numeric|string,
     *         shortage_reason?: string|null
     *     }>,
     *     user_id?: int|null
     * } $data
     */
    public function execute(array $data): StockTransfer
    {
        return DB::transaction(function () use ($data) {
            /** @var StockTransfer $transfer */
            $transfer = StockTransfer::with(['lines.product', 'fromWarehouse', 'toWarehouse'])
                ->lockForUpdate()
                ->findOrFail($data['transfer_id']);

            if ($transfer->status !== 'in_transit') {
                throw new InvalidArgumentException("Transfer [{$transfer->transfer_number}] is not in transit (current status: {$transfer->status}).");
            }

            $companyId = $transfer->company_id;
            $tenantId = $transfer->tenant_id;
            $destWarehouseId = $transfer->to_warehouse_id;
            $date = now()->toDateString();

            // Map received lines by line_id
            $receivedMap = [];
            foreach ($data['received_lines'] as $rLine) {
                $receivedMap[$rLine['line_id']] = $rLine;
            }

            $totalReceivedValue = '0.000000';
            $totalShortageValue = '0.000000';
            $totalDispatchedValue = '0.000000';

            foreach ($transfer->lines as $line) {
                $dispatchedQty = (float) ($line->dispatched_quantity ?: $line->quantity);
                $dispatchedQtyStr = number_format($dispatchedQty, 6, '.', '');

                $inputReceived = isset($receivedMap[$line->id])
                    ? (float) $receivedMap[$line->id]['received_quantity']
                    : $dispatchedQty;

                // Received quantity cannot exceed dispatched quantity
                $actualReceivedQty = min($inputReceived, $dispatchedQty);
                $shortageQty = max(0.0, $dispatchedQty - $actualReceivedQty);

                $actualReceivedStr = number_format($actualReceivedQty, 6, '.', '');
                $shortageStr = number_format($shortageQty, 6, '.', '');

                $unitCostStr = number_format((float) ($line->unit_cost ?: '0.000000'), 6, '.', '');
                $lineDispatchedTotal = bcmul($dispatchedQtyStr, $unitCostStr, 6);
                $lineReceivedTotal = bcmul($actualReceivedStr, $unitCostStr, 6);
                $lineShortageTotal = bcmul($shortageStr, $unitCostStr, 6);

                $totalDispatchedValue = bcadd($totalDispatchedValue, $lineDispatchedTotal, 6);
                $totalReceivedValue = bcadd($totalReceivedValue, $lineReceivedTotal, 6);
                $totalShortageValue = bcadd($totalShortageValue, $lineShortageTotal, 6);

                $line->received_quantity = $actualReceivedStr;
                $line->shortage_quantity = $shortageStr;
                if (! empty($receivedMap[$line->id]['shortage_reason'])) {
                    $line->shortage_reason = $receivedMap[$line->id]['shortage_reason'];
                }
                $line->save();

                // Receive actual quantity into destination warehouse
                if ($actualReceivedQty > 0) {
                    $this->costingEngine->receiveStock([
                        'tenant_id' => $tenantId,
                        'company_id' => $companyId,
                        'warehouse_id' => $destWarehouseId,
                        'product_id' => $line->product_id,
                        'quantity' => $actualReceivedStr,
                        'unit_cost' => $unitCostStr,
                        'movement_type' => 'transfer_in',
                        'reference_type' => StockTransfer::class,
                        'reference_id' => $transfer->id,
                        'date' => $date,
                        'notes' => "Transfer received from {$transfer->fromWarehouse?->name} ({$transfer->transfer_number})",
                    ]);
                }
            }

            // Post General Ledger Entries:
            // 1. Relieve Account 1350 (Goods In-Transit)
            // 2. Debit Account 1300 (Destination Inventory) for received value
            // 3. Debit Account 5260 (Transit Shortage Loss) for shortage value (if any)
            $inTransitAccount = Account::where('company_id', $companyId)->where('code', '1350')->firstOrFail();
            $destInventoryAccount = Account::where('company_id', $companyId)->where('code', '1300')->first()
                ?? Account::where('company_id', $companyId)->where('type', 'asset')->firstOrFail();

            $glLines = [];

            if ((float) $totalReceivedValue > 0) {
                $glLines[] = [
                    'account_id' => $destInventoryAccount->id,
                    'debit' => $totalReceivedValue,
                    'credit' => '0.000000',
                    'description' => "Stock Inward to {$transfer->toWarehouse?->name} - Transfer {$transfer->transfer_number}",
                ];
            }

            if ((float) $totalShortageValue > 0) {
                $lossAccount = Account::where('company_id', $companyId)->where('code', '5260')->first();
                if (! $lossAccount) {
                    $lossAccount = Account::create([
                        'tenant_id' => $tenantId,
                        'company_id' => $companyId,
                        'code' => '5260',
                        'name' => 'Loss on Transit & Shipping Damage',
                        'name_ar' => 'خسائر وعجز نقل وتلف شحن بين الفروع',
                        'type' => 'expense',
                        'subtype' => 'operating_expense',
                        'currency' => 'SAR',
                        'is_postable' => true,
                        'is_system' => false,
                        'current_balance' => '0.000000',
                    ]);
                }

                $glLines[] = [
                    'account_id' => $lossAccount->id,
                    'debit' => $totalShortageValue,
                    'credit' => '0.000000',
                    'description' => "Transit Shortage Loss - Transfer {$transfer->transfer_number}",
                ];
            }

            // Credit In-Transit Account for the full dispatched amount
            $glLines[] = [
                'account_id' => $inTransitAccount->id,
                'debit' => '0.000000',
                'credit' => $totalDispatchedValue,
                'description' => "Clear In-Transit for Transfer {$transfer->transfer_number}",
            ];

            $journalDesc = "Inter-Branch Receipt: Transfer {$transfer->transfer_number} into {$transfer->toWarehouse?->code}".
                ((float) $totalShortageValue > 0 ? " (Shortage: {$totalShortageValue} SAR)" : '');

            $journal = $this->postingEngine->post([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'date' => $date,
                'description' => $journalDesc,
                'source_type' => 'stock_transfer_receipt',
                'source_id' => $transfer->id,
                'idempotency_key' => "transfer_receipt_{$transfer->id}_".now()->timestamp,
                'lines' => $glLines,
            ]);

            $transfer->status = 'completed';
            $transfer->received_at = now();
            $transfer->received_by = $data['user_id'] ?? auth()->id();
            $transfer->shortage_value = $totalShortageValue;
            $transfer->receipt_journal_id = $journal->id;
            $transfer->save();

            AuditLogger::log(
                'inventory.stock_transfer.received',
                StockTransfer::class,
                $transfer->id,
                [
                    'transfer_number' => $transfer->transfer_number,
                    'received_value_sar' => $totalReceivedValue,
                    'shortage_value_sar' => $totalShortageValue,
                    'journal_entry_id' => $journal->id,
                ]
            );

            return $transfer->fresh(['lines.product', 'fromWarehouse', 'toWarehouse', 'receiptJournal']);
        });
    }
}
