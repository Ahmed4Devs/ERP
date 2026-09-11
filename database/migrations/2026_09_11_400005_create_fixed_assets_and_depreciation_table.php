<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asset_categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('code', 50);
            $table->string('name', 150);
            $table->string('name_ar', 150)->nullable();
            $table->string('depreciation_method', 30)->default('straight_line');
            $table->unsignedInteger('useful_life_months')->default(36);
            $table->foreignUuid('asset_account_id')->nullable()->constrained('accounts')->nullOnDelete();
            $table->foreignUuid('accumulated_depreciation_account_id')->nullable()->constrained('accounts')->nullOnDelete();
            $table->foreignUuid('depreciation_expense_account_id')->nullable()->constrained('accounts')->nullOnDelete();
            $table->timestamps();

            $table->unique(['company_id', 'code']);
        });

        Schema::create('fixed_assets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignUuid('category_id')->constrained('asset_categories')->cascadeOnDelete();
            $table->string('asset_tag', 50);
            $table->string('name', 150);
            $table->string('name_ar', 150)->nullable();
            $table->string('serial_number', 100)->nullable();
            $table->date('purchase_date');
            $table->date('in_service_date');
            $table->decimal('acquisition_cost', 24, 6);
            $table->decimal('salvage_value', 24, 6)->default(0);
            $table->unsignedInteger('useful_life_months');
            $table->string('depreciation_method', 30)->default('straight_line');
            $table->decimal('accumulated_depreciation', 24, 6)->default(0);
            $table->decimal('net_book_value', 24, 6);
            $table->string('status', 30)->default('active'); // active, fully_depreciated, disposed
            $table->foreignUuid('asset_account_id')->nullable()->constrained('accounts')->nullOnDelete();
            $table->foreignUuid('accumulated_depreciation_account_id')->nullable()->constrained('accounts')->nullOnDelete();
            $table->foreignUuid('depreciation_expense_account_id')->nullable()->constrained('accounts')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['company_id', 'asset_tag']);
        });

        Schema::create('asset_depreciation_runs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('run_number', 50);
            $table->unsignedSmallInteger('period_month');
            $table->unsignedSmallInteger('period_year');
            $table->date('date');
            $table->decimal('total_depreciation', 24, 6)->default(0);
            $table->foreignUuid('journal_entry_id')->nullable()->constrained('journal_entries')->nullOnDelete();
            $table->string('status', 30)->default('posted');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'period_year', 'period_month']);
            $table->unique(['company_id', 'run_number']);
        });

        Schema::create('asset_depreciation_entries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('depreciation_run_id')->constrained('asset_depreciation_runs')->cascadeOnDelete();
            $table->foreignUuid('fixed_asset_id')->constrained('fixed_assets')->cascadeOnDelete();
            $table->decimal('amount', 24, 6);
            $table->decimal('prior_accumulated_depreciation', 24, 6);
            $table->decimal('new_accumulated_depreciation', 24, 6);
            $table->decimal('new_net_book_value', 24, 6);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asset_depreciation_entries');
        Schema::dropIfExists('asset_depreciation_runs');
        Schema::dropIfExists('fixed_assets');
        Schema::dropIfExists('asset_categories');
    }
};
