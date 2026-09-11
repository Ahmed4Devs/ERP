<?php

namespace App\Modules\Inventory\Services;

use App\Modules\Accounting\Exceptions\PostingException;
use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Services\PostingEngine;
use App\Modules\Inventory\Exceptions\InsufficientStockException;
use App\Modules\Inventory\Models\InventoryLevel;
use App\Modules\Inventory\Models\Product;
use App\Modules\Inventory\Models\StockAdjustment;
use App\Modules\Inventory\Models\StockAdjustmentLine;
use App\Modules\Inventory\Models\Warehouse;
use App\Modules\Platform\Services\AuditLogger;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PostStockAdjustmentAction
{
    public function __construct(
        protected PostingEngine $postingEngine,
        protected InventoryCostingEngine $costingEngine
    ) {}

    /**
     * Post a physical stock count adjustment with balanced inventory variance GL entries.
     *
     * @param array{
     *     warehouse_id: string,
     *     date?: string,
     *     reason?: string,
     *     notes?: string|null,
     *     lines: array<int, array{
     *         product_id: string,
     *         type: string, // increase | decrease
     *         quantity: numeric|string,
     *         unit_cost?: numeric|string|null,
     *         notes?: string|null
     *     }>
     * } $data
     *
     * @throws PostingException
     * @throws InsufficientStockException
     */
    public function execute(array $data): StockAdjustment
    {
        $currentTenant = app(CurrentTenant::class);
        $currentCompany = app(CurrentCompany::class);

        $tenantId = $currentTenant->id();
        $companyId = $currentCompany->id();

        $warehouseId = $data['warehouse_id'] ?? null;
        $inputLines = $data['lines'] ?? [];
        $date = $data['date'] ?? now()->toDateString();
        $reason = $data['reason'] ?? 'count_variance';
        $notes = $data['notes'] ?? null;

        if (! $warehouseId) {
            throw new PostingException('Warehouse is required for stock adjustment.');
        }

        if (empty($inputLines)) {
            throw new PostingException('Stock adjustment must contain at least one line item.');
        }

        $warehouse = Warehouse::where('company_id', $companyId)->findOrFail($warehouseId);

        // Resolve inventory and variance accounts
        $invAccount = Account::where('company_id', $companyId)
            ->where(function ($q): void {
                $q->where('subtype', 'inventory')->orWhere('code', '1300');
            })
            ->first();

        if (! $invAccount) {
            throw new PostingException("Merchandise Inventory account (1300) not found for company {$companyId}.");
        }

        $varianceAccount = Account::where('company_id', $companyId)
            ->where(function ($q): void {
                $q->where('subtype', 'inventory_adjustment')->orWhere('code', '5900');
            })
            ->first();

        if (! $varianceAccount) {
            throw new PostingException("Inventory Variance account (5900) not found for company {$companyId}.");
        }

        return DB::transaction(function () use (
            $tenantId,
            $companyId,
            $warehouseId,
            $date,
            $reason,
            $notes,
            $inputLines,
            $invAccount,
            $varianceAccount
        ) {
            $adjustmentNumber = 'ADJ-'.date('Ymd').'-'.strtoupper(Str::random(6));
            $totalIncreaseCost = '0.000000';
            $totalDecreaseCost = '0.000000';

            $adjustment = StockAdjustment::create([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'warehouse_id' => $warehouseId,
                'adjustment_number' => $adjustmentNumber,
                'date' => $date,
                'reason' => $reason,
                'status' => 'draft',
                'total_cost_impact' => '0.000000',
                'notes' => $notes,
            ]);

            $processedLines = [];

            foreach ($inputLines as $index => $line) {
                $productId = $line['product_id'] ?? null;
                $type = strtolower($line['type'] ?? 'increase');
                $quantity = number_format((float) ($line['quantity'] ?? 0), 6, '.', '');

                if (! $productId) {
                    throw new PostingException("Adjustment line {$index} is missing product ID.");
                }

                if (bccomp($quantity, '0.000000', 6) <= 0) {
                    throw new PostingException("Adjustment line {$index} quantity must be greater than zero.");
                }

                $product = Product::where('company_id', $companyId)->findOrFail($productId);

                $level = InventoryLevel::where('company_id', $companyId)
                    ->where('warehouse_id', $warehouseId)
                    ->where('product_id', $productId)
                    ->first();

                $currentCost = $level && bccomp((string) $level->moving_average_cost, '0.000000', 6) > 0
                    ? (string) $level->moving_average_cost
                    : (string) $product->standard_cost;

                $unitCost = ! empty($line['unit_cost']) && bccomp((string) $line['unit_cost'], '0.000000', 6) > 0
                    ? number_format((float) $line['unit_cost'], 6, '.', '')
                    : $currentCost;

                $lineTotal = bcmul($quantity, $unitCost, 6);

                if ($type === 'increase') {
                    $totalIncreaseCost = bcadd($totalIncreaseCost, $lineTotal, 6);
                } else {
                    $totalDecreaseCost = bcadd($totalDecreaseCost, $lineTotal, 6);
                }

                $adjLine = StockAdjustmentLine::create([
                    'tenant_id' => $tenantId,
                    'company_id' => $companyId,
                    'stock_adjustment_id' => $adjustment->id,
                    'product_id' => $productId,
                    'type' => $type,
                    'quantity' => $quantity,
                    'unit_cost' => $unitCost,
                    'line_total' => $lineTotal,
                    'notes' => $line['notes'] ?? null,
                ]);

                $processedLines[] = [
                    'line' => $adjLine,
                    'product' => $product,
                    'type' => $type,
                    'quantity' => $quantity,
                    'unit_cost' => $unitCost,
                    'line_total' => $lineTotal,
                ];
            }

            // Prepare balanced GL entries for increases and decreases
            $glLines = [];

            if (bccomp($totalIncreaseCost, '0.000000', 6) > 0) {
                // DR 1300 Merchandise Inventory
                $glLines[] = [
                    'account_id' => $invAccount->id,
                    'debit' => $totalIncreaseCost,
                    'credit' => '0.000000',
                    'description' => "Stock Adjustment Increase: {$adjustmentNumber}",
                ];
                // CR 5900 Inventory Variance & Adjustments
                $glLines[] = [
                    'account_id' => $varianceAccount->id,
                    'debit' => '0.000000',
                    'credit' => $totalIncreaseCost,
                    'description' => "Inventory Gain Variance: {$adjustmentNumber}",
                ];
            }

            if (bccomp($totalDecreaseCost, '0.000000', 6) > 0) {
                // DR 5900 Inventory Variance & Adjustments
                $glLines[] = [
                    'account_id' => $varianceAccount->id,
                    'debit' => $totalDecreaseCost,
                    'credit' => '0.000000',
                    'description' => "Inventory Loss / Shrinkage Variance: {$adjustmentNumber}",
                ];
                // CR 1300 Merchandise Inventory
                $glLines[] = [
                    'account_id' => $invAccount->id,
                    'debit' => '0.000000',
                    'credit' => $totalDecreaseCost,
                    'description' => "Stock Adjustment Decrease: {$adjustmentNumber}",
                ];
            }

            $journalEntry = null;
            if (! empty($glLines)) {
                $journalEntry = $this->postingEngine->post([
                    'tenant_id' => $tenantId,
                    'company_id' => $companyId,
                    'date' => $date,
                    'description' => "Stock Adjustment {$adjustmentNumber} ({$reason})",
                    'source_type' => StockAdjustment::class,
                    'source_id' => $adjustment->id,
                    'lines' => $glLines,
                ]);
            }

            // Apply stock updates via costing engine
            foreach ($processedLines as $pLine) {
                if ($pLine['type'] === 'increase') {
                    $this->costingEngine->receiveStock([
                        'tenant_id' => $tenantId,
                        'company_id' => $companyId,
                        'warehouse_id' => $warehouseId,
                        'product_id' => $pLine['product']->id,
                        'quantity' => $pLine['quantity'],
                        'unit_cost' => $pLine['unit_cost'],
                        'movement_type' => 'adjustment',
                        'reference_type' => StockAdjustment::class,
                        'reference_id' => $adjustment->id,
                        'journal_entry_id' => $journalEntry?->id,
                        'date' => $date,
                        'notes' => "Adjustment increase: {$adjustmentNumber}",
                    ]);
                } else {
                    $this->costingEngine->issueStock([
                        'tenant_id' => $tenantId,
                        'company_id' => $companyId,
                        'warehouse_id' => $warehouseId,
                        'product_id' => $pLine['product']->id,
                        'quantity' => $pLine['quantity'],
                        'movement_type' => 'adjustment',
                        'reference_type' => StockAdjustment::class,
                        'reference_id' => $adjustment->id,
                        'journal_entry_id' => $journalEntry?->id,
                        'date' => $date,
                        'notes' => "Adjustment decrease: {$adjustmentNumber}",
                    ]);
                }
            }

            $netImpact = bcsub($totalIncreaseCost, $totalDecreaseCost, 6);
            $adjustment->total_cost_impact = $netImpact;
            $adjustment->journal_entry_id = $journalEntry?->id;
            $adjustment->status = 'posted';
            $adjustment->save();

            AuditLogger::log(
                'inventory.stock_adjustment.posted',
                StockAdjustment::class,
                $adjustment->id,
                [
                    'adjustment_number' => $adjustmentNumber,
                    'reason' => $reason,
                    'net_impact' => $netImpact,
                    'journal_entry_id' => $journalEntry?->id,
                ]
            );

            return $adjustment->load(['lines.product', 'warehouse', 'journalEntry.lines.account']);
        });
    }
}
