<?php

namespace App\Modules\MasterData\Models;

use App\Modules\Platform\Models\Tenant;
use App\Shared\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Party extends Model
{
    use BelongsToTenant, HasUuids, SoftDeletes;

    protected $table = 'parties';

    protected $fillable = [
        'tenant_id',
        'name',
        'name_ar',
        'type',
        'tax_id',
        'email',
        'phone',
        'status',
        'address',
    ];

    protected $casts = [
        'address' => 'array',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    public function customerProfiles(): HasMany
    {
        return $this->hasMany(CustomerProfile::class, 'party_id');
    }
}
