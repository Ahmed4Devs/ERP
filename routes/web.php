<?php

use App\Modules\Accounting\Http\Controllers\AccountController;
use App\Modules\Accounting\Http\Controllers\InvoiceController;
use App\Modules\Accounting\Http\Controllers\ReceiptController;
use App\Modules\Accounting\Http\Controllers\ReportController;
use App\Modules\MasterData\Http\Controllers\PartyController;
use App\Modules\Platform\Http\Controllers\ContextController;
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

    // Financial Reports
    Route::get('/reports/trial-balance', [ReportController::class, 'trialBalance'])->name('reports.trial-balance');
    Route::get('/reports/general-ledger', [ReportController::class, 'generalLedger'])->name('reports.general-ledger');
    Route::get('/reports/ar-aging', [ReportController::class, 'aging'])->name('reports.ar-aging');
});

require __DIR__.'/settings.php';
