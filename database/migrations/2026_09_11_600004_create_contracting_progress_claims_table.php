<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contracting_claims', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('claim_number', 50);
            $table->foreignUuid('project_id')->constrained('projects')->cascadeOnDelete();
            $table->foreignUuid('customer_id')->constrained('parties')->cascadeOnDelete();
            $table->date('claim_date');
            $table->decimal('contract_value', 24, 6)->default(0);
            $table->decimal('previous_billed_amount', 24, 6)->default(0);
            $table->decimal('current_work_amount', 24, 6)->default(0);
            $table->decimal('retention_rate', 8, 4)->default('0.0500'); // 5% contractual retention
            $table->decimal('retention_amount', 24, 6)->default(0);
            $table->decimal('net_claim_amount', 24, 6)->default(0);
            $table->decimal('tax_amount', 24, 6)->default(0);
            $table->decimal('total_amount', 24, 6)->default(0);
            $table->string('status', 30)->default('draft'); // draft, certified, billed, rejected
            $table->foreignUuid('invoice_id')->nullable()->constrained('service_invoices')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'claim_number']);
        });

        Schema::create('contracting_claim_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('claim_id')->constrained('contracting_claims')->cascadeOnDelete();
            $table->string('work_description', 255);
            $table->decimal('scheduled_value', 24, 6)->default(0);
            $table->decimal('previous_percentage', 8, 4)->default(0);
            $table->decimal('current_percentage', 8, 4)->default(0);
            $table->decimal('current_amount', 24, 6)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contracting_claim_items');
        Schema::dropIfExists('contracting_claims');
    }
};
