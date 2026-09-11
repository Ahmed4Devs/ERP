<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignUuid('department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->foreignUuid('designation_id')->nullable()->constrained('designations')->nullOnDelete();
            $table->string('employee_number', 50);
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->string('first_name_ar', 100)->nullable();
            $table->string('last_name_ar', 100)->nullable();
            $table->string('email', 150)->nullable();
            $table->string('phone', 50)->nullable();
            $table->string('national_id', 50)->nullable();
            $table->date('hire_date');
            $table->string('status', 30)->default('active'); // active, on_leave, terminated
            $table->decimal('basic_salary', 24, 6)->default(0);
            $table->decimal('housing_allowance', 24, 6)->default(0);
            $table->decimal('transport_allowance', 24, 6)->default(0);
            $table->decimal('other_allowances', 24, 6)->default(0);
            $table->string('bank_name', 100)->nullable();
            $table->string('iban', 50)->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['company_id', 'employee_number']);
        });

        Schema::table('departments', function (Blueprint $table) {
            $table->foreign('manager_id')->references('id')->on('employees')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            $table->dropForeign(['manager_id']);
        });

        Schema::dropIfExists('employees');
    }
};
