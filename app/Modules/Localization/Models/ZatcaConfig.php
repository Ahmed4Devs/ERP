<?php

namespace App\Modules\Localization\Models;

use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Models\Tenant;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ZatcaConfig extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'zatca_configs';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'environment',
        'simulation_mode',
        'vat_number',
        'egs_uuid',
        'egs_custom_id',
        'branch_name',
        'organization_unit_name',
        'organization_name',
        'country_code',
        'invoice_type',
        'private_key',
        'public_key',
        'csr',
        'compliance_csid',
        'compliance_secret',
        'production_csid',
        'production_secret',
        'last_invoice_hash',
        'invoice_counter',
        'status',
    ];

    protected $casts = [
        'simulation_mode' => 'boolean',
        'invoice_counter' => 'integer',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'company_id');
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    public function isReadyForProduction(): bool
    {
        return $this->status === 'production_ready' && ! empty($this->production_csid);
    }
}
