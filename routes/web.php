<?php

use App\Modules\Accounting\Http\Controllers\AccountController;
use App\Modules\Accounting\Http\Controllers\InvoiceController;
use App\Modules\Accounting\Http\Controllers\ReceiptController;
use App\Modules\Accounting\Http\Controllers\ReportController;
use App\Modules\MasterData\Http\Controllers\PartyController;
use App\Modules\Platform\Http\Controllers\ContextController;
use App\Modules\Purchasing\Http\Controllers\PurchaseOrderController;
use App\Modules\Purchasing\Http\Controllers\VendorBillController;
use App\Modules\Purchasing\Http\Controllers\VendorPaymentController;
use App\Modules\Treasury\Http\Controllers\TreasuryTransferController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::post('/switch-locale', [ContextController::class, 'switchLocale'])->name('context.locale');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    // Tenancy & Organization Context Switching
    Route::post('/switch-context/tenant', [ContextController::class, 'switchTenant'])->name('context.tenant');
    Route::post('/switch-context/company', [ContextController::class, 'switchCompany'])->name('context.company');
    Route::post('/switch-context/branch', [ContextController::class, 'switchBranch'])->name('context.branch');

    // Master Data - Customers / Parties
    Route::get('/customers', [PartyController::class, 'index'])->name('customers.index');
    Route::post('/customers', [PartyController::class, 'store'])->name('customers.store');
    Route::delete('/customers/{party}', [PartyController::class, 'destroy'])->name('customers.destroy');

    // Accounting & Finance
    Route::get('/accounts', [AccountController::class, 'index'])->name('accounts.index');

    // Service Invoices
    Route::get('/invoices', [InvoiceController::class, 'index'])->name('invoices.index');
    Route::get('/invoices/create', [InvoiceController::class, 'create'])->name('invoices.create');
    Route::post('/invoices', [InvoiceController::class, 'store'])->name('invoices.store');
    Route::get('/invoices/{invoice}', [InvoiceController::class, 'show'])->name('invoices.show');

    // Receipts & Collections
    Route::get('/receipts', [ReceiptController::class, 'index'])->name('receipts.index');
    Route::post('/receipts', [ReceiptController::class, 'store'])->name('receipts.store');

    // Purchasing & Procure-to-Pay
    Route::get('/purchase-orders', [PurchaseOrderController::class, 'index'])->name('purchase-orders.index');
    Route::get('/purchase-orders/create', [PurchaseOrderController::class, 'create'])->name('purchase-orders.create');
    Route::post('/purchase-orders', [PurchaseOrderController::class, 'store'])->name('purchase-orders.store');
    Route::get('/purchase-orders/{purchaseOrder}', [PurchaseOrderController::class, 'show'])->name('purchase-orders.show');
    Route::post('/purchase-orders/{purchaseOrder}/approve', [PurchaseOrderController::class, 'approve'])->name('purchase-orders.approve');

    Route::get('/vendor-bills', [VendorBillController::class, 'index'])->name('vendor-bills.index');
    Route::get('/vendor-bills/create', [VendorBillController::class, 'create'])->name('vendor-bills.create');
    Route::post('/vendor-bills', [VendorBillController::class, 'store'])->name('vendor-bills.store');
    Route::get('/vendor-bills/{vendorBill}', [VendorBillController::class, 'show'])->name('vendor-bills.show');

    Route::get('/vendor-payments', [VendorPaymentController::class, 'index'])->name('vendor-payments.index');
    Route::post('/vendor-payments', [VendorPaymentController::class, 'store'])->name('vendor-payments.store');

    // Treasury Transfers
    Route::get('/treasury/transfers', [TreasuryTransferController::class, 'index'])->name('treasury.transfers.index');
    Route::post('/treasury/transfers', [TreasuryTransferController::class, 'store'])->name('treasury.transfers.store');

    // Financial Reports
    Route::get('/reports/trial-balance', [ReportController::class, 'trialBalance'])->name('reports.trial-balance');
    Route::get('/reports/general-ledger', [ReportController::class, 'generalLedger'])->name('reports.general-ledger');
    Route::get('/reports/ar-aging', [ReportController::class, 'aging'])->name('reports.ar-aging');
    Route::get('/reports/ap-aging', [ReportController::class, 'apAging'])->name('reports.ap-aging');
});

require __DIR__.'/settings.php';
