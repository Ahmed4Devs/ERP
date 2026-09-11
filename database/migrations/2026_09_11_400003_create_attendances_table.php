<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendances', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->date('date');
            $table->string('status', 30)->default('present'); // present, absent, late, leave, half_day
            $table->decimal('hours_worked', 8, 2)->default(8.00);
            $table->decimal('overtime_hours', 8, 2)->default(0.00);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'employee_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};
