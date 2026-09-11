<?php

namespace App\Modules\Contracts\Models;

use App\Modules\MasterData\Models\Party;
use App\Modules\Projects\Models\Project;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Contract extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'contracts';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'contract_number',
        'customer_id',
        'project_id',
        'title',
        'title_ar',
        'start_date',
        'end_date',
        'billing_cycle', // monthly, quarterly, semi_annual, annual
        'recurring_amount',
        'tax_rate',
        'next_billing_date',
        'last_billed_at',
        'status', // draft, active, suspended, expired, terminated
        'auto_renew',
        'notes',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'next_billing_date' => 'date',
        'last_billed_at' => 'date',
        'recurring_amount' => 'decimal:6',
        'tax_rate' => 'decimal:6',
        'auto_renew' => 'boolean',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Party::class, 'customer_id');
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'project_id');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(ContractLine::class, 'contract_id');
    }
}
