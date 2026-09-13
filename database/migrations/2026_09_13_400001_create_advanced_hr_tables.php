<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Leave Requests
        Schema::create('leave_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignUuid('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->string('leave_type', 30)->default('annual'); // annual, sick, unpaid, emergency, maternity
            $table->date('start_date');
            $table->date('end_date');
            $table->decimal('days_count', 8, 2);
            $table->string('status', 30)->default('pending'); // pending, approved, rejected, cancelled
            $table->text('reason')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // 2. Employee Loans
        Schema::create('employee_loans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignUuid('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->string('loan_number', 50);
            $table->decimal('total_amount', 24, 6);
            $table->decimal('monthly_installment', 24, 6);
            $table->unsignedSmallInteger('installments_count');
            $table->decimal('paid_amount', 24, 6)->default(0);
            $table->decimal('remaining_amount', 24, 6);
            $table->date('start_date');
            $table->date('disbursement_date')->nullable();
            $table->string('status', 30)->default('pending'); // pending, active, completed, cancelled
            $table->text('reason')->nullable();
            $table->foreignUuid('journal_entry_id')->nullable()->constrained('journal_entries')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['company_id', 'loan_number']);
        });

        // 3. Employee Loan Installments
        Schema::create('employee_loan_installments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('employee_loan_id')->constrained('employee_loans')->cascadeOnDelete();
            $table->foreignUuid('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->unsignedSmallInteger('installment_number');
            $table->unsignedSmallInteger('period_year');
            $table->unsignedSmallInteger('period_month');
            $table->decimal('amount', 24, 6);
            $table->string('status', 30)->default('pending'); // pending, deducted, waived
            $table->foreignUuid('payslip_id')->nullable()->constrained('payslips')->nullOnDelete();
            $table->timestamp('deducted_at')->nullable();
            $table->timestamps();
        });

        // 4. End of Service Settlements
        Schema::create('end_of_service_settlements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignUuid('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->string('settlement_number', 50);
            $table->string('termination_type', 40); // resignation, contract_end, employer_termination, article_87
            $table->date('hire_date');
            $table->date('last_working_date');
            $table->decimal('service_years', 8, 4);
            $table->decimal('base_salary_amount', 24, 6); // last wage (basic + housing + transport)
            $table->decimal('gratuity_entitlement_rate', 5, 2)->default(1.00); // 0.00, 0.33, 0.67, 1.00
            $table->decimal('gratuity_amount', 24, 6)->default(0);
            $table->decimal('unused_leave_days', 8, 2)->default(0);
            $table->decimal('leave_compensation_amount', 24, 6)->default(0);
            $table->decimal('other_entitlements', 24, 6)->default(0);
            $table->decimal('deductions_amount', 24, 6)->default(0);
            $table->decimal('net_settlement_amount', 24, 6)->default(0);
            $table->string('status', 30)->default('draft'); // draft, approved, settled
            $table->foreignUuid('journal_entry_id')->nullable()->constrained('journal_entries')->nullOnDelete();
            $table->timestamp('settled_at')->nullable();
            $table->foreignId('prepared_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['company_id', 'settlement_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('end_of_service_settlements');
        Schema::dropIfExists('employee_loan_installments');
        Schema::dropIfExists('employee_loans');
        Schema::dropIfExists('leave_requests');
    }
};
