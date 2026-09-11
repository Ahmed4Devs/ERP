<?php

use App\Modules\Accounting\Http\Controllers\AccountController;
use App\Modules\Accounting\Http\Controllers\FiscalPeriodController;
use App\Modules\Accounting\Http\Controllers\InvoiceController;
use App\Modules\Accounting\Http\Controllers\ReceiptController;
use App\Modules\Accounting\Http\Controllers\ReportController;
use App\Modules\Assets\Http\Controllers\DepreciationController;
use App\Modules\Assets\Http\Controllers\FixedAssetController;
use App\Modules\Contracting\Http\Controllers\ContractingClaimController;
use App\Modules\Contracts\Http\Controllers\ContractController;
use App\Modules\CRM\Http\Controllers\LeadController;
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
use App\Modules\Manufacturing\Http\Controllers\BomController;
use App\Modules\Manufacturing\Http\Controllers\ProductionOrderController;
use App\Modules\MasterData\Http\Controllers\PartyController;
use App\Modules\Payroll\Http\Controllers\PayrollRunController;
use App\Modules\Platform\Http\Controllers\ContextController;
use App\Modules\Projects\Http\Controllers\ProjectController;
use App\Modules\Purchasing\Http\Controllers\PurchaseOrderController;
use App\Modules\Purchasing\Http\Controllers\VendorBillController;
use App\Modules\Purchasing\Http\Controllers\VendorPaymentController;
use App\Modules\Retail\Http\Controllers\PosOrderController;
use App\Modules\Retail\Http\Controllers\PosSessionController;
use App\Modules\Retail\Http\Controllers\PosTerminalController;
use App\Modules\Sales\Http\Controllers\SalesOrderController;
use App\Modules\Sales\Http\Controllers\SalesQuotationController;
use App\Modules\Support\Http\Controllers\SupportTicketController;
use App\Modules\Trade\Http\Controllers\PriceListController;
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

    // CRM Leads
    Route::get('/crm/leads', [LeadController::class, 'index'])->name('crm.leads.index');
    Route::get('/crm/leads/create', [LeadController::class, 'create'])->name('crm.leads.create');
    Route::post('/crm/leads', [LeadController::class, 'store'])->name('crm.leads.store');
    Route::get('/crm/leads/{lead}', [LeadController::class, 'show'])->name('crm.leads.show');
    Route::post('/crm/leads/{lead}/convert', [LeadController::class, 'convert'])->name('crm.leads.convert');

    // Sales Quotations & Orders
    Route::get('/sales/quotations', [SalesQuotationController::class, 'index'])->name('sales.quotations.index');
    Route::get('/sales/quotations/create', [SalesQuotationController::class, 'create'])->name('sales.quotations.create');
    Route::post('/sales/quotations', [SalesQuotationController::class, 'store'])->name('sales.quotations.store');
    Route::get('/sales/quotations/{quotation}', [SalesQuotationController::class, 'show'])->name('sales.quotations.show');
    Route::post('/sales/quotations/{quotation}/convert', [SalesQuotationController::class, 'convertToOrder'])->name('sales.quotations.convert');

    Route::get('/sales/orders', [SalesOrderController::class, 'index'])->name('sales.orders.index');
    Route::get('/sales/orders/{order}', [SalesOrderController::class, 'show'])->name('sales.orders.show');
    Route::put('/sales/orders/{order}/status', [SalesOrderController::class, 'updateStatus'])->name('sales.orders.status');

    // Projects & Timesheets
    Route::get('/projects', [ProjectController::class, 'index'])->name('projects.index');
    Route::get('/projects/create', [ProjectController::class, 'create'])->name('projects.create');
    Route::post('/projects', [ProjectController::class, 'store'])->name('projects.store');
    Route::get('/projects/{project}', [ProjectController::class, 'show'])->name('projects.show');
    Route::post('/projects/{project}/tasks', [ProjectController::class, 'storeTask'])->name('projects.tasks.store');
    Route::post('/projects/{project}/timesheets', [ProjectController::class, 'storeTimesheet'])->name('projects.timesheets.store');

    // Contracts & Subscriptions
    Route::get('/contracts', [ContractController::class, 'index'])->name('contracts.index');
    Route::get('/contracts/create', [ContractController::class, 'create'])->name('contracts.create');
    Route::post('/contracts', [ContractController::class, 'store'])->name('contracts.store');
    Route::get('/contracts/{contract}', [ContractController::class, 'show'])->name('contracts.show');
    Route::post('/contracts/{contract}/bill', [ContractController::class, 'bill'])->name('contracts.bill');

    // Support Tickets
    Route::get('/support/tickets', [SupportTicketController::class, 'index'])->name('support.tickets.index');
    Route::get('/support/tickets/create', [SupportTicketController::class, 'create'])->name('support.tickets.create');
    Route::post('/support/tickets', [SupportTicketController::class, 'store'])->name('support.tickets.store');
    Route::get('/support/tickets/{ticket}', [SupportTicketController::class, 'show'])->name('support.tickets.show');
    Route::post('/support/tickets/{ticket}/reply', [SupportTicketController::class, 'reply'])->name('support.tickets.reply');
    Route::post('/support/tickets/{ticket}/resolve', [SupportTicketController::class, 'resolve'])->name('support.tickets.resolve');

    // Retail & Point of Sale (POS)
    Route::get('/retail/terminals', [PosTerminalController::class, 'index'])->name('retail.terminals.index');
    Route::post('/retail/terminals', [PosTerminalController::class, 'store'])->name('retail.terminals.store');
    Route::get('/retail/pos/{terminal}', [PosTerminalController::class, 'terminal'])->name('retail.pos.terminal');

    Route::get('/retail/sessions', [PosSessionController::class, 'index'])->name('retail.sessions.index');
    Route::post('/retail/sessions', [PosSessionController::class, 'store'])->name('retail.sessions.store');
    Route::get('/retail/sessions/{session}', [PosSessionController::class, 'show'])->name('retail.sessions.show');
    Route::post('/retail/sessions/{session}/close', [PosSessionController::class, 'close'])->name('retail.sessions.close');

    Route::post('/retail/orders', [PosOrderController::class, 'store'])->name('retail.orders.store');
    Route::get('/retail/orders/{order}', [PosOrderController::class, 'show'])->name('retail.orders.show');

    // Manufacturing & Assembly
    Route::get('/manufacturing/boms', [BomController::class, 'index'])->name('manufacturing.boms.index');
    Route::get('/manufacturing/boms/create', [BomController::class, 'create'])->name('manufacturing.boms.create');
    Route::post('/manufacturing/boms', [BomController::class, 'store'])->name('manufacturing.boms.store');
    Route::get('/manufacturing/boms/{bom}', [BomController::class, 'show'])->name('manufacturing.boms.show');

    Route::get('/manufacturing/orders', [ProductionOrderController::class, 'index'])->name('manufacturing.orders.index');
    Route::get('/manufacturing/orders/create', [ProductionOrderController::class, 'create'])->name('manufacturing.orders.create');
    Route::post('/manufacturing/orders', [ProductionOrderController::class, 'store'])->name('manufacturing.orders.store');
    Route::get('/manufacturing/orders/{order}', [ProductionOrderController::class, 'show'])->name('manufacturing.orders.show');
    Route::post('/manufacturing/orders/{order}/complete', [ProductionOrderController::class, 'complete'])->name('manufacturing.orders.complete');

    // Trade & Wholesale Pricing
    Route::get('/trade/pricelists', [PriceListController::class, 'index'])->name('trade.pricelists.index');
    Route::get('/trade/pricelists/create', [PriceListController::class, 'create'])->name('trade.pricelists.create');
    Route::post('/trade/pricelists', [PriceListController::class, 'store'])->name('trade.pricelists.store');
    Route::get('/trade/pricelists/{priceList}', [PriceListController::class, 'show'])->name('trade.pricelists.show');
    Route::post('/trade/resolve-price', [PriceListController::class, 'resolvePrice'])->name('trade.resolve-price');

    // Contracting Progress Claims
    Route::get('/contracting/claims', [ContractingClaimController::class, 'index'])->name('contracting.claims.index');
    Route::get('/contracting/claims/create', [ContractingClaimController::class, 'create'])->name('contracting.claims.create');
    Route::post('/contracting/claims', [ContractingClaimController::class, 'store'])->name('contracting.claims.store');
    Route::get('/contracting/claims/{claim}', [ContractingClaimController::class, 'show'])->name('contracting.claims.show');
    Route::post('/contracting/claims/{claim}/bill', [ContractingClaimController::class, 'bill'])->name('contracting.claims.bill');
});

require __DIR__.'/settings.php';
