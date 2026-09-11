<?php

namespace App\Modules\Assets\Services;

use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Services\PostingEngine;
use App\Modules\Assets\Models\AssetDepreciationEntry;
use App\Modules\Assets\Models\AssetDepreciationRun;
use App\Modules\Assets\Models\FixedAsset;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use RuntimeException;

class PostAssetDepreciationRunAction
{
    public function __construct(
        private PostingEngine $postingEngine
    ) {}

    /**
     * Compute and post monthly straight-line depreciation for all active fixed assets.
     * DR 5300 Depreciation Expense
     * CR 1590 Accumulated Depreciation
     */
    public function execute(string $companyId, string $tenantId, int $year, int $month, string $date, ?string $notes = null): AssetDepreciationRun
    {
        $existing = AssetDepreciationRun::where('company_id', $companyId)
            ->where('period_year', $year)
            ->where('period_month', $month)
            ->first();

        if ($existing) {
            throw new InvalidArgumentException("An asset depreciation run for {$year}-".str_pad((string) $month, 2, '0', STR_PAD_LEFT).' already exists.');
        }

        $defaultExpenseAcc = Account::where('company_id', $companyId)->where('code', '5300')->first();
        $defaultAccumulatedAcc = Account::where('company_id', $companyId)->where('code', '1590')->first();

        if (! $defaultExpenseAcc || ! $defaultAccumulatedAcc) {
            throw new RuntimeException('Default depreciation accounts (5300 and 1590) not found for company.');
        }

        $assets = FixedAsset::with('category')
            ->where('company_id', $companyId)
            ->where('status', 'active')
            ->where('in_service_date', '<=', $date)
            ->get();

        if ($assets->isEmpty()) {
            throw new InvalidArgumentException('No active in-service assets found for depreciation run.');
        }

        return DB::transaction(function () use ($companyId, $tenantId, $year, $month, $date, $notes, $assets, $defaultExpenseAcc, $defaultAccumulatedAcc): AssetDepreciationRun {
            $runNumber = sprintf('DEP-%d-%02d', $year, $month);

            $run = AssetDepreciationRun::create([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'run_number' => $runNumber,
                'period_month' => $month,
                'period_year' => $year,
                'date' => $date,
                'total_depreciation' => '0.000000',
                'status' => 'posted',
                'notes' => $notes,
            ]);

            $totalDepreciation = '0.000000';
            $glDebits = []; // account_id => amount
            $glCredits = []; // account_id => amount

            foreach ($assets as $asset) {
                $deprAmount = $asset->calculateMonthlyDepreciation();

                if (bccomp($deprAmount, '0.000000', 6) <= 0) {
                    continue;
                }

                $priorAccum = (string) $asset->accumulated_depreciation;
                $newAccum = bcadd($priorAccum, $deprAmount, 6);
                $newNbv = bcsub((string) $asset->net_book_value, $deprAmount, 6);

                AssetDepreciationEntry::create([
                    'tenant_id' => $tenantId,
                    'company_id' => $companyId,
                    'depreciation_run_id' => $run->id,
                    'fixed_asset_id' => $asset->id,
                    'amount' => $deprAmount,
                    'prior_accumulated_depreciation' => $priorAccum,
                    'new_accumulated_depreciation' => $newAccum,
                    'new_net_book_value' => $newNbv,
                ]);

                $asset->accumulated_depreciation = $newAccum;
                $asset->net_book_value = $newNbv;

                if (bccomp($newNbv, (string) $asset->salvage_value, 6) <= 0) {
                    $asset->status = 'fully_depreciated';
                }
                $asset->save();

                $totalDepreciation = bcadd($totalDepreciation, $deprAmount, 6);

                // Determine GL accounts
                $expenseAccountId = $asset->depreciation_expense_account_id
                    ?? $asset->category?->depreciation_expense_account_id
                    ?? $defaultExpenseAcc->id;

                $accumulatedAccountId = $asset->accumulated_depreciation_account_id
                    ?? $asset->category?->accumulated_depreciation_account_id
                    ?? $defaultAccumulatedAcc->id;

                $glDebits[$expenseAccountId] = bcadd($glDebits[$expenseAccountId] ?? '0.000000', $deprAmount, 6);
                $glCredits[$accumulatedAccountId] = bcadd($glCredits[$accumulatedAccountId] ?? '0.000000', $deprAmount, 6);
            }

            if (bccomp($totalDepreciation, '0.000000', 6) <= 0) {
                throw new InvalidArgumentException('Depreciation amount computed to zero across all assets.');
            }

            $lines = [];
            foreach ($glDebits as $accId => $amt) {
                $lines[] = [
                    'account_id' => $accId,
                    'debit' => $amt,
                    'credit' => '0.000000',
                    'description' => "Fixed Asset Depreciation Expense - {$runNumber}",
                ];
            }

            foreach ($glCredits as $accId => $amt) {
                $lines[] = [
                    'account_id' => $accId,
                    'debit' => '0.000000',
                    'credit' => $amt,
                    'description' => "Accumulated Depreciation - {$runNumber}",
                ];
            }

            $journal = $this->postingEngine->post([
                'company_id' => $companyId,
                'tenant_id' => $tenantId,
                'date' => $date,
                'entry_type' => 'depreciation',
                'description' => "Monthly Depreciation Run for {$year}-{$month} ({$runNumber})",
                'reference' => $runNumber,
                'idempotency_key' => "depreciation_post_{$run->id}",
                'lines' => $lines,
            ]);

            $run->update([
                'total_depreciation' => $totalDepreciation,
                'journal_entry_id' => $journal->id,
            ]);

            return $run->refresh();
        });
    }
}
