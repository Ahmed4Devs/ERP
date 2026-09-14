<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Delivery Vehicles
        Schema::create('delivery_vehicles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->string('plate_number', 50); // e.g. "أ ب ج 1234"
            $table->string('model', 100);        // e.g. "Isuzu NPR 2024"
            $table->string('vehicle_type', 50)->default('van'); // van, pickup, truck_medium, truck_heavy, motorcycle
            $table->decimal('max_weight_capacity_kg', 12, 2)->default(1000.00);
            $table->decimal('max_volume_capacity_cbm', 12, 2)->default(10.00);
            $table->string('status', 30)->default('active'); // active, maintenance, inactive
            $table->date('insurance_expiry')->nullable();
            $table->date('license_expiry')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'plate_number']);
            $table->index(['company_id', 'status']);
        });

        // 2. Delivery Drivers
        Schema::create('delivery_drivers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignUuid('employee_id')->nullable()->constrained('employees')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('code', 50);
            $table->string('name', 150);
            $table->string('name_ar', 150)->nullable();
            $table->string('phone', 50);
            $table->string('national_id', 50)->nullable();
            $table->string('license_number', 50)->nullable();
            $table->string('license_type', 50)->default('light'); // light, medium, heavy
            $table->string('status', 30)->default('available'); // available, on_trip, off_duty
            $table->timestamps();

            $table->unique(['company_id', 'code']);
            $table->index(['company_id', 'status']);
        });

        // 3. Dispatch Delivery Trips
        Schema::create('delivery_trips', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignUuid('driver_id')->constrained('delivery_drivers')->restrictOnDelete();
            $table->foreignUuid('vehicle_id')->constrained('delivery_vehicles')->restrictOnDelete();
            $table->foreignUuid('departure_warehouse_id')->nullable()->constrained('warehouses')->nullOnDelete();
            $table->string('trip_number', 60);
            $table->date('scheduled_date');
            $table->timestamp('dispatched_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->string('status', 30)->default('draft'); // draft, scheduled, in_transit, completed, cancelled
            $table->integer('total_deliveries_count')->default(0);
            $table->integer('completed_deliveries_count')->default(0);
            $table->decimal('total_weight_kg', 12, 2)->default(0);
            $table->decimal('total_cod_expected', 24, 6)->default(0); // Expected Cash on Delivery
            $table->decimal('total_cod_collected', 24, 6)->default(0); // Actual Cash collected by driver
            $table->string('cod_settlement_status', 30)->default('pending'); // pending, settled
            $table->foreignUuid('settlement_journal_entry_id')->nullable()->constrained('journal_entries')->nullOnDelete();
            $table->text('route_notes')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'trip_number']);
            $table->index(['company_id', 'status']);
            $table->index(['company_id', 'scheduled_date']);
        });

        // 4. Trip Stops / Deliveries Manifest Lines
        Schema::create('delivery_trip_stops', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('delivery_trip_id')->constrained('delivery_trips')->cascadeOnDelete();
            $table->foreignUuid('delivery_note_id')->nullable()->constrained('delivery_notes')->nullOnDelete();
            $table->foreignUuid('sales_order_id')->nullable()->constrained('sales_orders')->nullOnDelete();
            $table->foreignUuid('customer_id')->constrained('parties')->restrictOnDelete();
            $table->integer('stop_sequence')->default(1);
            $table->string('destination_address', 255);
            $table->string('recipient_contact_phone', 50)->nullable();
            $table->decimal('cod_amount_due', 24, 6)->default(0);
            $table->decimal('cod_amount_collected', 24, 6)->default(0);
            $table->string('cod_payment_method', 30)->nullable(); // cash, pos_terminal, none
            $table->string('status', 30)->default('pending'); // pending, arrived, delivered, failed, returned
            $table->timestamp('delivered_at')->nullable();
            $table->string('failure_reason', 100)->nullable(); // customer_absent, wrong_address, refused_payment

            // Electronic Proof of Delivery (e-POD)
            $table->string('recipient_name', 150)->nullable();
            $table->string('recipient_national_id', 50)->nullable();
            $table->text('recipient_signature_svg')->nullable();
            $table->decimal('gps_latitude', 10, 7)->nullable();
            $table->decimal('gps_longitude', 10, 7)->nullable();
            $table->text('pod_notes')->nullable();
            $table->timestamps();

            $table->index(['delivery_trip_id', 'stop_sequence']);
            $table->index(['status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_trip_stops');
        Schema::dropIfExists('delivery_trips');
        Schema::dropIfExists('delivery_drivers');
        Schema::dropIfExists('delivery_vehicles');
    }
};
