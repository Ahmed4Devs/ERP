<?php

namespace App\Modules\Organization\Models;

use App\Modules\MasterData\Models\CustomerProfile;
use App\Modules\Platform\Models\Tenant;
use App\Shared\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Company extends Model
{
    use BelongsToTenant, HasUuids, SoftDeletes;

    protected $table = 'companies';

    protected $fillable = [
        'tenant_id',
        'name',
        'legal_name',
        'tax_number',
        'currency',
        'fiscal_year_start',
        'status',
        'settings',
    ];

    protected $casts = [
        'settings' => 'array',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    public function branches(): HasMany
    {
        return $this->hasMany(Branch::class, 'company_id');
    }

    public function customerProfiles(): HasMany
    {
        return $this->hasMany(CustomerProfile::class, 'company_id');
    }
}
