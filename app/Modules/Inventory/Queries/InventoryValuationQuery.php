<?php

namespace App\Modules\Inventory\Queries;

use App\Modules\Accounting\Models\Account;
use App\Modules\Inventory\Models\InventoryLevel;
use App\Shared\Context\CurrentCompany;

class InventoryValuationQuery
{
    /**
     * Retrieve inventory valuation subledger report with GL Account 1300 reconciliation.
     *
     * @param array{
     *     warehouse_id?: string|null,
     *     category_id?: string|null,
     *     search?: string|null
     * } $filters
     * @return array{
     *     items: array<int, array{
     *         product_id: string,
     *         sku: string,
     *         name: string,
     *         name_ar: string|null,
     *         category_name: string|null,
     *         unit_code: string|null,
     *         warehouse_id: string,
     *         warehouse_name: string,
     *         warehouse_code: string,
     *         quantity_on_hand: string,
     *         quantity_reserved: string,
     *         quantity_available: string,
     *         moving_average_cost: string,
     *         total_value: string
     *     }>,
     *     total_valuation: string,
     *     total_items_count: int,
     *     gl_inventory_balance: string,
     *     valuation_variance: string
     * }
     */
    public function execute(array $filters = []): array
    {
        $companyId = app(CurrentCompany::class)->id();

        $query = InventoryLevel::where('inventory_levels.company_id', $companyId)
            ->join('products', 'inventory_levels.product_id', '=', 'products.id')
            ->join('warehouses', 'inventory_levels.warehouse_id', '=', 'warehouses.id')
            ->leftJoin('product_categories', 'products.category_id', '=', 'product_categories.id')
            ->leftJoin('units_of_measure', 'products.unit_id', '=', 'units_of_measure.id')
            ->select([
                'inventory_levels.product_id',
                'inventory_levels.warehouse_id',
                'inventory_levels.quantity_on_hand',
                'inventory_levels.quantity_reserved',
                'inventory_levels.quantity_available',
                'inventory_levels.moving_average_cost',
                'inventory_levels.total_value',
                'products.sku',
                'products.name as product_name',
                'products.name_ar as product_name_ar',
                'warehouses.code as warehouse_code',
                'warehouses.name as warehouse_name',
                'product_categories.name as category_name',
                'units_of_measure.code as unit_code',
            ]);

        if (! empty($filters['warehouse_id'])) {
            $query->where('inventory_levels.warehouse_id', $filters['warehouse_id']);
        }

        if (! empty($filters['category_id'])) {
            $query->where('products.category_id', $filters['category_id']);
        }

        if (! empty($filters['search'])) {
            $term = '%'.$filters['search'].'%';
            $query->where(function ($q) use ($term): void {
                $q->where('products.sku', 'ilike', $term)
                    ->orWhere('products.name', 'ilike', $term)
                    ->orWhere('products.name_ar', 'ilike', $term);
            });
        }

        $records = $query->orderBy('products.sku')->get();

        $totalValuation = '0.000000';
        $items = [];

        foreach ($records as $r) {
            $val = number_format((float) $r->total_value, 6, '.', '');
            $totalValuation = bcadd($totalValuation, $val, 6);

            $items[] = [
                'product_id' => $r->product_id,
                'sku' => $r->sku,
                'name' => $r->product_name,
                'name_ar' => $r->product_name_ar,
                'category_name' => $r->category_name,
                'unit_code' => $r->unit_code,
                'warehouse_id' => $r->warehouse_id,
                'warehouse_name' => $r->warehouse_name,
                'warehouse_code' => $r->warehouse_code,
                'quantity_on_hand' => number_format((float) $r->quantity_on_hand, 6, '.', ''),
                'quantity_reserved' => number_format((float) $r->quantity_reserved, 6, '.', ''),
                'quantity_available' => number_format((float) $r->quantity_available, 6, '.', ''),
                'moving_average_cost' => number_format((float) $r->moving_average_cost, 6, '.', ''),
                'total_value' => $val,
            ];
        }

        // Retrieve GL Inventory Account 1300 balance
        $invAccount = Account::where('company_id', $companyId)
            ->where(function ($q): void {
                $q->where('code', '1300')->orWhere('subtype', 'inventory');
            })
            ->first();

        $glBalance = $invAccount ? number_format((float) $invAccount->current_balance, 6, '.', '') : '0.000000';
        $variance = bcsub($totalValuation, $glBalance, 6);

        return [
            'items' => $items,
            'total_valuation' => $totalValuation,
            'total_items_count' => count($items),
            'gl_inventory_balance' => $glBalance,
            'valuation_variance' => $variance,
        ];
    }
}
