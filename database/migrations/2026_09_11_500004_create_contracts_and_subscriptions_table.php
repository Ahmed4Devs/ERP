<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contracts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('contract_number', 50);
            $table->foreignUuid('customer_id')->constrained('parties')->cascadeOnDelete();
            $table->foreignUuid('project_id')->nullable()->constrained('projects')->nullOnDelete();
            $table->string('title', 150);
            $table->string('title_ar', 150)->nullable();
            $table->date('start_date');
            $table->date('end_date');
            $table->string('billing_cycle', 30)->default('monthly'); // monthly, quarterly, semi_annual, annual
            $table->decimal('recurring_amount', 24, 6);
            $table->decimal('tax_rate', 24, 6)->default('0.100000');
            $table->date('next_billing_date');
            $table->date('last_billed_at')->nullable();
            $table->string('status', 30)->default('draft'); // draft, active, suspended, expired, terminated
            $table->boolean('auto_renew')->default(false);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'contract_number']);
        });

        Schema::create('contract_lines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('contract_id')->constrained('contracts')->cascadeOnDelete();
            $table->string('description', 255);
            $table->decimal('quantity', 24, 6)->default(1);
            $table->decimal('unit_price', 24, 6)->default(0);
            $table->decimal('line_total', 24, 6)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contract_lines');
        Schema::dropIfExists('contracts');
    }
};
