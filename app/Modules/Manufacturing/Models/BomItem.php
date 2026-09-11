<?php

namespace App\Modules\Manufacturing\Models;

use App\Modules\Inventory\Models\Product;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BomItem extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'bom_items';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'bom_id',
        'product_id',
        'quantity',
        'scrap_percentage',
        'notes',
    ];

    protected $casts = [
        'quantity' => 'decimal:6',
        'scrap_percentage' => 'decimal:4',
    ];

    public function bom(): BelongsTo
    {
        return $this->belongsTo(BillOfMaterial::class, 'bom_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
