<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_invoices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignUuid('party_id')->constrained('parties')->restrictOnDelete();
            $table->string('invoice_number', 50);
            $table->date('date');
            $table->date('due_date');
            $table->string('status', 30)->default('draft'); // draft, posted, partially_paid, paid, reversed
            $table->decimal('subtotal', 24, 6)->default(0);
            $table->decimal('tax_rate', 24, 6)->default(0.100000); // Labeled 10% Test Tax
            $table->decimal('tax_amount', 24, 6)->default(0);
            $table->decimal('total', 24, 6)->default(0);
            $table->decimal('amount_paid', 24, 6)->default(0);
            $table->decimal('balance_due', 24, 6)->default(0);
            $table->string('currency', 3)->default('USD');
            $table->foreignUuid('journal_entry_id')->nullable()->constrained('journal_entries')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['company_id', 'invoice_number']);
            $table->index(['tenant_id', 'company_id', 'party_id', 'status']);
            $table->index(['tenant_id', 'company_id', 'date']);
        });

        Schema::create('service_invoice_lines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('service_invoice_id')->constrained('service_invoices')->cascadeOnDelete();
            $table->string('description');
            $table->decimal('quantity', 24, 6)->default(1);
            $table->decimal('unit_price', 24, 6)->default(0);
            $table->decimal('tax_rate', 24, 6)->default(0.100000);
            $table->decimal('tax_amount', 24, 6)->default(0);
            $table->decimal('line_total', 24, 6)->default(0);
            $table->foreignUuid('revenue_account_id')->nullable()->constrained('accounts')->nullOnDelete();
            $table->timestamps();

            $table->index(['service_invoice_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_invoice_lines');
        Schema::dropIfExists('service_invoices');
    }
};
