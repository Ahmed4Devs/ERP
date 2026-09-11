<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('receipts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('party_id')->constrained('parties')->restrictOnDelete();
            $table->foreignUuid('deposit_account_id')->constrained('accounts')->restrictOnDelete();
            $table->string('receipt_number', 50);
            $table->date('date');
            $table->string('payment_method', 30)->default('bank_transfer'); // bank_transfer, cash, check
            $table->decimal('amount', 24, 6)->default(0);
            $table->decimal('unallocated_amount', 24, 6)->default(0);
            $table->string('status', 30)->default('posted'); // draft, posted, reversed
            $table->foreignUuid('journal_entry_id')->nullable()->constrained('journal_entries')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['company_id', 'receipt_number']);
            $table->index(['tenant_id', 'company_id', 'party_id', 'status']);
            $table->index(['tenant_id', 'company_id', 'date']);
        });

        Schema::create('receipt_allocations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('receipt_id')->constrained('receipts')->cascadeOnDelete();
            $table->foreignUuid('service_invoice_id')->constrained('service_invoices')->cascadeOnDelete();
            $table->decimal('amount', 24, 6);
            $table->timestamp('allocated_at')->useCurrent();
            $table->timestamps();

            $table->index(['receipt_id', 'service_invoice_id']);
            $table->index(['tenant_id', 'company_id', 'service_invoice_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('receipt_allocations');
        Schema::dropIfExists('receipts');
    }
};
