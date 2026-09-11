<?php

namespace App\Modules\Contracting\Actions;

use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\ServiceInvoice;
use App\Modules\Accounting\Models\ServiceInvoiceLine;
use App\Modules\Contracting\Models\ContractingClaim;
use App\Modules\Organization\Models\Branch;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;

class ApproveAndBillProgressClaimAction
{
    /**
     * Certify progress claim, deduct contractual retention, and generate official Service Invoice.
     *
     * @param array{
     *     claim_id: string,
     *     notes?: string|null
     * } $data
     */
    public function execute(array $data): ContractingClaim
    {
        return DB::transaction(function () use ($data) {
            $claim = ContractingClaim::with(['project', 'customer', 'items'])
                ->lockForUpdate()
                ->findOrFail($data['claim_id']);

            if ($claim->status === 'billed') {
                throw new InvalidArgumentException("Contracting claim [{$claim->claim_number}] is already billed.");
            }

            if ($claim->status === 'rejected') {
                throw new InvalidArgumentException("Cannot bill rejected claim [{$claim->claim_number}].");
            }

            $companyId = $claim->company_id;
            $tenantId = $claim->tenant_id;

            // Compute current work amount from items if present
            $currentWorkAmount = '0.000000';
            if ($claim->items->isNotEmpty()) {
                foreach ($claim->items as $item) {
                    $currentWorkAmount = bcadd($currentWorkAmount, (string) $item->current_amount, 6);
                }
            } else {
                $currentWorkAmount = (string) $claim->current_work_amount;
            }

            if (bccomp($currentWorkAmount, '0.000000', 6) <= 0) {
                throw new InvalidArgumentException('Current work amount must be greater than zero to generate a bill.');
            }

            // Retention calculation
            $retentionRate = number_format((float) $claim->retention_rate, 4, '.', '');
            $retentionAmount = bcmul($currentWorkAmount, $retentionRate, 6);
            $netClaimAmount = bcsub($currentWorkAmount, $retentionAmount, 6);

            // 10% Test Tax
            $taxRate = '0.100000';
            $taxAmount = bcmul($netClaimAmount, $taxRate, 6);
            $totalAmount = bcadd($netClaimAmount, $taxAmount, 6);

            // Locate branch and revenue account
            $branch = Branch::where('company_id', $companyId)->first();
            $branchId = $branch ? $branch->id : null;

            $revenueAccount = Account::where('company_id', $companyId)->where('code', '4100')->firstOrFail();

            $invoiceNumber = 'INV-CLM-'.date('Ymd').'-'.strtoupper(Str::random(6));

            // Generate Service Invoice
            $invoice = ServiceInvoice::create([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'branch_id' => $branchId,
                'party_id' => $claim->customer_id,
                'invoice_number' => $invoiceNumber,
                'date' => now()->toDateString(),
                'due_date' => now()->addDays(30)->toDateString(),
                'status' => 'draft',
                'subtotal' => $netClaimAmount,
                'tax_rate' => $taxRate,
                'tax_amount' => $taxAmount,
                'total' => $totalAmount,
                'amount_paid' => '0.000000',
                'balance_due' => $totalAmount,
                'currency' => 'SAR',
                'notes' => "Progress Claim [{$claim->claim_number}] for Project [".($claim->project ? $claim->project->name : 'N/A').']',
            ]);

            ServiceInvoiceLine::create([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'service_invoice_id' => $invoice->id,
                'description' => "Progress Claim [{$claim->claim_number}] - Certified Work: {$currentWorkAmount} less {$claim->retention_rate}% Retention ({$retentionAmount})",
                'quantity' => '1.000000',
                'unit_price' => $netClaimAmount,
                'tax_rate' => $taxRate,
                'tax_amount' => $taxAmount,
                'line_total' => $totalAmount,
                'revenue_account_id' => $revenueAccount->id,
            ]);

            // Update Claim record
            $claim->current_work_amount = $currentWorkAmount;
            $claim->retention_amount = $retentionAmount;
            $claim->net_claim_amount = $netClaimAmount;
            $claim->tax_amount = $taxAmount;
            $claim->total_amount = $totalAmount;
            $claim->status = 'billed';
            $claim->invoice_id = $invoice->id;
            if (! empty($data['notes'])) {
                $claim->notes = $claim->notes ? ($claim->notes."\n".$data['notes']) : $data['notes'];
            }
            $claim->save();

            return $claim->fresh(['project', 'customer', 'invoice', 'items']);
        });
    }
}
