<?php

namespace App\Modules\Inventory\Services;

use App\Modules\Accounting\Exceptions\PostingException;
use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Services\PostingEngine;
use App\Modules\Inventory\Exceptions\InsufficientStockException;
use App\Modules\Inventory\Models\DeliveryNote;
use App\Modules\Inventory\Models\DeliveryNoteLine;
use App\Modules\Inventory\Models\Product;
use App\Modules\Inventory\Models\Warehouse;
use App\Modules\MasterData\Models\Party;
use App\Modules\Platform\Services\AuditLogger;
use App\Modules\Sales\Models\SalesOrder;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PostDeliveryNoteAction
{
    public function __construct(
        protected PostingEngine $postingEngine,
        protected InventoryCostingEngine $costingEngine
    ) {}

    /**
     * Create and post a Goods Delivery Note atomically with inventory relief and perpetual COGS GL.
     *
     * @param array{
     *     warehouse_id: string,
     *     customer_id: string,
     *     sales_order_id?: string|null,
     *     branch_id?: string|null,
     *     date?: string,
     *     driver_name?: string|null,
     *     vehicle_plate?: string|null,
     *     tracking_number?: string|null,
     *     recipient_name?: string|null,
     *     recipient_phone?: string|null,
     *     shipping_address?: string|null,
     *     notes?: string|null,
     *     lines: array<int, array{
     *         product_id: string,
     *         sales_order_line_id?: string|null,
     *         description?: string|null,
     *         quantity: numeric|string
     *     }>
     * } $data
     *
     * @throws PostingException|InsufficientStockException
     */
    public function execute(array $data): DeliveryNote
    {
        $currentTenant = app(CurrentTenant::class);
        $currentCompany = app(CurrentCompany::class);

        $tenantId = $currentTenant->id();
        $companyId = $currentCompany->id();

        $warehouseId = $data['warehouse_id'] ?? null;
        $customerId = $data['customer_id'] ?? null;
        $inputLines = $data['lines'] ?? [];
        $date = $data['date'] ?? now()->toDateString();
        $salesOrderId = $data['sales_order_id'] ?? null;
        $branchId = $data['branch_id'] ?? null;

        if (! $warehouseId) {
            throw new PostingException('Source warehouse is required for goods delivery note.');
        }

        if (! $customerId) {
            throw new PostingException('Customer party is required for goods delivery note.');
        }

        if (empty($inputLines)) {
            throw new PostingException('Delivery note must contain at least one product line.');
        }

        $warehouse = Warehouse::where('company_id', $companyId)->findOrFail($warehouseId);
        $customer = Party::where('tenant_id', $tenantId)->findOrFail($customerId);

        // Resolve default GL accounts for Perpetual Inventory & COGS
        $inventoryAccount = Account::where('company_id', $companyId)
            ->where(function ($q): void {
                $q->where('code', '1300')->orWhere('subtype', 'inventory');
            })
            ->first();

        if (! $inventoryAccount) {
            throw new PostingException("Merchandise Inventory control account (1300) not found for company {$companyId}.");
        }

        $cogsAccount = Account::where('company_id', $companyId)
            ->where(function ($q): void {
                $q->where('code', '5000')->orWhere('subtype', 'cost_of_goods_sold');
            })
            ->first();

        if (! $cogsAccount) {
            throw new PostingException("Cost of Goods Sold (COGS) control account (5000) not found for company {$companyId}.");
        }

        // Validate line items
        $validatedItems = [];
        foreach ($inputLines as $idx => $line) {
            $productId = $line['product_id'] ?? null;
            if (! $productId) {
                throw new PostingException("Line {$idx} is missing product ID.");
            }

            $product = Product::where('company_id', $companyId)->findOrFail($productId);
            $qty = number_format((float) ($line['quantity'] ?? 1), 6, '.', '');

            if (bccomp($qty, '0.000000', 6) <= 0) {
                throw new PostingException("Line {$idx} quantity must be greater than zero.");
            }

            $validatedItems[] = [
                'product' => $product,
                'product_id' => $product->id,
                'sales_order_line_id' => $line['sales_order_line_id'] ?? null,
                'description' => $line['description'] ?? ($product->name_ar ?: $product->name),
                'quantity' => $qty,
            ];
        }

        return DB::transaction(function () use (
            $tenantId,
            $companyId,
            $warehouseId,
            $customerId,
            $salesOrderId,
            $branchId,
            $date,
            $data,
            $validatedItems,
            $inventoryAccount,
            $cogsAccount
        ) {
            $deliveryNumber = 'DN-'.date('Ymd').'-'.strtoupper(Str::random(6));

            $deliveryNote = DeliveryNote::create([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'branch_id' => $branchId,
                'warehouse_id' => $warehouseId,
                'customer_id' => $customerId,
                'sales_order_id' => $salesOrderId,
                'delivery_number' => $deliveryNumber,
                'date' => $date,
                'status' => 'dispatched',
                'driver_name' => $data['driver_name'] ?? null,
                'vehicle_plate' => $data['vehicle_plate'] ?? null,
                'tracking_number' => $data['tracking_number'] ?? null,
                'recipient_name' => $data['recipient_name'] ?? null,
                'recipient_phone' => $data['recipient_phone'] ?? null,
                'shipping_address' => $data['shipping_address'] ?? null,
                'notes' => $data['notes'] ?? null,
                'total_cost' => '0.000000',
            ]);

            $totalDeliveryCost = '0.000000';
            $createdLines = [];

            // Relieve inventory atomically for each item using moving-average costing
            foreach ($validatedItems as $item) {
                $issueResult = $this->costingEngine->issueStock([
                    'tenant_id' => $tenantId,
                    'company_id' => $companyId,
                    'warehouse_id' => $warehouseId,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'movement_type' => 'delivery',
                    'reference_type' => DeliveryNote::class,
                    'reference_id' => $deliveryNote->id,
                    'date' => $date,
                    'notes' => "Delivery Note {$deliveryNumber}: {$item['description']}",
                ]);

                $unitCost = (string) $issueResult['stock_movement']->unit_cost;
                $lineTotalCost = (string) $issueResult['stock_movement']->total_cost;
                $totalDeliveryCost = bcadd($totalDeliveryCost, $lineTotalCost, 6);

                $line = DeliveryNoteLine::create([
                    'tenant_id' => $tenantId,
                    'company_id' => $companyId,
                    'delivery_note_id' => $deliveryNote->id,
                    'product_id' => $item['product_id'],
                    'sales_order_line_id' => $item['sales_order_line_id'],
                    'description' => $item['description'],
                    'quantity' => $item['quantity'],
                    'unit_cost' => $unitCost,
                    'total_cost' => $lineTotalCost,
                ]);

                $createdLines[] = $line;
            }

            $deliveryNote->total_cost = $totalDeliveryCost;
            $deliveryNote->save();

            // Post perpetual double-entry GL entry if total cost > 0
            if (bccomp($totalDeliveryCost, '0.000000', 6) > 0) {
                $glLines = [
                    // DR: Cost of Goods Sold (5000)
                    [
                        'account_id' => $cogsAccount->id,
                        'debit' => $totalDeliveryCost,
                        'credit' => '0.000000',
                        'description' => "Cost of Goods Sold - Delivery {$deliveryNumber}",
                    ],
                    // CR: Merchandise Inventory (1300)
                    [
                        'account_id' => $inventoryAccount->id,
                        'debit' => '0.000000',
                        'credit' => $totalDeliveryCost,
                        'description' => "Inventory Relief - Delivery {$deliveryNumber}",
                    ],
                ];

                $journalEntry = $this->postingEngine->post([
                    'tenant_id' => $tenantId,
                    'company_id' => $companyId,
                    'date' => $date,
                    'description' => "Goods Delivery {$deliveryNumber}",
                    'source_type' => DeliveryNote::class,
                    'source_id' => $deliveryNote->id,
                    'lines' => $glLines,
                ]);

                $deliveryNote->journal_entry_id = $journalEntry->id;
                $deliveryNote->save();
            }

            // If linked to SalesOrder, update status
            if ($salesOrderId) {
                $order = SalesOrder::with(['lines'])->find($salesOrderId);
                if ($order && in_array($order->status, ['draft', 'confirmed', 'delivering'])) {
                    $order->status = 'delivering';
                    $order->save();
                }
            }

            AuditLogger::log(
                'inventory.delivery_note.posted',
                DeliveryNote::class,
                $deliveryNote->id,
                [
                    'delivery_number' => $deliveryNumber,
                    'total_cost' => $totalDeliveryCost,
                    'warehouse_id' => $warehouseId,
                    'customer_id' => $customerId,
                    'sales_order_id' => $salesOrderId,
                ]
            );

            return $deliveryNote->load([
                'warehouse',
                'customer',
                'salesOrder',
                'lines.product',
                'journalEntry.lines.account',
            ]);
        });
    }
}
