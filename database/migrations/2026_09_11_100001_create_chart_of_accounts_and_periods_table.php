<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fiscal_periods', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('name');
            $table->date('start_date');
            $table->date('end_date');
            $table->boolean('is_locked')->default(false);
            $table->timestamps();

            $table->index(['tenant_id', 'company_id', 'start_date', 'end_date']);
        });

        Schema::create('accounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('code', 30);
            $table->string('name');
            $table->string('name_ar')->nullable();
            $table->string('type', 30); // asset, liability, equity, revenue, expense
            $table->string('subtype', 50)->nullable(); // current_asset, receivable, bank, cash, tax_payable, operating_revenue, etc.
            $table->string('currency', 3)->default('USD');
            $table->boolean('is_postable')->default(true);
            $table->boolean('is_system')->default(false);
            $table->decimal('current_balance', 24, 6)->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['company_id', 'code']);
            $table->index(['tenant_id', 'company_id', 'type', 'is_postable']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accounts');
        Schema::dropIfExists('fiscal_periods');
    }
};
