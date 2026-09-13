<?php

namespace App\Modules\Inventory\Services;

use App\Modules\Accounting\Exceptions\PostingException;
use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Services\PostingEngine;
use App\Modules\Inventory\Models\InventoryLevel;
use App\Modules\Inventory\Models\LandedCost;
use App\Modules\Inventory\Models\LandedCostAllocation;
use App\Modules\Inventory\Models\Product;
use Illuminate\Support\Facades\DB;

class LandedCostService
{
    public function __construct(
        protected PostingEngine $postingEngine,
        protected InventoryCostingEngine $costingEngine
    ) {}

    /**
     * Compute and save cost allocations across goods receipt lines.
     */
    public function computeAllocations(LandedCost $landedCost): void
    {
        $landedCost->loadMissing(['charges', 'receipts.lines']);

        $totalCharges = (float) $landedCost->charges->sum('amount');
        $landedCost->update(['total_charges' => $totalCharges]);

        // Remove existing allocations
        $landedCost->allocations()->delete();

        if ($totalCharges <= 0) {
            return;
        }

        $allReceiptLines = collect();
        foreach ($landedCost->receipts as $receipt) {
            foreach ($receipt->lines as $line) {
                $allReceiptLines->push($line);
            }
        }

        if ($allReceiptLines->isEmpty()) {
            return;
        }

        $method = $landedCost->allocation_method; // 'by_value' or 'by_quantity'

        $basisTotal = 0.0;
        foreach ($allReceiptLines as $line) {
            if ($method === 'by_quantity') {
                $basisTotal += (float) $line->quantity;
            } else {
                $basisTotal += (float) $line->quantity * (float) $line->unit_cost;
            }
        }

        if ($basisTotal <= 0) {
            return;
        }

        $allocatedSum = 0.0;
        $count = $allReceiptLines->count();

        foreach ($allReceiptLines as $index => $line) {
            $qty = (float) $line->quantity;
            $origCost = (float) $line->unit_cost;

            if ($index === $count - 1) {
                // Assign remainder to avoid rounding error
                $allocatedAmount = round($totalCharges - $allocatedSum, 4);
            } else {
                $basis = ($method === 'by_quantity') ? $qty : ($qty * $origCost);
                $allocatedAmount = round(($basis / $basisTotal) * $totalCharges, 4);
                $allocatedSum += $allocatedAmount;
            }

            $perUnitExtra = $qty > 0 ? ($allocatedAmount / $qty) : 0.0;
            $newUnitCost = round($origCost + $perUnitExtra, 4);

            LandedCostAllocation::create([
                'landed_cost_id' => $landedCost->id,
                'goods_receipt_line_id' => $line->id,
                'product_id' => $line->product_id,
                'quantity' => $qty,
                'original_unit_cost' => $origCost,
                'allocated_amount' => $allocatedAmount,
                'new_unit_cost' => $newUnitCost,
            ]);
        }
    }

    /**
     * Post the Landed Cost voucher, generate balanced GL entries, and update product valuations.
     */
    public function post(LandedCost $landedCost): LandedCost
    {
        if ($landedCost->status === 'posted') {
            throw new PostingException('This landed cost voucher is already posted.');
        }

        $this->computeAllocations($landedCost);
        $landedCost->load(['charges', 'allocations.product']);

        $totalCharges = (float) $landedCost->total_charges;
        if ($totalCharges <= 0) {
            throw new PostingException('Cannot post a landed cost voucher with zero total charges.');
        }

        if ($landedCost->allocations->isEmpty()) {
            throw new PostingException('No goods receipt lines available for cost allocation.');
        }

        $companyId = $landedCost->company_id;

        // Inventory control account (1300)
        $invAccount = Account::where('company_id', $companyId)
            ->where(function ($q): void {
                $q->where('subtype', 'inventory')->orWhere('code', '1300');
            })
            ->first();

        if (! $invAccount) {
            throw new PostingException("Merchandise Inventory account (1300) not found for company {$companyId}.");
        }

        // Default clearing account (2020 GRNI / Clearing)
        $defaultClearingAccount = Account::where('company_id', $companyId)
            ->where(function ($q): void {
                $q->where('subtype', 'clearing')->orWhere('code', '2020');
            })
            ->first();

        if (! $defaultClearingAccount) {
            throw new PostingException("Clearing / GRNI account (2020) not found for company {$companyId}.");
        }

        return DB::transaction(function () use ($landedCost, $invAccount, $defaultClearingAccount, $totalCharges): LandedCost {
            // 1. Prepare Journal Entry lines
            // Debit: Inventory (1300) for each allocated product or total
            $glLines = [];

            // Debit Inventory for total added landed cost
            $glLines[] = [
                'account_id' => $invAccount->id,
                'debit' => $totalCharges,
                'credit' => 0.0,
                'description' => "Landed Cost Allocation - Voucher {$landedCost->voucher_number}",
            ];

            // Credit each charge expense/clearing account
            foreach ($landedCost->charges as $charge) {
                $creditAccountId = $charge->expense_account_id ?: $defaultClearingAccount->id;
                $glLines[] = [
                    'account_id' => $creditAccountId,
                    'debit' => 0.0,
                    'credit' => (float) $charge->amount,
                    'description' => $charge->description ?: "Landed Charge ({$charge->cost_type}) - {$landedCost->voucher_number}",
                ];
            }

            $journalEntry = $this->postingEngine->post([
                'date' => $landedCost->date->toDateString(),
                'entry_type' => 'landed_cost',
                'description' => "Landed Cost Voucher {$landedCost->voucher_number}",
                'lines' => $glLines,
            ]);

            // 2. Update Product unit cost in inventory
            foreach ($landedCost->allocations as $allocation) {
                $product = $allocation->product;
                if ($product) {
                    $currentOnHand = (float) InventoryLevel::where('product_id', $product->id)->sum('quantity_on_hand');
                    $currentCost = (float) ($product->moving_average_cost ?: $product->standard_cost);

                    // Re-weight cost: (currentOnHand * currentCost + allocatedAmount) / currentOnHand
                    if ($currentOnHand > 0) {
                        $updatedUnitCost = round((($currentOnHand * $currentCost) + (float) $allocation->allocated_amount) / $currentOnHand, 4);
                        $product->update(['moving_average_cost' => $updatedUnitCost]);
                    } else {
                        $product->update(['moving_average_cost' => (float) $allocation->new_unit_cost]);
                    }
                }
            }

            // 3. Mark landed cost as posted
            $landedCost->update([
                'status' => 'posted',
                'journal_entry_id' => $journalEntry->id,
            ]);

            return $landedCost->refresh();
        });
    }
}
