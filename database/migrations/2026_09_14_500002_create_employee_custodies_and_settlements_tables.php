<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_custodies', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignUuid('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->string('custody_number', 50);
            $table->string('type', 20)->default('temporary'); // temporary, permanent
            $table->string('purpose', 255);
            $table->decimal('amount', 24, 6)->default(0);
            $table->decimal('current_balance', 24, 6)->default(0);
            $table->string('status', 20)->default('draft'); // draft, approved, disbursed, partially_settled, closed
            $table->string('disbursement_method', 20)->default('bank_transfer'); // bank_transfer, cash
            $table->foreignUuid('disbursement_account_id')->nullable()->constrained('accounts')->nullOnDelete();
            $table->foreignUuid('custody_account_id')->nullable()->constrained('accounts')->nullOnDelete();
            $table->foreignUuid('journal_entry_id')->nullable()->constrained('journal_entries')->nullOnDelete();
            $table->timestamp('disbursed_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['company_id', 'custody_number']);
        });

        Schema::create('employee_custody_settlements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('custody_id')->constrained('employee_custodies')->cascadeOnDelete();
            $table->string('settlement_number', 50);
            $table->date('settlement_date');
            $table->decimal('total_expenses_amount', 24, 6)->default(0);
            $table->decimal('total_tax_amount', 24, 6)->default(0);
            $table->decimal('total_claimed_amount', 24, 6)->default(0);
            $table->decimal('refund_amount', 24, 6)->default(0); // returned to treasury
            $table->decimal('reimbursement_amount', 24, 6)->default(0); // paid extra to employee
            $table->string('status', 20)->default('draft'); // draft, approved, posted
            $table->foreignUuid('journal_entry_id')->nullable()->constrained('journal_entries')->nullOnDelete();
            $table->timestamp('posted_at')->nullable();
            $table->foreignId('posted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['company_id', 'settlement_number']);
        });

        Schema::create('employee_custody_expense_lines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('settlement_id')->constrained('employee_custody_settlements')->cascadeOnDelete();
            $table->foreignUuid('expense_account_id')->constrained('accounts')->cascadeOnDelete();
            $table->string('vendor_name', 200);
            $table->string('vendor_tax_number', 50)->nullable();
            $table->string('invoice_number', 100)->nullable();
            $table->date('invoice_date')->nullable();
            $table->decimal('subtotal', 24, 6)->default(0);
            $table->decimal('tax_rate', 24, 6)->default('0.150000');
            $table->decimal('tax_amount', 24, 6)->default(0);
            $table->decimal('total', 24, 6)->default(0);
            $table->string('description', 255);
            $table->string('receipt_file_path', 255)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_custody_expense_lines');
        Schema::dropIfExists('employee_custody_settlements');
        Schema::dropIfExists('employee_custodies');
    }
};
