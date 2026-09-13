<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cheques', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('type', 20); // received, issued
            $table->string('cheque_number', 50);
            $table->string('bank_name', 100);
            $table->string('drawer_name', 150);
            $table->string('payee_name', 150)->nullable();
            $table->date('issue_date');
            $table->date('due_date');
            $table->decimal('amount', 15, 4);
            $table->string('currency', 10)->default('SAR');
            $table->string('status', 30)->default('in_safe'); // in_safe, under_collection, collected, bounced, returned_to_drawer, issued, cleared, cancelled
            $table->foreignUuid('party_id')->nullable()->constrained('parties')->nullOnDelete();
            $table->foreignUuid('bank_account_id')->nullable()->constrained('accounts')->nullOnDelete();
            $table->foreignUuid('pdc_account_id')->nullable()->constrained('accounts')->nullOnDelete();
            $table->foreignUuid('journal_entry_id')->nullable()->constrained('journal_entries')->nullOnDelete();
            $table->foreignUuid('settlement_journal_entry_id')->nullable()->constrained('journal_entries')->nullOnDelete();
            $table->text('bounce_reason')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'company_id', 'type', 'status']);
            $table->index('due_date');
            $table->unique(['company_id', 'bank_name', 'cheque_number', 'type']);
        });

        Schema::create('bank_guarantees', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('guarantee_number', 50);
            $table->string('type', 50); // bid_bond, performance_bond, advance_payment, retention
            $table->string('beneficiary_name', 150);
            $table->string('issuing_bank', 100);
            $table->decimal('amount', 15, 4);
            $table->decimal('margin_percentage', 5, 2)->default(100);
            $table->decimal('margin_amount', 15, 4)->default(0);
            $table->decimal('commission_amount', 15, 4)->default(0);
            $table->foreignUuid('bank_account_id')->nullable()->constrained('accounts')->nullOnDelete();
            $table->foreignUuid('margin_account_id')->nullable()->constrained('accounts')->nullOnDelete();
            $table->foreignUuid('journal_entry_id')->nullable()->constrained('journal_entries')->nullOnDelete();
            $table->date('issue_date');
            $table->date('expiry_date');
            $table->string('status', 30)->default('active'); // active, renewed, released, claimed
            $table->foreignUuid('project_id')->nullable()->constrained('projects')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'company_id', 'status']);
            $table->index('expiry_date');
            $table->unique(['company_id', 'guarantee_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bank_guarantees');
        Schema::dropIfExists('cheques');
    }
};
