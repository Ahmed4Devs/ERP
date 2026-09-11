<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('treasury_transfers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('from_account_id')->constrained('accounts')->restrictOnDelete();
            $table->foreignUuid('to_account_id')->constrained('accounts')->restrictOnDelete();
            $table->foreignUuid('journal_entry_id')->nullable()->constrained('journal_entries')->nullOnDelete();
            $table->string('transfer_number', 50);
            $table->date('date');
            $table->decimal('amount', 24, 6)->default(0);
            $table->string('currency', 3)->default('SAR');
            $table->string('status', 30)->default('posted'); // posted, reversed
            $table->string('reference')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'transfer_number']);
            $table->index(['tenant_id', 'company_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('treasury_transfers');
    }
};
