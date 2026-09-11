<?php

namespace App\Modules\Retail\Actions;

use App\Modules\Retail\Models\PosSession;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class ClosePosSessionAction
{
    /**
     * @param array{
     *     session_id: string,
     *     closing_cash: numeric|string,
     *     notes?: string|null
     * } $data
     */
    public function execute(array $data): PosSession
    {
        return DB::transaction(function () use ($data) {
            $session = PosSession::lockForUpdate()->findOrFail($data['session_id']);

            if ($session->status !== 'open') {
                throw new InvalidArgumentException("Session (#{$session->session_number}) is already closed.");
            }

            $closingCash = number_format((float) $data['closing_cash'], 6, '.', '');
            $expectedCash = (string) $session->expected_cash;
            $difference = bcsub($closingCash, $expectedCash, 6);

            $session->closing_cash = $closingCash;
            $session->cash_difference = $difference;
            $session->status = 'closed';
            $session->closed_at = now();
            if (! empty($data['notes'])) {
                $session->notes = $session->notes ? ($session->notes."\n".$data['notes']) : $data['notes'];
            }
            $session->save();

            return $session;
        });
    }
}
