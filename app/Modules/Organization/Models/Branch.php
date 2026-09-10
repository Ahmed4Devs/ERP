<?php

namespace App\Modules\Organization\Models;

use App\Modules\Platform\Models\Tenant;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Branch extends Model
{
    use BelongsToCompany, HasUuids, SoftDeletes;

    protected $table = 'branches';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'name',
        'code',
        'is_headquarters',
        'status',
        'address',
    ];

    protected $casts = [
        'is_headquarters' => 'boolean',
        'address' => 'array',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'company_id');
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }
}
