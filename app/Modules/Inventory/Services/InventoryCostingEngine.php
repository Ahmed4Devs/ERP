<?php

namespace App\Modules\Inventory\Services;

use App\Modules\Inventory\Exceptions\InsufficientStockException;
use App\Modules\Inventory\Models\InventoryLevel;
use App\Modules\Inventory\Models\Product;
use App\Modules\Inventory\Models\StockMovement;
use App\Modules\Inventory\Models\Warehouse;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Support\Str;

class InventoryCostingEngine
{
    /**
     * Receive stock into a warehouse and atomically recalculate moving weighted-average cost.
     * Formula: C_new = (V_old + Q_in * C_in) / (Q_old + Q_in)
     *
     * @param array{
     *     company_id?: string|null,
     *     tenant_id?: string|null,
     *     warehouse_id: string,
     *     product_id: string,
     *     quantity: numeric|string,
     *     unit_cost: numeric|string,
     *     movement_type?: string,
     *     direction?: string,
     *     reference_type?: string|null,
     *     reference_id?: string|null,
     *     journal_entry_id?: string|null,
     *     date?: string,
     *     notes?: string|null
     * } $params
     * @return array{inventory_level: InventoryLevel, stock_movement: StockMovement}
     */
    public function receiveStock(array $params): array
    {
        $tenantId = $params['tenant_id'] ?? app(CurrentTenant::class)->id();
        $companyId = $params['company_id'] ?? app(CurrentCompany::class)->id();
        $warehouseId = $params['warehouse_id'];
        $productId = $params['product_id'];

        $quantityIn = number_format((float) $params['quantity'], 6, '.', '');
        $unitCostIn = number_format((float) $params['unit_cost'], 6, '.', '');
        $valueIn = bcmul($quantityIn, $unitCostIn, 6);

        if (bccomp($quantityIn, '0.000000', 6) <= 0) {
            throw new \InvalidArgumentException('Receipt quantity must be greater than zero.');
        }

        // Lock inventory level record for update
        $level = InventoryLevel::withoutGlobalScopes()
            ->where('company_id', $companyId)
            ->where('warehouse_id', $warehouseId)
            ->where('product_id', $productId)
            ->lockForUpdate()
            ->first();

        if (! $level) {
            $level = new InventoryLevel([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'warehouse_id' => $warehouseId,
                'product_id' => $productId,
                'quantity_on_hand' => '0.000000',
                'quantity_reserved' => '0.000000',
                'quantity_available' => '0.000000',
                'moving_average_cost' => '0.000000',
                'total_value' => '0.000000',
                'reorder_point' => '0.000000',
            ]);
        }

        $qtyOld = number_format((float) $level->quantity_on_hand, 6, '.', '');
        $costOld = number_format((float) $level->moving_average_cost, 6, '.', '');
        $valOld = bcmul($qtyOld, $costOld, 6);

        $qtyNew = bcadd($qtyOld, $quantityIn, 6);
        $valNew = bcadd($valOld, $valueIn, 6);

        // Calculate new weighted-average unit cost
        $costNew = bccomp($qtyNew, '0.000000', 6) > 0
            ? bcdiv($valNew, $qtyNew, 6)
            : $unitCostIn;

        $level->quantity_on_hand = $qtyNew;
        $level->quantity_available = bcsub($qtyNew, (string) $level->quantity_reserved, 6);
        $level->moving_average_cost = $costNew;
        $level->total_value = $valNew;
        $level->save();

        // Update product master moving average cost
        $product = Product::withoutGlobalScopes()->find($productId);
        if ($product) {
            $product->moving_average_cost = $costNew;
            $product->save();
        }

        // Generate stock movement entry
        $movementNumber = 'SM-IN-'.date('Ymd').'-'.strtoupper(Str::random(6));
        $movement = StockMovement::create([
            'tenant_id' => $tenantId,
            'company_id' => $companyId,
            'warehouse_id' => $warehouseId,
            'product_id' => $productId,
            'journal_entry_id' => $params['journal_entry_id'] ?? null,
            'movement_number' => $movementNumber,
            'movement_type' => $params['movement_type'] ?? 'receipt',
            'direction' => 'in',
            'quantity' => $quantityIn,
            'unit_cost' => $unitCostIn,
            'total_cost' => $valueIn,
            'pre_movement_qty' => $qtyOld,
            'post_movement_qty' => $qtyNew,
            'pre_movement_avg_cost' => $costOld,
            'post_movement_avg_cost' => $costNew,
            'reference_type' => $params['reference_type'] ?? null,
            'reference_id' => $params['reference_id'] ?? null,
            'date' => $params['date'] ?? now()->toDateString(),
            'notes' => $params['notes'] ?? null,
        ]);

        return [
            'inventory_level' => $level,
            'stock_movement' => $movement,
        ];
    }

