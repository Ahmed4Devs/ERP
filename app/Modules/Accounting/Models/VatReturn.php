<?php

namespace App\Modules\Accounting\Models;

use App\Models\User;
use App\Modules\Organization\Models\Branch;
use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Models\Tenant;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class VatReturn extends Model
{
    use BelongsToCompany, HasUuids, SoftDeletes;

    protected $table = 'vat_returns';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'branch_id',
        'return_number',
        'period_type',
        'tax_period',
        'start_date',
        'end_date',
        'status', // draft, filed, paid
        'standard_sales_amount',
        'standard_sales_vat',
        'standard_sales_adjustment',
        'zero_rated_sales_amount',
        'exempt_sales_amount',
        'total_sales_amount',
        'total_output_vat',
        'standard_purchases_amount',
        'standard_purchases_vat',
        'standard_purchases_adjustment',
        'imports_vat_amount',
        'zero_rated_purchases_amount',
        'exempt_purchases_amount',
        'total_purchases_amount',
        'total_input_vat',
        'net_vat_due',
        'previous_period_credit',
        'final_net_payable',
        'filing_date',
        'filed_by',
        'journal_entry_id',
        'notes',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'filing_date' => 'date',
        'standard_sales_amount' => 'decimal:6',
        'standard_sales_vat' => 'decimal:6',
        'standard_sales_adjustment' => 'decimal:6',
        'zero_rated_sales_amount' => 'decimal:6',
        'exempt_sales_amount' => 'decimal:6',
        'total_sales_amount' => 'decimal:6',
        'total_output_vat' => 'decimal:6',
        'standard_purchases_amount' => 'decimal:6',
        'standard_purchases_vat' => 'decimal:6',
        'standard_purchases_adjustment' => 'decimal:6',
        'imports_vat_amount' => 'decimal:6',
        'zero_rated_purchases_amount' => 'decimal:6',
        'exempt_purchases_amount' => 'decimal:6',
        'total_purchases_amount' => 'decimal:6',
        'total_input_vat' => 'decimal:6',
        'net_vat_due' => 'decimal:6',
        'previous_period_credit' => 'decimal:6',
        'final_net_payable' => 'decimal:6',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'company_id');
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function filedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'filed_by');
    }

    public function journalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class, 'journal_entry_id');
    }
}
