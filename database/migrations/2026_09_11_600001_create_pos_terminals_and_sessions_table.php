<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pos_terminals', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignUuid('warehouse_id')->constrained('warehouses')->cascadeOnDelete();
            $table->foreignUuid('cash_account_id')->constrained('accounts')->cascadeOnDelete();
            $table->string('name', 100);
            $table->string('code', 50);
            $table->string('status', 20)->default('active'); // active, inactive
            $table->timestamps();

            $table->unique(['company_id', 'code']);
        });

        Schema::create('pos_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('terminal_id')->constrained('pos_terminals')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('session_number', 50);
            $table->decimal('opening_cash', 24, 6)->default(0);
            $table->decimal('closing_cash', 24, 6)->nullable();
            $table->decimal('expected_cash', 24, 6)->default(0);
            $table->decimal('cash_difference', 24, 6)->default(0);
            $table->string('status', 20)->default('open'); // open, closed
            $table->timestamp('opened_at');
            $table->timestamp('closed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'session_number']);
        });

        Schema::create('pos_orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('session_id')->constrained('pos_sessions')->cascadeOnDelete();
            $table->foreignUuid('customer_id')->nullable()->constrained('parties')->nullOnDelete();
            $table->string('receipt_number', 50);
            $table->decimal('subtotal', 24, 6)->default(0);
            $table->decimal('tax_rate', 24, 6)->default('0.100000');
            $table->decimal('tax_amount', 24, 6)->default(0);
            $table->decimal('discount_amount', 24, 6)->default(0);
            $table->decimal('total_amount', 24, 6)->default(0);
            $table->string('payment_method', 20)->default('cash'); // cash, card, split
            $table->decimal('cash_tendered', 24, 6)->default(0);
            $table->decimal('change_due', 24, 6)->default(0);
            $table->foreignUuid('journal_entry_id')->nullable()->constrained('journal_entries')->nullOnDelete();
            $table->text('qr_payload')->nullable(); // Base64 TLV string for ZATCA
            $table->timestamps();

            $table->unique(['company_id', 'receipt_number']);
        });

        Schema::create('pos_order_lines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('pos_order_id')->constrained('pos_orders')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products')->cascadeOnDelete();
            $table->string('description', 255);
            $table->decimal('quantity', 24, 6)->default(1);
            $table->decimal('unit_price', 24, 6)->default(0);
            $table->decimal('unit_cost', 24, 6)->default(0);
            $table->decimal('tax_amount', 24, 6)->default(0);
            $table->decimal('line_total', 24, 6)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pos_order_lines');
        Schema::dropIfExists('pos_orders');
        Schema::dropIfExists('pos_sessions');
        Schema::dropIfExists('pos_terminals');
    }
};
