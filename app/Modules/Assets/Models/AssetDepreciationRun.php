<?php

namespace App\Modules\Assets\Models;

use App\Modules\Accounting\Models\JournalEntry;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AssetDepreciationRun extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'asset_depreciation_runs';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'run_number',
        'period_month',
        'period_year',
        'date',
        'total_depreciation',
        'journal_entry_id',
        'status',
        'notes',
    ];

    protected $casts = [
        'period_month' => 'integer',
        'period_year' => 'integer',
        'date' => 'date',
        'total_depreciation' => 'decimal:6',
    ];

    public function entries(): HasMany
    {
        return $this->hasMany(AssetDepreciationEntry::class, 'depreciation_run_id');
    }

    public function journalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class, 'journal_entry_id');
    }
}
