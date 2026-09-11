<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('warehouse_id')->constrained('warehouses')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignUuid('journal_entry_id')->nullable()->constrained('journal_entries')->nullOnDelete();
            $table->string('movement_number', 50);
            $table->string('movement_type', 30); // receipt, issue, transfer_in, transfer_out, adjustment
            $table->string('direction', 10); // in, out
            $table->decimal('quantity', 24, 6);
            $table->decimal('unit_cost', 24, 6)->default(0);
            $table->decimal('total_cost', 24, 6)->default(0);
            $table->decimal('pre_movement_qty', 24, 6)->default(0);
            $table->decimal('post_movement_qty', 24, 6)->default(0);
            $table->decimal('pre_movement_avg_cost', 24, 6)->default(0);
            $table->decimal('post_movement_avg_cost', 24, 6)->default(0);
            $table->string('reference_type', 100)->nullable();
            $table->uuid('reference_id')->nullable();
            $table->date('date');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'company_id', 'product_id', 'date']);
            $table->index(['company_id', 'warehouse_id', 'product_id']);
            $table->index(['reference_type', 'reference_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
