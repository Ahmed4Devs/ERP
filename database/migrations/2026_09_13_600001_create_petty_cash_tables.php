<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('petty_cash_funds', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->index();
            $table->uuid('company_id')->index();
            $table->uuid('branch_id')->nullable()->index();
            $table->unsignedBigInteger('custodian_id')->nullable()->index();
            $table->uuid('account_id')->index(); // GL Petty Cash / Custody Account (e.g. 1030)
            $table->string('name');
            $table->string('name_ar')->nullable();
            $table->string('code')->index();
            $table->decimal('fund_limit', 15, 6)->default(0);
            $table->decimal('current_balance', 15, 6)->default(0);
            $table->string('status')->default('active')->index(); // active, suspended, closed
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();
            $table->foreign('account_id')->references('id')->on('accounts')->restrictOnDelete();
        });

        Schema::create('petty_cash_settlements', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->index();
            $table->uuid('company_id')->index();
            $table->uuid('branch_id')->nullable()->index();
            $table->uuid('fund_id')->index();
            $table->string('settlement_number')->index();
            $table->date('date')->index();
            $table->decimal('subtotal', 15, 6)->default(0);
            $table->decimal('tax_amount', 15, 6)->default(0);
            $table->decimal('total', 15, 6)->default(0);
            $table->string('reimbursement_type')->default('replenish_bank'); // replenish_bank, deduct_custody
            $table->uuid('bank_account_id')->nullable()->index(); // Bank/Cash account for reimbursement
            $table->string('status')->default('draft')->index(); // draft, posted, rejected
            $table->uuid('journal_entry_id')->nullable()->index();
            $table->text('notes')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('posted_by')->nullable();
            $table->timestamp('posted_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();
            $table->foreign('fund_id')->references('id')->on('petty_cash_funds')->cascadeOnDelete();
            $table->foreign('journal_entry_id')->references('id')->on('journal_entries')->nullOnDelete();
        });

        Schema::create('petty_cash_settlement_lines', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->index();
            $table->uuid('company_id')->index();
            $table->uuid('settlement_id')->index();
            $table->uuid('expense_account_id')->index();
            $table->string('description');
            $table->string('receipt_ref')->nullable();
            $table->date('receipt_date')->nullable();
            $table->decimal('subtotal', 15, 6)->default(0);
            $table->decimal('tax_rate', 8, 4)->default(0.1500);
            $table->decimal('tax_amount', 15, 6)->default(0);
            $table->decimal('total', 15, 6)->default(0);
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();
            $table->foreign('settlement_id')->references('id')->on('petty_cash_settlements')->cascadeOnDelete();
            $table->foreign('expense_account_id')->references('id')->on('accounts')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('petty_cash_settlement_lines');
        Schema::dropIfExists('petty_cash_settlements');
        Schema::dropIfExists('petty_cash_funds');
    }
};
