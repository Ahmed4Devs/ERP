<?php

namespace App\Modules\Purchasing\Models;

use App\Models\User;
use App\Modules\HR\Models\Department;
use App\Modules\Organization\Models\Branch;
use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Models\Tenant;
use App\Shared\Traits\BelongsToCompany;
use App\Shared\Traits\HasAttachments;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PurchaseRequisition extends Model
{
    use BelongsToCompany, HasAttachments, HasUuids, SoftDeletes;

    protected $table = 'purchase_requisitions';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'branch_id',
        'department_id',
        'requisition_number',
        'requested_by_id',
        'required_date',
        'status',
        'priority',
        'total_estimated_amount',
        'purchase_order_id',
        'approved_by_id',
        'approved_at',
        'rejection_reason',
        'notes',
    ];

    protected $casts = [
        'required_date' => 'date',
        'approved_at' => 'datetime',
        'total_estimated_amount' => 'decimal:6',
    ];

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_id');
    }

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class, 'purchase_order_id');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(PurchaseRequisitionLine::class, 'purchase_requisition_id');
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
