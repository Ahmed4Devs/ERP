<?php

namespace App\Modules\Sales\Services;

use App\Modules\Accounting\Models\ServiceInvoice;
use App\Modules\Accounting\Services\PostServiceInvoiceAction;
use App\Modules\Sales\Models\SalesOrder;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class ConvertSalesOrderToInvoiceAction
{
    public function __construct(
        protected PostServiceInvoiceAction $postServiceInvoiceAction,
        protected CustomerCreditService $creditService
    ) {}

    /**
     * Convert a Sales Order to a posted ZATCA Tax Invoice atomically.
     */
    public function execute(SalesOrder $order, bool $ignoreCreditLimit = false): ServiceInvoice
    {
        if ($order->invoicing_status === 'fully_billed') {
            throw new InvalidArgumentException("Sales Order {$order->order_number} is already fully billed.");
        }

        $order->loadMissing(['customer', 'lines']);
        $customer = $order->customer;

        if (! $customer) {
            throw new InvalidArgumentException("Sales Order {$order->order_number} has no valid customer assigned.");
        }

        // Check Customer Credit Limit
        if (! $ignoreCreditLimit) {
            $creditCheck = $this->creditService->checkCreditLimit($customer, $order->company_id, (float) $order->total_amount);
            if ($creditCheck['is_exceeded']) {
                $limitFormatted = number_format($creditCheck['credit_limit'], 2);
                $projectedFormatted = number_format($creditCheck['projected_balance'], 2);
                throw new InvalidArgumentException("Customer credit limit exceeded. Limit: {$limitFormatted} SAR, Projected Balance: {$projectedFormatted} SAR.");
            }
        }

        return DB::transaction(function () use ($order): ServiceInvoice {
            $lines = [];
            foreach ($order->lines as $line) {
                $lines[] = [
                    'description' => $line->description ?: 'Sales Order Item',
                    'quantity' => (string) $line->quantity,
                    'unit_price' => (string) $line->unit_price,
                ];
            }

            if (empty($lines)) {
                throw new InvalidArgumentException("Sales Order {$order->order_number} has no item lines to bill.");
            }

            $date = now()->toDateString();
            $dueDate = $order->delivery_date ? $order->delivery_date->toDateString() : now()->addDays(30)->toDateString();

            $invoice = $this->postServiceInvoiceAction->execute([
                'party_id' => $order->customer_id,
                'date' => $date,
                'due_date' => $dueDate,
                'notes' => "Converted from Sales Order {$order->order_number}.".($order->notes ? "\n".$order->notes : ''),
                'lines' => $lines,
            ]);

            $invoice->update(['sales_order_id' => $order->id]);
            $order->update([
                'invoicing_status' => 'fully_billed',
                'status' => in_array($order->status, ['draft', 'confirmed'], true) ? 'completed' : $order->status,
            ]);

            return $invoice;
        });
    }
}
