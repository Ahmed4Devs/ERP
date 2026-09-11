<?php

namespace App\Modules\Sales\Models;

use App\Modules\MasterData\Models\Party;
use App\Modules\Projects\Models\Project;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SalesOrder extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'sales_orders';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'order_number',
        'quotation_id',
        'customer_id',
        'order_date',
        'delivery_date',
        'subtotal',
        'tax_rate',
        'tax_amount',
        'discount_amount',
        'total_amount',
        'status', // draft, confirmed, delivering, completed, cancelled
        'invoicing_status', // unbilled, partially_billed, fully_billed
        'notes',
    ];

    protected $casts = [
        'order_date' => 'date',
        'delivery_date' => 'date',
        'subtotal' => 'decimal:6',
        'tax_rate' => 'decimal:6',
        'tax_amount' => 'decimal:6',
        'discount_amount' => 'decimal:6',
        'total_amount' => 'decimal:6',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Party::class, 'customer_id');
    }

    public function quotation(): BelongsTo
    {
        return $this->belongsTo(SalesQuotation::class, 'quotation_id');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(SalesOrderLine::class, 'sales_order_id');
    }

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class, 'sales_order_id');
    }
}
