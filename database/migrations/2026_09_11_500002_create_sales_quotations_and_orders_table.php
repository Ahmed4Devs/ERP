<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_quotations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('quote_number', 50);
            $table->foreignUuid('lead_id')->nullable()->constrained('crm_leads')->nullOnDelete();
            $table->foreignUuid('customer_id')->constrained('parties')->cascadeOnDelete();
            $table->date('issue_date');
            $table->date('valid_until');
            $table->decimal('subtotal', 24, 6)->default(0);
            $table->decimal('tax_rate', 24, 6)->default('0.100000');
            $table->decimal('tax_amount', 24, 6)->default(0);
            $table->decimal('discount_amount', 24, 6)->default(0);
            $table->decimal('total_amount', 24, 6)->default(0);
            $table->string('status', 30)->default('draft'); // draft, sent, accepted, rejected, expired, converted
            $table->text('terms_and_conditions')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'quote_number']);
        });

        Schema::create('sales_quotation_lines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('quotation_id')->constrained('sales_quotations')->cascadeOnDelete();
            $table->foreignUuid('product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->string('description', 255);
            $table->decimal('quantity', 24, 6)->default(1);
            $table->decimal('unit_price', 24, 6)->default(0);
            $table->decimal('discount_amount', 24, 6)->default(0);
            $table->decimal('tax_amount', 24, 6)->default(0);
            $table->decimal('line_total', 24, 6)->default(0);
            $table->timestamps();
        });

        Schema::create('sales_orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('order_number', 50);
            $table->foreignUuid('quotation_id')->nullable()->constrained('sales_quotations')->nullOnDelete();
            $table->foreignUuid('customer_id')->constrained('parties')->cascadeOnDelete();
            $table->date('order_date');
            $table->date('delivery_date')->nullable();
            $table->decimal('subtotal', 24, 6)->default(0);
            $table->decimal('tax_rate', 24, 6)->default('0.100000');
            $table->decimal('tax_amount', 24, 6)->default(0);
            $table->decimal('discount_amount', 24, 6)->default(0);
            $table->decimal('total_amount', 24, 6)->default(0);
            $table->string('status', 30)->default('draft'); // draft, confirmed, delivering, completed, cancelled
            $table->string('invoicing_status', 30)->default('unbilled'); // unbilled, partially_billed, fully_billed
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'order_number']);
        });

        Schema::create('sales_order_lines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('sales_order_id')->constrained('sales_orders')->cascadeOnDelete();
            $table->foreignUuid('product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->string('description', 255);
            $table->decimal('quantity', 24, 6)->default(1);
            $table->decimal('unit_price', 24, 6)->default(0);
            $table->decimal('tax_amount', 24, 6)->default(0);
            $table->decimal('line_total', 24, 6)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_order_lines');
        Schema::dropIfExists('sales_orders');
        Schema::dropIfExists('sales_quotation_lines');
        Schema::dropIfExists('sales_quotations');
    }
};
