<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('asset_categories', function (Blueprint $table) {
            $table->string('zatca_tax_group', 30)->default('group_5')->after('depreciation_method');
        });

        Schema::table('fixed_assets', function (Blueprint $table) {
            $table->string('zatca_tax_group', 30)->default('group_5')->after('depreciation_method');
            $table->decimal('zatca_tax_base', 24, 6)->nullable()->after('net_book_value');
        });
    }

    public function down(): void
    {
        Schema::table('fixed_assets', function (Blueprint $table) {
            $table->dropColumn(['zatca_tax_group', 'zatca_tax_base']);
        });

        Schema::table('asset_categories', function (Blueprint $table) {
            $table->dropColumn(['zatca_tax_group']);
        });
    }
};
