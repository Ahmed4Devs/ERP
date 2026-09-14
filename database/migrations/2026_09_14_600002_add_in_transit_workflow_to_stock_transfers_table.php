<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stock_transfers', function (Blueprint $table) {
            $table->string('driver_name', 150)->nullable()->after('notes');
            $table->string('vehicle_plate', 50)->nullable()->after('driver_name');
            $table->string('tracking_number', 100)->nullable()->after('vehicle_plate');
            $table->timestamp('dispatched_at')->nullable()->after('tracking_number');
            $table->timestamp('received_at')->nullable()->after('dispatched_at');
            $table->foreignId('dispatched_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('received_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('in_transit_journal_id')->nullable()->constrained('journal_entries')->nullOnDelete();
            $table->foreignUuid('receipt_journal_id')->nullable()->constrained('journal_entries')->nullOnDelete();
            $table->decimal('shortage_value', 24, 6)->default(0)->after('total_value');
        });

        Schema::table('stock_transfer_lines', function (Blueprint $table) {
            $table->decimal('dispatched_quantity', 24, 6)->nullable()->after('quantity');
            $table->decimal('received_quantity', 24, 6)->nullable()->after('dispatched_quantity');
            $table->decimal('shortage_quantity', 24, 6)->default(0)->after('received_quantity');
            $table->string('shortage_reason', 255)->nullable()->after('shortage_quantity');
        });
    }

    public function down(): void
    {
        Schema::table('stock_transfer_lines', function (Blueprint $table) {
            $table->dropColumn(['dispatched_quantity', 'received_quantity', 'shortage_quantity', 'shortage_reason']);
        });

        Schema::table('stock_transfers', function (Blueprint $table) {
            $table->dropConstrainedForeignId('dispatched_by');
            $table->dropConstrainedForeignId('received_by');
            $table->dropConstrainedForeignId('in_transit_journal_id');
            $table->dropConstrainedForeignId('receipt_journal_id');
            $table->dropColumn([
                'driver_name',
                'vehicle_plate',
                'tracking_number',
                'dispatched_at',
                'received_at',
                'shortage_value',
            ]);
        });
    }
};
