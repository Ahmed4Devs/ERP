<?php

namespace App\Modules\Purchasing\Queries;

use App\Modules\Purchasing\Models\VendorBill;
use App\Shared\Context\CurrentCompany;
use Carbon\Carbon;

class AccountsPayableAgingQuery
{
    /**
     * Compute Accounts Payable Aging report grouped by vendor.
     *
     * @return array<int, array{
     *     party_id: string,
     *     party_name: string,
     *     party_name_ar: string|null,
     *     current: string,
     *     days_31_60: string,
     *     days_61_90: string,
     *     days_over_90: string,
     *     total: string
     * }>
     */
    public function execute(?string $asOfDate = null): array
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $asOf = $asOfDate ? Carbon::parse($asOfDate) : Carbon::today();

        $bills = VendorBill::where('vendor_bills.company_id', $companyId)
            ->whereIn('vendor_bills.status', ['posted', 'partially_paid'])
            ->with(['party.vendorProfiles'])
            ->get();

        $vendors = [];

        foreach ($bills as $bill) {
            $partyId = $bill->party_id;
            $partyName = $bill->party?->name ?? 'Unknown Vendor';
            $partyNameAr = $bill->party?->name_ar;
            $vendorProfile = $bill->party?->vendorProfiles?->firstWhere('company_id', $companyId);
            $vendorId = $vendorProfile?->id ?? $partyId;

            if (! isset($vendors[$partyId])) {
                $vendors[$partyId] = [
                    'party_id' => $partyId,
                    'vendor_id' => $vendorId,
                    'party_name' => $partyName,
                    'vendor_name' => $partyName,
                    'party_name_ar' => $partyNameAr,
                    'vendor_name_ar' => $partyNameAr,
                    'current' => '0.000000',
                    'days_31_60' => '0.000000',
                    'days_61_90' => '0.000000',
                    'days_over_90' => '0.000000',
                    'total' => '0.000000',
                ];
            }

            $dueDate = Carbon::parse($bill->due_date);
            $daysOverdue = $asOf->diffInDays($dueDate, false); // negative if past due
            $balance = (string) $bill->balance_due;

            $vendors[$partyId]['total'] = bcadd($vendors[$partyId]['total'], $balance, 6);

            if ($daysOverdue >= -30) {
                // Not overdue or <= 30 days overdue
                $vendors[$partyId]['current'] = bcadd($vendors[$partyId]['current'], $balance, 6);
            } elseif ($daysOverdue >= -60) {
                $vendors[$partyId]['days_31_60'] = bcadd($vendors[$partyId]['days_31_60'], $balance, 6);
            } elseif ($daysOverdue >= -90) {
                $vendors[$partyId]['days_61_90'] = bcadd($vendors[$partyId]['days_61_90'], $balance, 6);
            } else {
                $vendors[$partyId]['days_over_90'] = bcadd($vendors[$partyId]['days_over_90'], $balance, 6);
            }
        }

        return array_values($vendors);
    }
}
