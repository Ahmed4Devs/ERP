<?php

namespace App\Modules\Contracts\Services;

use App\Modules\Accounting\Models\ServiceInvoice;
use App\Modules\Accounting\Services\PostServiceInvoiceAction;
use App\Modules\Contracts\Models\Contract;
use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Models\Tenant;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class GenerateContractBillingInvoiceAction
{
    public function __construct(
        protected PostServiceInvoiceAction $postServiceInvoiceAction
    ) {}

    /**
     * Generate an official posted service invoice for an active recurring contract and advance its next billing date.
     */
    public function execute(Contract $contract, ?string $billingDate = null): ServiceInvoice
    {
        if ($contract->status !== 'active') {
            throw new InvalidArgumentException("Cannot generate billing invoice for contract in '{$contract->status}' status.");
        }

        $currentTenant = app(CurrentTenant::class);
        $currentCompany = app(CurrentCompany::class);

        if (! $currentTenant->check()) {
            $tenant = Tenant::find($contract->tenant_id);
            $currentTenant->set($tenant);
        }

        if (! $currentCompany->check()) {
            $company = Company::find($contract->company_id);
            $currentCompany->set($company);
        }

        return DB::transaction(function () use ($contract, $billingDate) {
            $effectiveDate = $billingDate ?? ($contract->next_billing_date ? $contract->next_billing_date->toDateString() : now()->toDateString());
            $dueDate = Carbon::parse($effectiveDate)->addDays(30)->toDateString();

            $contract->loadMissing('lines');

            $lines = [];
            if ($contract->lines->isNotEmpty()) {
                foreach ($contract->lines as $line) {
                    $lines[] = [
                        'description' => $line->description,
                        'quantity' => (string) $line->quantity,
                        'unit_price' => (string) $line->unit_price,
                    ];
                }
            } else {
                $lines[] = [
                    'description' => "Contract {$contract->contract_number} - {$contract->title} ({$contract->billing_cycle})",
                    'quantity' => '1.000000',
                    'unit_price' => (string) $contract->recurring_amount,
                ];
            }

            $invoice = $this->postServiceInvoiceAction->execute([
                'party_id' => $contract->customer_id,
                'date' => $effectiveDate,
                'due_date' => $dueDate,
                'notes' => "Recurring subscription billing for contract {$contract->contract_number} ({$contract->title})",
                'lines' => $lines,
            ]);

            // Advance next billing date according to cycle
            $currentNextDate = Carbon::parse($effectiveDate);
            $newNextDate = match ($contract->billing_cycle) {
                'quarterly' => $currentNextDate->copy()->addMonths(3),
                'semi_annual' => $currentNextDate->copy()->addMonths(6),
                'annual' => $currentNextDate->copy()->addYear(),
                default => $currentNextDate->copy()->addMonth(), // monthly
            };

            $contract->last_billed_at = $effectiveDate;
            $contract->next_billing_date = $newNextDate->toDateString();

            // Check expiration if not auto renew
            if ($contract->end_date && Carbon::parse($newNextDate)->greaterThan($contract->end_date)) {
                if (! $contract->auto_renew) {
                    $contract->status = 'expired';
                }
            }

            $contract->save();

            return $invoice;
        });
    }
}
