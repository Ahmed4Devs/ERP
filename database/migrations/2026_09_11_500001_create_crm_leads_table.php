<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('crm_leads', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('lead_number', 50);
            $table->string('title', 150);
            $table->foreignUuid('party_id')->nullable()->constrained('parties')->nullOnDelete();
            $table->string('contact_name', 100);
            $table->string('email', 150)->nullable();
            $table->string('phone', 50)->nullable();
            $table->string('company_name', 150)->nullable();
            $table->string('source', 50)->default('website'); // website, referral, cold_call, partner, exhibition
            $table->string('status', 30)->default('new'); // new, contacted, qualified, proposal, won, lost
            $table->decimal('estimated_value', 24, 6)->default(0);
            $table->unsignedTinyInteger('probability_percent')->default(20);
            $table->foreignId('assigned_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('loss_reason')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('converted_at')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'lead_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crm_leads');
    }
};
