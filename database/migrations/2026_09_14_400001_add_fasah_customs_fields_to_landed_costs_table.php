<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('landed_costs', function (Blueprint $table) {
            $table->string('customs_declaration_number', 100)->nullable()->after('allocation_method');
            $table->date('customs_declaration_date')->nullable()->after('customs_declaration_number');
            $table->string('port_of_entry', 150)->nullable()->after('customs_declaration_date');
            $table->string('bill_of_lading', 100)->nullable()->after('port_of_entry');
            $table->foreignUuid('customs_broker_id')->nullable()->constrained('parties')->nullOnDelete()->after('bill_of_lading');
            $table->string('customs_broker_name', 150)->nullable()->after('customs_broker_id');

            // Categorized import costs
            $table->decimal('customs_duty_amount', 15, 4)->default(0)->after('customs_broker_name');
            $table->decimal('customs_vat_amount', 15, 4)->default(0)->after('customs_duty_amount');
            $table->decimal('freight_amount', 15, 4)->default(0)->after('customs_vat_amount');
            $table->decimal('port_handling_amount', 15, 4)->default(0)->after('freight_amount');
            $table->decimal('insurance_amount', 15, 4)->default(0)->after('port_handling_amount');
            $table->decimal('other_charges_amount', 15, 4)->default(0)->after('insurance_amount');
        });

        Schema::table('goods_receipt_lines', function (Blueprint $table) {
            $table->decimal('weight_kg', 15, 4)->default(0)->after('line_total');
            $table->decimal('volume_cbm', 15, 4)->default(0)->after('weight_kg');
        });

        Schema::table('landed_cost_allocations', function (Blueprint $table) {
            $table->decimal('weight_kg', 15, 4)->default(0)->after('quantity');
            $table->decimal('volume_cbm', 15, 4)->default(0)->after('weight_kg');
            $table->decimal('customs_duty_allocated', 15, 4)->default(0)->after('allocated_amount');
            $table->decimal('freight_allocated', 15, 4)->default(0)->after('customs_duty_allocated');
        });
    }

    public function down(): void
    {
        Schema::table('landed_cost_allocations', function (Blueprint $table) {
            $table->dropColumn(['weight_kg', 'volume_cbm', 'customs_duty_allocated', 'freight_allocated']);
        });

        Schema::table('goods_receipt_lines', function (Blueprint $table) {
            $table->dropColumn(['weight_kg', 'volume_cbm']);
        });

        Schema::table('landed_costs', function (Blueprint $table) {
            $table->dropForeign(['customs_broker_id']);
            $table->dropColumn([
                'customs_declaration_number',
                'customs_declaration_date',
                'port_of_entry',
                'bill_of_lading',
                'customs_broker_id',
                'customs_broker_name',
                'customs_duty_amount',
                'customs_vat_amount',
                'freight_amount',
                'port_handling_amount',
                'insurance_amount',
                'other_charges_amount',
            ]);
        });
    }
};
