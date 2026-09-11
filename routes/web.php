<?php

use App\Modules\Accounting\Http\Controllers\AccountController;
use App\Modules\Accounting\Http\Controllers\FiscalPeriodController;
use App\Modules\Accounting\Http\Controllers\InvoiceController;
use App\Modules\Accounting\Http\Controllers\ReceiptController;
use App\Modules\Accounting\Http\Controllers\ReportController;
use App\Modules\Assets\Http\Controllers\DepreciationController;
use App\Modules\Assets\Http\Controllers\FixedAssetController;
use App\Modules\HR\Http\Controllers\AttendanceController;
use App\Modules\HR\Http\Controllers\DepartmentController;
use App\Modules\HR\Http\Controllers\EmployeeController;
use App\Modules\Inventory\Http\Controllers\GoodsReceiptController;
use App\Modules\Inventory\Http\Controllers\InventoryReportController;
use App\Modules\Inventory\Http\Controllers\ProductController;
use App\Modules\Inventory\Http\Controllers\StockAdjustmentController;
use App\Modules\Inventory\Http\Controllers\StockMovementController;
use App\Modules\Inventory\Http\Controllers\StockTransferController;
use App\Modules\Inventory\Http\Controllers\WarehouseController;
use App\Modules\MasterData\Http\Controllers\PartyController;
use App\Modules\Payroll\Http\Controllers\PayrollRunController;
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
    Route::get('/reports/inventory-valuation', [InventoryReportController::class, 'valuation'])->name('reports.inventory-valuation');

    // Inventory & Distribution
    Route::get('/inventory/products', [ProductController::class, 'index'])->name('inventory.products.index');
    Route::get('/inventory/products/create', [ProductController::class, 'create'])->name('inventory.products.create');
    Route::post('/inventory/products', [ProductController::class, 'store'])->name('inventory.products.store');
    Route::get('/inventory/products/{product}/edit', [ProductController::class, 'edit'])->name('inventory.products.edit');
    Route::put('/inventory/products/{product}', [ProductController::class, 'update'])->name('inventory.products.update');
    Route::delete('/inventory/products/{product}', [ProductController::class, 'destroy'])->name('inventory.products.destroy');

    Route::get('/inventory/warehouses', [WarehouseController::class, 'index'])->name('inventory.warehouses.index');
    Route::post('/inventory/warehouses', [WarehouseController::class, 'store'])->name('inventory.warehouses.store');
    Route::put('/inventory/warehouses/{warehouse}', [WarehouseController::class, 'update'])->name('inventory.warehouses.update');

    Route::get('/inventory/receipts', [GoodsReceiptController::class, 'index'])->name('inventory.receipts.index');
    Route::get('/inventory/receipts/create', [GoodsReceiptController::class, 'create'])->name('inventory.receipts.create');
    Route::post('/inventory/receipts', [GoodsReceiptController::class, 'store'])->name('inventory.receipts.store');
    Route::get('/inventory/receipts/{goodsReceipt}', [GoodsReceiptController::class, 'show'])->name('inventory.receipts.show');

    Route::get('/inventory/movements', [StockMovementController::class, 'index'])->name('inventory.movements.index');

    Route::get('/inventory/transfers', [StockTransferController::class, 'index'])->name('inventory.transfers.index');
    Route::get('/inventory/transfers/create', [StockTransferController::class, 'create'])->name('inventory.transfers.create');
    Route::post('/inventory/transfers', [StockTransferController::class, 'store'])->name('inventory.transfers.store');

    Route::get('/inventory/adjustments', [StockAdjustmentController::class, 'index'])->name('inventory.adjustments.index');
    Route::get('/inventory/adjustments/create', [StockAdjustmentController::class, 'create'])->name('inventory.adjustments.create');
    Route::post('/inventory/adjustments', [StockAdjustmentController::class, 'store'])->name('inventory.adjustments.store');

    // Human Resources (HR)
    Route::get('/hr/employees', [EmployeeController::class, 'index'])->name('hr.employees.index');
    Route::get('/hr/employees/create', [EmployeeController::class, 'create'])->name('hr.employees.create');
    Route::post('/hr/employees', [EmployeeController::class, 'store'])->name('hr.employees.store');
    Route::get('/hr/employees/{employee}/edit', [EmployeeController::class, 'edit'])->name('hr.employees.edit');
    Route::put('/hr/employees/{employee}', [EmployeeController::class, 'update'])->name('hr.employees.update');
    Route::delete('/hr/employees/{employee}', [EmployeeController::class, 'destroy'])->name('hr.employees.destroy');

    Route::get('/hr/departments', [DepartmentController::class, 'index'])->name('hr.departments.index');
    Route::post('/hr/departments', [DepartmentController::class, 'storeDepartment'])->name('hr.departments.store');
    Route::post('/hr/designations', [DepartmentController::class, 'storeDesignation'])->name('hr.designations.store');

    Route::get('/hr/attendances', [AttendanceController::class, 'index'])->name('hr.attendances.index');
    Route::post('/hr/attendances', [AttendanceController::class, 'store'])->name('hr.attendances.store');

    // Payroll Framework
    Route::get('/payroll/runs', [PayrollRunController::class, 'index'])->name('payroll.runs.index');
    Route::get('/payroll/runs/create', [PayrollRunController::class, 'create'])->name('payroll.runs.create');
    Route::post('/payroll/runs', [PayrollRunController::class, 'store'])->name('payroll.runs.store');
    Route::get('/payroll/runs/{payrollRun}', [PayrollRunController::class, 'show'])->name('payroll.runs.show');
    Route::post('/payroll/runs/{payrollRun}/post', [PayrollRunController::class, 'postRun'])->name('payroll.runs.post');
    Route::post('/payroll/runs/{payrollRun}/disburse', [PayrollRunController::class, 'disburse'])->name('payroll.runs.disburse');

    // Fixed Assets & Depreciation
    Route::get('/assets/register', [FixedAssetController::class, 'index'])->name('assets.register.index');
    Route::get('/assets/register/create', [FixedAssetController::class, 'create'])->name('assets.register.create');
    Route::post('/assets/register', [FixedAssetController::class, 'store'])->name('assets.register.store');
    Route::get('/assets/register/{fixedAsset}', [FixedAssetController::class, 'show'])->name('assets.register.show');

    Route::get('/assets/depreciation', [DepreciationController::class, 'index'])->name('assets.depreciation.index');
    Route::post('/assets/depreciation', [DepreciationController::class, 'store'])->name('assets.depreciation.store');

    // Fiscal Periods & Close
    Route::get('/accounting/periods', [FiscalPeriodController::class, 'index'])->name('accounting.periods.index');
    Route::post('/accounting/periods', [FiscalPeriodController::class, 'store'])->name('accounting.periods.store');
    Route::post('/accounting/periods/{fiscalPeriod}/lock', [FiscalPeriodController::class, 'toggleLock'])->name('accounting.periods.toggleLock');
});

require __DIR__.'/settings.php';
