<?php

namespace App\Modules\Trade\Models;

use App\Modules\Inventory\Models\Product;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PriceListItem extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'price_list_items';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'price_list_id',
        'product_id',
        'min_quantity',
        'price',
        'discount_percentage',
    ];

    protected $casts = [
        'min_quantity' => 'decimal:6',
        'price' => 'decimal:6',
        'discount_percentage' => 'decimal:4',
    ];

    public function priceList(): BelongsTo
    {
        return $this->belongsTo(PriceList::class, 'price_list_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
