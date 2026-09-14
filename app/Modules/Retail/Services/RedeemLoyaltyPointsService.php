<?php

namespace App\Modules\Retail\Services;

use App\Modules\Retail\Models\LoyaltyAccount;
use App\Modules\Retail\Models\LoyaltyTransaction;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class RedeemLoyaltyPointsService
{
    /**
     * Redeem loyalty points for an immediate checkout or invoice discount.
     */
    public function execute(
        LoyaltyAccount $account,
        int $pointsToRedeem,
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

        if ($pointsToRedeem <= 0) {
            throw new InvalidArgumentException(__('Points to redeem must be greater than zero.'));
        }

        if ($pointsToRedeem < $program->min_points_to_redeem) {
            throw new InvalidArgumentException(__(
                'Minimum points required for redemption is :min points.',
                ['min' => $program->min_points_to_redeem]
            ));
        }

        if ($pointsToRedeem > $account->points_balance) {
            throw new InvalidArgumentException(__(
                'Insufficient points balance. Available: :available, requested: :requested.',
                ['available' => $account->points_balance, 'requested' => $pointsToRedeem]
            ));
        }

        return DB::transaction(function () use ($account, $program, $pointsToRedeem, $referenceType, $referenceId, $notes, $userId) {
            $discountAmount = $program->calculateDiscountForPoints($pointsToRedeem);

            $account->points_balance -= $pointsToRedeem;
            $account->lifetime_points_redeemed += $pointsToRedeem;
            $account->save();

            $transaction = LoyaltyTransaction::create([
                'tenant_id' => $account->tenant_id,
                'company_id' => $account->company_id,
                'loyalty_account_id' => $account->id,
                'transaction_type' => 'redeem',
                'points' => -$pointsToRedeem,
                'balance_after' => $account->points_balance,
                'spend_amount' => null,
                'monetary_equivalent' => $discountAmount,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'notes' => $notes ?? "Redeemed {$pointsToRedeem} points for {$discountAmount} SAR discount",
                'created_by_user_id' => $userId,
            ]);

            return [
                'account' => $account->fresh(['currentTier', 'program']),
                'points_redeemed' => $pointsToRedeem,
                'discount_amount' => $discountAmount,
                'transaction' => $transaction,
            ];
        });
    }
}
