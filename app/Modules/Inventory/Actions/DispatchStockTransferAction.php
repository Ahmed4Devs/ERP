<?php

namespace App\Modules\Inventory\Actions;

use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Services\PostingEngine;
use App\Modules\Inventory\Models\InventoryLevel;
use App\Modules\Inventory\Models\StockTransfer;
use App\Modules\Inventory\Services\InventoryCostingEngine;
use App\Modules\Platform\Services\AuditLogger;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class DispatchStockTransferAction
{
    public function __construct(
        protected InventoryCostingEngine $costingEngine,
        protected PostingEngine $postingEngine
    ) {}

    /**
     * Dispatch an internal stock transfer:
     * - Relieve inventory from source warehouse
     * - Put transfer into 'in_transit' status with driver & tracking info
     * - Post In-Transit General Ledger entry:
     *   DR 1350 (Goods In-Transit / بضاعة بالطريق)
     *   CR 1300 (Source Warehouse Inventory Asset / مخزون البضاعة)
     *
     * @param array{
     *     transfer_id: string,
     *     driver_name?: string|null,
     *     vehicle_plate?: string|null,
     *     tracking_number?: string|null,
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

            if ($transfer->status !== 'draft' && $transfer->status !== 'requested') {
                throw new InvalidArgumentException("Transfer [{$transfer->transfer_number}] cannot be dispatched from status [{$transfer->status}].");
            }

            $companyId = $transfer->company_id;
            $tenantId = $transfer->tenant_id;
            $sourceWarehouseId = $transfer->from_warehouse_id;
            $date = now()->toDateString();
            $totalDispatchedValue = '0.000000';

            foreach ($transfer->lines as $line) {
                $qty = (float) $line->quantity;
                if ($qty <= 0) {
                    continue;
                }

                $qtyStr = number_format($qty, 6, '.', '');

                // Verify and lock source warehouse inventory level
                $sourceLevel = InventoryLevel::where('warehouse_id', $sourceWarehouseId)
                    ->where('product_id', $line->product_id)
                    ->lockForUpdate()
                    ->first();

                $available = $sourceLevel ? (float) $sourceLevel->quantity_on_hand : 0.0;
                if ($available < $qty) {
                    throw new InvalidArgumentException("Insufficient stock in source warehouse for product [{$line->product?->sku}]. Requested: {$qty}, Available: {$available}");
                }

                $sourceCost = $sourceLevel ? (string) ($sourceLevel->moving_average_cost ?: '0.000000') : '0.000000';
                $lineTotal = bcmul($qtyStr, $sourceCost, 6);
                $totalDispatchedValue = bcadd($totalDispatchedValue, $lineTotal, 6);

                $line->unit_cost = $sourceCost;
                $line->line_total = $lineTotal;
                $line->dispatched_quantity = $qtyStr;
                $line->save();

                // Issue stock from source warehouse
                $this->costingEngine->issueStock([
                    'tenant_id' => $tenantId,
                    'company_id' => $companyId,
                    'warehouse_id' => $sourceWarehouseId,
                    'product_id' => $line->product_id,
                    'quantity' => $qtyStr,
                    'movement_type' => 'transfer_out',
                    'reference_type' => StockTransfer::class,
                    'reference_id' => $transfer->id,
                    'date' => $date,
                    'notes' => "Dispatched to {$transfer->toWarehouse?->name} ({$transfer->transfer_number})",
                ]);
            }

            // Post Double-Entry In-Transit GL Journal Entry:
            // DR 1350 (Goods In-Transit / بضاعة بالطريق)
            // CR 1300 (Inventory Asset / مخزون البضاعة)
            $inTransitAccount = Account::where('company_id', $companyId)->where('code', '1350')->first();
            if (! $inTransitAccount) {
                $inTransitAccount = Account::create([
                    'tenant_id' => $tenantId,
                    'company_id' => $companyId,
                    'code' => '1350',
                    'name' => 'Goods In-Transit',
                    'name_ar' => 'بضاعة بالطريق بين الفروع والمستودعات',
                    'type' => 'asset',
                    'subtype' => 'current_asset',
                    'currency' => 'SAR',
                    'is_postable' => true,
                    'is_system' => false,
                    'current_balance' => '0.000000',
                ]);
            }

            $inventoryAccount = Account::where('company_id', $companyId)->where('code', '1300')->first()
                ?? Account::where('company_id', $companyId)->where('type', 'asset')->firstOrFail();

            $journalDesc = "Inter-Branch In-Transit: Transfer {$transfer->transfer_number} from {$transfer->fromWarehouse?->code} to {$transfer->toWarehouse?->code}";

            $glLines = [
                [
                    'account_id' => $inTransitAccount->id,
                    'debit' => $totalDispatchedValue,
                    'credit' => '0.000000',
                    'description' => $journalDesc,
                ],
                [
                    'account_id' => $inventoryAccount->id,
                    'debit' => '0.000000',
                    'credit' => $totalDispatchedValue,
                    'description' => "Stock Relief from {$transfer->fromWarehouse?->name} - {$transfer->transfer_number}",
                ],
            ];

            $journal = $this->postingEngine->post([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'date' => $date,
                'description' => $journalDesc,
                'source_type' => 'stock_transfer_dispatch',
                'source_id' => $transfer->id,
                'idempotency_key' => "transfer_dispatch_{$transfer->id}_".now()->timestamp,
                'lines' => $glLines,
            ]);

            $transfer->status = 'in_transit';
            $transfer->total_value = $totalDispatchedValue;
            $transfer->dispatched_at = now();
            $transfer->dispatched_by = $data['user_id'] ?? auth()->id();
            $transfer->driver_name = $data['driver_name'] ?? null;
            $transfer->vehicle_plate = $data['vehicle_plate'] ?? null;
            $transfer->tracking_number = $data['tracking_number'] ?? null;
            $transfer->in_transit_journal_id = $journal->id;
            $transfer->save();

            AuditLogger::log(
                'inventory.stock_transfer.dispatched',
                StockTransfer::class,
                $transfer->id,
                [
                    'transfer_number' => $transfer->transfer_number,
                    'from' => $transfer->fromWarehouse?->code,
                    'to' => $transfer->toWarehouse?->code,
                    'total_value_sar' => $totalDispatchedValue,
                    'driver' => $transfer->driver_name,
                    'journal_entry_id' => $journal->id,
                ]
            );

            return $transfer->fresh(['lines.product', 'fromWarehouse', 'toWarehouse', 'inTransitJournal']);
        });
    }
}
