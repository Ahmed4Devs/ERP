<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Loyalty Programs
        Schema::create('loyalty_programs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('code', 50);
            $table->string('name', 150);
            $table->string('name_ar', 150)->nullable();
            $table->text('description')->nullable();
            $table->decimal('spend_amount_per_point', 24, 6)->default(10.000000); // 10 SAR = 1 point
            $table->decimal('point_redeem_value', 24, 6)->default(0.050000); // 1 point = 0.05 SAR discount (100 pts = 5 SAR)
            $table->integer('min_points_to_redeem')->default(100);
            $table->integer('points_expiry_days')->nullable(); // null = never expire
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['company_id', 'code']);
            $table->index(['company_id', 'is_active']);
        });

        // 2. Loyalty Tiers (Bronze, Silver, Gold, Platinum)
        Schema::create('loyalty_tiers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('loyalty_program_id')->constrained('loyalty_programs')->cascadeOnDelete();
            $table->string('tier_code', 50); // bronze, silver, gold, platinum, vip
            $table->string('name', 100);
            $table->string('name_ar', 100)->nullable();
            $table->integer('min_points_threshold')->default(0);
            $table->decimal('earn_multiplier', 8, 4)->default(1.0000); // 1.0x, 1.25x, 1.5x, 2.0x
            $table->string('color_hex', 20)->default('#64748b');
            $table->string('perks_summary_ar', 255)->nullable();
            $table->timestamps();

            $table->unique(['loyalty_program_id', 'tier_code']);
            $table->index(['loyalty_program_id', 'min_points_threshold']);
        });

        // 3. Customer Loyalty Accounts
        Schema::create('loyalty_accounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('party_id')->constrained('parties')->cascadeOnDelete();
            $table->foreignUuid('loyalty_program_id')->constrained('loyalty_programs')->restrictOnDelete();
            $table->foreignUuid('current_tier_id')->nullable()->constrained('loyalty_tiers')->nullOnDelete();
            $table->string('card_number', 60);
            $table->integer('points_balance')->default(0);
            $table->integer('lifetime_points_earned')->default(0);
            $table->integer('lifetime_points_redeemed')->default(0);
            $table->string('status', 30)->default('active'); // active, suspended, closed
            $table->timestamp('joined_at')->useCurrent();
            $table->timestamps();

            $table->unique(['company_id', 'party_id']);
            $table->unique(['company_id', 'card_number']);
            $table->index(['company_id', 'status']);
        });

        // 4. Loyalty Points Ledger / Transactions
        Schema::create('loyalty_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('loyalty_account_id')->constrained('loyalty_accounts')->cascadeOnDelete();
            $table->string('transaction_type', 30); // earn, redeem, manual_adjust, expire
            $table->integer('points'); // positive for earn / credit, negative for redeem / expire
            $table->integer('balance_after');
            $table->decimal('spend_amount', 24, 6)->nullable();
            $table->decimal('monetary_equivalent', 24, 6)->nullable(); // SAR value of points redeemed or awarded
            $table->string('reference_type', 60)->nullable(); // service_invoice, pos_order, manual
            $table->uuid('reference_id')->nullable();
            $table->foreignUuid('journal_entry_id')->nullable()->constrained('journal_entries')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['loyalty_account_id', 'created_at']);
            $table->index(['company_id', 'transaction_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loyalty_transactions');
        Schema::dropIfExists('loyalty_accounts');
        Schema::dropIfExists('loyalty_tiers');
        Schema::dropIfExists('loyalty_programs');
    }
};
