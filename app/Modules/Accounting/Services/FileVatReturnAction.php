<?php

namespace App\Modules\Accounting\Services;

use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\VatReturn;
use App\Modules\Platform\Services\AuditLogger;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class FileVatReturnAction
{
    public function __construct(
        protected PostingEngine $postingEngine
    ) {}

    /**
     * File and finalize a VAT return with an optional settlement journal entry.
     */
    public function execute(VatReturn $vatReturn, int $userId): VatReturn
    {
        if ($vatReturn->status === 'filed') {
            throw new InvalidArgumentException("VAT Return {$vatReturn->return_number} is already filed.");
        }

        return DB::transaction(function () use ($vatReturn, $userId) {
            $companyId = $vatReturn->company_id;
            $tenantId = $vatReturn->tenant_id;
            $finalNetPayable = (string) $vatReturn->final_net_payable;

            // Generate tax settlement GL entry if net payable != 0
            if (bccomp($finalNetPayable, '0.000000', 2) > 0) {
                $taxLiabilityAccount = Account::where('company_id', $companyId)
                    ->where(function ($q): void {
                        $q->where('code', '2150')->orWhere('subtype', 'tax_payable');
                    })
                    ->first();

                // Settlement / Clearing or AP Payable
                $payableAccount = Account::where('company_id', $companyId)
                    ->where(function ($q): void {
                        $q->where('code', '2000')->orWhere('subtype', 'payable');
                    })
                    ->first();

                if ($taxLiabilityAccount && $payableAccount) {
                    $journalEntry = $this->postingEngine->post([
                        'tenant_id' => $tenantId,
                        'company_id' => $companyId,
                        'date' => now()->toDateString(),
                        'description' => "VAT Return Settlement {$vatReturn->return_number} [{$vatReturn->tax_period}]",
                        'source_type' => VatReturn::class,
                        'source_id' => $vatReturn->id,
                        'lines' => [
                            // Debit Tax Liability to close out liability
                            [
                                'account_id' => $taxLiabilityAccount->id,
                                'debit' => $finalNetPayable,
                                'credit' => '0.000000',
                                'description' => "Clear VAT Liability: {$vatReturn->tax_period}",
                            ],
                            // Credit Tax Payable / ZATCA Payable
                            [
                                'account_id' => $payableAccount->id,
                                'debit' => '0.000000',
                                'credit' => $finalNetPayable,
                                'description' => "ZATCA Tax Return Payable: {$vatReturn->return_number}",
                            ],
                        ],
                    ]);

                    $vatReturn->journal_entry_id = $journalEntry->id;
                }
            }

            $vatReturn->status = 'filed';
            $vatReturn->filing_date = now()->toDateString();
            $vatReturn->filed_by = $userId;
            $vatReturn->save();

            AuditLogger::log(
                'accounting.vat_return.filed',
                VatReturn::class,
                $vatReturn->id,
                [
                    'return_number' => $vatReturn->return_number,
                    'tax_period' => $vatReturn->tax_period,
                    'final_net_payable' => $finalNetPayable,
                    'filed_by' => $userId,
                ]
            );

            return $vatReturn->load(['company', 'filedByUser', 'journalEntry.lines.account']);
        });
    }
}
