<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pos_sessions', function (Blueprint $table) {
            $table->string('z_report_number', 60)->nullable()->after('session_number');
            $table->unsignedInteger('z_report_sequence')->nullable()->after('z_report_number');
            $table->unsignedInteger('total_orders_count')->default(0)->after('cash_difference');
            $table->decimal('total_gross_sales', 24, 6)->default(0)->after('total_orders_count');
            $table->decimal('total_discounts', 24, 6)->default(0)->after('total_gross_sales');
            $table->decimal('total_net_sales', 24, 6)->default(0)->after('total_discounts');
            $table->decimal('total_tax', 24, 6)->default(0)->after('total_net_sales');
            $table->decimal('total_cash_sales', 24, 6)->default(0)->after('total_tax');
            $table->decimal('total_card_sales', 24, 6)->default(0)->after('total_cash_sales');
            $table->foreignUuid('difference_journal_entry_id')->nullable()->after('total_card_sales')->constrained('journal_entries')->nullOnDelete();
            $table->foreignId('closed_by')->nullable()->after('difference_journal_entry_id')->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('pos_sessions', function (Blueprint $table) {
            $table->dropForeign(['difference_journal_entry_id']);
            $table->dropForeign(['closed_by']);
            $table->dropColumn([
                'z_report_number',
                'z_report_sequence',
                'total_orders_count',
                'total_gross_sales',
                'total_discounts',
                'total_net_sales',
                'total_tax',
                'total_cash_sales',
                'total_card_sales',
                'difference_journal_entry_id',
                'closed_by',
            ]);
        });
    }
};
