<?php

namespace App\Modules\HR\Models;

use App\Modules\Accounting\Models\Account;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeCustodyExpenseLine extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'employee_custody_expense_lines';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'settlement_id',
        'expense_account_id',
        'vendor_name',
        'vendor_tax_number',
        'invoice_number',
        'invoice_date',
        'subtotal',
        'tax_rate',
        'tax_amount',
        'total',
        'description',
        'receipt_file_path',
    ];

    protected $casts = [
        'invoice_date' => 'date',
        'subtotal' => 'decimal:6',
        'tax_rate' => 'decimal:6',
        'tax_amount' => 'decimal:6',
        'total' => 'decimal:6',
    ];

    public function settlement(): BelongsTo
    {
        return $this->belongsTo(EmployeeCustodySettlement::class, 'settlement_id');
    }

    public function expenseAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'expense_account_id');
    }
}
