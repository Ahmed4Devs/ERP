<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('category_id')->nullable()->constrained('product_categories')->nullOnDelete();
            $table->foreignUuid('unit_id')->constrained('units_of_measure')->restrictOnDelete();
            $table->string('sku', 100);
            $table->string('barcode', 100)->nullable();
            $table->string('name', 200);
            $table->string('name_ar', 200)->nullable();
            $table->text('description')->nullable();
            $table->string('type', 30)->default('storable'); // storable, consumable, service
            $table->decimal('standard_cost', 24, 6)->default(0);
            $table->decimal('moving_average_cost', 24, 6)->default(0);
            $table->decimal('list_price', 24, 6)->default(0);
            $table->foreignUuid('inventory_account_id')->nullable()->constrained('accounts')->nullOnDelete();
            $table->foreignUuid('cogs_account_id')->nullable()->constrained('accounts')->nullOnDelete();
            $table->foreignUuid('revenue_account_id')->nullable()->constrained('accounts')->nullOnDelete();
            $table->foreignUuid('grni_account_id')->nullable()->constrained('accounts')->nullOnDelete();
            $table->decimal('tax_rate', 8, 6)->default(0.10); // 10% test tax
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['company_id', 'sku']);
            $table->index(['tenant_id', 'company_id', 'type', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
