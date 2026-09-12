<?php

namespace App\Modules\Sales\Models;

use App\Modules\CRM\Models\Lead;
use App\Modules\MasterData\Models\Party;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class SalesQuotation extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'sales_quotations';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'quote_number',
        'lead_id',
        'customer_id',
        'issue_date',
        'valid_until',
        'subtotal',
        'tax_rate',
        'tax_amount',
        'discount_amount',
        'total_amount',
        'status', // draft, sent, accepted, rejected, expired, converted
        'terms_and_conditions',
        'notes',
    ];

    protected $casts = [
        'issue_date' => 'date',
        'valid_until' => 'date',
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

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class, 'lead_id');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(SalesQuotationLine::class, 'quotation_id');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(SalesOrder::class, 'quotation_id');
    }

    public function salesOrder(): HasOne
    {
        return $this->hasOne(SalesOrder::class, 'quotation_id');
    }
}