    /**
     * Issue stock from a warehouse at existing moving average cost without mutating unit cost.
     * Prevents negative stock by throwing InsufficientStockException.
     *
     * @param array{
     *     company_id?: string|null,
     *     tenant_id?: string|null,
     *     warehouse_id: string,
     *     product_id: string,
     *     quantity: numeric|string,
     *     movement_type?: string,
     *     reference_type?: string|null,
     *     reference_id?: string|null,
     *     journal_entry_id?: string|null,
     *     date?: string,
     *     notes?: string|null
     * } $params
     * @return array{inventory_level: InventoryLevel, stock_movement: StockMovement}
     *
     * @throws InsufficientStockException
     */
    public function issueStock(array $params): array
    {
        $tenantId = $params['tenant_id'] ?? app(CurrentTenant::class)->id();
        $companyId = $params['company_id'] ?? app(CurrentCompany::class)->id();
        $warehouseId = $params['warehouse_id'];
        $productId = $params['product_id'];

        $quantityOut = number_format((float) $params['quantity'], 6, '.', '');

        if (bccomp($quantityOut, '0.000000', 6) <= 0) {
            throw new \InvalidArgumentException('Issue quantity must be greater than zero.');
        }

        // Lock inventory level record for update
        $level = InventoryLevel::withoutGlobalScopes()
            ->where('company_id', $companyId)
            ->where('warehouse_id', $warehouseId)
            ->where('product_id', $productId)
            ->lockForUpdate()
            ->first();

        $qtyOnHand = $level ? (string) $level->quantity_on_hand : '0.000000';

        if (! $level || bccomp($qtyOnHand, $quantityOut, 6) < 0) {
            $product = Product::withoutGlobalScopes()->find($productId);
            $sku = $product ? $product->sku : $productId;
            $warehouse = Warehouse::withoutGlobalScopes()->find($warehouseId);
            $whCode = $warehouse ? $warehouse->code : $warehouseId;

            throw new InsufficientStockException(
                "Insufficient stock for product [{$sku}] in warehouse [{$whCode}]. Available: {$qtyOnHand}, Requested: {$quantityOut}"
            );
        }

        $qtyOld = $qtyOnHand;
        $costOld = number_format((float) $level->moving_average_cost, 6, '.', '');
        $qtyNew = bcsub($qtyOld, $quantityOut, 6);
        $valOut = bcmul($quantityOut, $costOld, 6);
        $valNew = bcmul($qtyNew, $costOld, 6);

        $level->quantity_on_hand = $qtyNew;
        $level->quantity_available = bcsub($qtyNew, (string) $level->quantity_reserved, 6);
        $level->total_value = $valNew;
        // On issue, unit moving average cost remains unchanged
        $level->save();

        // Generate stock movement entry
        $movementNumber = 'SM-OUT-'.date('Ymd').'-'.strtoupper(Str::random(6));
        $movement = StockMovement::create([
            'tenant_id' => $tenantId,
            'company_id' => $companyId,
            'warehouse_id' => $warehouseId,
            'product_id' => $productId,
            'journal_entry_id' => $params['journal_entry_id'] ?? null,
            'movement_number' => $movementNumber,
            'movement_type' => $params['movement_type'] ?? 'issue',
            'direction' => 'out',
            'quantity' => $quantityOut,
            'unit_cost' => $costOld,
            'total_cost' => $valOut,
            'pre_movement_qty' => $qtyOld,
            'post_movement_qty' => $qtyNew,
            'pre_movement_avg_cost' => $costOld,
            'post_movement_avg_cost' => $costOld,
            'reference_type' => $params['reference_type'] ?? null,
            'reference_id' => $params['reference_id'] ?? null,
            'date' => $params['date'] ?? now()->toDateString(),
            'notes' => $params['notes'] ?? null,
        ]);

        return [
            'inventory_level' => $level,
            'stock_movement' => $movement,
        ];
    }
}
