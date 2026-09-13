<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vat_returns', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->string('return_number', 50);
            $table->string('period_type', 30)->default('quarterly'); // quarterly, monthly, custom
            $table->string('tax_period', 50); // e.g. 2026-Q1, 2026-09
            $table->date('start_date');
            $table->date('end_date');
            $table->string('status', 30)->default('draft'); // draft, filed, paid

            // Output VAT (المبيعات وضريبة المخرجات)
            $table->decimal('standard_sales_amount', 24, 6)->default(0);
            $table->decimal('standard_sales_vat', 24, 6)->default(0);
            $table->decimal('standard_sales_adjustment', 24, 6)->default(0);
            $table->decimal('zero_rated_sales_amount', 24, 6)->default(0);
            $table->decimal('exempt_sales_amount', 24, 6)->default(0);
            $table->decimal('total_sales_amount', 24, 6)->default(0);
            $table->decimal('total_output_vat', 24, 6)->default(0);

            // Input VAT (المشتريات وضريبة المدخلات)
            $table->decimal('standard_purchases_amount', 24, 6)->default(0);
            $table->decimal('standard_purchases_vat', 24, 6)->default(0);
            $table->decimal('standard_purchases_adjustment', 24, 6)->default(0);
            $table->decimal('imports_vat_amount', 24, 6)->default(0);
            $table->decimal('zero_rated_purchases_amount', 24, 6)->default(0);
            $table->decimal('exempt_purchases_amount', 24, 6)->default(0);
            $table->decimal('total_purchases_amount', 24, 6)->default(0);
            $table->decimal('total_input_vat', 24, 6)->default(0);

            // Net VAT (صافي الضريبة)
            $table->decimal('net_vat_due', 24, 6)->default(0);
            $table->decimal('previous_period_credit', 24, 6)->default(0);
            $table->decimal('final_net_payable', 24, 6)->default(0);

            $table->date('filing_date')->nullable();
            $table->foreignId('filed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('journal_entry_id')->nullable()->constrained('journal_entries')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['company_id', 'return_number']);
            $table->index(['tenant_id', 'company_id', 'tax_period', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vat_returns');
    }
};
