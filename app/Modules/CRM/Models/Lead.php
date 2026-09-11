<?php

namespace App\Modules\CRM\Models;

use App\Models\User;
use App\Modules\MasterData\Models\Party;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Lead extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'crm_leads';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'lead_number',
        'title',
        'party_id',
        'contact_name',
        'email',
        'phone',
        'company_name',
        'source', // website, referral, cold_call, partner, exhibition
        'status', // new, contacted, qualified, proposal, won, lost
        'estimated_value',
        'probability_percent',
        'assigned_user_id',
        'loss_reason',
        'notes',
        'converted_at',
    ];

    protected $casts = [
        'estimated_value' => 'decimal:6',
        'probability_percent' => 'integer',
        'converted_at' => 'datetime',
    ];

    public function party(): BelongsTo
    {
        return $this->belongsTo(Party::class, 'party_id');
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    public function getExpectedRevenue(): string
    {
        $factor = bcdiv((string) $this->probability_percent, '100.000000', 6);

        return bcmul((string) $this->estimated_value, $factor, 6);
    }
}
