<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customer_profiles', function (Blueprint $table) {
            $table->string('portal_token', 64)->nullable()->unique()->after('is_active');
            $table->boolean('portal_access_enabled')->default(true)->after('portal_token');
        });
    }

    public function down(): void
    {
        Schema::table('customer_profiles', function (Blueprint $table) {
            $table->dropColumn(['portal_token', 'portal_access_enabled']);
        });
    }
};
