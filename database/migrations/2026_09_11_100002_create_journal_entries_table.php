<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('journal_entries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('entry_number', 50);
            $table->date('date');
            $table->string('description');
            $table->string('status', 30)->default('posted'); // draft, posted, reversed
            $table->string('source_type')->nullable(); // invoice, receipt, adjustment, manual
            $table->string('source_id')->nullable();
            $table->string('idempotency_key')->nullable();
            $table->string('payload_hash', 64)->nullable();
            $table->uuid('reversal_of_id')->nullable();
            $table->timestamp('posted_at')->useCurrent();
            $table->foreignId('posted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['company_id', 'entry_number']);
            $table->unique(['company_id', 'idempotency_key']);
            $table->index(['tenant_id', 'company_id', 'date', 'status']);
            $table->index(['source_type', 'source_id']);
        });

        Schema::table('journal_entries', function (Blueprint $table) {
            $table->foreign('reversal_of_id')->references('id')->on('journal_entries')->nullOnDelete();
        });

        Schema::create('journal_entry_lines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('journal_entry_id')->constrained('journal_entries')->cascadeOnDelete();
            $table->foreignUuid('account_id')->constrained('accounts')->restrictOnDelete();
            $table->decimal('debit', 24, 6)->default(0);
            $table->decimal('credit', 24, 6)->default(0);
            $table->string('description')->nullable();
            $table->timestamps();

            $table->index(['journal_entry_id', 'account_id']);
            $table->index(['tenant_id', 'company_id', 'account_id']);
        });

        // Add PostgreSQL check constraints on debit/credit lines
        DB::statement('ALTER TABLE journal_entry_lines ADD CONSTRAINT chk_jel_non_negative CHECK (debit >= 0 AND credit >= 0)');
        DB::statement('ALTER TABLE journal_entry_lines ADD CONSTRAINT chk_jel_mutually_exclusive CHECK ((debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0))');
    }

    public function down(): void
    {
        Schema::dropIfExists('journal_entry_lines');
        Schema::dropIfExists('journal_entries');
    }
};
