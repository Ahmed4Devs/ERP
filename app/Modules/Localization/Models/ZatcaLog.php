<?php

namespace App\Modules\Localization\Models;

use App\Modules\Accounting\Models\ServiceInvoice;
use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Models\Tenant;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ZatcaLog extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'zatca_logs';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'service_invoice_id',
        'endpoint',
        'action',
        'request_payload',
        'response_payload',
        'status_code',
        'is_success',
        'message',
    ];

    protected $casts = [
        'request_payload' => 'array',
        'response_payload' => 'array',
        'status_code' => 'integer',
        'is_success' => 'boolean',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(ServiceInvoice::class, 'service_invoice_id');
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
