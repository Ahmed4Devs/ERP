<?php

namespace App\Modules\Trade\Services;

use App\Modules\Inventory\Models\Product;
use App\Modules\Trade\Models\PriceList;
use App\Modules\Trade\Models\PriceListItem;

class PriceResolverService
{
    /**
     * Resolve the effective unit price for a product, customer tier, and order quantity.
     *
     * @return array{
     *     unit_price: string,
     *     base_price: string,
     *     discount_percentage: string,
     *     tier_min_quantity: string,
     *     source: 'price_list'|'product_list_price',
     *     price_list_id: string|null
     * }
     */
    public function resolve(string $companyId, string $productId, float|int|string $quantity, ?string $priceListId = null): array
    {
        $qty = number_format((float) $quantity, 6, '.', '');

        // 1. Locate price list (explicit or default active)
        $priceListQuery = PriceList::where('company_id', $companyId)->where('is_active', true);

        if ($priceListId) {
            $priceList = $priceListQuery->where('id', $priceListId)->first();
        } else {
            $priceList = $priceListQuery->where('is_default', true)->first();
        }

        if ($priceList) {
            // Find tier matching product and min_quantity <= requested quantity (highest qualifying tier)
            $tierItem = PriceListItem::where('price_list_id', $priceList->id)
                ->where('product_id', $productId)
                ->where('min_quantity', '<=', $qty)
                ->orderBy('min_quantity', 'desc')
                ->first();

            if ($tierItem) {
                $basePrice = number_format((float) $tierItem->price, 6, '.', '');
                $discountPct = number_format((float) $tierItem->discount_percentage, 4, '.', '');

                $discountFactor = bcdiv($discountPct, '100.0000', 6);
                $discountAmount = bcmul($basePrice, $discountFactor, 6);
                $effectivePrice = bcsub($basePrice, $discountAmount, 6);

                return [
                    'unit_price' => $effectivePrice,
                    'base_price' => $basePrice,
                    'discount_percentage' => $discountPct,
                    'tier_min_quantity' => (string) $tierItem->min_quantity,
                    'source' => 'price_list',
                    'price_list_id' => $priceList->id,
                ];
            }
        }

        // Fallback to Product list_price
        $product = Product::withoutGlobalScopes()->findOrFail($productId);
        $listPrice = number_format((float) ($product->list_price ?? 0), 6, '.', '');

        return [
            'unit_price' => $listPrice,
            'base_price' => $listPrice,
            'discount_percentage' => '0.0000',
            'tier_min_quantity' => '1.000000',
            'source' => 'product_list_price',
            'price_list_id' => null,
        ];
    }
}
