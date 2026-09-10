<?php

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
});

require __DIR__.'/settings.php';
