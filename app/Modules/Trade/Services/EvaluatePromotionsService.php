<?php

namespace App\Modules\Trade\Services;

use App\Modules\Inventory\Models\Product;
use App\Modules\Trade\Models\Promotion;

class EvaluatePromotionsService
{
    public function __construct(
        protected PriceResolverService $priceResolver
    ) {}

    /**
     * Evaluate cart items against active promotions, coupon codes, and tiered price lists.
     *
     * @param array<int, array{
     *     product_id: string,
     *     quantity: numeric,
     *     unit_price?: numeric|null
     * }> $items
     * @param array{
     *     coupon_code?: string|null,
     *     price_list_id?: string|null
     * } $options
     * @return array{
     *     items: array<int, array<string, mixed>>,
     *     applied_promotions: array<int, array<string, mixed>>,
     *     subtotal: float,
     *     total_discount: float,
     *     net_total: float,
     *     tax_amount: float,
     *     grand_total: float
     * }
     */
    public function evaluate(string $companyId, array $items, array $options = []): array
    {
        $priceListId = $options['price_list_id'] ?? null;
        $couponCode = ! empty($options['coupon_code']) ? trim((string) $options['coupon_code']) : null;

        // 1. Resolve base & tiered prices for all items
        $processedItems = [];
        $subtotal = '0.000000';

        foreach ($items as $item) {
            $productId = $item['product_id'];
            $qty = (float) $item['quantity'];
            if ($qty <= 0) {
                continue;
            }

            $product = Product::withoutGlobalScopes()->find($productId);
            if (! $product) {
                continue;
            }

            // Resolve price with price list / volume tiers if not explicitly fixed
            if (isset($item['unit_price']) && (float) $item['unit_price'] > 0) {
                $unitPrice = number_format((float) $item['unit_price'], 4, '.', '');
                $tierMinQty = '1.000000';
            } else {
                $resolved = $this->priceResolver->resolve($companyId, $productId, $qty, $priceListId);
                $unitPrice = number_format((float) $resolved['unit_price'], 4, '.', '');
                $tierMinQty = $resolved['tier_min_quantity'];
            }

            $lineTotal = bcmul((string) $qty, $unitPrice, 4);
            $subtotal = bcadd($subtotal, $lineTotal, 4);

            $processedItems[] = [
                'product_id' => $productId,
                'product_sku' => $product->sku,
                'product_name' => $product->name,
                'product_name_ar' => $product->name_ar,
                'quantity' => $qty,
                'unit_price' => (float) $unitPrice,
                'tier_min_quantity' => (float) $tierMinQty,
                'line_total' => (float) $lineTotal,
                'discount_amount' => 0.0,
                'net_line_total' => (float) $lineTotal,
                'applied_promo_id' => null,
            ];
        }

        // 2. Fetch Active Promotions
        $promotions = Promotion::where('company_id', $companyId)
            ->active()
            ->where(function ($q) use ($couponCode): void {
                $q->where('apply_automatically', true);
                if ($couponCode) {
                    $q->orWhere('code', $couponCode);
                }
            })
            ->get();

        $appliedPromotions = [];
        $totalDiscount = '0.000000';

        // 3. Evaluate BOGO (Buy X Get Y) Promotions
        $bogoPromos = $promotions->where('type', 'bogo');
        foreach ($bogoPromos as $promo) {
            $buyProductIndex = null;
            foreach ($processedItems as $idx => $pItem) {
                if ($pItem['product_id'] === $promo->buy_product_id) {
                    $buyProductIndex = $idx;
                    break;
                }
            }

            if ($buyProductIndex === null) {
                continue;
            }

            $buyQtyInCart = $processedItems[$buyProductIndex]['quantity'];
            $requiredBuyQty = (float) $promo->buy_quantity;
            if ($requiredBuyQty <= 0 || $buyQtyInCart < $requiredBuyQty) {
                continue;
            }

            $setsCount = (int) floor($buyQtyInCart / $requiredBuyQty);
            $eligibleRewardQty = $setsCount * (float) $promo->get_quantity;

            // Check if get_product is in the cart
            $rewardProductIndex = null;
            $rewardProductId = $promo->get_product_id ?: $promo->buy_product_id;

            foreach ($processedItems as $idx => $pItem) {
                if ($pItem['product_id'] === $rewardProductId) {
                    $rewardProductIndex = $idx;
                    break;
                }
            }

            if ($rewardProductIndex !== null) {
                $targetItem = &$processedItems[$rewardProductIndex];
                $discountableQty = min($targetItem['quantity'], $eligibleRewardQty);

                $discountRate = bcdiv((string) $promo->get_discount_percentage, '100.0000', 4);
                $singleItemDiscount = bcmul((string) $targetItem['unit_price'], $discountRate, 4);
                $lineDiscount = bcmul((string) $discountableQty, $singleItemDiscount, 4);

                if ((float) $lineDiscount > 0) {
                    $targetItem['discount_amount'] = (float) bcadd((string) $targetItem['discount_amount'], $lineDiscount, 4);
                    $targetItem['net_line_total'] = max(0.0, (float) bcsub((string) $targetItem['line_total'], (string) $targetItem['discount_amount'], 4));
                    $targetItem['applied_promo_id'] = $promo->id;

                    $totalDiscount = bcadd($totalDiscount, $lineDiscount, 4);
                    $appliedPromotions[] = [
                        'promotion_id' => $promo->id,
                        'name' => $promo->name,
                        'name_ar' => $promo->name_ar,
                        'code' => $promo->code,
                        'type' => 'bogo',
                        'discount_amount' => (float) $lineDiscount,
                        'description' => "عرض BOGO: خصم {$promo->get_discount_percentage}% على عدد ({$discountableQty}) من {$targetItem['product_name']}",
                    ];
                }
            }
        }

        // 4. Evaluate Cart-Level Discounts (Percentage & Fixed Amount)
        $currentSubtotalAfterBogo = bcsub($subtotal, $totalDiscount, 4);

        $cartPromos = $promotions->whereIn('type', ['percentage', 'fixed_amount']);
        foreach ($cartPromos as $promo) {
            $minOrder = (float) $promo->min_order_amount;
            if ($minOrder > 0 && (float) $currentSubtotalAfterBogo < $minOrder) {
                continue;
            }

            $discountAmount = '0.0000';
            if ($promo->type === 'percentage') {
                $rate = bcdiv((string) $promo->discount_rate, '100.0000', 4);
                $discountAmount = bcmul($currentSubtotalAfterBogo, $rate, 4);
            } elseif ($promo->type === 'fixed_amount') {
                $discountAmount = min((string) $promo->fixed_discount_amount, $currentSubtotalAfterBogo);
            }

            if ((float) $discountAmount > 0) {
                $totalDiscount = bcadd($totalDiscount, $discountAmount, 4);
                $currentSubtotalAfterBogo = bcsub($currentSubtotalAfterBogo, $discountAmount, 4);

                $appliedPromotions[] = [
                    'promotion_id' => $promo->id,
                    'name' => $promo->name,
                    'name_ar' => $promo->name_ar,
                    'code' => $promo->code,
                    'type' => $promo->type,
                    'discount_amount' => (float) $discountAmount,
                    'description' => $promo->type === 'percentage'
                        ? "خصم ترويجي {$promo->discount_rate}% على السلة"
                        : "خصم نقدي مباشر {$promo->fixed_discount_amount} ريال",
                ];
            }
        }

        // 5. Compute Financial Summary
        $netTotal = max('0.0000', bcsub($subtotal, $totalDiscount, 4));
        // Standard Saudi VAT rate is 15%
        $taxAmount = bcmul($netTotal, '0.1500', 4);
        $grandTotal = bcadd($netTotal, $taxAmount, 4);

        return [
            'items' => $processedItems,
            'applied_promotions' => $appliedPromotions,
            'subtotal' => (float) $subtotal,
            'total_discount' => (float) $totalDiscount,
            'net_total' => (float) $netTotal,
            'tax_amount' => (float) $taxAmount,
            'grand_total' => (float) $grandTotal,
        ];
    }
}
