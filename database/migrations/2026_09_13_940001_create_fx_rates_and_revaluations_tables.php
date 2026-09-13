<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Currency Exchange Rates History
        Schema::create('currency_exchange_rates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();

            $table->string('from_currency', 3); // USD, EUR, GBP, AED, etc.
            $table->string('to_currency', 3)->default('SAR');
            $table->decimal('rate', 18, 6); // e.g. 3.750000
            $table->date('effective_date');
            $table->string('source')->default('manual'); // manual, central_bank, api
            $table->timestamps();

            $table->unique(['company_id', 'from_currency', 'to_currency', 'effective_date'], 'fx_rates_unique');
        });

        // 2. Add foreign currency tracking to journal_entry_lines if not already present
        Schema::table('journal_entry_lines', function (Blueprint $table) {
            $table->string('currency', 3)->nullable()->default('SAR');
            $table->decimal('foreign_amount', 18, 6)->nullable();
            $table->decimal('exchange_rate', 18, 6)->nullable()->default(1.000000);
        });

        // 3. FX Revaluation Batches
        Schema::create('fx_revaluations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();

            $table->string('revaluation_number')->unique();
            $table->date('date'); // End of period date
            $table->string('status')->default('draft'); // draft, posted, reversed
            $table->decimal('total_gain', 18, 4)->default(0);
            $table->decimal('total_loss', 18, 4)->default(0);
            $table->decimal('net_adjustment', 18, 4)->default(0);

            $table->foreignUuid('journal_entry_id')->nullable()->constrained('journal_entries')->nullOnDelete();
            $table->foreignUuid('reversal_journal_entry_id')->nullable()->constrained('journal_entries')->nullOnDelete();
            $table->foreignId('created_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();

            $table->timestamps();
        });

        // 4. FX Revaluation Detail Lines
        Schema::create('fx_revaluation_lines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('fx_revaluation_id')->constrained('fx_revaluations')->cascadeOnDelete();

            $table->foreignUuid('account_id')->constrained('accounts')->cascadeOnDelete();
            $table->string('currency', 3);
            $table->decimal('foreign_balance', 18, 4);
            $table->decimal('book_exchange_rate', 18, 6);
            $table->decimal('closing_exchange_rate', 18, 6);
            $table->decimal('book_amount_sar', 18, 4);
            $table->decimal('revalued_amount_sar', 18, 4);
            $table->decimal('adjustment_amount_sar', 18, 4);
            $table->string('gain_loss_type'); // gain, loss, neutral

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fx_revaluation_lines');
        Schema::dropIfExists('fx_revaluations');

        Schema::table('journal_entry_lines', function (Blueprint $table) {
            $table->dropColumn(['currency', 'foreign_amount', 'exchange_rate']);
        });

        Schema::dropIfExists('currency_exchange_rates');
    }
};
