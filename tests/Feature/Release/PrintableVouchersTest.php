<?php

use App\Models\User;
use App\Modules\Accounting\Models\Receipt;
use App\Modules\Accounting\Models\ServiceInvoice;
use App\Modules\Inventory\Models\GoodsReceipt;
use App\Modules\Purchasing\Models\PurchaseOrder;
use App\Modules\Purchasing\Models\VendorBill;
use App\Modules\Purchasing\Models\VendorPayment;
use App\Modules\Retail\Models\PosOrder;
use App\Modules\Sales\Models\SalesOrder;
use App\Modules\Sales\Models\SalesQuotation;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed();
});

test('all enterprise printable vouchers render successfully with tafqeet and verification qr codes', function () {
    $user = User::where('email', 'admin@alamal.com')->firstOrFail();

    // 1. Service Invoice Print
    $invoice = ServiceInvoice::first();
    if ($invoice) {
        $response = $this->actingAs($user)->get(route('invoices.print', $invoice->id));
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Accounting/Invoices/Print')
            ->has('invoice')
            ->has('qrCodeDataUri')
            ->has('amountInWords')
        );
    }

    // 2. Receipt Voucher Print
    $receipt = Receipt::first();
    if ($receipt) {
        $response = $this->actingAs($user)->get(route('receipts.print', $receipt->id));
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Accounting/Receipts/Print')
            ->has('receipt')
            ->has('qrCodeDataUri')
            ->has('amountInWords')
        );
    }

    // 3. Purchase Order Print
    $po = PurchaseOrder::first();
    if ($po) {
        $response = $this->actingAs($user)->get(route('purchase-orders.print', $po->id));
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Purchasing/Orders/Print')
            ->has('order')
            ->has('qrCodeDataUri')
            ->has('amountInWords')
        );
    }

    // 4. Vendor Bill Print
    $bill = VendorBill::first();
    if ($bill) {
        $response = $this->actingAs($user)->get(route('vendor-bills.print', $bill->id));
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Purchasing/Bills/Print')
            ->has('bill')
            ->has('qrCodeDataUri')
            ->has('amountInWords')
        );
    }

    // 5. Vendor Payment Print
    $payment = VendorPayment::first();
    if ($payment) {
        $response = $this->actingAs($user)->get(route('vendor-payments.print', $payment->id));
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Purchasing/Payments/Print')
            ->has('payment')
            ->has('qrCodeDataUri')
            ->has('amountInWords')
        );
    }

    // 6. Sales Quotation Print
    $quotation = SalesQuotation::first();
    if ($quotation) {
        $response = $this->actingAs($user)->get(route('sales.quotations.print', $quotation->id));
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Sales/Quotations/Print')
            ->has('quotation')
            ->has('qrCodeDataUri')
            ->has('amountInWords')
        );
    }

    // 7. Sales Order Print
    $salesOrder = SalesOrder::first();
    if ($salesOrder) {
        $response = $this->actingAs($user)->get(route('sales.orders.print', $salesOrder->id));
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Sales/Orders/Print')
            ->has('order')
            ->has('qrCodeDataUri')
            ->has('amountInWords')
        );
    }

    // 8. POS Thermal Receipt Print
    $posOrder = PosOrder::first();
    if ($posOrder) {
        $response = $this->actingAs($user)->get(route('retail.orders.print', $posOrder->id));
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Retail/Orders/Print')
            ->has('order')
            ->has('qrCodeDataUri')
            ->has('amountInWords')
        );
    }

    // 9. Goods Receipt Note Print
    $grn = GoodsReceipt::first();
    if ($grn) {
        $response = $this->actingAs($user)->get(route('inventory.receipts.print', $grn->id));
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Inventory/GoodsReceipts/Print')
            ->has('receipt')
            ->has('qrCodeDataUri')
            ->has('amountInWords')
        );
    }
});
