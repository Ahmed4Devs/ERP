<?php

namespace App\Modules\Inventory\Models;

use App\Modules\Accounting\Models\JournalEntry;
use App\Modules\MasterData\Models\Party;
use App\Modules\Organization\Models\Branch;
use App\Modules\Purchasing\Models\PurchaseOrder;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class GoodsReceipt extends Model
{
    use BelongsToCompany, HasUuids, SoftDeletes;

    protected $table = 'goods_receipts';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'branch_id',
        'warehouse_id',
        'party_id',
        'purchase_order_id',
        'journal_entry_id',
        'receipt_number',
        'date',
        'status',
        'total_cost',
        'notes',
    ];

    protected $casts = [
        'date' => 'date',
        'total_cost' => 'decimal:6',
    ];

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id');
    }

    public function party(): BelongsTo
    {
        return $this->belongsTo(Party::class, 'party_id');
    }

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class, 'purchase_order_id');
    }

    public function journalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class, 'journal_entry_id');
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(GoodsReceiptLine::class, 'goods_receipt_id');
    }
}
