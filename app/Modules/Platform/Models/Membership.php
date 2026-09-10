<?php

namespace App\Modules\Platform\Models;

use App\Models\User;
use App\Modules\Organization\Models\Company;
use App\Shared\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Membership extends Model
{
    use BelongsToTenant, HasUuids;

    protected $table = 'memberships';

    protected $fillable = [
        'user_id',
        'tenant_id',
        'default_company_id',
        'is_owner',
        'status',
    ];

    protected $casts = [
        'is_owner' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function defaultCompany(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'default_company_id');
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'membership_roles', 'membership_id', 'role_id')
            ->withPivot('company_id')
            ->withTimestamps();
    }

    public function hasPermission(string $permissionName, ?string $companyId = null): bool
    {
        if ($this->is_owner) {
            return true;
        }

        return $this->roles()
            ->where(function ($query) use ($companyId): void {
                $query->whereNull('membership_roles.company_id');
                if ($companyId) {
                    $query->orWhere('membership_roles.company_id', $companyId);
                }
            })
            ->whereHas('permissions', function ($query) use ($permissionName): void {
                $query->where('permissions.name', $permissionName);
            })
            ->exists();
    }
}
