<?php

namespace App\Modules\Purchasing\Models;

use App\Modules\MasterData\Models\Party;
use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Models\Tenant;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VendorProfile extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'vendor_profiles';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'party_id',
        'payment_terms_days',
        'credit_limit',
        'currency',
        'bank_account_details',
        'is_active',
    ];

    protected $casts = [
        'credit_limit' => 'decimal:6',
        'payment_terms_days' => 'integer',
        'is_active' => 'boolean',
    ];

    public function party(): BelongsTo
    {
        return $this->belongsTo(Party::class, 'party_id');
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
