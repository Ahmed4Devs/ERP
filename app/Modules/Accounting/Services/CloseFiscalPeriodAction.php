<?php

namespace App\Modules\Accounting\Services;

use App\Modules\Accounting\Models\FiscalPeriod;

class CloseFiscalPeriodAction
{
    /**
     * Lock or unlock a fiscal period.
     */
    public function execute(FiscalPeriod $period, bool $lock = true): FiscalPeriod
    {
        $period->update(['is_locked' => $lock]);

        return $period->refresh();
    }
}
