<?php

namespace App\Modules\Trade\Services;

use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Services\PostingEngine;
use App\Modules\Trade\Models\DeliveryTrip;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class SettleTripCodAction
{
    public function __construct(
        protected ?PostingEngine $postingEngine = null
    ) {
        $this->postingEngine = $postingEngine ?? app(PostingEngine::class);
    }

    /**
     * Reconcile and settle driver's collected Cash on Delivery (COD):
     * DR 1010 (Cash on Hand / الخزينة الرئيسية)
     * CR 1030 (Accounts Receivable / المدينون التجاريون)
     */
    public function execute(DeliveryTrip $trip, ?int $userId = null): DeliveryTrip
    {
        if ($trip->cod_settlement_status === 'settled') {
            throw new InvalidArgumentException(__('Trip [:trip] COD collections are already settled.', ['trip' => $trip->trip_number]));
        }

        return DB::transaction(function () use ($trip) {
            $companyId = $trip->company_id;
            $tenantId = $trip->tenant_id;
            $totalCollected = (float) $trip->total_cod_collected;
            $totalCollectedStr = number_format($totalCollected, 6, '.', '');

            if ($totalCollected > 0) {
                // 1. Ensure Cash on Hand Account (1010)
                $cashAccount = Account::where('company_id', $companyId)->where('code', '1010')->first()
                    ?? Account::where('company_id', $companyId)->where('type', 'asset')->where('subtype', 'cash')->first();

                if (! $cashAccount) {
                    $cashAccount = Account::create([
                        'company_id' => $companyId,
                        'tenant_id' => $tenantId,
                        'code' => '1010',
                        'name' => 'Main Cash Treasury',
                        'name_ar' => 'صندوق الخزينة الرئيسية',
                        'type' => 'asset',
                        'subtype' => 'cash',
                        'currency' => 'SAR',
                        'is_postable' => true,
                        'is_system' => true,
                        'current_balance' => '0.000000',
                    ]);
                }
                if (! $cashAccount->is_postable) {
                    $cashAccount->update(['is_postable' => true]);
                }

                // 2. Ensure Accounts Receivable (1030)
                $arAccount = Account::where('company_id', $companyId)->where('code', '1030')->first()
                    ?? Account::where('company_id', $companyId)->where('type', 'asset')->where('subtype', 'receivable')->first();

                if (! $arAccount) {
                    $arAccount = Account::create([
                        'company_id' => $companyId,
                        'tenant_id' => $tenantId,
                        'code' => '1030',
                        'name' => 'Accounts Receivable',
                        'name_ar' => 'المدينون التجاريون والعملاء',
                        'type' => 'asset',
                        'subtype' => 'receivable',
                        'is_postable' => true,
                        'is_system' => true,
                        'current_balance' => '0.000000',
                    ]);
                }
                if (! $arAccount->is_postable) {
                    $arAccount->update(['is_postable' => true]);
                }

                $lines = [
                    [
                        'account_id' => $cashAccount->id,
                        'debit' => $totalCollectedStr,
                        'credit' => '0.000000',
                        'description' => "Cash collected by driver {$trip->driver->name} for trip {$trip->trip_number}",
                    ],
                    [
                        'account_id' => $arAccount->id,
                        'debit' => '0.000000',
                        'credit' => $totalCollectedStr,
                        'description' => "Customer receivable settlement for trip {$trip->trip_number}",
                    ],
                ];

                $journalEntry = $this->postingEngine->post([
                    'tenant_id' => $tenantId,
                    'company_id' => $companyId,
                    'date' => now()->toDateString(),
                    'description' => "Driver COD Collection Settlement - Trip {$trip->trip_number}",
                    'source_type' => 'trip_cod_settlement',
                    'source_id' => $trip->id,
                    'idempotency_key' => "trip_cod_{$trip->id}",
                    'lines' => $lines,
                ]);

                $trip->settlement_journal_entry_id = $journalEntry->id;
            }

            $trip->cod_settlement_status = 'settled';
            if ($trip->status === 'in_transit' || $trip->status === 'scheduled') {
                $trip->status = 'completed';
                if (! $trip->completed_at) {
                    $trip->completed_at = now();
                }
            }
            $trip->save();

            // Release driver back to available
            $trip->driver->update(['status' => 'available']);

            return $trip->fresh(['driver', 'vehicle', 'stops.customer', 'settlementJournalEntry']);
        });
    }
}
