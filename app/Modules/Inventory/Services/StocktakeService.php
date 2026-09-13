<?php

namespace App\Modules\Inventory\Services;

use App\Modules\Accounting\Exceptions\PostingException;
use App\Modules\Inventory\Models\InventoryLevel;
use App\Modules\Inventory\Models\Product;
use App\Modules\Inventory\Models\StocktakeSession;
use App\Modules\Inventory\Models\StocktakeSessionLine;
use App\Modules\Inventory\Models\Warehouse;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Support\Facades\DB;

class StocktakeService
{
    public function __construct(
        protected PostStockAdjustmentAction $adjustmentAction
    ) {}

    /**
     * Start a new physical stocktake session by snapshotting current warehouse stock.
     */
    public function createSession(array $data): StocktakeSession
    {
        $currentTenant = app(CurrentTenant::class);
        $currentCompany = app(CurrentCompany::class);

        $tenantId = $currentTenant->id();
        $companyId = $currentCompany->id();

        $warehouseId = $data['warehouse_id'];
        $warehouse = Warehouse::where('company_id', $companyId)->findOrFail($warehouseId);

        $date = $data['date'] ?? now()->toDateString();
        $countType = $data['count_type'] ?? 'full';
        $notes = $data['notes'] ?? null;
        $categoryIds = $data['category_ids'] ?? [];

        $sessionNumber = 'ST-'.date('Ymd').'-'.strtoupper(substr(uniqid(), -4));

        return DB::transaction(function () use ($tenantId, $companyId, $warehouseId, $sessionNumber, $date, $countType, $notes, $categoryIds): StocktakeSession {
            $session = StocktakeSession::create([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'warehouse_id' => $warehouseId,
                'session_number' => $sessionNumber,
                'date' => $date,
                'status' => 'draft',
                'count_type' => $countType,
                'notes' => $notes,
                'created_by_id' => auth()->id(),
            ]);

            // Query active products for this company
            $query = Product::where('company_id', $companyId)->where('is_active', true);
            if (! empty($categoryIds)) {
                $query->whereIn('category_id', $categoryIds);
            }
            $products = $query->get();

            // Fetch current inventory levels for this warehouse
            $inventoryLevels = InventoryLevel::where('warehouse_id', $warehouseId)
                ->get()
                ->keyBy('product_id');

            foreach ($products as $product) {
                $level = $inventoryLevels->get($product->id);
                $bookQty = $level ? (float) $level->quantity_on_hand : 0.0;
                $unitCost = (float) ($product->moving_average_cost ?: $product->standard_cost);

                StocktakeSessionLine::create([
                    'stocktake_session_id' => $session->id,
                    'product_id' => $product->id,
                    'book_quantity' => $bookQty,
                    'counted_quantity' => $bookQty, // Default counted = book until user enters scan/count
                    'variance_quantity' => 0.0,
                    'unit_cost' => $unitCost,
                    'variance_amount' => 0.0,
                    'notes' => null,
                ]);
            }

            return $session->load(['lines.product', 'warehouse']);
        });
    }

    /**
     * Record physical count quantities entered by staff or barcode scanners.
     */
    public function recordCounts(StocktakeSession $session, array $counts): StocktakeSession
    {
        if ($session->status === 'completed') {
            throw new PostingException('Cannot update counts on a completed stocktake session.');
        }

        DB::transaction(function () use ($session, $counts): void {
            foreach ($counts as $item) {
                $lineId = $item['line_id'] ?? null;
                $countedQty = (float) ($item['counted_quantity'] ?? 0);
                $notes = $item['notes'] ?? null;

                $line = StocktakeSessionLine::where('stocktake_session_id', $session->id)->find($lineId);
                if ($line) {
                    $bookQty = (float) $line->book_quantity;
                    $varianceQty = $countedQty - $bookQty;
                    $varianceAmount = $varianceQty * (float) $line->unit_cost;

                    $line->update([
                        'counted_quantity' => $countedQty,
                        'variance_quantity' => $varianceQty,
                        'variance_amount' => $varianceAmount,
                        'notes' => $notes ?: $line->notes,
                    ]);
                }
            }

            $session->update(['status' => 'in_progress']);
        });

        return $session->fresh(['lines.product', 'warehouse']);
    }

    /**
     * Finalize the stocktake session, auto-generate StockAdjustment, and post GL entries.
     */
    public function finalizeAndAdjust(StocktakeSession $session): StocktakeSession
    {
        if ($session->status === 'completed') {
            throw new PostingException('Stocktake session is already completed and adjusted.');
        }

        $session->loadMissing(['lines.product', 'warehouse']);

        // Find lines with non-zero variance
        $adjustmentLines = [];
        foreach ($session->lines as $line) {
            $variance = (float) $line->variance_quantity;
            if (abs($variance) > 0.0001) {
                $adjustmentLines[] = [
                    'product_id' => $line->product_id,
                    'type' => $variance > 0 ? 'increase' : 'decrease',
                    'quantity' => abs($variance),
                    'unit_cost' => (float) $line->unit_cost,
                    'notes' => "Stocktake {$session->session_number} variance adjustment",
                ];
            }
        }

        return DB::transaction(function () use ($session, $adjustmentLines): StocktakeSession {
            $stockAdjustment = null;

            if (! empty($adjustmentLines)) {
                $stockAdjustment = $this->adjustmentAction->execute([
                    'warehouse_id' => $session->warehouse_id,
                    'date' => now()->toDateString(),
                    'reason' => 'physical_count_variance',
                    'notes' => "Generated from Physical Stocktake Session {$session->session_number}",
                    'lines' => $adjustmentLines,
                ]);
            }

            $session->update([
                'status' => 'completed',
                'stock_adjustment_id' => $stockAdjustment?->id,
                'completed_at' => now(),
            ]);

            return $session->fresh(['lines.product', 'warehouse', 'stockAdjustment']);
        });
    }
}
