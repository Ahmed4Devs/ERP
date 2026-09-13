<?php

namespace App\Modules\Inventory\Services;

use App\Modules\Inventory\Models\BatchTransaction;
use App\Modules\Inventory\Models\Product;
use App\Modules\Inventory\Models\ProductBatch;
use App\Modules\Inventory\Models\ProductSerial;
use App\Modules\Inventory\Models\SerialTransaction;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class BatchTrackingService
{
    /**
     * Register a new or existing batch receipt.
     */
    public function registerBatch(array $data): ProductBatch
    {
        return DB::transaction(function () use ($data) {
            $product = Product::findOrFail($data['product_id']);

            $manufactureDate = ! empty($data['manufacture_date']) ? Carbon::parse($data['manufacture_date']) : null;
            $expiryDate = ! empty($data['expiry_date']) ? Carbon::parse($data['expiry_date']) : null;

            // Auto-calculate expiry if shelf life is set on product and manufacture date is known
            if (! $expiryDate && $manufactureDate && $product->shelf_life_days) {
                $expiryDate = $manufactureDate->copy()->addDays($product->shelf_life_days);
            }

            $batch = ProductBatch::firstOrNew([
                'company_id' => $data['company_id'],
                'product_id' => $data['product_id'],
                'batch_number' => $data['batch_number'],
            ]);

            $qty = (float) ($data['quantity'] ?? 0);

            if ($batch->exists) {
                $batch->received_qty = (float) $batch->received_qty + $qty;
                $batch->current_qty = (float) $batch->current_qty + $qty;
                $batch->warehouse_id = $data['warehouse_id'];
                if ($expiryDate) {
                    $batch->expiry_date = $expiryDate;
                }
                if ($manufactureDate) {
                    $batch->manufacture_date = $manufactureDate;
                }
                if (! empty($data['supplier_batch_number'])) {
                    $batch->supplier_batch_number = $data['supplier_batch_number'];
                }
                if ($batch->current_qty > 0 && $batch->status === 'depleted') {
                    $batch->status = 'active';
                }
                $batch->save();
            } else {
                $batch->fill([
                    'tenant_id' => $data['tenant_id'],
                    'company_id' => $data['company_id'],
                    'product_id' => $data['product_id'],
                    'warehouse_id' => $data['warehouse_id'],
                    'batch_number' => $data['batch_number'],
                    'supplier_batch_number' => $data['supplier_batch_number'] ?? null,
                    'manufacture_date' => $manufactureDate,
                    'expiry_date' => $expiryDate,
                    'received_qty' => $qty,
                    'current_qty' => $qty,
                    'reserved_qty' => 0,
                    'unit_cost' => $data['unit_cost'] ?? $product->moving_average_cost ?? 0,
                    'status' => 'active',
                    'notes' => $data['notes'] ?? null,
                ]);
                $batch->save();
            }

            if ($qty > 0) {
                BatchTransaction::create([
                    'tenant_id' => $data['tenant_id'],
                    'company_id' => $data['company_id'],
                    'batch_id' => $batch->id,
                    'product_id' => $batch->product_id,
                    'warehouse_id' => $batch->warehouse_id,
                    'transaction_type' => $data['transaction_type'] ?? 'receipt',
                    'direction' => 'in',
                    'quantity' => $qty,
                    'reference_type' => $data['reference_type'] ?? null,
                    'reference_id' => $data['reference_id'] ?? null,
                    'transaction_date' => $data['date'] ?? now()->toDateString(),
                    'notes' => $data['notes'] ?? 'Batch initial receipt / addition',
                ]);
            }

            return $batch;
        });
    }

    /**
     * Recommend batches according to FEFO (First-Expired, First-Out).
     */
    public function recommendBatchesForDispatch(string $productId, string $warehouseId, float $requestedQty): array
    {
        // Earliest expiry date first, null expiry last, then oldest batch
        $batches = ProductBatch::where('product_id', $productId)
            ->where('warehouse_id', $warehouseId)
            ->where('current_qty', '>', 0)
            ->where('status', 'active')
            ->orderByRaw('expiry_date ASC NULLS LAST')
            ->orderBy('created_at', 'asc')
            ->get();

        $allocations = [];
        $remainingNeeded = $requestedQty;
        $totalAllocated = 0.0;
        $hasExpiredBatches = false;

        foreach ($batches as $batch) {
            if ($remainingNeeded <= 0) {
                break;
            }

            $available = (float) $batch->current_qty;
            $allocate = min($available, $remainingNeeded);

            $isExpired = $batch->isExpired();
            if ($isExpired) {
                $hasExpiredBatches = true;
            }

            $allocations[] = [
                'batch_id' => $batch->id,
                'batch_number' => $batch->batch_number,
                'expiry_date' => $batch->expiry_date?->toDateString(),
                'days_to_expiry' => $batch->days_until_expiry,
                'is_expired' => $isExpired,
                'available_qty' => $available,
                'allocated_qty' => $allocate,
                'remaining_batch_qty' => $available - $allocate,
                'unit_cost' => (float) $batch->unit_cost,
            ];

            $totalAllocated += $allocate;
            $remainingNeeded -= $allocate;
        }

        return [
            'product_id' => $productId,
            'warehouse_id' => $warehouseId,
            'requested_qty' => $requestedQty,
            'total_allocated' => $totalAllocated,
            'shortage_qty' => max(0.0, $requestedQty - $totalAllocated),
            'has_expired_batches' => $hasExpiredBatches,
            'allocations' => $allocations,
        ];
    }

    /**
     * Dispatch/consume quantity from a specific batch.
     */
    public function dispatchBatch(
        string $batchId,
        float $quantity,
        ?string $referenceType = null,
        ?string $referenceId = null,
        ?string $notes = null
    ): ProductBatch {
        return DB::transaction(function () use ($batchId, $quantity, $referenceType, $referenceId, $notes) {
            /** @var ProductBatch $batch */
            $batch = ProductBatch::lockForUpdate()->findOrFail($batchId);

            if ((float) $batch->current_qty < $quantity) {
                throw new InvalidArgumentException("Insufficient batch quantity. Available: {$batch->current_qty}, Requested: {$quantity}");
            }

            $batch->current_qty = (float) $batch->current_qty - $quantity;
            if ($batch->current_qty <= 0) {
                $batch->current_qty = 0;
                $batch->status = 'depleted';
            }
            $batch->save();

            BatchTransaction::create([
                'tenant_id' => $batch->tenant_id,
                'company_id' => $batch->company_id,
                'batch_id' => $batch->id,
                'product_id' => $batch->product_id,
                'warehouse_id' => $batch->warehouse_id,
                'transaction_type' => 'issue',
                'direction' => 'out',
                'quantity' => $quantity,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'transaction_date' => now()->toDateString(),
                'notes' => $notes ?? 'Batch issue / dispatch',
            ]);

            return $batch;
        });
    }

    /**
     * Bulk register serial numbers for a product.
     */
    public function registerSerials(array $data): array
    {
        return DB::transaction(function () use ($data) {
            $product = Product::findOrFail($data['product_id']);
            $serialNumbers = is_array($data['serial_numbers']) ? $data['serial_numbers'] : explode("\n", (string) $data['serial_numbers']);

            $warrantyMonths = $data['warranty_months'] ?? $product->warranty_months ?? 12;
            $startDate = ! empty($data['warranty_start_date']) ? Carbon::parse($data['warranty_start_date']) : null;
            $endDate = ! empty($data['warranty_end_date']) ? Carbon::parse($data['warranty_end_date']) : null;

            if (! $endDate && $startDate && $warrantyMonths) {
                $endDate = $startDate->copy()->addMonths($warrantyMonths);
            }

            $createdSerials = [];

            foreach ($serialNumbers as $rawSerial) {
                $serialNum = trim($rawSerial);
                if ($serialNum === '') {
                    continue;
                }

                $serial = ProductSerial::create([
                    'tenant_id' => $data['tenant_id'],
                    'company_id' => $data['company_id'],
                    'product_id' => $data['product_id'],
                    'warehouse_id' => $data['warehouse_id'] ?? null,
                    'batch_id' => $data['batch_id'] ?? null,
                    'serial_number' => $serialNum,
                    'status' => 'in_stock',
                    'unit_cost' => $data['unit_cost'] ?? $product->moving_average_cost ?? 0,
                    'warranty_start_date' => $startDate,
                    'warranty_end_date' => $endDate,
                    'warranty_notes' => $data['warranty_notes'] ?? null,
                    'notes' => $data['notes'] ?? null,
                ]);

                SerialTransaction::create([
                    'tenant_id' => $data['tenant_id'],
                    'company_id' => $data['company_id'],
                    'serial_id' => $serial->id,
                    'product_id' => $serial->product_id,
                    'warehouse_id' => $serial->warehouse_id,
                    'transaction_type' => 'receive',
                    'reference_type' => $data['reference_type'] ?? null,
                    'reference_id' => $data['reference_id'] ?? null,
                    'transaction_date' => $data['date'] ?? now()->toDateString(),
                    'notes' => 'Serial received into inventory',
                ]);

                $createdSerials[] = $serial;
            }

            return $createdSerials;
        });
    }

    /**
     * Dispatch a serial number to a customer.
     */
    public function dispatchSerial(
        string $serialId,
        ?string $customerId = null,
        ?string $referenceType = null,
        ?string $referenceId = null,
        ?string $notes = null
    ): ProductSerial {
        return DB::transaction(function () use ($serialId, $customerId, $referenceType, $referenceId, $notes) {
            /** @var ProductSerial $serial */
            $serial = ProductSerial::lockForUpdate()->findOrFail($serialId);

            if ($serial->status !== 'in_stock' && $serial->status !== 'reserved') {
                throw new InvalidArgumentException("Serial {$serial->serial_number} cannot be dispatched because status is {$serial->status}");
            }

            $serial->status = 'sold';
            $serial->customer_id = $customerId;
            $oldWarehouseId = $serial->warehouse_id;
            $serial->warehouse_id = null; // Dispatched out of warehouse

            // If warranty start was not set, set it to now
            if (! $serial->warranty_start_date) {
                $serial->warranty_start_date = now();
                $months = $serial->product?->warranty_months ?? 12;
                $serial->warranty_end_date = now()->addMonths($months);
            }

            $serial->save();

            SerialTransaction::create([
                'tenant_id' => $serial->tenant_id,
                'company_id' => $serial->company_id,
                'serial_id' => $serial->id,
                'product_id' => $serial->product_id,
                'warehouse_id' => $oldWarehouseId,
                'transaction_type' => 'dispatch',
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'transaction_date' => now()->toDateString(),
                'notes' => $notes ?? 'Serial dispatched to customer',
            ]);

            return $serial;
        });
    }

    /**
     * Fetch active batches expiring within $days.
     */
    public function getExpiringBatches(string $companyId, int $days = 30): Collection
    {
        return ProductBatch::with(['product', 'warehouse'])
            ->where('company_id', $companyId)
            ->where('current_qty', '>', 0)
            ->where('status', 'active')
            ->whereNotNull('expiry_date')
            ->where('expiry_date', '<=', now()->addDays($days))
            ->orderBy('expiry_date', 'asc')
            ->get();
    }

    /**
     * Check warranty status for a serial number.
     */
    public function verifyWarranty(string $serialNumber, string $companyId): ?array
    {
        $serial = ProductSerial::with(['product', 'customer', 'batch'])
            ->where('company_id', $companyId)
            ->where('serial_number', $serialNumber)
            ->first();

        if (! $serial) {
            return null;
        }

        $now = now()->startOfDay();
        $isUnderWarranty = false;
        $daysRemaining = 0;

        if ($serial->warranty_end_date) {
            $endDate = $serial->warranty_end_date->startOfDay();
            $isUnderWarranty = ! $endDate->isPast();
            $daysRemaining = (int) $now->diffInDays($endDate, false);
        }

        return [
            'serial' => $serial,
            'is_under_warranty' => $isUnderWarranty,
            'days_remaining' => $daysRemaining,
            'status' => $serial->status,
            'warranty_start' => $serial->warranty_start_date?->toDateString(),
            'warranty_end' => $serial->warranty_end_date?->toDateString(),
            'customer_name' => $serial->customer?->name,
            'product_name' => $serial->product?->name,
        ];
    }
}
