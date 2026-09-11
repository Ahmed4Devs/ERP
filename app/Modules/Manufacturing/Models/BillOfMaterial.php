<?php

namespace App\Modules\Manufacturing\Models;

use App\Modules\Inventory\Models\Product;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BillOfMaterial extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'bills_of_materials';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'bom_code',
        'product_id',
        'yield_quantity',
        'version',
        'is_active',
        'notes',
    ];

    protected $casts = [
        'yield_quantity' => 'decimal:6',
        'is_active' => 'boolean',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(BomItem::class, 'bom_id');
    }

    public function productionOrders(): HasMany
    {
        return $this->hasMany(ProductionOrder::class, 'bom_id');
    }
}
