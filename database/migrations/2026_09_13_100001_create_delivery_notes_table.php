<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delivery_notes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignUuid('warehouse_id')->constrained('warehouses')->restrictOnDelete();
            $table->foreignUuid('customer_id')->constrained('parties')->restrictOnDelete();
            $table->foreignUuid('sales_order_id')->nullable()->constrained('sales_orders')->nullOnDelete();
            $table->foreignUuid('journal_entry_id')->nullable()->constrained('journal_entries')->nullOnDelete();
            $table->string('delivery_number', 50);
            $table->date('date');
            $table->string('status', 30)->default('draft'); // draft, dispatched, delivered, cancelled
            $table->string('driver_name', 100)->nullable();
            $table->string('vehicle_plate', 50)->nullable();
            $table->string('tracking_number', 100)->nullable();
            $table->string('recipient_name', 100)->nullable();
            $table->string('recipient_phone', 50)->nullable();
            $table->text('shipping_address')->nullable();
            $table->decimal('total_cost', 24, 6)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['company_id', 'delivery_number']);
            $table->index(['tenant_id', 'company_id', 'warehouse_id', 'status', 'date']);
            $table->index(['sales_order_id']);
        });

        Schema::create('delivery_note_lines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('delivery_note_id')->constrained('delivery_notes')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products')->restrictOnDelete();
            $table->foreignUuid('sales_order_line_id')->nullable()->constrained('sales_order_lines')->nullOnDelete();
            $table->string('description', 255);
            $table->decimal('quantity', 24, 6)->default(1);
            $table->decimal('unit_cost', 24, 6)->default(0);
            $table->decimal('total_cost', 24, 6)->default(0);
            $table->timestamps();

            $table->index(['delivery_note_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_note_lines');
        Schema::dropIfExists('delivery_notes');
    }
};
