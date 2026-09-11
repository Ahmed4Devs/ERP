<?php

namespace App\Modules\Contracting\Models;

use App\Modules\Accounting\Models\ServiceInvoice;
use App\Modules\MasterData\Models\Party;
use App\Modules\Projects\Models\Project;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ContractingClaim extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'contracting_claims';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'claim_number',
        'project_id',
        'customer_id',
        'claim_date',
        'contract_value',
        'previous_billed_amount',
        'current_work_amount',
        'retention_rate',
        'retention_amount',
        'net_claim_amount',
        'tax_amount',
        'total_amount',
        'status', // draft, certified, billed, rejected
        'invoice_id',
        'notes',
    ];

    protected $casts = [
        'claim_date' => 'date',
        'contract_value' => 'decimal:6',
        'previous_billed_amount' => 'decimal:6',
        'current_work_amount' => 'decimal:6',
        'retention_rate' => 'decimal:4',
        'retention_amount' => 'decimal:6',
        'net_claim_amount' => 'decimal:6',
        'tax_amount' => 'decimal:6',
        'total_amount' => 'decimal:6',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'project_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Party::class, 'customer_id');
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(ServiceInvoice::class, 'invoice_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(ContractingClaimItem::class, 'claim_id');
    }
}
