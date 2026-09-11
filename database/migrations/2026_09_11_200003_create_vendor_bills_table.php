<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendor_bills', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignUuid('party_id')->constrained('parties')->restrictOnDelete();
            $table->foreignUuid('purchase_order_id')->nullable()->constrained('purchase_orders')->nullOnDelete();
            $table->foreignUuid('journal_entry_id')->nullable()->constrained('journal_entries')->nullOnDelete();
            $table->string('bill_number', 50);
            $table->string('vendor_invoice_ref', 100)->nullable();
            $table->date('date');
            $table->date('due_date');
            $table->string('status', 30)->default('draft'); // draft, posted, partially_paid, paid, reversed
            $table->decimal('subtotal', 24, 6)->default(0);
            $table->decimal('tax_rate', 8, 6)->default(0.10); // 10% test tax
            $table->decimal('tax_amount', 24, 6)->default(0);
            $table->decimal('total', 24, 6)->default(0);
            $table->decimal('amount_paid', 24, 6)->default(0);
            $table->decimal('balance_due', 24, 6)->default(0);
            $table->string('currency', 3)->default('SAR');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['company_id', 'bill_number']);
            $table->index(['tenant_id', 'company_id', 'party_id', 'status', 'due_date']);
        });

        Schema::create('vendor_bill_lines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('vendor_bill_id')->constrained('vendor_bills')->cascadeOnDelete();
            $table->foreignUuid('expense_account_id')->constrained('accounts')->restrictOnDelete();
            $table->string('description');
            $table->decimal('quantity', 24, 6)->default(1);
            $table->decimal('unit_price', 24, 6)->default(0);
            $table->decimal('subtotal', 24, 6)->default(0);
            $table->decimal('tax_rate', 8, 6)->default(0.10);
            $table->decimal('tax_amount', 24, 6)->default(0);
            $table->decimal('line_total', 24, 6)->default(0);
            $table->timestamps();

            $table->index(['vendor_bill_id', 'expense_account_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendor_bill_lines');
        Schema::dropIfExists('vendor_bills');
    }
};
