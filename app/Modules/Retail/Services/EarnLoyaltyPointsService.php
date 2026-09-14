<?php

namespace App\Modules\Retail\Services;

use App\Modules\Retail\Models\LoyaltyAccount;
use App\Modules\Retail\Models\LoyaltyTransaction;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class EarnLoyaltyPointsService
{
    /**
     * Accrue loyalty points for a qualifying customer purchase.
     */
    public function execute(
        LoyaltyAccount $account,
        string|float $spendAmount,
        ?string $referenceType = null,
        ?string $referenceId = null,
        ?string $notes = null,
        ?int $userId = null
    ): array {
        if ($account->status !== 'active') {
            throw new InvalidArgumentException(__('Loyalty account is not active.'));
        }

        $program = $account->program;
        if (! $program || ! $program->is_active) {
            throw new InvalidArgumentException(__('Active loyalty program not found.'));
        }

        $points = $program->calculatePointsForSpend($spendAmount, $account->currentTier);

        if ($points <= 0) {
            return [
                'account' => $account,
                'points_earned' => 0,
                'transaction' => null,
            ];
        }

        return DB::transaction(function () use ($account, $program, $points, $spendAmount, $referenceType, $referenceId, $notes, $userId) {
            $account->points_balance += $points;
            $account->lifetime_points_earned += $points;
            $account->save();

            $monetaryValue = $program->calculateDiscountForPoints($points);

            $transaction = LoyaltyTransaction::create([
                'tenant_id' => $account->tenant_id,
                'company_id' => $account->company_id,
                'loyalty_account_id' => $account->id,
                'transaction_type' => 'earn',
                'points' => $points,
                'balance_after' => $account->points_balance,
                'spend_amount' => $spendAmount,
                'monetary_equivalent' => $monetaryValue,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'notes' => $notes ?? "Earned {$points} points on spend of {$spendAmount} SAR",
                'created_by_user_id' => $userId,
            ]);

            // Auto-advance tier if threshold reached
            $account->refreshTierStatus();

            return [
                'account' => $account->fresh(['currentTier', 'program']),
                'points_earned' => $points,
                'transaction' => $transaction,
            ];
        });
    }
}
