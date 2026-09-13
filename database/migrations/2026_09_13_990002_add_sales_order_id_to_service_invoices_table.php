<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('service_invoices', function (Blueprint $table) {
            $table->foreignUuid('sales_order_id')->nullable()->after('party_id')->constrained('sales_orders')->nullOnDelete();
            $table->index(['sales_order_id']);
        });
    }

    public function down(): void
    {
        Schema::table('service_invoices', function (Blueprint $table) {
            $table->dropForeign(['sales_order_id']);
            $table->dropColumn(['sales_order_id']);
        });
    }
};
