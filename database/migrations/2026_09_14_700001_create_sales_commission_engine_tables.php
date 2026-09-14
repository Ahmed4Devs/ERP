<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Commission Plans
        Schema::create('sales_commission_plans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('code', 50);
            $table->string('name', 150);
            $table->string('name_ar', 150)->nullable();
            $table->string('basis', 30)->default('invoiced_sales'); // invoiced_sales, collected_cash
            $table->json('tiers')->nullable(); // [{"min": 0, "max": 50000, "rate": 2.0}, {"min": 50000, "max": 100000, "rate": 3.5}, ...]
            $table->decimal('target_bonus_rate', 8, 4)->default(0); // Bonus percentage if >= 100% target
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'code']);
            $table->index(['company_id', 'is_active']);
        });

        // 2. Sales Representatives
        Schema::create('sales_representatives', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignUuid('employee_id')->nullable()->constrained('employees')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('commission_plan_id')->constrained('sales_commission_plans')->restrictOnDelete();
            $table->string('code', 50);
            $table->string('name', 150);
            $table->string('name_ar', 150)->nullable();
            $table->string('phone', 50)->nullable();
            $table->string('email', 150)->nullable();
            $table->decimal('monthly_target', 24, 6)->default(0);
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'code']);
            $table->index(['company_id', 'is_active']);
        });

        // 3. Link Sales Reps to Parties, Orders, and Invoices
        Schema::table('parties', function (Blueprint $table) {
            $table->foreignUuid('sales_rep_id')->nullable()->constrained('sales_representatives')->nullOnDelete();
        });

        Schema::table('sales_orders', function (Blueprint $table) {
            $table->foreignUuid('sales_rep_id')->nullable()->constrained('sales_representatives')->nullOnDelete();
        });

        Schema::table('service_invoices', function (Blueprint $table) {
            $table->foreignUuid('sales_rep_id')->nullable()->constrained('sales_representatives')->nullOnDelete();
        });

        // 4. Commission Runs
        Schema::create('sales_commission_runs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('run_number', 50);
            $table->date('period_start');
            $table->date('period_end');
            $table->string('basis', 30)->default('invoiced_sales');
            $table->string('status', 30)->default('draft'); // draft, approved, settled, cancelled
            $table->decimal('total_eligible_sales', 24, 6)->default(0);
            $table->decimal('total_commission_amount', 24, 6)->default(0);
            $table->decimal('total_bonus_amount', 24, 6)->default(0);
            $table->decimal('total_deductions', 24, 6)->default(0);
            $table->decimal('total_net_payable', 24, 6)->default(0);
            $table->foreignUuid('journal_entry_id')->nullable()->constrained('journal_entries')->nullOnDelete();
            $table->foreignUuid('payment_journal_id')->nullable()->constrained('journal_entries')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('settled_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'run_number']);
            $table->index(['company_id', 'status', 'period_start', 'period_end']);
        });

        // 5. Commission Run Lines
        Schema::create('sales_commission_run_lines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('sales_commission_run_id')->constrained('sales_commission_runs')->cascadeOnDelete();
            $table->foreignUuid('sales_representative_id')->constrained('sales_representatives')->restrictOnDelete();
            $table->decimal('sales_target', 24, 6)->default(0);
            $table->decimal('achieved_sales', 24, 6)->default(0);
            $table->decimal('achievement_rate', 8, 4)->default(0);
            $table->decimal('commission_amount', 24, 6)->default(0);
            $table->decimal('bonus_amount', 24, 6)->default(0);
            $table->decimal('deductions_amount', 24, 6)->default(0);
            $table->decimal('net_payable', 24, 6)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['sales_commission_run_id', 'sales_representative_id'], 'comm_run_lines_run_rep_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_commission_run_lines');
        Schema::dropIfExists('sales_commission_runs');

        Schema::table('service_invoices', function (Blueprint $table) {
            $table->dropConstrainedForeignId('sales_rep_id');
        });

        Schema::table('sales_orders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('sales_rep_id');
        });

        Schema::table('parties', function (Blueprint $table) {
            $table->dropConstrainedForeignId('sales_rep_id');
        });

        Schema::dropIfExists('sales_representatives');
        Schema::dropIfExists('sales_commission_plans');
    }
};
