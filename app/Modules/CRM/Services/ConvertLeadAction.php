<?php

namespace App\Modules\CRM\Services;

use App\Modules\CRM\Models\Lead;
use App\Modules\MasterData\Models\CustomerProfile;
use App\Modules\MasterData\Models\Party;
use App\Modules\Sales\Models\SalesQuotation;
use App\Modules\Sales\Models\SalesQuotationLine;
use Illuminate\Support\Facades\DB;

class ConvertLeadAction
{
    /**
     * Convert a Lead into a Party Customer and an initial draft Sales Quotation.
     *
     * @return array{party: Party, quotation: ?SalesQuotation, lead: Lead}
     */
    public function execute(Lead $lead): array
    {
        return DB::transaction(function () use ($lead) {
            $party = null;

            if ($lead->party_id) {
                $party = Party::find($lead->party_id);
            }

            if (! $party) {
                $party = Party::create([
                    'tenant_id' => $lead->tenant_id,
                    'name' => $lead->company_name ?: $lead->contact_name,
                    'name_ar' => $lead->company_name ?: $lead->contact_name,
                    'type' => 'customer',
                    'email' => $lead->email,
                    'phone' => $lead->phone,
                    'status' => 'active',
                ]);

                CustomerProfile::create([
                    'tenant_id' => $lead->tenant_id,
                    'company_id' => $lead->company_id,
                    'party_id' => $party->id,
                    'credit_limit' => '10000.000000',
                    'payment_terms_days' => 30,
                    'currency' => 'SAR',
                    'is_active' => true,
                ]);

                $lead->party_id = $party->id;
            }

            $quotation = null;
            $estValue = (string) ($lead->estimated_value ?? '0.000000');
            if (bccomp($estValue, '0.000000', 6) > 0) {
                $subtotal = $estValue;
                $taxAmount = bcmul($subtotal, '0.100000', 6);
                $totalAmount = bcadd($subtotal, $taxAmount, 6);

                $quoteNumber = 'QT-'.date('Ymd').'-'.strtoupper(substr(uniqid(), -4));

                $quotation = SalesQuotation::create([
                    'tenant_id' => $lead->tenant_id,
                    'company_id' => $lead->company_id,
                    'quote_number' => $quoteNumber,
                    'lead_id' => $lead->id,
                    'customer_id' => $party->id,
                    'issue_date' => now()->toDateString(),
                    'valid_until' => now()->addDays(30)->toDateString(),
                    'subtotal' => $subtotal,
                    'tax_rate' => '0.100000',
                    'tax_amount' => $taxAmount,
                    'discount_amount' => '0.000000',
                    'total_amount' => $totalAmount,
                    'status' => 'draft',
                    'notes' => 'Generated automatically from converted CRM Lead: '.$lead->title,
                ]);

                SalesQuotationLine::create([
                    'tenant_id' => $lead->tenant_id,
                    'company_id' => $lead->company_id,
                    'quotation_id' => $quotation->id,
                    'description' => $lead->title,
                    'quantity' => '1.000000',
                    'unit_price' => $subtotal,
                    'discount_amount' => '0.000000',
                    'tax_amount' => $taxAmount,
                    'line_total' => $totalAmount,
                ]);
            }

            $lead->status = 'won';
            $lead->probability_percent = 100;
            $lead->converted_at = now();
            $lead->save();

            return [
                'party' => $party,
                'quotation' => $quotation,
                'lead' => $lead,
            ];
        });
    }
}
