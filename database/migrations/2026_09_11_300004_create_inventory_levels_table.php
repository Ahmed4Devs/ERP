<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_levels', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('warehouse_id')->constrained('warehouses')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products')->cascadeOnDelete();
            $table->decimal('quantity_on_hand', 24, 6)->default(0);
            $table->decimal('quantity_reserved', 24, 6)->default(0);
            $table->decimal('quantity_available', 24, 6)->default(0);
            $table->decimal('moving_average_cost', 24, 6)->default(0);
            $table->decimal('total_value', 24, 6)->default(0);
            $table->decimal('reorder_point', 24, 6)->default(0);
            $table->timestamps();

            $table->unique(['company_id', 'warehouse_id', 'product_id']);
            $table->index(['tenant_id', 'company_id', 'product_id']);
        });

        // Strict non-negative inventory constraint
        DB::statement('ALTER TABLE inventory_levels ADD CONSTRAINT chk_inventory_levels_non_negative_stock CHECK (quantity_on_hand >= 0)');
        DB::statement('ALTER TABLE inventory_levels ADD CONSTRAINT chk_inventory_levels_non_negative_reserved CHECK (quantity_reserved >= 0)');
        DB::statement('ALTER TABLE inventory_levels ADD CONSTRAINT chk_inventory_levels_non_negative_cost CHECK (moving_average_cost >= 0)');
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_levels');
    }
};
