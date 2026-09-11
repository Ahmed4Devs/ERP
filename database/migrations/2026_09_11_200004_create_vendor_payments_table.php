<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendor_payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('party_id')->constrained('parties')->restrictOnDelete();
            $table->foreignUuid('payment_account_id')->constrained('accounts')->restrictOnDelete();
            $table->foreignUuid('journal_entry_id')->nullable()->constrained('journal_entries')->nullOnDelete();
            $table->string('payment_number', 50);
            $table->date('date');
            $table->string('payment_method', 30)->default('bank_transfer'); // bank_transfer, cash, check
            $table->decimal('amount', 24, 6)->default(0);
            $table->decimal('unallocated_amount', 24, 6)->default(0);
            $table->string('currency', 3)->default('SAR');
            $table->string('status', 30)->default('posted'); // posted, reversed
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['company_id', 'payment_number']);
            $table->index(['tenant_id', 'company_id', 'party_id', 'date']);
        });

        Schema::create('vendor_payment_allocations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('vendor_payment_id')->constrained('vendor_payments')->cascadeOnDelete();
            $table->foreignUuid('vendor_bill_id')->constrained('vendor_bills')->cascadeOnDelete();
            $table->decimal('amount', 24, 6);
            $table->timestamp('allocated_at');
            $table->timestamps();

            $table->index(['vendor_payment_id', 'vendor_bill_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendor_payment_allocations');
        Schema::dropIfExists('vendor_payments');
    }
};
