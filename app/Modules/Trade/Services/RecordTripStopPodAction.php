<?php

namespace App\Modules\Trade\Services;

use App\Modules\Inventory\Models\DeliveryNote;
use App\Modules\Trade\Models\DeliveryTripStop;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class RecordTripStopPodAction
{
    /**
     * Record Electronic Proof of Delivery (e-POD) or failed delivery attempt.
     */
    public function execute(
        DeliveryTripStop $stop,
        bool $success = true,
        ?string $recipientName = null,
        ?string $recipientNationalId = null,
        ?string $signatureSvg = null,
        ?float $gpsLatitude = null,
        ?float $gpsLongitude = null,
        string|float $codAmountCollected = 0,
        ?string $codPaymentMethod = 'cash',
        ?string $failureReason = null,
        ?string $podNotes = null
    ): DeliveryTripStop {
        if (in_array($stop->status, ['delivered', 'returned'], true)) {
            throw new InvalidArgumentException(__('Stop status is already finalized (:status).', ['status' => $stop->status]));
        }

        return DB::transaction(function () use (
            $stop,
            $success,
            $recipientName,
            $recipientNationalId,
            $signatureSvg,
            $gpsLatitude,
            $gpsLongitude,
            $codAmountCollected,
            $codPaymentMethod,
            $failureReason,
            $podNotes
        ) {
            $trip = $stop->trip;

            if ($success) {
                $stop->status = 'delivered';
                $stop->delivered_at = now();
                $stop->recipient_name = $recipientName;
                $stop->recipient_national_id = $recipientNationalId;
                $stop->recipient_signature_svg = $signatureSvg;
                $stop->gps_latitude = $gpsLatitude;
                $stop->gps_longitude = $gpsLongitude;
                $stop->cod_amount_collected = number_format((float) $codAmountCollected, 6, '.', '');
                $stop->cod_payment_method = $codPaymentMethod;
                $stop->failure_reason = null;
                $stop->pod_notes = $podNotes;

                if ($stop->delivery_note_id) {
                    DeliveryNote::where('id', $stop->delivery_note_id)->update([
                        'status' => 'delivered',
                        'recipient_name' => $recipientName,
                    ]);
                }
            } else {
                $stop->status = 'failed';
                $stop->failure_reason = $failureReason ?: 'Delivery unsuccessful';
                $stop->cod_amount_collected = '0.000000';
                $stop->pod_notes = $podNotes;

                if ($stop->delivery_note_id) {
                    DeliveryNote::where('id', $stop->delivery_note_id)->update([
                        'status' => 'failed',
                    ]);
                }
            }

            $stop->save();

            // Refresh and recalculate trip
            $trip->recalculateTotals();

            return $stop->fresh(['trip', 'customer', 'deliveryNote']);
        });
    }
}
