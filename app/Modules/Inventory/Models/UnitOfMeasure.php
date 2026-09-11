<?php

namespace App\Modules\Inventory\Models;

use App\Modules\Platform\Models\Tenant;
use App\Shared\Context\CurrentTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UnitOfMeasure extends Model
{
    use HasUuids;

    protected $table = 'units_of_measure';

    protected $fillable = [
        'tenant_id',
        'code',
        'name',
        'name_ar',
        'symbol',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public static function booted(): void
    {
        static::creating(function ($model): void {
            if (empty($model->tenant_id)) {
                $currentTenant = app(CurrentTenant::class);
                if ($currentTenant->check()) {
                    $model->tenant_id = $currentTenant->id();
                }
            }
        });
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'unit_id');
    }
}
