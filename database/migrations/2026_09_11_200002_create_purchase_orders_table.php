<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignUuid('party_id')->constrained('parties')->restrictOnDelete();
            $table->string('po_number', 50);
            $table->date('date');
            $table->date('expected_delivery_date')->nullable();
            $table->string('status', 30)->default('draft'); // draft, approved, received, billed, cancelled
            $table->decimal('subtotal', 24, 6)->default(0);
            $table->decimal('tax_rate', 8, 6)->default(0.10); // 10% test tax
            $table->decimal('tax_amount', 24, 6)->default(0);
            $table->decimal('total', 24, 6)->default(0);
            $table->string('currency', 3)->default('SAR');
            $table->text('notes')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['company_id', 'po_number']);
            $table->index(['tenant_id', 'company_id', 'party_id', 'status']);
        });

        Schema::create('purchase_order_lines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('purchase_order_id')->constrained('purchase_orders')->cascadeOnDelete();
            $table->foreignUuid('expense_account_id')->nullable()->constrained('accounts')->nullOnDelete();
            $table->string('description');
            $table->decimal('quantity', 24, 6)->default(1);
            $table->decimal('unit_price', 24, 6)->default(0);
            $table->decimal('subtotal', 24, 6)->default(0);
            $table->decimal('tax_rate', 8, 6)->default(0.10);
            $table->decimal('tax_amount', 24, 6)->default(0);
            $table->decimal('line_total', 24, 6)->default(0);
            $table->timestamps();

            $table->index(['purchase_order_id', 'expense_account_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_order_lines');
        Schema::dropIfExists('purchase_orders');
    }
};
