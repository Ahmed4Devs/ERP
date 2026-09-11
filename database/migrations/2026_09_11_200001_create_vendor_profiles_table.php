<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendor_profiles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('party_id')->constrained('parties')->cascadeOnDelete();
            $table->integer('payment_terms_days')->default(30);
            $table->decimal('credit_limit', 24, 6)->default(0);
            $table->string('currency', 3)->default('SAR');
            $table->text('bank_account_details')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['company_id', 'party_id']);
            $table->index(['tenant_id', 'company_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendor_profiles');
    }
};
