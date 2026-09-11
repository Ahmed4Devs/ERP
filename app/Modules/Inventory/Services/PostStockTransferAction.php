<?php

namespace App\Modules\Inventory\Services;

use App\Modules\Accounting\Exceptions\PostingException;
use App\Modules\Inventory\Exceptions\InsufficientStockException;
use App\Modules\Inventory\Models\InventoryLevel;
use App\Modules\Inventory\Models\StockTransfer;
use App\Modules\Inventory\Models\StockTransferLine;
use App\Modules\Inventory\Models\Warehouse;
use App\Modules\Platform\Services\AuditLogger;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PostStockTransferAction
{
    public function __construct(
        protected InventoryCostingEngine $costingEngine
    ) {}

    /**
     * Transfer stock between warehouses within the same legal company atomically.
     *
     * @param array{
     *     from_warehouse_id: string,
     *     to_warehouse_id: string,
     *     date?: string,
     *     notes?: string|null,
     *     lines: array<int, array{
     *         product_id: string,
     *         quantity: numeric|string
     *     }>
     * } $data
     *
     * @throws PostingException
     * @throws InsufficientStockException
     */
    public function execute(array $data): StockTransfer
    {
        $currentTenant = app(CurrentTenant::class);
        $currentCompany = app(CurrentCompany::class);

        $tenantId = $currentTenant->id();
        $companyId = $currentCompany->id();

        $fromWarehouseId = $data['from_warehouse_id'] ?? null;
        $toWarehouseId = $data['to_warehouse_id'] ?? null;
        $inputLines = $data['lines'] ?? [];
        $date = $data['date'] ?? now()->toDateString();
        $notes = $data['notes'] ?? null;

        if (! $fromWarehouseId || ! $toWarehouseId) {
            throw new PostingException('Both source and destination warehouses are required.');
        }

        if ($fromWarehouseId === $toWarehouseId) {
            throw new PostingException('Source and destination warehouses cannot be the same.');
        }

        if (empty($inputLines)) {
            throw new PostingException('Stock transfer must contain at least one product line.');
        }

        $fromWarehouse = Warehouse::where('company_id', $companyId)->findOrFail($fromWarehouseId);
        $toWarehouse = Warehouse::where('company_id', $companyId)->findOrFail($toWarehouseId);

        return DB::transaction(function () use (
            $tenantId,
            $companyId,
            $fromWarehouseId,
            $toWarehouseId,
            $fromWarehouse,
            $toWarehouse,
            $date,
            $notes,
            $inputLines
        ) {
            $transferNumber = 'TRF-'.date('Ymd').'-'.strtoupper(Str::random(6));
            $totalValue = '0.000000';

            $transfer = StockTransfer::create([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'from_warehouse_id' => $fromWarehouseId,
                'to_warehouse_id' => $toWarehouseId,
                'transfer_number' => $transferNumber,
                'date' => $date,
                'status' => 'draft',
                'total_value' => '0.000000',
                'notes' => $notes,
            ]);

            foreach ($inputLines as $index => $line) {
                $productId = $line['product_id'] ?? null;
                if (! $productId) {
                    throw new PostingException("Transfer line {$index} missing product ID.");
                }

                $quantity = number_format((float) ($line['quantity'] ?? 0), 6, '.', '');
                if (bccomp($quantity, '0.000000', 6) <= 0) {
                    throw new PostingException("Transfer quantity must be greater than zero for line {$index}.");
                }

                // Retrieve current moving average cost from source warehouse
                $sourceLevel = InventoryLevel::where('company_id', $companyId)
                    ->where('warehouse_id', $fromWarehouseId)
                    ->where('product_id', $productId)
                    ->lockForUpdate()
                    ->first();

                $sourceCost = $sourceLevel ? (string) $sourceLevel->moving_average_cost : '0.000000';
                $lineTotal = bcmul($quantity, $sourceCost, 6);
                $totalValue = bcadd($totalValue, $lineTotal, 6);

                StockTransferLine::create([
                    'tenant_id' => $tenantId,
                    'company_id' => $companyId,
                    'stock_transfer_id' => $transfer->id,
                    'product_id' => $productId,
                    'quantity' => $quantity,
                    'unit_cost' => $sourceCost,
                    'line_total' => $lineTotal,
                ]);

                // 1. Issue stock from source warehouse
                $this->costingEngine->issueStock([
                    'tenant_id' => $tenantId,
                    'company_id' => $companyId,
                    'warehouse_id' => $fromWarehouseId,
                    'product_id' => $productId,
                    'quantity' => $quantity,
                    'movement_type' => 'transfer_out',
                    'reference_type' => StockTransfer::class,
                    'reference_id' => $transfer->id,
                    'date' => $date,
                    'notes' => "Transfer out to {$toWarehouse->name} ({$transferNumber})",
                ]);

                // 2. Receive stock into destination warehouse at source cost
                $this->costingEngine->receiveStock([
                    'tenant_id' => $tenantId,
                    'company_id' => $companyId,
                    'warehouse_id' => $toWarehouseId,
                    'product_id' => $productId,
                    'quantity' => $quantity,
                    'unit_cost' => $sourceCost,
                    'movement_type' => 'transfer_in',
                    'reference_type' => StockTransfer::class,
                    'reference_id' => $transfer->id,
                    'date' => $date,
                    'notes' => "Transfer in from {$fromWarehouse->name} ({$transferNumber})",
                ]);
            }

            $transfer->total_value = $totalValue;
            $transfer->status = 'posted';
            $transfer->save();

            AuditLogger::log(
                'inventory.stock_transfer.posted',
                StockTransfer::class,
                $transfer->id,
                [
                    'transfer_number' => $transferNumber,
                    'from_warehouse' => $fromWarehouse->code,
                    'to_warehouse' => $toWarehouse->code,
                    'total_value' => $totalValue,
                ]
            );

            return $transfer->load(['lines.product', 'fromWarehouse', 'toWarehouse']);
        });
    }
}
