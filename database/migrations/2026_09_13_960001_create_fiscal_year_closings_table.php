<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fiscal_year_closings', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->integer('fiscal_year')->index();
            $table->date('closing_date');
            $table->foreignUuid('journal_entry_id')->nullable()->constrained('journal_entries')->nullOnDelete();
            $table->decimal('total_revenue', 15, 4)->default(0);
            $table->decimal('total_expenses', 15, 4)->default(0);
            $table->decimal('net_profit_loss', 15, 4)->default(0);
            $table->foreignUuid('retained_earnings_account_id')->constrained('accounts')->cascadeOnDelete();
            $table->string('status', 30)->default('closed'); // closed, reopened
            $table->text('notes')->nullable();
            $table->foreignId('closed_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['company_id', 'fiscal_year']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fiscal_year_closings');
    }
};
