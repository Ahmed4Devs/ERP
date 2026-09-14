<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contracting_claims', function (Blueprint $table) {
            $table->string('claim_type', 30)->default('progress')->after('claim_number'); // progress, advance_payment, retention_release
            $table->decimal('advance_payment_deduction_rate', 8, 4)->default(0)->after('retention_amount');
            $table->decimal('advance_payment_deduction_amount', 24, 6)->default(0)->after('advance_payment_deduction_rate');
            $table->decimal('cumulative_work_amount', 24, 6)->default(0)->after('current_work_amount');
            $table->decimal('cumulative_retention_amount', 24, 6)->default(0)->after('advance_payment_deduction_amount');
            $table->decimal('completion_percentage', 8, 4)->default(0)->after('cumulative_work_amount');
            $table->decimal('tax_rate', 8, 4)->default('0.1500')->after('net_claim_amount'); // 15% Saudi Standard VAT
            $table->boolean('is_retention_release')->default(false)->after('tax_amount');
            $table->foreignUuid('retention_account_id')->nullable()->constrained('accounts')->nullOnDelete()->after('invoice_id');
        });
    }

    public function down(): void
    {
        Schema::table('contracting_claims', function (Blueprint $table) {
            $table->dropForeign(['retention_account_id']);
            $table->dropColumn([
                'claim_type',
                'advance_payment_deduction_rate',
                'advance_payment_deduction_amount',
                'cumulative_work_amount',
                'cumulative_retention_amount',
                'completion_percentage',
                'tax_rate',
                'is_retention_release',
                'retention_account_id',
            ]);
        });
    }
};
