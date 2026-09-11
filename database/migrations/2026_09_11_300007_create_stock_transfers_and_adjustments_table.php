<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_transfers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('from_warehouse_id')->constrained('warehouses')->restrictOnDelete();
            $table->foreignUuid('to_warehouse_id')->constrained('warehouses')->restrictOnDelete();
            $table->string('transfer_number', 50);
            $table->date('date');
            $table->string('status', 30)->default('draft'); // draft, posted, cancelled
            $table->decimal('total_value', 24, 6)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['company_id', 'transfer_number']);
            $table->index(['tenant_id', 'company_id', 'date']);
        });

        Schema::create('stock_transfer_lines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('stock_transfer_id')->constrained('stock_transfers')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products')->restrictOnDelete();
            $table->decimal('quantity', 24, 6);
            $table->decimal('unit_cost', 24, 6)->default(0);
            $table->decimal('line_total', 24, 6)->default(0);
            $table->timestamps();

            $table->index(['stock_transfer_id', 'product_id']);
        });

        Schema::create('stock_adjustments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('warehouse_id')->constrained('warehouses')->restrictOnDelete();
            $table->foreignUuid('journal_entry_id')->nullable()->constrained('journal_entries')->nullOnDelete();
            $table->string('adjustment_number', 50);
            $table->date('date');
            $table->string('reason', 50)->default('count_variance'); // count_variance, damage, expired, opening_balance, other
            $table->string('status', 30)->default('draft'); // draft, posted, cancelled
            $table->decimal('total_cost_impact', 24, 6)->default(0); // net debit/credit value
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['company_id', 'adjustment_number']);
            $table->index(['tenant_id', 'company_id', 'warehouse_id', 'status', 'date']);
        });

        Schema::create('stock_adjustment_lines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('stock_adjustment_id')->constrained('stock_adjustments')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products')->restrictOnDelete();
            $table->string('type', 20); // increase, decrease
            $table->decimal('quantity', 24, 6);
            $table->decimal('unit_cost', 24, 6)->default(0);
            $table->decimal('line_total', 24, 6)->default(0);
            $table->string('notes')->nullable();
            $table->timestamps();

            $table->index(['stock_adjustment_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_adjustment_lines');
        Schema::dropIfExists('stock_adjustments');
        Schema::dropIfExists('stock_transfer_lines');
        Schema::dropIfExists('stock_transfers');
    }
};
