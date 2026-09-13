<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Credit Notes (Sales Returns)
        Schema::create('credit_notes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignUuid('customer_id')->constrained('parties')->cascadeOnDelete();
            $table->foreignUuid('invoice_id')->nullable()->constrained('service_invoices')->nullOnDelete();
            $table->string('credit_note_number', 50);
            $table->date('date');
            $table->string('reason')->nullable();
            $table->decimal('subtotal', 24, 6)->default(0);
            $table->decimal('tax_amount', 24, 6)->default(0);
            $table->decimal('total', 24, 6)->default(0);
            $table->string('status', 30)->default('draft'); // draft, posted, cancelled
            $table->foreignUuid('journal_entry_id')->nullable()->constrained('journal_entries')->nullOnDelete();
            $table->foreignUuid('costing_journal_entry_id')->nullable()->constrained('journal_entries')->nullOnDelete();
            $table->timestamp('posted_at')->nullable();
            $table->foreignId('posted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['company_id', 'credit_note_number']);
        });

        Schema::create('credit_note_lines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('credit_note_id')->constrained('credit_notes')->cascadeOnDelete();
            $table->foreignUuid('product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->foreignUuid('warehouse_id')->nullable()->constrained('warehouses')->nullOnDelete();
            $table->string('description');
            $table->decimal('quantity', 24, 6)->default(1);
            $table->decimal('unit_price', 24, 6)->default(0);
            $table->decimal('subtotal', 24, 6)->default(0);
            $table->decimal('tax_rate', 8, 4)->default(0.15);
            $table->decimal('tax_amount', 24, 6)->default(0);
            $table->decimal('total', 24, 6)->default(0);
            $table->timestamps();
        });

        // 2. Debit Notes (Purchase Returns)
        Schema::create('debit_notes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignUuid('vendor_id')->constrained('parties')->cascadeOnDelete();
            $table->foreignUuid('vendor_bill_id')->nullable()->constrained('vendor_bills')->nullOnDelete();
            $table->string('debit_note_number', 50);
            $table->date('date');
            $table->string('reason')->nullable();
            $table->decimal('subtotal', 24, 6)->default(0);
            $table->decimal('tax_amount', 24, 6)->default(0);
            $table->decimal('total', 24, 6)->default(0);
            $table->string('status', 30)->default('draft'); // draft, posted, cancelled
            $table->foreignUuid('journal_entry_id')->nullable()->constrained('journal_entries')->nullOnDelete();
            $table->timestamp('posted_at')->nullable();
            $table->foreignId('posted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['company_id', 'debit_note_number']);
        });

        Schema::create('debit_note_lines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('debit_note_id')->constrained('debit_notes')->cascadeOnDelete();
            $table->foreignUuid('product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->foreignUuid('warehouse_id')->nullable()->constrained('warehouses')->nullOnDelete();
            $table->string('description');
            $table->decimal('quantity', 24, 6)->default(1);
            $table->decimal('unit_price', 24, 6)->default(0);
            $table->decimal('subtotal', 24, 6)->default(0);
            $table->decimal('tax_rate', 8, 4)->default(0.15);
            $table->decimal('tax_amount', 24, 6)->default(0);
            $table->decimal('total', 24, 6)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('debit_note_lines');
        Schema::dropIfExists('debit_notes');
        Schema::dropIfExists('credit_note_lines');
        Schema::dropIfExists('credit_notes');
    }
};
