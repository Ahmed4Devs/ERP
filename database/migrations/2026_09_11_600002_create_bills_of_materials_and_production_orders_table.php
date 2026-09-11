<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bills_of_materials', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('bom_code', 50);
            $table->foreignUuid('product_id')->constrained('products')->cascadeOnDelete();
            $table->decimal('yield_quantity', 24, 6)->default(1);
            $table->string('version', 20)->default('v1.0');
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'bom_code']);
        });

        Schema::create('bom_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('bom_id')->constrained('bills_of_materials')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products')->cascadeOnDelete();
            $table->decimal('quantity', 24, 6);
            $table->decimal('scrap_percentage', 8, 4)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('production_orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('order_number', 50);
            $table->foreignUuid('bom_id')->constrained('bills_of_materials')->cascadeOnDelete();
            $table->foreignUuid('finished_product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignUuid('source_warehouse_id')->constrained('warehouses')->cascadeOnDelete();
            $table->foreignUuid('destination_warehouse_id')->constrained('warehouses')->cascadeOnDelete();
            $table->decimal('target_quantity', 24, 6);
            $table->decimal('produced_quantity', 24, 6)->default(0);
            $table->decimal('total_material_cost', 24, 6)->default(0);
            $table->decimal('unit_material_cost', 24, 6)->default(0);
            $table->string('status', 30)->default('draft'); // draft, in_progress, completed, cancelled
            $table->date('start_date');
            $table->date('completion_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'order_number']);
        });

        Schema::create('production_order_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('production_order_id')->constrained('production_orders')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products')->cascadeOnDelete();
            $table->decimal('planned_quantity', 24, 6);
            $table->decimal('consumed_quantity', 24, 6)->default(0);
            $table->decimal('unit_cost', 24, 6)->default(0);
            $table->decimal('total_cost', 24, 6)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('production_order_items');
        Schema::dropIfExists('production_orders');
        Schema::dropIfExists('bom_items');
        Schema::dropIfExists('bills_of_materials');
    }
};
