<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('landed_costs', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->string('voucher_number')->index();
            $table->date('date');
            $table->string('status', 30)->default('draft'); // draft, posted, cancelled
            $table->string('allocation_method', 30)->default('by_value'); // by_value, by_quantity
            $table->decimal('total_charges', 15, 4)->default(0);
            $table->foreignUuid('journal_entry_id')->nullable()->constrained('journal_entries')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->foreignId('created_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['company_id', 'voucher_number']);
        });

        Schema::create('landed_cost_receipts', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('landed_cost_id')->constrained('landed_costs')->cascadeOnDelete();
            $table->foreignUuid('goods_receipt_id')->constrained('goods_receipts')->cascadeOnDelete();
            $table->timestamps();
        });

        Schema::create('landed_cost_charges', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('landed_cost_id')->constrained('landed_costs')->cascadeOnDelete();
            $table->string('cost_type', 50); // customs, freight, insurance, clearance, port_handling, other
            $table->string('description')->nullable();
            $table->decimal('amount', 15, 4);
            $table->foreignUuid('vendor_party_id')->nullable()->constrained('parties')->nullOnDelete();
            $table->foreignUuid('expense_account_id')->nullable()->constrained('accounts')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('landed_cost_allocations', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('landed_cost_id')->constrained('landed_costs')->cascadeOnDelete();
            $table->foreignUuid('goods_receipt_line_id')->constrained('goods_receipt_lines')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products')->cascadeOnDelete();
            $table->decimal('quantity', 15, 4);
            $table->decimal('original_unit_cost', 15, 4);
            $table->decimal('allocated_amount', 15, 4);
            $table->decimal('new_unit_cost', 15, 4);
            $table->timestamps();
        });

        Schema::create('stocktake_sessions', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('warehouse_id')->constrained('warehouses')->cascadeOnDelete();
            $table->string('session_number')->index();
            $table->date('date');
            $table->string('status', 30)->default('draft'); // draft, in_progress, completed, cancelled
            $table->string('count_type', 30)->default('full'); // full, selective
            $table->foreignUuid('stock_adjustment_id')->nullable()->constrained('stock_adjustments')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->foreignId('created_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['company_id', 'session_number']);
        });

        Schema::create('stocktake_session_lines', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('stocktake_session_id')->constrained('stocktake_sessions')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products')->cascadeOnDelete();
            $table->decimal('book_quantity', 15, 4)->default(0);
            $table->decimal('counted_quantity', 15, 4)->default(0);
            $table->decimal('variance_quantity', 15, 4)->default(0);
            $table->decimal('unit_cost', 15, 4)->default(0);
            $table->decimal('variance_amount', 15, 4)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stocktake_session_lines');
        Schema::dropIfExists('stocktake_sessions');
        Schema::dropIfExists('landed_cost_allocations');
        Schema::dropIfExists('landed_cost_charges');
        Schema::dropIfExists('landed_cost_receipts');
        Schema::dropIfExists('landed_costs');
    }
};
