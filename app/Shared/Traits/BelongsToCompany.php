<?php

namespace App\Shared\Traits;

use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Models\Tenant;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToCompany
{
    public static function bootBelongsToCompany(): void
    {
        static::creating(function ($model): void {
            if (empty($model->tenant_id)) {
                $currentTenant = app(CurrentTenant::class);
                if ($currentTenant->check()) {
                    $model->tenant_id = $currentTenant->id();
                }
            }

            if (empty($model->company_id)) {
                $currentCompany = app(CurrentCompany::class);
                if ($currentCompany->check()) {
                    $model->company_id = $currentCompany->id();
                }
            }
        });

        static::addGlobalScope('company_scope', function (Builder $builder): void {
            $currentCompany = app(CurrentCompany::class);
            if ($currentCompany->check()) {
                $builder->where($builder->getModel()->getTable().'.company_id', $currentCompany->id());
            }
        });
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'company_id');
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    public function scopeForCompany(Builder $query, ?string $companyId = null): Builder
    {
        $id = $companyId ?? app(CurrentCompany::class)->id();

        return $query->where($this->getTable().'.company_id', $id);
    }
}
