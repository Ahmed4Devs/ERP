<?php

namespace App\Modules\Assets\Models;

use App\Models\User;
use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\JournalEntry;
use App\Modules\Organization\Models\Branch;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class FixedAssetDisposal extends Model
{
    use BelongsToCompany, HasUuids, SoftDeletes;

    protected $table = 'fixed_asset_disposals';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'branch_id',
        'fixed_asset_id',
        'disposal_number',
        'disposal_date',
        'disposal_type',
        'acquisition_cost',
        'accumulated_depreciation',
        'net_book_value',
        'proceeds',
        'tax_amount',
        'gain_loss_amount',
        'gain_loss_type',
        'bank_account_id',
        'buyer_name',
        'reason',
        'notes',
        'status',
        'journal_entry_id',
        'created_by',
        'posted_by',
        'posted_at',
    ];

    protected $casts = [
        'disposal_date' => 'date',
        'posted_at' => 'datetime',
        'acquisition_cost' => 'decimal:6',
        'accumulated_depreciation' => 'decimal:6',
        'net_book_value' => 'decimal:6',
        'proceeds' => 'decimal:6',
        'tax_amount' => 'decimal:6',
        'gain_loss_amount' => 'decimal:6',
    ];

    public function asset(): BelongsTo
    {
        return $this->belongsTo(FixedAsset::class, 'fixed_asset_id');
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function bankAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'bank_account_id');
    }

    public function journalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class, 'journal_entry_id');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function postedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'posted_by');
    }
}
