<?php

namespace App\Modules\Purchasing\Models;

use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Models\Tenant;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VendorPaymentAllocation extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'vendor_payment_allocations';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'vendor_payment_id',
        'vendor_bill_id',
        'amount',
        'allocated_at',
    ];

    protected $casts = [
        'amount' => 'decimal:6',
        'allocated_at' => 'datetime',
    ];

    public function payment(): BelongsTo
    {
        return $this->belongsTo(VendorPayment::class, 'vendor_payment_id');
    }

    public function bill(): BelongsTo
    {
        return $this->belongsTo(VendorBill::class, 'vendor_bill_id');
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'company_id');
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }
}
