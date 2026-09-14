<?php

namespace App\Modules\Trade\Models;

use App\Modules\Inventory\Models\Product;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Promotion extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'promotions';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'code',
        'name',
        'name_ar',
        'type',
        'buy_product_id',
        'buy_quantity',
        'get_product_id',
        'get_quantity',
        'get_discount_percentage',
        'min_order_amount',
        'discount_rate',
        'fixed_discount_amount',
        'start_date',
        'end_date',
        'apply_automatically',
        'is_active',
        'notes',
    ];

    protected $casts = [
        'buy_quantity' => 'decimal:6',
        'get_quantity' => 'decimal:6',
        'get_discount_percentage' => 'decimal:4',
        'min_order_amount' => 'decimal:6',
        'discount_rate' => 'decimal:4',
        'fixed_discount_amount' => 'decimal:6',
        'apply_automatically' => 'boolean',
        'is_active' => 'boolean',
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function buyProduct(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'buy_product_id');
    }

    public function getProduct(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'get_product_id');
    }

    /**
     * Scope active promotions within date range.
     */
    public function scopeActive(Builder $query): Builder
    {
        $today = now()->toDateString();

        return $query->where('is_active', true)
            ->where(function ($q) use ($today): void {
                $q->whereNull('start_date')->orWhere('start_date', '<=', $today);
            })
            ->where(function ($q) use ($today): void {
                $q->whereNull('end_date')->orWhere('end_date', '>=', $today);
            });
    }

    /**
     * Determine if promotion is currently valid and active.
     */
    public function isValid(): bool
    {
        if (! $this->is_active) {
            return false;
        }

        $today = now()->toDateString();
        if ($this->start_date && $this->start_date->toDateString() > $today) {
            return false;
        }

        if ($this->end_date && $this->end_date->toDateString() < $today) {
            return false;
        }

        return true;
    }
}
