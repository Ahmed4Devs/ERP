<?php

namespace App\Modules\Manufacturing\Actions;

use App\Modules\Inventory\Services\InventoryCostingEngine;
use App\Modules\Manufacturing\Models\ProductionOrder;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class CompleteProductionOrderAction
{
    public function __construct(
        protected InventoryCostingEngine $costingEngine
    ) {}

    /**
     * Complete a production order:
     * 1. Issues component raw materials from source warehouse via InventoryCostingEngine
     * 2. Tallies total material manufacturing cost
     * 3. Calculates unit manufacturing cost
     * 4. Receipts finished good into destination warehouse via InventoryCostingEngine
     * 5. Updates production order status and quantities
     *
     * @param array{
     *     production_order_id: string,
     *     produced_quantity?: numeric|string|null,
     *     completion_date?: string|null
     * } $data
     */
    public function execute(array $data): ProductionOrder
    {
        return DB::transaction(function () use ($data) {
            $order = ProductionOrder::with(['items.product', 'finishedProduct', 'bom'])
                ->lockForUpdate()
                ->findOrFail($data['production_order_id']);

            if ($order->status === 'completed') {
                throw new InvalidArgumentException("Production order [{$order->order_number}] is already completed.");
            }

            if ($order->status === 'cancelled') {
                throw new InvalidArgumentException("Cannot complete cancelled production order [{$order->order_number}].");
            }

            $producedQty = number_format(
                (float) ($data['produced_quantity'] ?? $order->target_quantity),
                6,
                '.',
                ''
            );

            if (bccomp($producedQty, '0.000000', 6) <= 0) {
                throw new InvalidArgumentException('Produced quantity must be greater than zero.');
            }

            $companyId = $order->company_id;
            $tenantId = $order->tenant_id;
            $sourceWarehouseId = $order->source_warehouse_id;
            $destWarehouseId = $order->destination_warehouse_id;

            $totalMaterialCost = '0.000000';

            // 1. Issue raw material components
            foreach ($order->items as $item) {
                // If consumed_quantity is already set, use it; otherwise, use planned_quantity
                $qtyToConsume = bccomp((string) $item->consumed_quantity, '0.000000', 6) > 0
                    ? (string) $item->consumed_quantity
                    : (string) $item->planned_quantity;

                $issueResult = $this->costingEngine->issueStock([
                    'tenant_id' => $tenantId,
                    'company_id' => $companyId,
                    'warehouse_id' => $sourceWarehouseId,
                    'product_id' => $item->product_id,
                    'quantity' => $qtyToConsume,
                    'movement_type' => 'production_consumption',
                    'notes' => "Consumed in Production Order [{$order->order_number}]",
                ]);

                $unitCost = (string) $issueResult['stock_movement']->unit_cost;
                $lineTotalCost = (string) $issueResult['stock_movement']->total_cost;

                $item->consumed_quantity = $qtyToConsume;
                $item->unit_cost = $unitCost;
                $item->total_cost = $lineTotalCost;
                $item->save();

                $totalMaterialCost = bcadd($totalMaterialCost, $lineTotalCost, 6);
            }

            // 2. Compute Unit Manufacturing Cost
            $unitMaterialCost = bccomp($producedQty, '0.000000', 6) > 0
                ? bcdiv($totalMaterialCost, $producedQty, 6)
                : '0.000000';

            // 3. Receive Finished Goods into Destination Warehouse
            $this->costingEngine->receiveStock([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'warehouse_id' => $destWarehouseId,
                'product_id' => $order->finished_product_id,
                'quantity' => $producedQty,
                'unit_cost' => $unitMaterialCost,
                'movement_type' => 'production_receipt',
                'notes' => "Finished product output from Production Order [{$order->order_number}]",
            ]);

            // 4. Update Order Record
            $order->status = 'completed';
            $order->produced_quantity = $producedQty;
            $order->total_material_cost = $totalMaterialCost;
            $order->unit_material_cost = $unitMaterialCost;
            $order->completion_date = $data['completion_date'] ?? now()->toDateString();
            $order->save();

            return $order->fresh(['items.product', 'finishedProduct']);
        });
    }
}
