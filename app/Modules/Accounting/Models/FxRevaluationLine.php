<?php

namespace App\Modules\Accounting\Models;

use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Models\Tenant;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FxRevaluationLine extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'fx_revaluation_lines';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'fx_revaluation_id',
        'account_id',
        'currency',
        'foreign_balance',
        'book_exchange_rate',
        'closing_exchange_rate',
        'book_amount_sar',
        'revalued_amount_sar',
        'adjustment_amount_sar',
        'gain_loss_type', // gain, loss, neutral
    ];

    protected $casts = [
        'foreign_balance' => 'decimal:4',
        'book_exchange_rate' => 'decimal:6',
        'closing_exchange_rate' => 'decimal:6',
        'book_amount_sar' => 'decimal:4',
        'revalued_amount_sar' => 'decimal:4',
        'adjustment_amount_sar' => 'decimal:4',
    ];

    public function revaluation(): BelongsTo
    {
        return $this->belongsTo(FxRevaluation::class, 'fx_revaluation_id');
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'account_id');
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'company_id');
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }
}
