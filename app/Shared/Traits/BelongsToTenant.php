<?php

namespace App\Shared\Traits;

use App\Modules\Platform\Models\Tenant;
use App\Shared\Context\CurrentTenant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToTenant
{
    public static function bootBelongsToTenant(): void
    {
        static::creating(function ($model): void {
            if (empty($model->tenant_id)) {
                $currentTenant = app(CurrentTenant::class);
                if ($currentTenant->check()) {
                    $model->tenant_id = $currentTenant->id();
                }
            }
        });

        static::addGlobalScope('tenant_scope', function (Builder $builder): void {
            $currentTenant = app(CurrentTenant::class);
            if ($currentTenant->check()) {
                $builder->where($builder->getModel()->getTable().'.tenant_id', $currentTenant->id());
            }
        });
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    public function scopeForTenant(Builder $query, ?string $tenantId = null): Builder
    {
        $id = $tenantId ?? app(CurrentTenant::class)->id();

        return $query->where($this->getTable().'.tenant_id', $id);
    }
}
