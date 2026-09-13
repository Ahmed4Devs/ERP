<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fixed_asset_disposals', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->index();
            $table->uuid('company_id')->index();
            $table->uuid('branch_id')->nullable()->index();
            $table->uuid('fixed_asset_id')->index();
            $table->string('disposal_number')->index();
            $table->date('disposal_date')->index();
            $table->string('disposal_type')->default('sale')->index(); // sale, scrap, donation, stolen
            $table->decimal('acquisition_cost', 15, 6)->default(0);
            $table->decimal('accumulated_depreciation', 15, 6)->default(0);
            $table->decimal('net_book_value', 15, 6)->default(0);
            $table->decimal('proceeds', 15, 6)->default(0); // Sale price / scrap proceeds
            $table->decimal('tax_amount', 15, 6)->default(0); // VAT on sale if applicable
            $table->decimal('gain_loss_amount', 15, 6)->default(0); // Absolute gain or loss
            $table->string('gain_loss_type')->default('none'); // gain, loss, none
            $table->uuid('bank_account_id')->nullable()->index(); // Account receiving proceeds
            $table->string('buyer_name')->nullable();
            $table->string('reason')->nullable();
            $table->text('notes')->nullable();
            $table->string('status')->default('draft')->index(); // draft, posted
            $table->uuid('journal_entry_id')->nullable()->index();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('posted_by')->nullable();
            $table->timestamp('posted_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();
            $table->foreign('fixed_asset_id')->references('id')->on('fixed_assets')->cascadeOnDelete();
            $table->foreign('bank_account_id')->references('id')->on('accounts')->nullOnDelete();
            $table->foreign('journal_entry_id')->references('id')->on('journal_entries')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fixed_asset_disposals');
    }
};
