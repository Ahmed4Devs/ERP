<?php

namespace App\Modules\Purchasing\Services;

use App\Modules\Purchasing\Models\PurchaseOrder;
use App\Modules\Purchasing\Models\PurchaseOrderLine;
use App\Modules\Purchasing\Models\PurchaseRequisition;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class PurchaseRequisitionService
{
    /**
     * Submit a draft requisition for approval.
     */
    public function submit(PurchaseRequisition $requisition): PurchaseRequisition
    {
        if ($requisition->status !== 'draft') {
            throw new InvalidArgumentException("Cannot submit requisition with status '{$requisition->status}'. Only draft requisitions can be submitted.");
        }

        $requisition->update(['status' => 'submitted']);

        return $requisition;
    }

    /**
     * Approve a submitted or draft requisition.
     */
    public function approve(PurchaseRequisition $requisition, int $userId): PurchaseRequisition
    {
        if (in_array($requisition->status, ['approved', 'converted'], true)) {
            throw new InvalidArgumentException("Requisition is already {$requisition->status}.");
        }

        $requisition->update([
            'status' => 'approved',
            'approved_by_id' => $userId,
            'approved_at' => now(),
            'rejection_reason' => null,
        ]);

        return $requisition;
    }

    /**
     * Reject a requisition with a reason.
     */
    public function reject(PurchaseRequisition $requisition, ?string $reason = null): PurchaseRequisition
    {
        if ($requisition->status === 'converted') {
            throw new InvalidArgumentException('Cannot reject a requisition that has already been converted to a Purchase Order.');
        }

        $requisition->update([
            'status' => 'rejected',
            'rejection_reason' => $reason,
        ]);

        return $requisition;
    }

    /**
     * Convert an approved Purchase Requisition to an official Purchase Order.
     */
    public function convertToPurchaseOrder(
        PurchaseRequisition $requisition,
        string $vendorPartyId,
        ?string $expectedDeliveryDate = null,
        array $lineOverrides = []
    ): PurchaseOrder {
        if ($requisition->status !== 'approved') {
            throw new InvalidArgumentException("Only approved requisitions can be converted to Purchase Orders. Current status: '{$requisition->status}'.");
        }

        if ($requisition->purchase_order_id) {
            throw new InvalidArgumentException("Requisition {$requisition->requisition_number} has already been converted to PO.");
        }

        return DB::transaction(function () use ($requisition, $vendorPartyId, $expectedDeliveryDate, $lineOverrides): PurchaseOrder {
            $requisition->loadMissing('lines.product');

            $year = now()->format('Y');
            $count = PurchaseOrder::where('company_id', $requisition->company_id)
                ->whereYear('date', $year)
                ->count();
            $seq = str_pad((string) ($count + 1), 6, '0', STR_PAD_LEFT);
            $poNumber = "PO-{$year}-{$seq}";

            $taxRate = '0.100000';
            $subtotal = '0.000000';

            // Calculate total first
            foreach ($requisition->lines as $line) {
                $qty = number_format((float) $line->quantity, 6, '.', '');
                $unitPrice = isset($lineOverrides[$line->id]['unit_price'])
                    ? number_format((float) $lineOverrides[$line->id]['unit_price'], 6, '.', '')
                    : number_format((float) $line->estimated_unit_cost, 6, '.', '');

                $lineSubtotal = bcmul($qty, $unitPrice, 6);
                $subtotal = bcadd($subtotal, $lineSubtotal, 6);
            }

            $taxAmount = bcmul($subtotal, $taxRate, 6);
            $total = bcadd($subtotal, $taxAmount, 6);

            $notes = "Converted from Purchase Requisition {$requisition->requisition_number}.";
            if ($requisition->notes) {
                $notes .= "\n".$requisition->notes;
            }

            $po = PurchaseOrder::create([
                'tenant_id' => $requisition->tenant_id,
                'company_id' => $requisition->company_id,
                'branch_id' => $requisition->branch_id,
                'party_id' => $vendorPartyId,
                'po_number' => $poNumber,
                'date' => now()->toDateString(),
                'expected_delivery_date' => $expectedDeliveryDate ?: $requisition->required_date?->toDateString(),
                'status' => 'draft',
                'subtotal' => $subtotal,
                'tax_rate' => $taxRate,
                'tax_amount' => $taxAmount,
                'total' => $total,
                'currency' => 'SAR',
                'notes' => $notes,
            ]);

            foreach ($requisition->lines as $line) {
                $qty = number_format((float) $line->quantity, 6, '.', '');
                $unitPrice = isset($lineOverrides[$line->id]['unit_price'])
                    ? number_format((float) $lineOverrides[$line->id]['unit_price'], 6, '.', '')
                    : number_format((float) $line->estimated_unit_cost, 6, '.', '');

                $lineSubtotal = bcmul($qty, $unitPrice, 6);
                $lineTax = bcmul($lineSubtotal, $taxRate, 6);
                $lineTotal = bcadd($lineSubtotal, $lineTax, 6);

                PurchaseOrderLine::create([
                    'tenant_id' => $requisition->tenant_id,
                    'company_id' => $requisition->company_id,
                    'purchase_order_id' => $po->id,
                    'description' => $line->description ?: ($line->product?->name ?? 'Requisition Item'),
                    'quantity' => $qty,
                    'unit_price' => $unitPrice,
                    'subtotal' => $lineSubtotal,
                    'tax_rate' => $taxRate,
                    'tax_amount' => $lineTax,
                    'line_total' => $lineTotal,
                ]);
            }

            $requisition->update([
                'purchase_order_id' => $po->id,
                'status' => 'converted',
            ]);

            return $po;
        });
    }
}
