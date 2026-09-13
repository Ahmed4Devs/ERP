<?php

namespace App\Modules\Assets\Services;

use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Services\PostingEngine;
use App\Modules\Assets\Models\FixedAssetDisposal;
use App\Modules\Platform\Services\AuditLogger;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class PostAssetDisposalAction
{
    public function __construct(
        protected PostingEngine $postingEngine
    ) {}

    /**
     * Post a Fixed Asset Disposal/Scrap, generating GL journal entries to clear original cost,
     * eliminate accumulated depreciation, recognize cash/bank proceeds, and record Capital Gain or Loss.
     */
    public function execute(FixedAssetDisposal $disposal, ?int $userId = null): FixedAssetDisposal
    {
        if ($disposal->status === 'posted') {
            throw new InvalidArgumentException('Fixed asset disposal is already posted.');
        }

        return DB::transaction(function () use ($disposal, $userId): FixedAssetDisposal {
            $companyId = $disposal->company_id;
            $tenantId = $disposal->tenant_id;
            $asset = $disposal->asset;
            $date = $disposal->disposal_date->toDateString();

            $cost = (string) $disposal->acquisition_cost;
            $accumDep = (string) $disposal->accumulated_depreciation;
            $proceeds = (string) $disposal->proceeds;
            $gainLoss = (string) $disposal->gain_loss_amount;
            $gainLossType = $disposal->gain_loss_type;

            $glLines = [];

            // 1. Debit: Clear Accumulated Depreciation
            if (bccomp($accumDep, '0.000000', 6) > 0) {
                $glLines[] = [
                    'account_id' => $asset->accumulated_depreciation_account_id,
                    'debit' => $accumDep,
                    'credit' => '0.000000',
                    'description' => "Clear Accumulated Depreciation on Disposal - Asset: {$asset->name} ({$asset->asset_tag})",
                ];
            }

            // 2. Debit: Cash/Bank proceeds if asset sold
            if (bccomp($proceeds, '0.000000', 6) > 0) {
                $bankAccountId = $disposal->bank_account_id;
                if (! $bankAccountId) {
                    $defaultBank = Account::where('company_id', $companyId)->whereIn('code', ['1020', '1010'])->firstOrFail();
                    $bankAccountId = $defaultBank->id;
                }

                $glLines[] = [
                    'account_id' => $bankAccountId,
                    'debit' => $proceeds,
                    'credit' => '0.000000',
                    'description' => "Disposal / Sale Proceeds received for Asset {$asset->name} ({$asset->asset_tag})",
                ];
            }

            // 3. Debit Loss on Disposal (if loss)
            if ($gainLossType === 'loss' && bccomp($gainLoss, '0.000000', 6) > 0) {
                $lossAccount = Account::firstOrCreate(
                    ['company_id' => $companyId, 'code' => '5300'],
                    [
                        'tenant_id' => $tenantId,
                        'name' => 'Loss on Asset Disposal & Scrap',
                        'name_ar' => 'خسائر رأسمالية واستبعاد أصول ثابتة',
                        'type' => 'expense',
                        'subtype' => 'other_expense',
                    ]
                );

                $glLines[] = [
                    'account_id' => $lossAccount->id,
                    'debit' => $gainLoss,
                    'credit' => '0.000000',
                    'description' => "Net Loss on Asset Disposal/Scrap - {$asset->name}",
                ];
            }

            // 4. Credit: Remove Asset Acquisition Cost from Asset GL Account
            $glLines[] = [
                'account_id' => $asset->asset_account_id,
                'debit' => '0.000000',
                'credit' => $cost,
                'description' => "Deregister Asset Cost on Disposal - {$asset->name} ({$asset->asset_tag})",
            ];

            // 5. Credit Gain on Disposal (if gain)
            if ($gainLossType === 'gain' && bccomp($gainLoss, '0.000000', 6) > 0) {
                $gainAccount = Account::firstOrCreate(
                    ['company_id' => $companyId, 'code' => '4300'],
                    [
                        'tenant_id' => $tenantId,
                        'name' => 'Gain on Asset Disposal',
                        'name_ar' => 'أرباح رأسمالية من بيع واستبعاد أصول',
                        'type' => 'revenue',
                        'subtype' => 'other_income',
                    ]
                );

                $glLines[] = [
                    'account_id' => $gainAccount->id,
                    'debit' => '0.000000',
                    'credit' => $gainLoss,
                    'description' => "Capital Gain on Asset Disposal - {$asset->name}",
                ];
            }

            $journal = $this->postingEngine->post([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'date' => $date,
                'description' => "Fixed Asset Disposal {$disposal->disposal_number} - {$asset->name} ({$disposal->disposal_type})",
                'source_type' => 'fixed_asset_disposal',
                'source_id' => $disposal->id,
                'idempotency_key' => "fad_{$disposal->id}",
                'lines' => $glLines,
            ]);

            // Update Asset status to disposed and zero net book value
            $asset->update([
                'status' => 'disposed',
                'net_book_value' => '0.000000',
            ]);

            $disposal->update([
                'status' => 'posted',
                'journal_entry_id' => $journal->id,
                'posted_at' => now(),
                'posted_by' => $userId,
            ]);

            AuditLogger::log(
                action: 'fixed_asset.disposed',
                entityType: FixedAssetDisposal::class,
                entityId: $disposal->id,
                newValues: [
                    'disposal_number' => $disposal->disposal_number,
                    'asset_id' => $asset->id,
                    'disposal_type' => $disposal->disposal_type,
                    'net_book_value' => $disposal->net_book_value,
                    'proceeds' => $disposal->proceeds,
                    'gain_loss_amount' => $disposal->gain_loss_amount,
                    'gain_loss_type' => $disposal->gain_loss_type,
                    'journal_entry_id' => $journal->id,
                ]
            );

            return $disposal->fresh(['asset.category', 'bankAccount', 'journalEntry.lines.account']);
        });
    }
}
