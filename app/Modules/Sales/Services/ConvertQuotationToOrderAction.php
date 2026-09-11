<?php

namespace App\Modules\Sales\Services;

use App\Modules\Sales\Models\SalesOrder;
use App\Modules\Sales\Models\SalesOrderLine;
use App\Modules\Sales\Models\SalesQuotation;
use Illuminate\Support\Facades\DB;

class ConvertQuotationToOrderAction
{
    /**
     * Convert an accepted or valid Sales Quotation into a confirmed Sales Order.
     */
    public function execute(SalesQuotation $quotation, ?string $deliveryDate = null): SalesOrder
    {
        return DB::transaction(function () use ($quotation, $deliveryDate) {
            $orderNumber = 'SO-'.date('Ymd').'-'.strtoupper(substr(uniqid(), -4));

            $salesOrder = SalesOrder::create([
                'tenant_id' => $quotation->tenant_id,
                'company_id' => $quotation->company_id,
                'order_number' => $orderNumber,
                'quotation_id' => $quotation->id,
                'customer_id' => $quotation->customer_id,
                'order_date' => now()->toDateString(),
                'delivery_date' => $deliveryDate ?? now()->addDays(14)->toDateString(),
                'subtotal' => $quotation->subtotal,
                'tax_rate' => $quotation->tax_rate,
                'tax_amount' => $quotation->tax_amount,
                'discount_amount' => $quotation->discount_amount,
                'total_amount' => $quotation->total_amount,
                'status' => 'confirmed',
                'invoicing_status' => 'unbilled',
                'notes' => 'Generated automatically from Sales Quotation: '.$quotation->quote_number,
            ]);

            $quotation->loadMissing('lines');

            foreach ($quotation->lines as $quoteLine) {
                SalesOrderLine::create([
                    'tenant_id' => $quotation->tenant_id,
                    'company_id' => $quotation->company_id,
                    'sales_order_id' => $salesOrder->id,
                    'product_id' => $quoteLine->product_id,
                    'description' => $quoteLine->description,
                    'quantity' => $quoteLine->quantity,
                    'unit_price' => $quoteLine->unit_price,
                    'tax_amount' => $quoteLine->tax_amount,
                    'line_total' => $quoteLine->line_total,
                ]);
            }

            $quotation->status = 'converted';
            $quotation->save();

            return $salesOrder;
        });
    }
}
