<?php

namespace App\Modules\Trade\Models;

use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalesCommissionRunLine extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'sales_commission_run_lines';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'sales_commission_run_id',
        'sales_representative_id',
        'sales_target',
        'achieved_sales',
        'achievement_rate',
        'commission_amount',
        'bonus_amount',
        'deductions_amount',
        'net_payable',
        'notes',
    ];

    protected $casts = [
        'sales_target' => 'decimal:6',
        'achieved_sales' => 'decimal:6',
        'achievement_rate' => 'decimal:4',
        'commission_amount' => 'decimal:6',
        'bonus_amount' => 'decimal:6',
        'deductions_amount' => 'decimal:6',
        'net_payable' => 'decimal:6',
    ];

    public function run(): BelongsTo
    {
        return $this->belongsTo(SalesCommissionRun::class, 'sales_commission_run_id');
    }

    public function representative(): BelongsTo
    {
        return $this->belongsTo(SalesRepresentative::class, 'sales_representative_id');
    }
}
