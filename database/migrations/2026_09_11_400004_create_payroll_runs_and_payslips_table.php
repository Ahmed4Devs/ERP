<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payroll_runs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('run_number', 50);
            $table->unsignedSmallInteger('period_month');
            $table->unsignedSmallInteger('period_year');
            $table->date('payment_date');
            $table->decimal('total_basic', 24, 6)->default(0);
            $table->decimal('total_allowances', 24, 6)->default(0);
            $table->decimal('total_deductions', 24, 6)->default(0);
            $table->decimal('total_net', 24, 6)->default(0);
            $table->string('status', 30)->default('draft'); // draft, approved, posted, paid
            $table->foreignUuid('journal_entry_id')->nullable()->constrained('journal_entries')->nullOnDelete();
            $table->foreignUuid('disbursement_journal_entry_id')->nullable()->constrained('journal_entries')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'period_year', 'period_month']);
            $table->unique(['company_id', 'run_number']);
        });

        Schema::create('payslips', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('payroll_run_id')->constrained('payroll_runs')->cascadeOnDelete();
            $table->foreignUuid('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->decimal('basic_salary', 24, 6)->default(0);
            $table->decimal('housing_allowance', 24, 6)->default(0);
            $table->decimal('transport_allowance', 24, 6)->default(0);
            $table->decimal('other_allowances', 24, 6)->default(0);
            $table->decimal('overtime_amount', 24, 6)->default(0);
            $table->decimal('gross_salary', 24, 6)->default(0);
            $table->decimal('social_insurance_deduction', 24, 6)->default(0);
            $table->decimal('other_deductions', 24, 6)->default(0);
            $table->decimal('total_deductions', 24, 6)->default(0);
            $table->decimal('net_salary', 24, 6)->default(0);
            $table->string('status', 30)->default('draft'); // draft, approved, paid
            $table->timestamps();

            $table->unique(['payroll_run_id', 'employee_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payslips');
        Schema::dropIfExists('payroll_runs');
    }
};
