<?php

namespace App\Modules\Contracting\Models;

use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContractingClaimItem extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'contracting_claim_items';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'claim_id',
        'work_description',
        'scheduled_value',
        'previous_percentage',
        'current_percentage',
        'current_amount',
    ];

    protected $casts = [
        'scheduled_value' => 'decimal:6',
        'previous_percentage' => 'decimal:4',
        'current_percentage' => 'decimal:4',
        'current_amount' => 'decimal:6',
    ];

    public function claim(): BelongsTo
    {
        return $this->belongsTo(ContractingClaim::class, 'claim_id');
    }
}
