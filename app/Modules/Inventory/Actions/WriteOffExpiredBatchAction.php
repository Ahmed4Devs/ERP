<?php

namespace App\Modules\Inventory\Actions;

use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Services\PostingEngine;
use App\Modules\Inventory\Models\BatchTransaction;
use App\Modules\Inventory\Models\InventoryLevel;
use App\Modules\Inventory\Models\ProductBatch;
use App\Modules\Platform\Services\AuditLogger;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class WriteOffExpiredBatchAction
{
    public function __construct(
        protected PostingEngine $postingEngine
    ) {}

    /**
     * Write off and scrap an expired/damaged product batch:
     * - Relieve inventory level from warehouse
     * - Decrement or deplete product batch current quantity
     * - Create BatchTransaction of type 'write_off'
     * - Post balanced double-entry GL journal:
     *   DR 5250 (Loss on Expired & Scrapped Stock / خسائر بضاعة تالفة ومنتهية الصلاحية)
     *   CR 1300 (Inventory Asset Account / حساب بضاعة المخزون)
     *
     * @param array{
     *     batch_id: string,
     *     quantity?: numeric|string|null,
     *     reason: string,
     *     notes?: string|null,
     *     user_id?: int|null
     * } $data
     * @return array{batch: ProductBatch, journal_entry_id: string, total_loss: string}
     */
    public function execute(array $data): array
    {
        return DB::transaction(function () use ($data) {
            /** @var ProductBatch $batch */
            $batch = ProductBatch::with(['product', 'warehouse'])->lockForUpdate()->findOrFail($data['batch_id']);

            $available = (float) $batch->current_qty;
            if ($available <= 0) {
                throw new InvalidArgumentException("Batch [{$batch->batch_number}] has no remaining quantity to write off.");
            }

            $writeOffQty = isset($data['quantity']) && (float) $data['quantity'] > 0
                ? min((float) $data['quantity'], $available)
                : $available;

            $writeOffQtyStr = number_format($writeOffQty, 4, '.', '');
            $unitCostStr = (string) ($batch->unit_cost ?: ($batch->product?->moving_average_cost ?: '0.000000'));
            $totalLoss = bcmul($writeOffQtyStr, $unitCostStr, 6);

            $companyId = $batch->company_id;
            $tenantId = $batch->tenant_id;
            $warehouseId = $batch->warehouse_id;
            $productId = $batch->product_id;

            // 1. Decrement batch current quantity
            $newBatchQty = (float) $batch->current_qty - $writeOffQty;
            $batch->current_qty = $newBatchQty;
            if ($newBatchQty <= 0) {
                $batch->current_qty = 0;
                $batch->status = 'scrapped';
            } else {
                $batch->status = 'quarantined';
            }
            $batch->save();

            // 2. Decrement physical warehouse inventory level
            $invLevel = InventoryLevel::where('warehouse_id', $warehouseId)
                ->where('product_id', $productId)
                ->lockForUpdate()
                ->first();

            if ($invLevel) {
                $newInvQty = max(0.0, (float) $invLevel->quantity_on_hand - $writeOffQty);
                $invLevel->quantity_on_hand = $newInvQty;
                $invLevel->save();
            }

            // 3. Record Batch Transaction
            BatchTransaction::create([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'batch_id' => $batch->id,
                'product_id' => $productId,
                'warehouse_id' => $warehouseId,
                'transaction_type' => 'write_off',
                'direction' => 'out',
                'quantity' => $writeOffQtyStr,
                'transaction_date' => now()->toDateString(),
                'notes' => $data['reason'].(! empty($data['notes']) ? ' - '.$data['notes'] : ''),
            ]);

            // 4. Post Double-Entry GL Journal Entry
            // DR 5250 (Loss on Expired & Scrapped Stock / خسائر بضاعة تالفة ومنتهية الصلاحية)
            // CR 1300 (Inventory Asset Account / حساب بضاعة المخزون)
            $lossAccount = Account::where('company_id', $companyId)->where('code', '5250')->first();
            if (! $lossAccount) {
                $lossAccount = Account::create([
                    'tenant_id' => $tenantId,
                    'company_id' => $companyId,
                    'code' => '5250',
                    'name' => 'Loss on Expired & Damaged Stock',
                    'name_ar' => 'خسائر بضاعة تالفة ومنتهية الصلاحية',
                    'type' => 'expense',
                    'subtype' => 'operating_expense',
                    'currency' => 'SAR',
                    'is_postable' => true,
                    'is_system' => false,
                    'current_balance' => '0.000000',
                ]);
            }

            $inventoryAccount = Account::where('company_id', $companyId)->where('code', '1300')->first()
                ?? Account::where('company_id', $companyId)->where('type', 'asset')->firstOrFail();

            $date = now()->toDateString();
            $journalDescription = "Stock Write-off: Batch {$batch->batch_number} ({$batch->product?->sku}) - {$data['reason']}";

            $glLines = [
                [
                    'account_id' => $lossAccount->id,
                    'debit' => $totalLoss,
                    'credit' => '0.000000',
                    'description' => $journalDescription,
                ],
                [
                    'account_id' => $inventoryAccount->id,
                    'debit' => '0.000000',
                    'credit' => $totalLoss,
                    'description' => "Inventory Relief - Write-off Batch {$batch->batch_number}",
                ],
            ];

            $journal = $this->postingEngine->post([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'date' => $date,
                'description' => $journalDescription,
                'source_type' => 'batch_write_off',
                'source_id' => $batch->id,
                'idempotency_key' => "batch_write_off_{$batch->id}_".now()->timestamp,
                'lines' => $glLines,
            ]);

            AuditLogger::log(
                action: 'inventory.batch_written_off',
                entityType: ProductBatch::class,
                entityId: $batch->id,
                newValues: [
                    'batch_number' => $batch->batch_number,
                    'product_id' => $productId,
                    'quantity_written_off' => $writeOffQtyStr,
                    'total_loss_sar' => $totalLoss,
                    'reason' => $data['reason'],
                    'journal_entry_id' => $journal->id,
                ]
            );

            return [
                'batch' => $batch->fresh(),
                'journal_entry_id' => $journal->id,
                'total_loss' => $totalLoss,
            ];
        });
    }
}
