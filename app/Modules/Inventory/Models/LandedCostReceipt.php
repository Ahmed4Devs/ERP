<?php

namespace App\Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\Pivot;

class LandedCostReceipt extends Pivot
{
    use HasUuids;

    protected $table = 'landed_cost_receipts';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'landed_cost_id',
        'goods_receipt_id',
    ];
}
