<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attachments', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('attachable_type', 150)->index();
            $table->string('attachable_id', 150)->index();
            $table->string('file_name');
            $table->string('file_path');
            $table->unsignedBigInteger('file_size');
            $table->string('mime_type', 100);
            $table->string('category', 50)->default('general'); // general, contract, invoice, receipt, tax_document, check_copy
            $table->string('description')->nullable();
            $table->foreignId('uploaded_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('system_alerts', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('alert_type', 50)->index(); // cheque_due, guarantee_expiring, invoice_overdue, low_stock, general
            $table->string('title');
            $table->string('title_ar')->nullable();
            $table->text('message');
            $table->text('message_ar')->nullable();
            $table->string('severity', 20)->default('warning'); // info, warning, critical
            $table->string('source_type', 150)->nullable()->index();
            $table->string('source_id', 150)->nullable()->index();
            $table->string('action_url')->nullable();
            $table->boolean('is_read')->default(false)->index();
            $table->boolean('is_dismissed')->default(false)->index();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_alerts');
        Schema::dropIfExists('attachments');
    }
};
