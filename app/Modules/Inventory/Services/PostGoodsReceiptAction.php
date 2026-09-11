<?php

namespace App\Modules\Inventory\Services;

use App\Modules\Accounting\Exceptions\PostingException;
use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Services\PostingEngine;
use App\Modules\Inventory\Models\GoodsReceipt;
use App\Modules\Inventory\Models\GoodsReceiptLine;
use App\Modules\Inventory\Models\Product;
use App\Modules\Inventory\Models\Warehouse;
use App\Modules\MasterData\Models\Party;
use App\Modules\Platform\Services\AuditLogger;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PostGoodsReceiptAction
{
    public function __construct(
        protected PostingEngine $postingEngine,
        protected InventoryCostingEngine $costingEngine
    ) {}

    /**
     * Create and post a Goods Receipt atomically with moving-average costing and GRNI clearing GL.
     *
     * @param array{
     *     warehouse_id: string,
     *     party_id: string,
     *     purchase_order_id?: string|null,
     *     branch_id?: string|null,
     *     date?: string,
     *     notes?: string|null,
     *     lines: array<int, array{
     *         product_id: string,
     *         purchase_order_line_id?: string|null,
     *         description?: string|null,
     *         quantity: numeric|string,
     *         unit_cost: numeric|string
     *     }>
     * } $data
     *
     * @throws PostingException
     */
    public function execute(array $data): GoodsReceipt
    {
        $currentTenant = app(CurrentTenant::class);
        $currentCompany = app(CurrentCompany::class);

        $tenantId = $currentTenant->id();
        $companyId = $currentCompany->id();

        $warehouseId = $data['warehouse_id'] ?? null;
        $partyId = $data['party_id'] ?? null;
        $inputLines = $data['lines'] ?? [];
        $date = $data['date'] ?? now()->toDateString();
        $notes = $data['notes'] ?? null;
        $poId = $data['purchase_order_id'] ?? null;
        $branchId = $data['branch_id'] ?? null;

        if (! $warehouseId) {
            throw new PostingException('Destination warehouse is required for goods receipt.');
        }

        if (! $partyId) {
            throw new PostingException('Vendor / supplier party is required for goods receipt.');
        }

        if (empty($inputLines)) {
            throw new PostingException('Goods receipt must contain at least one product line.');
        }

        $warehouse = Warehouse::where('company_id', $companyId)->findOrFail($warehouseId);
        $party = Party::where('tenant_id', $tenantId)->findOrFail($partyId);

        // Resolve Default Fallback Accounts
        $defaultInvAccount = Account::where('company_id', $companyId)
            ->where(function ($q): void {
                $q->where('subtype', 'inventory')->orWhere('code', '1300');
            })
            ->first();

        if (! $defaultInvAccount) {
            throw new PostingException("Merchandise Inventory control account (1300) not found for company {$companyId}.");
        }

        $defaultGrniAccount = Account::where('company_id', $companyId)
            ->where(function ($q): void {
                $q->where('subtype', 'clearing')->orWhere('code', '2020');
            })
            ->first();

        if (! $defaultGrniAccount) {
            throw new PostingException("GRNI Clearing account (2020) not found for company {$companyId}.");
        }

        // Validate lines and calculate exact totals
        $totalCost = '0.000000';
        $preparedLines = [];

        foreach ($inputLines as $index => $line) {
            $productId = $line['product_id'] ?? null;
            if (! $productId) {
                throw new PostingException("Line {$index} is missing product ID.");
            }

            $product = Product::where('company_id', $companyId)->findOrFail($productId);
            $qty = number_format((float) ($line['quantity'] ?? 1), 6, '.', '');
            $unitCost = number_format((float) ($line['unit_cost'] ?? $product->standard_cost), 6, '.', '');

            if (bccomp($qty, '0.000000', 6) <= 0) {
                throw new PostingException("Line {$index} quantity must be greater than zero.");
            }

            $lineTotal = bcmul($qty, $unitCost, 6);
            $totalCost = bcadd($totalCost, $lineTotal, 6);

            $invAccount = $product->inventory_account_id
                ? (Account::where('company_id', $companyId)->find($product->inventory_account_id) ?? $defaultInvAccount)
                : $defaultInvAccount;

            $grniAccount = $product->grni_account_id
                ? (Account::where('company_id', $companyId)->find($product->grni_account_id) ?? $defaultGrniAccount)
                : $defaultGrniAccount;

            $preparedLines[] = [
                'product' => $product,
                'product_id' => $product->id,
                'purchase_order_line_id' => $line['purchase_order_line_id'] ?? null,
                'description' => $line['description'] ?? $product->name,
                'quantity' => $qty,
                'unit_cost' => $unitCost,
                'line_total' => $lineTotal,
                'inventory_account' => $invAccount,
                'grni_account' => $grniAccount,
            ];
        }

        // Execute atomically in DB transaction
        return DB::transaction(function () use (
            $tenantId,
            $companyId,
            $warehouseId,
            $partyId,
            $branchId,
            $poId,
            $date,
            $notes,
            $totalCost,
            $preparedLines,
            $defaultGrniAccount
        ) {
            $receiptNumber = 'GRN-'.date('Ymd').'-'.strtoupper(Str::random(6));

            $receipt = GoodsReceipt::create([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'branch_id' => $branchId,
                'warehouse_id' => $warehouseId,
                'party_id' => $partyId,
                'purchase_order_id' => $poId,
                'receipt_number' => $receiptNumber,
                'date' => $date,
                'status' => 'draft',
                'total_cost' => $totalCost,
                'notes' => $notes,
            ]);

            // Create goods receipt line records
            foreach ($preparedLines as $pLine) {
                GoodsReceiptLine::create([
                    'tenant_id' => $tenantId,
                    'company_id' => $companyId,
                    'goods_receipt_id' => $receipt->id,
                    'product_id' => $pLine['product_id'],
                    'purchase_order_line_id' => $pLine['purchase_order_line_id'],
                    'description' => $pLine['description'],
                    'quantity' => $pLine['quantity'],
                    'unit_cost' => $pLine['unit_cost'],
                    'line_total' => $pLine['line_total'],
                ]);
            }

            // Prepare balanced GL journal entry lines
            $glLines = [];

            // Debit Inventory for each line/product
            foreach ($preparedLines as $pLine) {
                $glLines[] = [
                    'account_id' => $pLine['inventory_account']->id,
                    'debit' => $pLine['line_total'],
                    'credit' => '0.000000',
                    'description' => "Inventory Receipt: {$receiptNumber} - {$pLine['product']->sku} ({$pLine['product']->name})",
                ];
            }

            // Credit GRNI Clearing account for total receipt cost
            $glLines[] = [
                'account_id' => $defaultGrniAccount->id,
                'debit' => '0.000000',
                'credit' => $totalCost,
                'description' => "GRNI Clearing: Goods Receipt {$receiptNumber}",
            ];

            // Post balanced journal entry via PostingEngine
            $journalEntry = $this->postingEngine->post([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'date' => $date,
                'description' => "Goods Receipt {$receiptNumber}",
                'source_type' => GoodsReceipt::class,
                'source_id' => $receipt->id,
                'lines' => $glLines,
            ]);

            // Execute perpetual moving-average inventory updates & stock movements
            foreach ($preparedLines as $pLine) {
                $this->costingEngine->receiveStock([
                    'tenant_id' => $tenantId,
                    'company_id' => $companyId,
                    'warehouse_id' => $warehouseId,
                    'product_id' => $pLine['product_id'],
                    'quantity' => $pLine['quantity'],
                    'unit_cost' => $pLine['unit_cost'],
                    'movement_type' => 'receipt',
                    'reference_type' => GoodsReceipt::class,
                    'reference_id' => $receipt->id,
                    'journal_entry_id' => $journalEntry->id,
                    'date' => $date,
                    'notes' => "GRN {$receiptNumber}: {$pLine['description']}",
                ]);
            }

            $receipt->journal_entry_id = $journalEntry->id;
            $receipt->status = 'posted';
            $receipt->save();

            AuditLogger::log(
                'inventory.goods_receipt.posted',
                GoodsReceipt::class,
                $receipt->id,
                [
                    'receipt_number' => $receiptNumber,
                    'total_cost' => $totalCost,
                    'journal_entry_id' => $journalEntry->id,
                ]
            );

            return $receipt->load(['lines.product', 'warehouse', 'party', 'journalEntry.lines.account']);
        });
    }
}
