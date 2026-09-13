<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. ZATCA Phase 2 EGS Configuration Table
        Schema::create('zatca_configs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();

            $table->string('environment')->default('sandbox'); // sandbox, simulation, production
            $table->boolean('simulation_mode')->default(true);
            $table->string('vat_number');
            $table->string('egs_uuid')->unique();
            $table->string('egs_custom_id');
            $table->string('branch_name')->nullable();
            $table->string('organization_unit_name')->nullable();
            $table->string('organization_name')->nullable();
            $table->string('country_code')->default('SA');
            $table->string('invoice_type')->default('1100'); // 1100 = Standard & Simplified

            // Cryptographic Keys & CSIDs
            $table->text('private_key')->nullable();
            $table->text('public_key')->nullable();
            $table->text('csr')->nullable();
            $table->text('compliance_csid')->nullable();
            $table->text('compliance_secret')->nullable();
            $table->text('production_csid')->nullable();
            $table->text('production_secret')->nullable();

            // Blockchain / Hash Chaining
            $table->string('last_invoice_hash')->default('NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjAzZTQ4MmE4NDNmNmE5OA==');
            $table->unsignedBigInteger('invoice_counter')->default(0);

            $table->string('status')->default('not_configured'); // not_configured, csr_generated, compliance_passed, production_ready
            $table->timestamps();

            $table->unique(['company_id', 'environment']);
        });

        // 2. Add ZATCA Phase 2 fields to service_invoices
        Schema::table('service_invoices', function (Blueprint $table) {
            $table->string('zatca_status')->default('not_submitted'); // not_submitted, submitted, cleared, reported, rejected
            $table->string('zatca_invoice_type')->default('standard'); // standard, simplified
            $table->uuid('zatca_uuid')->nullable();
            $table->string('zatca_invoice_hash')->nullable();
            $table->string('zatca_previous_hash')->nullable();
            $table->text('zatca_qr_code')->nullable();
            $table->longText('zatca_xml')->nullable();
            $table->longText('zatca_cleared_xml')->nullable();
            $table->json('zatca_response')->nullable();
            $table->timestamp('zatca_submitted_at')->nullable();
            $table->text('zatca_error')->nullable();
        });

        // 3. ZATCA Communication Audit Logs
        Schema::create('zatca_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('service_invoice_id')->nullable()->constrained('service_invoices')->nullOnDelete();

            $table->string('endpoint');
            $table->string('action'); // compliance, clearance, reporting
            $table->json('request_payload')->nullable();
            $table->json('response_payload')->nullable();
            $table->integer('status_code')->default(200);
            $table->boolean('is_success')->default(true);
            $table->text('message')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('zatca_logs');

        Schema::table('service_invoices', function (Blueprint $table) {
            $table->dropColumn([
                'zatca_status',
                'zatca_invoice_type',
                'zatca_uuid',
                'zatca_invoice_hash',
                'zatca_previous_hash',
                'zatca_qr_code',
                'zatca_xml',
                'zatca_cleared_xml',
                'zatca_response',
                'zatca_submitted_at',
                'zatca_error',
            ]);
        });

        Schema::dropIfExists('zatca_configs');
    }
};
