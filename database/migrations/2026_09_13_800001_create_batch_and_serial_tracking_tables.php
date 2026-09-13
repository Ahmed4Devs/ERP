<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('tracking_type', 20)->default('none')->after('type'); // 'none', 'batch', 'serial', 'both'
            $table->integer('shelf_life_days')->nullable()->after('tax_rate');
            $table->integer('warranty_months')->nullable()->after('shelf_life_days');
        });

        Schema::create('product_batches', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignUuid('warehouse_id')->constrained('warehouses')->cascadeOnDelete();
            $table->string('batch_number', 100);
            $table->string('supplier_batch_number', 100)->nullable();
            $table->date('manufacture_date')->nullable();
            $table->date('expiry_date')->nullable();
            $table->decimal('received_qty', 15, 4)->default(0);
            $table->decimal('current_qty', 15, 4)->default(0);
            $table->decimal('reserved_qty', 15, 4)->default(0);
            $table->decimal('unit_cost', 24, 6)->default(0);
            $table->string('status', 30)->default('active'); // active, expired, depleted, quarantined
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'product_id', 'batch_number']);
            $table->index(['tenant_id', 'company_id', 'product_id', 'warehouse_id', 'status']);
            $table->index('expiry_date');
        });

        Schema::create('product_serials', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignUuid('warehouse_id')->nullable()->constrained('warehouses')->nullOnDelete();
            $table->foreignUuid('batch_id')->nullable()->constrained('product_batches')->nullOnDelete();
            $table->foreignUuid('customer_id')->nullable()->constrained('parties')->nullOnDelete();
            $table->string('serial_number', 100);
            $table->string('status', 30)->default('in_stock'); // in_stock, reserved, sold, returned, scrapped
            $table->decimal('unit_cost', 24, 6)->default(0);
            $table->date('warranty_start_date')->nullable();
            $table->date('warranty_end_date')->nullable();
            $table->text('warranty_notes')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'product_id', 'serial_number']);
            $table->index(['tenant_id', 'company_id', 'status']);
            $table->index('warranty_end_date');
        });

        Schema::create('batch_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('batch_id')->constrained('product_batches')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignUuid('warehouse_id')->constrained('warehouses')->cascadeOnDelete();
            $table->string('transaction_type', 50); // receipt, issue, adjustment, transfer
            $table->string('direction', 10); // in, out
            $table->decimal('quantity', 15, 4);
            $table->string('reference_type', 150)->nullable();
            $table->uuid('reference_id')->nullable();
            $table->date('transaction_date');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['batch_id', 'transaction_date']);
        });

        Schema::create('serial_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('serial_id')->constrained('product_serials')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignUuid('warehouse_id')->nullable()->constrained('warehouses')->nullOnDelete();
            $table->string('transaction_type', 50); // receive, dispatch, return, scrap, transfer
            $table->string('reference_type', 150)->nullable();
            $table->uuid('reference_id')->nullable();
            $table->date('transaction_date');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['serial_id', 'transaction_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('serial_transactions');
        Schema::dropIfExists('batch_transactions');
        Schema::dropIfExists('product_serials');
        Schema::dropIfExists('product_batches');

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['tracking_type', 'shelf_life_days', 'warranty_months']);
        });
    }
};
