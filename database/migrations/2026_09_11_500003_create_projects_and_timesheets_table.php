<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('project_number', 50);
            $table->string('name', 150);
            $table->string('name_ar', 150)->nullable();
            $table->foreignUuid('customer_id')->constrained('parties')->cascadeOnDelete();
            $table->foreignUuid('sales_order_id')->nullable()->constrained('sales_orders')->nullOnDelete();
            $table->foreignUuid('manager_id')->nullable()->constrained('employees')->nullOnDelete();
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->decimal('budget_cost', 24, 6)->default(0);
            $table->decimal('budget_revenue', 24, 6)->default(0);
            $table->string('status', 30)->default('planning'); // planning, in_progress, on_hold, completed, cancelled
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'project_number']);
        });

        Schema::create('project_tasks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('project_id')->constrained('projects')->cascadeOnDelete();
            $table->string('title', 150);
            $table->decimal('estimated_hours', 8, 2)->default(0);
            $table->decimal('actual_hours', 8, 2)->default(0);
            $table->string('status', 30)->default('todo'); // todo, in_progress, review, done
            $table->string('priority', 20)->default('medium'); // low, medium, high, urgent
            $table->date('due_date')->nullable();
            $table->timestamps();
        });

        Schema::create('project_timesheets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('project_id')->constrained('projects')->cascadeOnDelete();
            $table->foreignUuid('task_id')->nullable()->constrained('project_tasks')->nullOnDelete();
            $table->foreignUuid('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->date('date');
            $table->decimal('hours', 8, 2);
            $table->decimal('hourly_cost', 24, 6)->default(0);
            $table->decimal('hourly_billing_rate', 24, 6)->default(0);
            $table->decimal('total_cost', 24, 6)->default(0);
            $table->decimal('total_billable', 24, 6)->default(0);
            $table->boolean('is_billable')->default(true);
            $table->boolean('is_billed')->default(false);
            $table->foreignUuid('invoice_id')->nullable()->constrained('service_invoices')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_timesheets');
        Schema::dropIfExists('project_tasks');
        Schema::dropIfExists('projects');
    }
};
