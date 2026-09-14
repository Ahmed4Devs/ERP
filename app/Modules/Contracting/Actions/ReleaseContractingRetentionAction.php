<?php

namespace App\Modules\Contracting\Actions;

use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\ServiceInvoice;
use App\Modules\Accounting\Models\ServiceInvoiceLine;
use App\Modules\Contracting\Models\ContractingClaim;
use App\Modules\Organization\Models\Branch;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;

class ReleaseContractingRetentionAction
{
    /**
     * Release contractual retention guarantee upon project completion/final handover.
     *
     * @param array{
     *     project_id: string,
     *     customer_id: string,
     *     amount: numeric|string,
     *     claim_number?: string|null,
     *     release_date?: string|null,
     *     notes?: string|null
     * } $data
     */
    public function execute(array $data): ContractingClaim
    {
        return DB::transaction(function () use ($data) {
            $companyId = app(CurrentCompany::class)->id();
            $tenantId = app(CurrentTenant::class)->id();

            $releaseAmount = number_format((float) $data['amount'], 6, '.', '');
            if (bccomp($releaseAmount, '0.000000', 6) <= 0) {
                throw new InvalidArgumentException('Retention release amount must be strictly greater than zero.');
            }

            $date = $data['release_date'] ?? now()->toDateString();
            $claimNumber = $data['claim_number'] ?? ('RET-REL-'.date('Ymd').'-'.strtoupper(Str::random(4)));

            // Locate or create Retention Receivable Account (1250)
            $retentionAccount = Account::firstOrCreate(
                ['company_id' => $companyId, 'code' => '1250'],
                [
                    'tenant_id' => $tenantId,
                    'name' => 'Contract Retention Receivable',
                    'name_ar' => 'محتجزات ضمان أعمال مدينة',
                    'type' => 'asset',
                    'subtype' => 'other_current_asset',
                    'is_postable' => true,
                ]
            );

            // Locate branch
            $branch = Branch::where('company_id', $companyId)->first();
            $branchId = $branch ? $branch->id : null;

            $invoiceNumber = 'INV-RET-'.date('Ymd').'-'.strtoupper(Str::random(6));

            // Generate Service Invoice for Retention Release
            // In Saudi Arabia, retention release bills the previously certified amount against the Retention account
            $invoice = ServiceInvoice::create([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'branch_id' => $branchId,
                'party_id' => $data['customer_id'],
                'invoice_number' => $invoiceNumber,
                'date' => $date,
                'due_date' => now()->addDays(30)->toDateString(),
                'status' => 'draft',
                'subtotal' => $releaseAmount,
                'tax_rate' => '0.000000', // VAT was already assessed on the certified progress claims
                'tax_amount' => '0.000000',
                'total' => $releaseAmount,
                'amount_paid' => '0.000000',
                'balance_due' => $releaseAmount,
                'currency' => 'SAR',
                'notes' => "Final Handover Retention Release [{$claimNumber}]",
            ]);

            ServiceInvoiceLine::create([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'service_invoice_id' => $invoice->id,
                'description' => "استرداد وفك محتجزات ضمان الأعمال (Retention Release) - مستخلص رقم [{$claimNumber}]",
                'quantity' => '1.000000',
                'unit_price' => $releaseAmount,
                'tax_rate' => '0.000000',
                'tax_amount' => '0.000000',
                'line_total' => $releaseAmount,
                'revenue_account_id' => $retentionAccount->id, // Credits the Retention Receivable asset
            ]);

            $claim = ContractingClaim::create([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'claim_number' => $claimNumber,
                'claim_type' => 'retention_release',
                'project_id' => $data['project_id'],
                'customer_id' => $data['customer_id'],
                'claim_date' => $date,
                'contract_value' => '0.000000',
                'previous_billed_amount' => '0.000000',
                'current_work_amount' => '0.000000',
                'cumulative_work_amount' => '0.000000',
                'completion_percentage' => '1.0000',
                'retention_rate' => '0.0000',
                'retention_amount' => '0.0000',
                'cumulative_retention_amount' => '0.0000',
                'advance_payment_deduction_rate' => '0.0000',
                'advance_payment_deduction_amount' => '0.0000',
                'net_claim_amount' => $releaseAmount,
                'tax_rate' => '0.0000',
                'tax_amount' => '0.000000',
                'total_amount' => $releaseAmount,
                'is_retention_release' => true,
                'status' => 'billed',
                'invoice_id' => $invoice->id,
                'retention_account_id' => $retentionAccount->id,
                'notes' => $data['notes'] ?? 'مستخلص فك واسترداد ضمان الأعمال عند الاستلام النهائي للمشروع',
            ]);

            return $claim->load(['project', 'customer', 'invoice', 'retentionAccount']);
        });
    }
}
