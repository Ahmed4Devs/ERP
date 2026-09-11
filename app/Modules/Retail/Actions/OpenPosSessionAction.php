<?php

namespace App\Modules\Retail\Actions;

use App\Modules\Retail\Models\PosSession;
use App\Modules\Retail\Models\PosTerminal;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;

class OpenPosSessionAction
{
    /**
     * @param array{
     *     terminal_id: string,
     *     opening_cash?: numeric|string,
     *     user_id?: int|string|null,
     *     notes?: string|null
     * } $data
     */
    public function execute(array $data): PosSession
    {
        return DB::transaction(function () use ($data) {
            $terminal = PosTerminal::findOrFail($data['terminal_id']);

            if ($terminal->status !== 'active') {
                throw new InvalidArgumentException("Cannot open session for inactive POS terminal [{$terminal->code}].");
            }

            // Check if there is already an open session for this terminal
            $existingOpenSession = PosSession::where('terminal_id', $terminal->id)
                ->where('status', 'open')
                ->lockForUpdate()
                ->first();

            if ($existingOpenSession) {
                throw new InvalidArgumentException("Terminal [{$terminal->code}] already has an active open session (#{$existingOpenSession->session_number}).");
            }

            $openingCash = number_format((float) ($data['opening_cash'] ?? 0), 6, '.', '');
            $sessionNumber = 'SES-'.date('Ymd').'-'.strtoupper(Str::random(6));
            $userId = $data['user_id'] ?? auth()->id();

            $companyId = $terminal->company_id ?? app(CurrentCompany::class)->id();
            $tenantId = $terminal->tenant_id ?? app(CurrentTenant::class)->id();

            return PosSession::create([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'terminal_id' => $terminal->id,
                'user_id' => $userId,
                'session_number' => $sessionNumber,
                'opening_cash' => $openingCash,
                'expected_cash' => $openingCash,
                'cash_difference' => '0.000000',
                'status' => 'open',
                'opened_at' => now(),
                'notes' => $data['notes'] ?? null,
            ]);
        });
    }
}
