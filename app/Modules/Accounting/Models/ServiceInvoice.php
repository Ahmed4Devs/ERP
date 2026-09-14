<?php

namespace App\Modules\Accounting\Models;

use App\Modules\MasterData\Models\Party;
use App\Modules\Organization\Models\Branch;
use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Models\Tenant;
use App\Modules\Sales\Models\SalesOrder;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ServiceInvoice extends Model
{
    use BelongsToCompany, HasUuids, SoftDeletes;

    protected $table = 'service_invoices';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'branch_id',
        'party_id',
        'sales_rep_id',
        'sales_order_id',
        'invoice_number',
        'date',
        'due_date',
        'status',
        'subtotal',
        'tax_rate',
        'tax_amount',
        'total',
        'amount_paid',
        'balance_due',
        'currency',
        'journal_entry_id',
        'notes',
        'zatca_status',
        'zatca_invoice_type',
        'zatca_uuid',
        'zatca_invoice_hash',
        'zatca_previous_hash',
        'zatca_qr_code',
        'zatca_xml',
        'zatca_cleared_xml',
        'zatca_response',
        'zatca_submitted_at',
        'zatca_error',
    ];

    protected $casts = [
        'date' => 'date',
        'due_date' => 'date',
        'subtotal' => 'decimal:6',
        'tax_rate' => 'decimal:6',
        'tax_amount' => 'decimal:6',
        'total' => 'decimal:6',
        'amount_paid' => 'decimal:6',
        'balance_due' => 'decimal:6',
        'zatca_response' => 'array',
        'zatca_submitted_at' => 'datetime',
    ];

    public function lines(): HasMany
    {
        return $this->hasMany(ServiceInvoiceLine::class, 'service_invoice_id');
    }

    public function party(): BelongsTo
    {
        return $this->belongsTo(Party::class, 'party_id');
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'company_id');
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    public function journalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class, 'journal_entry_id');
    }

    public function allocations(): HasMany
    {
        return $this->hasMany(ReceiptAllocation::class, 'service_invoice_id');
    }

    public function salesOrder(): BelongsTo
    {
        return $this->belongsTo(SalesOrder::class, 'sales_order_id');
    }
}
