<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bank_reconciliations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('bank_account_id')->constrained('accounts')->restrictOnDelete();
            $table->string('statement_number', 50);
            $table->date('statement_date');
            $table->date('start_date');
            $table->date('end_date');
            $table->decimal('opening_balance', 24, 6)->default(0);
            $table->decimal('closing_balance', 24, 6)->default(0);
            $table->decimal('cleared_balance', 24, 6)->default(0);
            $table->decimal('difference', 24, 6)->default(0);
            $table->string('status', 30)->default('draft'); // draft, in_progress, reconciled
            $table->timestamp('reconciled_at')->nullable();
            $table->foreignId('reconciled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'company_id', 'bank_account_id', 'status']);
        });

        Schema::create('bank_statement_lines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('bank_reconciliation_id')->constrained('bank_reconciliations')->cascadeOnDelete();
            $table->date('line_date');
            $table->string('description', 255);
            $table->string('reference_number', 100)->nullable();
            $table->string('type', 20)->default('deposit'); // deposit, withdrawal
            $table->decimal('amount', 24, 6)->default(0);
            $table->boolean('is_reconciled')->default(false);
            $table->foreignUuid('matched_journal_entry_line_id')->nullable()->constrained('journal_entry_lines')->nullOnDelete();
            $table->timestamp('reconciled_at')->nullable();
            $table->timestamps();

            $table->index(['bank_reconciliation_id', 'is_reconciled']);
            $table->index(['matched_journal_entry_line_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bank_statement_lines');
        Schema::dropIfExists('bank_reconciliations');
    }
};
