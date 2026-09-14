<?php

namespace App\Modules\MasterData\Models;

use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Models\Tenant;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class CustomerProfile extends Model
{
    use BelongsToCompany, HasUuids, SoftDeletes;

    protected $table = 'customer_profiles';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'party_id',
        'credit_limit',
        'payment_terms_days',
        'currency',
        'is_active',
        'portal_token',
        'portal_access_enabled',
    ];

    protected $casts = [
        'credit_limit' => 'decimal:6',
        'payment_terms_days' => 'integer',
        'is_active' => 'boolean',
        'portal_access_enabled' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function (CustomerProfile $profile): void {
            if (empty($profile->portal_token)) {
                $profile->portal_token = bin2hex(random_bytes(24));
            }
        });
    }

    public function ensurePortalToken(): string
    {
        if (empty($this->portal_token)) {
            $this->portal_token = bin2hex(random_bytes(24));
            $this->saveQuietly();
        }

        return $this->portal_token;
    }

    public function getPortalUrlAttribute(): string
    {
        $token = $this->ensurePortalToken();

        return route('portal.dashboard', ['token' => $token]);
    }

    public function party(): BelongsTo
    {
        return $this->belongsTo(Party::class, 'party_id');
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
