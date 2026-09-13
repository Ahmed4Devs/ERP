<?php

namespace App\Modules\Sales\Services;

use App\Modules\Accounting\Models\ServiceInvoice;
use App\Modules\MasterData\Models\Party;

class CustomerCreditService
{
    /**
     * Calculate total outstanding balance for a customer in a specific company.
     */
    public function getOutstandingBalance(Party $customer, string $companyId): float
    {
        return (float) ServiceInvoice::where('company_id', $companyId)
            ->where('party_id', $customer->id)
            ->whereIn('status', ['posted', 'partially_paid'])
            ->sum('balance_due');
    }

    /**
     * Check if customer credit limit is exceeded or approaching limit.
     *
     * @return array{
     *     credit_limit: float,
     *     current_balance: float,
     *     projected_balance: float,
     *     available_credit: float,
     *     is_exceeded: bool,
     *     utilization_percent: float,
     *     has_credit_limit: bool
     * }
     */
    public function checkCreditLimit(Party $customer, string $companyId, float $additionalAmount = 0.0): array
    {
        $profile = $customer->customerProfiles()
            ->where('company_id', $companyId)
            ->first();

        $creditLimit = $profile ? (float) $profile->credit_limit : 0.0;
        $currentBalance = $this->getOutstandingBalance($customer, $companyId);
        $projectedBalance = $currentBalance + $additionalAmount;

        $hasCreditLimit = $creditLimit > 0.0;
        $isExceeded = $hasCreditLimit && ($projectedBalance > $creditLimit);
        $availableCredit = $hasCreditLimit ? max(0.0, $creditLimit - $currentBalance) : 0.0;
        $utilizationPercent = ($hasCreditLimit && $creditLimit > 0)
            ? min(100.0, round(($currentBalance / $creditLimit) * 100, 1))
            : 0.0;

        return [
            'credit_limit' => $creditLimit,
            'current_balance' => $currentBalance,
            'projected_balance' => $projectedBalance,
            'available_credit' => $availableCredit,
            'is_exceeded' => $isExceeded,
            'utilization_percent' => $utilizationPercent,
            'has_credit_limit' => $hasCreditLimit,
        ];
    }
}
