<?php

namespace App\Modules\Inventory\Models;

use App\Models\User;
use App\Modules\Accounting\Models\JournalEntry;
use App\Modules\Organization\Models\Branch;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class LandedCost extends Model
{
    use BelongsToCompany, HasUuids, SoftDeletes;

    protected $table = 'landed_costs';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'branch_id',
        'voucher_number',
        'date',
        'status',
        'allocation_method',
        'total_charges',
        'journal_entry_id',
        'notes',
        'created_by_id',
    ];

    protected $casts = [
        'date' => 'date',
        'total_charges' => 'decimal:4',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function journalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class, 'journal_entry_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    public function receipts(): BelongsToMany
    {
        return $this->belongsToMany(GoodsReceipt::class, 'landed_cost_receipts', 'landed_cost_id', 'goods_receipt_id')
            ->using(LandedCostReceipt::class)
            ->withTimestamps();
    }

    public function charges(): HasMany
    {
        return $this->hasMany(LandedCostCharge::class, 'landed_cost_id');
    }

    public function allocations(): HasMany
    {
        return $this->hasMany(LandedCostAllocation::class, 'landed_cost_id');
    }
}
