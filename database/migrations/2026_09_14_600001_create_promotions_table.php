<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('promotions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('code', 50)->nullable();
            $table->string('name', 150);
            $table->string('name_ar', 150)->nullable();
            $table->string('type', 30)->default('bogo'); // bogo, percentage, fixed_amount
            $table->foreignUuid('buy_product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->decimal('buy_quantity', 24, 6)->default(1);
            $table->foreignUuid('get_product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->decimal('get_quantity', 24, 6)->default(1);
            $table->decimal('get_discount_percentage', 8, 4)->default(100.0000); // 100 = Free, 50 = Half Price
            $table->decimal('min_order_amount', 24, 6)->default(0);
            $table->decimal('discount_rate', 8, 4)->default(0); // For percentage type
            $table->decimal('fixed_discount_amount', 24, 6)->default(0); // For fixed_amount type
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->boolean('apply_automatically')->default(true);
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['company_id', 'is_active', 'start_date', 'end_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promotions');
    }
};
