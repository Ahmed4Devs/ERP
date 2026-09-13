<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->string('nationality', 50)->default('Saudi')->after('national_id');
            $table->string('gosi_number', 50)->nullable()->after('nationality');
        });

        Schema::table('payslips', function (Blueprint $table) {
            $table->decimal('gosi_contributory_wage', 24, 6)->default(0)->after('gross_salary');
            $table->decimal('employer_gosi_contribution', 24, 6)->default(0)->after('social_insurance_deduction');
        });
    }

    public function down(): void
    {
        Schema::table('payslips', function (Blueprint $table) {
            $table->dropColumn(['gosi_contributory_wage', 'employer_gosi_contribution']);
        });

        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn(['nationality', 'gosi_number']);
        });
    }
};
