<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('approval_rules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('module', 60); // vendor_bill, vendor_payment, journal_entry, petty_cash, employee_loan, asset_disposal
            $table->string('name', 150);
            $table->decimal('min_amount', 15, 4)->default(0);
            $table->decimal('max_amount', 15, 4)->nullable(); // null = unlimited
            $table->integer('required_levels')->default(1);
            $table->boolean('is_active')->default(true);
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'company_id', 'module', 'is_active']);
        });

        Schema::create('approval_rule_levels', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('rule_id')->constrained('approval_rules')->cascadeOnDelete();
            $table->integer('level_number'); // 1, 2, 3
            $table->string('level_name', 150); // e.g. "اعتماد المدير المالي", "اعتماد الرئيس التنفيذي"
            $table->string('approver_role', 60)->nullable(); // e.g. "finance_manager", "cfo", "general_manager"
            $table->foreignId('approver_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['rule_id', 'level_number']);
        });

        Schema::create('approval_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('rule_id')->nullable()->constrained('approval_rules')->nullOnDelete();
            $table->string('document_type', 60); // vendor_bill, vendor_payment, journal_entry, petty_cash_settlement, employee_loan, asset_disposal
            $table->uuid('document_id');
            $table->string('document_number', 100);
            $table->decimal('amount', 15, 4)->default(0);
            $table->string('currency', 10)->default('SAR');
            $table->foreignId('requester_id')->constrained('users')->cascadeOnDelete();
            $table->integer('current_level')->default(1);
            $table->integer('total_levels')->default(1);
            $table->string('status', 30)->default('pending'); // pending, approved, rejected, cancelled
            $table->text('notes')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'company_id', 'status']);
            $table->index(['document_type', 'document_id']);
        });

        Schema::create('approval_actions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('approval_request_id')->constrained('approval_requests')->cascadeOnDelete();
            $table->integer('level_number');
            $table->string('action', 30); // approved, rejected
            $table->foreignId('actor_id')->constrained('users')->cascadeOnDelete();
            $table->text('comments')->nullable();
            $table->timestamp('action_at');
            $table->timestamps();

            $table->index(['approval_request_id', 'level_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('approval_actions');
        Schema::dropIfExists('approval_requests');
        Schema::dropIfExists('approval_rule_levels');
        Schema::dropIfExists('approval_rules');
    }
};
