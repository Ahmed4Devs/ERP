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

        $method = $landedCost->allocation_method ?: 'by_value';

        // Separate capitalizable charges (duties, freight, insurance, port fees) from refundable VAT charges
        $vatCostTypes = ['customs_vat', 'import_vat', 'vat'];
        $capitalizableCharges = (float) $landedCost->charges
            ->reject(fn ($c) => in_array(strtolower($c->cost_type), $vatCostTypes))
            ->sum('amount');

        // If all charges are typed as VAT or non-specified, default capitalizable to total charges
        if ($capitalizableCharges <= 0) {
            $capitalizableCharges = $totalCharges;
        }

        $totalDuty = (float) $landedCost->charges
            ->filter(fn ($c) => in_array(strtolower($c->cost_type), ['customs', 'customs_duty']))
            ->sum('amount');

        $totalFreight = (float) $landedCost->charges
            ->filter(fn ($c) => in_array(strtolower($c->cost_type), ['freight', 'ocean_freight', 'air_freight']))
            ->sum('amount');

        $basisTotal = 0.0;
        foreach ($allReceiptLines as $line) {
            $qty = (float) $line->quantity;
            $origCost = (float) $line->unit_cost;
            $weight = (float) ($line->weight_kg ?? 0);
            $volume = (float) ($line->volume_cbm ?? 0);

            $basis = match ($method) {
                'by_quantity' => $qty,
                'by_weight' => ($weight > 0 ? ($weight * $qty) : ($qty * $origCost)),
                'by_volume' => ($volume > 0 ? ($volume * $qty) : ($qty * $origCost)),
                default => ($qty * $origCost), // by_value
            };

            $basisTotal += $basis;
        }

        if ($basisTotal <= 0) {
            // Fallback to equal distribution if basis total is zero
            $basisTotal = (float) $allReceiptLines->count();
        }

        $allocatedSum = 0.0;
        $dutySum = 0.0;
        $freightSum = 0.0;
        $count = $allReceiptLines->count();

        foreach ($allReceiptLines as $index => $line) {
            $qty = (float) $line->quantity;
            $origCost = (float) $line->unit_cost;
            $weight = (float) ($line->weight_kg ?? 0);
            $volume = (float) ($line->volume_cbm ?? 0);

            $basis = match ($method) {
                'by_quantity' => $qty,
                'by_weight' => ($weight > 0 ? ($weight * $qty) : ($qty * $origCost)),
                'by_volume' => ($volume > 0 ? ($volume * $qty) : ($qty * $origCost)),
                default => ($qty * $origCost),
            };

            if ($index === $count - 1) {
                // Assign remainder to avoid rounding drift
                $allocatedAmount = round($capitalizableCharges - $allocatedSum, 4);
                $allocatedDuty = round($totalDuty - $dutySum, 4);
                $allocatedFreight = round($totalFreight - $freightSum, 4);
            } else {
                $ratio = $basisTotal > 0 ? ($basis / $basisTotal) : (1 / $count);
                $allocatedAmount = round($ratio * $capitalizableCharges, 4);
                $allocatedDuty = round($ratio * $totalDuty, 4);
                $allocatedFreight = round($ratio * $totalFreight, 4);

                $allocatedSum += $allocatedAmount;
                $dutySum += $allocatedDuty;
                $freightSum += $allocatedFreight;
            }

            $perUnitExtra = $qty > 0 ? ($allocatedAmount / $qty) : 0.0;
            $newUnitCost = round($origCost + $perUnitExtra, 4);

            LandedCostAllocation::create([
                'landed_cost_id' => $landedCost->id,
                'goods_receipt_line_id' => $line->id,
                'product_id' => $line->product_id,
                'quantity' => $qty,
                'weight_kg' => $weight,
                'volume_cbm' => $volume,
                'original_unit_cost' => $origCost,
                'allocated_amount' => $allocatedAmount,
                'customs_duty_allocated' => $allocatedDuty,
                'freight_allocated' => $allocatedFreight,
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

        // VAT Input account for Customs VAT (1150 Tax Recoverable or 2150 or subtype vat_input / tax_receivable)
        $vatInputAccount = Account::where('company_id', $companyId)
            ->where(function ($q): void {
                $q->where('code', '1150')
                    ->orWhere('subtype', 'tax_receivable')
                    ->orWhere('subtype', 'vat_input')
                    ->orWhere('code', '2150')
                    ->orWhere('subtype', 'tax_payable');
            })
            ->first();

        return DB::transaction(function () use ($landedCost, $invAccount, $defaultClearingAccount, $vatInputAccount): LandedCost {
            $vatCostTypes = ['customs_vat', 'import_vat', 'vat'];
            $glLines = [];

            $inventoryAmount = 0.0;
            $vatAmount = 0.0;

            foreach ($landedCost->charges as $charge) {
                $amt = (float) $charge->amount;
                if (in_array(strtolower($charge->cost_type), $vatCostTypes)) {
                    $vatAmount += $amt;
                } else {
                    $inventoryAmount += $amt;
                }
            }

            // If no charges were specifically flagged as non-VAT, capitalize total charges to inventory
            if ($inventoryAmount <= 0 && $vatAmount > 0) {
                $inventoryAmount = (float) $landedCost->total_charges;
                $vatAmount = 0.0;
            }

            // 1. Debit Inventory (1300) for capitalizable landed costs (Duties, Freight, Handling, Insurance)
            if ($inventoryAmount > 0) {
                $glLines[] = [
                    'account_id' => $invAccount->id,
                    'debit' => $inventoryAmount,
                    'credit' => 0.0,
                    'description' => "Landed Cost Allocation - Voucher {$landedCost->voucher_number}".($landedCost->customs_declaration_number ? " (FASAH: {$landedCost->customs_declaration_number})" : ''),
                ];
            }

            // 2. Debit VAT Input (2150) for Customs Import VAT (ZATCA Box 8 compliant)
            if ($vatAmount > 0) {
                $vatTargetAccountId = $vatInputAccount ? $vatInputAccount->id : $invAccount->id;
                $glLines[] = [
                    'account_id' => $vatTargetAccountId,
                    'debit' => $vatAmount,
                    'credit' => 0.0,
                    'description' => "Customs Import VAT (ZATCA Box 8) - FASAH {$landedCost->customs_declaration_number}",
                ];
            }

            // 3. Credit each charge expense/clearing/vendor account
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
                'description' => "Landed Cost Voucher {$landedCost->voucher_number}".($landedCost->customs_declaration_number ? " [FASAH: {$landedCost->customs_declaration_number}]" : ''),
                'lines' => $glLines,
            ]);

            // 4. Update Product unit cost in inventory
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

            // 5. Mark landed cost as posted
            $landedCost->update([
                'status' => 'posted',
                'journal_entry_id' => $journalEntry->id,
            ]);

            return $landedCost->refresh();
        });
    }
}
