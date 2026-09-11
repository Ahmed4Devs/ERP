<?php

namespace App\Modules\Accounting\Queries;

use App\Modules\Accounting\Models\ServiceInvoice;
use App\Shared\Context\CurrentCompany;
use Carbon\Carbon;

class AccountsReceivableAgingQuery
{
    /**
     * Compute Accounts Receivable Aging report grouped by customer.
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

        $invoices = ServiceInvoice::where('service_invoices.company_id', $companyId)
            ->whereIn('service_invoices.status', ['posted', 'partially_paid'])
            ->with('party')
            ->get();

        $customers = [];

        foreach ($invoices as $inv) {
            $partyId = $inv->party_id;
            $partyName = $inv->party?->name ?? 'Unknown Customer';
            $partyNameAr = $inv->party?->name_ar;

            if (! isset($customers[$partyId])) {
                $customers[$partyId] = [
                    'party_id' => $partyId,
                    'party_name' => $partyName,
                    'party_name_ar' => $partyNameAr,
                    'current' => '0.000000',
                    'days_31_60' => '0.000000',
                    'days_61_90' => '0.000000',
                    'days_over_90' => '0.000000',
                    'total' => '0.000000',
                ];
            }

            $dueDate = Carbon::parse($inv->due_date);
            $daysOverdue = $asOf->diffInDays($dueDate, false); // negative if past due
            $balance = (string) $inv->balance_due;

            $customers[$partyId]['total'] = bcadd($customers[$partyId]['total'], $balance, 6);

            if ($daysOverdue >= -30) {
                // Not overdue or <= 30 days overdue
                $customers[$partyId]['current'] = bcadd($customers[$partyId]['current'], $balance, 6);
            } elseif ($daysOverdue >= -60) {
                $customers[$partyId]['days_31_60'] = bcadd($customers[$partyId]['days_31_60'], $balance, 6);
            } elseif ($daysOverdue >= -90) {
                $customers[$partyId]['days_61_90'] = bcadd($customers[$partyId]['days_61_90'], $balance, 6);
            } else {
                $customers[$partyId]['days_over_90'] = bcadd($customers[$partyId]['days_over_90'], $balance, 6);
            }
        }

        return array_values($customers);
    }
}
