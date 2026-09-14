<?php

use App\Modules\Accounting\Http\Controllers\AccountController;
use App\Modules\Accounting\Http\Controllers\BankReconciliationController;
use App\Modules\Accounting\Http\Controllers\BudgetController;
use App\Modules\Accounting\Http\Controllers\CostCenterController;
use App\Modules\Accounting\Http\Controllers\CurrencyRateController;
use App\Modules\Accounting\Http\Controllers\FiscalPeriodController;
use App\Modules\Accounting\Http\Controllers\FiscalYearClosingController;
use App\Modules\Accounting\Http\Controllers\FxRevaluationController;
use App\Modules\Accounting\Http\Controllers\InvoiceController;
use App\Modules\Accounting\Http\Controllers\JournalEntryController;
use App\Modules\Accounting\Http\Controllers\PettyCashController;
use App\Modules\Accounting\Http\Controllers\ReceiptController;
use App\Modules\Accounting\Http\Controllers\ReportController;
use App\Modules\Accounting\Http\Controllers\StatementController;
use App\Modules\Accounting\Http\Controllers\VatReturnController;
use App\Modules\Accounting\Http\Controllers\ZakatReportController;
use App\Modules\Assets\Http\Controllers\DepreciationController;
use App\Modules\Assets\Http\Controllers\FixedAssetController;
use App\Modules\Assets\Http\Controllers\FixedAssetDisposalController;
use App\Modules\Assets\Http\Controllers\ZatcaTaxAssetScheduleController;
use App\Modules\Contracting\Http\Controllers\ContractingClaimController;
use App\Modules\Contracts\Http\Controllers\ContractController;
use App\Modules\CRM\Http\Controllers\LeadController;
use App\Modules\Governance\Http\Controllers\ApprovalWorkflowController;
use App\Modules\HR\Http\Controllers\AttendanceController;
use App\Modules\HR\Http\Controllers\DepartmentController;
use App\Modules\HR\Http\Controllers\EmployeeController;
use App\Modules\HR\Http\Controllers\EmployeeCustodyController;
use App\Modules\HR\Http\Controllers\EmployeeLoanController;
use App\Modules\HR\Http\Controllers\EndOfServiceController;
use App\Modules\HR\Http\Controllers\LeaveRequestController;
use App\Modules\Inventory\Http\Controllers\DeliveryNoteController;
use App\Modules\Inventory\Http\Controllers\GoodsReceiptController;
use App\Modules\Inventory\Http\Controllers\InventoryReportController;
use App\Modules\Inventory\Http\Controllers\LandedCostController;
use App\Modules\Inventory\Http\Controllers\ProductBatchController;
use App\Modules\Inventory\Http\Controllers\ProductController;
use App\Modules\Inventory\Http\Controllers\ProductSerialController;
use App\Modules\Inventory\Http\Controllers\StockAdjustmentController;
use App\Modules\Inventory\Http\Controllers\StockMovementController;
use App\Modules\Inventory\Http\Controllers\StocktakeController;
use App\Modules\Inventory\Http\Controllers\StockTransferController;
use App\Modules\Inventory\Http\Controllers\WarehouseController;
use App\Modules\Localization\Http\Controllers\ZatcaIntegrationController;
use App\Modules\Manufacturing\Http\Controllers\BomController;
use App\Modules\Manufacturing\Http\Controllers\ProductionOrderController;
use App\Modules\MasterData\Http\Controllers\PartyController;
use App\Modules\Payroll\Http\Controllers\GosiReportController;
use App\Modules\Payroll\Http\Controllers\PayrollRunController;
use App\Modules\Platform\Http\Controllers\AlertController;
use App\Modules\Platform\Http\Controllers\AttachmentController;
use App\Modules\Platform\Http\Controllers\AuditLogController;
use App\Modules\Platform\Http\Controllers\ContextController;
use App\Modules\Platform\Http\Controllers\DashboardController;
use App\Modules\Platform\Http\Controllers\DataImportController;
use App\Modules\Platform\Http\Controllers\ModuleController;
use App\Modules\Projects\Http\Controllers\ProjectController;
use App\Modules\Purchasing\Http\Controllers\DebitNoteController;
use App\Modules\Purchasing\Http\Controllers\PurchaseOrderController;
use App\Modules\Purchasing\Http\Controllers\PurchaseRequisitionController;
use App\Modules\Purchasing\Http\Controllers\SupplierPortalController;
use App\Modules\Purchasing\Http\Controllers\VendorBillController;
use App\Modules\Purchasing\Http\Controllers\VendorPaymentController;
use App\Modules\Retail\Http\Controllers\PosOrderController;
use App\Modules\Retail\Http\Controllers\PosSessionController;
use App\Modules\Retail\Http\Controllers\PosTerminalController;
use App\Modules\Sales\Http\Controllers\CreditNoteController;
use App\Modules\Sales\Http\Controllers\CustomerPortalController;
use App\Modules\Sales\Http\Controllers\SalesOrderController;
use App\Modules\Sales\Http\Controllers\SalesQuotationController;
use App\Modules\Support\Http\Controllers\SupportTicketController;
use App\Modules\Trade\Http\Controllers\PriceListController;
use App\Modules\Treasury\Http\Controllers\BankGuaranteeController;
use App\Modules\Treasury\Http\Controllers\ChequeController;
use App\Modules\Treasury\Http\Controllers\TreasuryTransferController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::post('/switch-locale', [ContextController::class, 'switchLocale'])->name('context.locale');

// B2B Customer Self-Service Portal (Public / Token-Secured)
Route::prefix('portal/{token}')->name('portal.')->group(function () {
    Route::get('/', [CustomerPortalController::class, 'dashboard'])->name('dashboard');
    Route::get('/statement/export', [CustomerPortalController::class, 'exportStatement'])->name('statement.export');
    Route::get('/invoices/{invoice}/print', [CustomerPortalController::class, 'printInvoice'])->name('invoice.print');
    Route::get('/invoices/{invoice}/xml', [CustomerPortalController::class, 'downloadInvoiceXml'])->name('invoice.xml');
});

// B2B Supplier Self-Service Portal (Public / Token-Secured)
Route::prefix('supplier-portal/{token}')->name('supplier-portal.')->group(function () {
    Route::get('/', [SupplierPortalController::class, 'dashboard'])->name('dashboard');
    Route::get('/statement/export', [SupplierPortalController::class, 'exportStatement'])->name('statement.export');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    // Tenancy & Organization Context Switching
    Route::post('/switch-context/tenant', [ContextController::class, 'switchTenant'])->name('context.tenant');
    Route::post('/switch-context/company', [ContextController::class, 'switchCompany'])->name('context.company');
    Route::post('/switch-context/branch', [ContextController::class, 'switchBranch'])->name('context.branch');

    // Master Data - Customers / Parties
    Route::get('/customers', [PartyController::class, 'index'])->name('customers.index');
    Route::post('/customers', [PartyController::class, 'store'])->name('customers.store');
    Route::delete('/customers/{party}', [PartyController::class, 'destroy'])->name('customers.destroy');
    Route::post('/customers/{profile}/regenerate-portal-token', [CustomerPortalController::class, 'regenerateToken'])->name('customers.regenerate-portal-token');
    Route::post('/vendors/{profile}/regenerate-portal-token', [SupplierPortalController::class, 'regenerateToken'])->name('vendors.regenerate-portal-token');

    // Accounting & Finance
    Route::get('/accounts', [AccountController::class, 'index'])->name('accounts.index');

    // Bank Reconciliation & Statement Matching
    Route::get('/accounting/bank-reconciliation', [BankReconciliationController::class, 'index'])->name('accounting.bank-reconciliation.index');
    Route::get('/accounting/bank-reconciliation/create', [BankReconciliationController::class, 'create'])->name('accounting.bank-reconciliation.create');
    Route::post('/accounting/bank-reconciliation', [BankReconciliationController::class, 'store'])->name('accounting.bank-reconciliation.store');
    Route::get('/accounting/bank-reconciliation/{bankReconciliation}', [BankReconciliationController::class, 'show'])->name('accounting.bank-reconciliation.show');
    Route::get('/accounting/bank-reconciliation/{bankReconciliation}/print', [BankReconciliationController::class, 'print'])->name('accounting.bank-reconciliation.print');
    Route::post('/accounting/bank-reconciliation/{bankReconciliation}/auto-match', [BankReconciliationController::class, 'autoMatch'])->name('accounting.bank-reconciliation.auto-match');
    Route::post('/accounting/bank-reconciliation/{bankReconciliation}/match', [BankReconciliationController::class, 'match'])->name('accounting.bank-reconciliation.match');
    Route::post('/accounting/bank-reconciliation/{bankReconciliation}/unmatch', [BankReconciliationController::class, 'unmatch'])->name('accounting.bank-reconciliation.unmatch');
    Route::post('/accounting/bank-reconciliation/{bankReconciliation}/import-lines', [BankReconciliationController::class, 'importLines'])->name('accounting.bank-reconciliation.import-lines');
    Route::post('/accounting/bank-reconciliation/{bankReconciliation}/finalize', [BankReconciliationController::class, 'finalize'])->name('accounting.bank-reconciliation.finalize');

    // ZATCA VAT Return Management
    Route::get('/accounting/vat-returns', [VatReturnController::class, 'index'])->name('accounting.vat-returns.index');
    Route::get('/accounting/vat-returns/create', [VatReturnController::class, 'create'])->name('accounting.vat-returns.create');
    Route::post('/accounting/vat-returns', [VatReturnController::class, 'store'])->name('accounting.vat-returns.store');
    Route::get('/accounting/vat-returns/{vatReturn}', [VatReturnController::class, 'show'])->name('accounting.vat-returns.show');
    Route::post('/accounting/vat-returns/{vatReturn}/file', [VatReturnController::class, 'file'])->name('accounting.vat-returns.file');
    Route::get('/accounting/vat-returns/{vatReturn}/print', [VatReturnController::class, 'print'])->name('accounting.vat-returns.print');
    Route::get('/accounting/vat-returns/{vatReturn}/export', [VatReturnController::class, 'export'])->name('accounting.vat-returns.export');

    // Service Invoices
    Route::get('/invoices', [InvoiceController::class, 'index'])->name('invoices.index');
    Route::get('/invoices/create', [InvoiceController::class, 'create'])->name('invoices.create');
    Route::post('/invoices', [InvoiceController::class, 'store'])->name('invoices.store');
    Route::get('/invoices/{invoice}', [InvoiceController::class, 'show'])->name('invoices.show');
    Route::get('/invoices/{invoice}/print', [InvoiceController::class, 'print'])->name('invoices.print');
    Route::post('/invoices/{invoice}/zatca/transmit', [ZatcaIntegrationController::class, 'transmitInvoice'])->name('invoices.zatca.transmit');
    Route::get('/invoices/{invoice}/zatca/xml', [ZatcaIntegrationController::class, 'downloadXml'])->name('invoices.zatca.xml');

    // ZATCA Phase 2 (Fatoora) Platform Integration
    Route::get('/settings/zatca', [ZatcaIntegrationController::class, 'index'])->name('settings.zatca.index');
    Route::put('/settings/zatca/config', [ZatcaIntegrationController::class, 'updateConfig'])->name('settings.zatca.config.update');
    Route::post('/settings/zatca/csr', [ZatcaIntegrationController::class, 'generateCsr'])->name('settings.zatca.csr.generate');
    Route::post('/settings/zatca/csid', [ZatcaIntegrationController::class, 'requestCsid'])->name('settings.zatca.csid.request');
    Route::post('/settings/zatca/compliance', [ZatcaIntegrationController::class, 'runCompliance'])->name('settings.zatca.compliance.run');

    // ZATCA Statutory Asset Tax Depreciation & Zakat Schedule (Article 17)
    Route::get('/assets/zatca-tax-schedule', [ZatcaTaxAssetScheduleController::class, 'index'])->name('assets.zatca-tax-schedule.index');
    Route::get('/assets/zatca-tax-schedule/export', [ZatcaTaxAssetScheduleController::class, 'exportCsv'])->name('assets.zatca-tax-schedule.export');
    Route::put('/assets/zatca-tax-schedule/assets/{asset}', [ZatcaTaxAssetScheduleController::class, 'updateAssetTaxGroup'])->name('assets.zatca-tax-schedule.update-group');

    // Saudi Zakat Base & Annual Liability Schedule (ZATCA Regulations)
    Route::get('/accounting/zakat', [ZakatReportController::class, 'index'])->name('accounting.zakat.index');
    Route::post('/accounting/zakat/post-provision', [ZakatReportController::class, 'postProvision'])->name('accounting.zakat.post-provision');
    Route::get('/accounting/zakat/export', [ZakatReportController::class, 'export'])->name('accounting.zakat.export');

    // Receipts & Collections
    Route::get('/receipts', [ReceiptController::class, 'index'])->name('receipts.index');
    Route::post('/receipts', [ReceiptController::class, 'store'])->name('receipts.store');
    Route::get('/receipts/{receipt}/print', [ReceiptController::class, 'print'])->name('receipts.print');

    // Purchasing & Procure-to-Pay
    Route::get('/purchase-requisitions', [PurchaseRequisitionController::class, 'index'])->name('purchase-requisitions.index');
    Route::get('/purchase-requisitions/create', [PurchaseRequisitionController::class, 'create'])->name('purchase-requisitions.create');
    Route::post('/purchase-requisitions', [PurchaseRequisitionController::class, 'store'])->name('purchase-requisitions.store');
    Route::get('/purchase-requisitions/{purchaseRequisition}', [PurchaseRequisitionController::class, 'show'])->name('purchase-requisitions.show');
    Route::post('/purchase-requisitions/{purchaseRequisition}/submit', [PurchaseRequisitionController::class, 'submit'])->name('purchase-requisitions.submit');
    Route::post('/purchase-requisitions/{purchaseRequisition}/approve', [PurchaseRequisitionController::class, 'approve'])->name('purchase-requisitions.approve');
    Route::post('/purchase-requisitions/{purchaseRequisition}/reject', [PurchaseRequisitionController::class, 'reject'])->name('purchase-requisitions.reject');
    Route::post('/purchase-requisitions/{purchaseRequisition}/convert-to-po', [PurchaseRequisitionController::class, 'convertToPo'])->name('purchase-requisitions.convert-to-po');

    Route::get('/purchase-orders', [PurchaseOrderController::class, 'index'])->name('purchase-orders.index');
    Route::get('/purchase-orders/create', [PurchaseOrderController::class, 'create'])->name('purchase-orders.create');
    Route::post('/purchase-orders', [PurchaseOrderController::class, 'store'])->name('purchase-orders.store');
    Route::get('/purchase-orders/{purchaseOrder}', [PurchaseOrderController::class, 'show'])->name('purchase-orders.show');
    Route::get('/purchase-orders/{purchaseOrder}/print', [PurchaseOrderController::class, 'print'])->name('purchase-orders.print');
    Route::post('/purchase-orders/{purchaseOrder}/approve', [PurchaseOrderController::class, 'approve'])->name('purchase-orders.approve');

    Route::get('/vendor-bills', [VendorBillController::class, 'index'])->name('vendor-bills.index');
    Route::get('/vendor-bills/create', [VendorBillController::class, 'create'])->name('vendor-bills.create');
    Route::post('/vendor-bills', [VendorBillController::class, 'store'])->name('vendor-bills.store');
    Route::get('/vendor-bills/{vendorBill}', [VendorBillController::class, 'show'])->name('vendor-bills.show');
    Route::get('/vendor-bills/{vendorBill}/print', [VendorBillController::class, 'print'])->name('vendor-bills.print');

    Route::get('/vendor-payments', [VendorPaymentController::class, 'index'])->name('vendor-payments.index');
    Route::post('/vendor-payments', [VendorPaymentController::class, 'store'])->name('vendor-payments.store');
    Route::get('/vendor-payments/{vendorPayment}/print', [VendorPaymentController::class, 'print'])->name('vendor-payments.print');

    // Purchasing Debit Notes (Vendor Returns & VAT Recovery Adjustment)
    Route::get('/purchasing/debit-notes', [DebitNoteController::class, 'index'])->name('purchasing.debit-notes.index');
    Route::get('/purchasing/debit-notes/create', [DebitNoteController::class, 'create'])->name('purchasing.debit-notes.create');
    Route::post('/purchasing/debit-notes', [DebitNoteController::class, 'store'])->name('purchasing.debit-notes.store');
    Route::get('/purchasing/debit-notes/{debitNote}', [DebitNoteController::class, 'show'])->name('purchasing.debit-notes.show');
    Route::post('/purchasing/debit-notes/{debitNote}/post', [DebitNoteController::class, 'post'])->name('purchasing.debit-notes.post');
    Route::get('/purchasing/debit-notes/{debitNote}/print', [DebitNoteController::class, 'print'])->name('purchasing.debit-notes.print');

    // Treasury Transfers
    Route::get('/treasury/transfers', [TreasuryTransferController::class, 'index'])->name('treasury.transfers.index');
    Route::post('/treasury/transfers', [TreasuryTransferController::class, 'store'])->name('treasury.transfers.store');

    // Treasury Cheques (PDC)
    Route::get('/treasury/cheques', [ChequeController::class, 'index'])->name('treasury.cheques.index');
    Route::get('/treasury/cheques/create', [ChequeController::class, 'create'])->name('treasury.cheques.create');
    Route::post('/treasury/cheques', [ChequeController::class, 'store'])->name('treasury.cheques.store');
    Route::get('/treasury/cheques/{cheque}', [ChequeController::class, 'show'])->name('treasury.cheques.show');
    Route::post('/treasury/cheques/{cheque}/deposit', [ChequeController::class, 'deposit'])->name('treasury.cheques.deposit');
    Route::post('/treasury/cheques/{cheque}/collect', [ChequeController::class, 'collect'])->name('treasury.cheques.collect');
    Route::post('/treasury/cheques/{cheque}/bounce', [ChequeController::class, 'bounce'])->name('treasury.cheques.bounce');
    Route::post('/treasury/cheques/{cheque}/clear', [ChequeController::class, 'clear'])->name('treasury.cheques.clear');

    // Bank Guarantees (Letters of Guarantee)
    Route::get('/treasury/bank-guarantees', [BankGuaranteeController::class, 'index'])->name('treasury.bank-guarantees.index');
    Route::get('/treasury/bank-guarantees/create', [BankGuaranteeController::class, 'create'])->name('treasury.bank-guarantees.create');
    Route::post('/treasury/bank-guarantees', [BankGuaranteeController::class, 'store'])->name('treasury.bank-guarantees.store');
    Route::post('/treasury/bank-guarantees/{bankGuarantee}/release', [BankGuaranteeController::class, 'release'])->name('treasury.bank-guarantees.release');
    Route::post('/treasury/bank-guarantees/{bankGuarantee}/renew', [BankGuaranteeController::class, 'renew'])->name('treasury.bank-guarantees.renew');

    // Petty Cash Funds & Settlement Vouchers
    Route::get('/accounting/petty-cash', [PettyCashController::class, 'index'])->name('accounting.petty-cash.index');
    Route::post('/accounting/petty-cash/funds', [PettyCashController::class, 'storeFund'])->name('accounting.petty-cash.funds.store');
    Route::get('/accounting/petty-cash/settlements/create', [PettyCashController::class, 'createSettlement'])->name('accounting.petty-cash.settlements.create');
    Route::post('/accounting/petty-cash/settlements', [PettyCashController::class, 'storeSettlement'])->name('accounting.petty-cash.settlements.store');
    Route::get('/accounting/petty-cash/settlements/{settlement}', [PettyCashController::class, 'showSettlement'])->name('accounting.petty-cash.settlements.show');
    Route::post('/accounting/petty-cash/settlements/{settlement}/post', [PettyCashController::class, 'postSettlement'])->name('accounting.petty-cash.settlements.post');
    Route::get('/accounting/petty-cash/settlements/{settlement}/print', [PettyCashController::class, 'printSettlement'])->name('accounting.petty-cash.settlements.print');

    // Cost Centers & Budgeting
    Route::get('/accounting/cost-centers', [CostCenterController::class, 'index'])->name('accounting.cost-centers.index');
    Route::post('/accounting/cost-centers', [CostCenterController::class, 'store'])->name('accounting.cost-centers.store');
    Route::put('/accounting/cost-centers/{costCenter}', [CostCenterController::class, 'update'])->name('accounting.cost-centers.update');
    Route::delete('/accounting/cost-centers/{costCenter}', [CostCenterController::class, 'destroy'])->name('accounting.cost-centers.destroy');

    Route::get('/accounting/budgets', [BudgetController::class, 'index'])->name('accounting.budgets.index');
    Route::get('/accounting/budgets/create', [BudgetController::class, 'create'])->name('accounting.budgets.create');
    Route::post('/accounting/budgets', [BudgetController::class, 'store'])->name('accounting.budgets.store');
    Route::get('/accounting/budgets/{budget}', [BudgetController::class, 'show'])->name('accounting.budgets.show');
    Route::post('/accounting/budgets/{budget}/approve', [BudgetController::class, 'approve'])->name('accounting.budgets.approve');

    // Multi-Currency Exchange Rates & Foreign Exchange Revaluation (Phase 4)
    Route::get('/accounting/fx-rates', [CurrencyRateController::class, 'index'])->name('accounting.fx-rates.index');
    Route::post('/accounting/fx-rates', [CurrencyRateController::class, 'store'])->name('accounting.fx-rates.store');
    Route::post('/accounting/fx-rates/sync-sama', [CurrencyRateController::class, 'syncSama'])->name('accounting.fx-rates.sync-sama');
    Route::post('/accounting/fx-rates/convert', [CurrencyRateController::class, 'convert'])->name('accounting.fx-rates.convert');

    Route::get('/accounting/fx-revaluations', [FxRevaluationController::class, 'index'])->name('accounting.fx-revaluations.index');
    Route::get('/accounting/fx-revaluations/create', [FxRevaluationController::class, 'create'])->name('accounting.fx-revaluations.create');
    Route::post('/accounting/fx-revaluations', [FxRevaluationController::class, 'store'])->name('accounting.fx-revaluations.store');
    Route::get('/accounting/fx-revaluations/{fxRevaluation}', [FxRevaluationController::class, 'show'])->name('accounting.fx-revaluations.show');
    Route::post('/accounting/fx-revaluations/{fxRevaluation}/reverse', [FxRevaluationController::class, 'reverse'])->name('accounting.fx-revaluations.reverse');

    // Financial Reports
    Route::get('/reports/trial-balance', [ReportController::class, 'trialBalance'])->name('reports.trial-balance');
    Route::get('/reports/trial-balance/export', [ReportController::class, 'exportTrialBalance'])->name('reports.trial-balance.export');

    Route::get('/reports/general-ledger', [ReportController::class, 'generalLedger'])->name('reports.general-ledger');
    Route::get('/reports/general-ledger/export', [ReportController::class, 'exportGeneralLedger'])->name('reports.general-ledger.export');

    Route::get('/reports/income-statement', [ReportController::class, 'incomeStatement'])->name('reports.income-statement');
    Route::get('/reports/income-statement/export', [ReportController::class, 'exportIncomeStatement'])->name('reports.income-statement.export');

    Route::get('/reports/balance-sheet', [ReportController::class, 'balanceSheet'])->name('reports.balance-sheet');
    Route::get('/reports/balance-sheet/export', [ReportController::class, 'exportBalanceSheet'])->name('reports.balance-sheet.export');

    Route::get('/reports/cash-flow', [ReportController::class, 'cashFlow'])->name('reports.cash-flow');
    Route::get('/reports/cash-flow/export', [ReportController::class, 'exportCashFlow'])->name('reports.cash-flow.export');

    Route::get('/reports/customer-statement', [StatementController::class, 'customerStatement'])->name('reports.customer-statement');
    Route::get('/reports/customer-statement/export', [StatementController::class, 'exportCustomerStatement'])->name('reports.customer-statement.export');

    Route::get('/reports/vendor-statement', [StatementController::class, 'vendorStatement'])->name('reports.vendor-statement');
    Route::get('/reports/vendor-statement/export', [StatementController::class, 'exportVendorStatement'])->name('reports.vendor-statement.export');

    Route::get('/reports/ar-aging', [ReportController::class, 'aging'])->name('reports.ar-aging');
    Route::get('/reports/ar-aging/export', [ReportController::class, 'exportArAging'])->name('reports.ar-aging.export');

    Route::get('/reports/ap-aging', [ReportController::class, 'apAging'])->name('reports.ap-aging');
    Route::get('/reports/ap-aging/export', [ReportController::class, 'exportApAging'])->name('reports.ap-aging.export');

    Route::get('/reports/inventory-valuation', [InventoryReportController::class, 'valuation'])->name('reports.inventory-valuation');
    Route::get('/reports/inventory-valuation/export', [InventoryReportController::class, 'exportValuation'])->name('reports.inventory-valuation.export');

    // General Journal Entries
    Route::get('/accounting/journal-entries', [JournalEntryController::class, 'index'])->name('accounting.journal-entries.index');
    Route::get('/accounting/journal-entries/{journalEntry}', [JournalEntryController::class, 'show'])->name('accounting.journal-entries.show');
    Route::get('/accounting/journal-entries/{journalEntry}/print', [JournalEntryController::class, 'print'])->name('accounting.journal-entries.print');

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
    Route::get('/inventory/receipts/{goodsReceipt}/print', [GoodsReceiptController::class, 'print'])->name('inventory.receipts.print');

    // Goods Delivery Notes (Outbound Dispatch)
    Route::get('/inventory/delivery-notes', [DeliveryNoteController::class, 'index'])->name('inventory.delivery-notes.index');
    Route::get('/inventory/delivery-notes/create', [DeliveryNoteController::class, 'create'])->name('inventory.delivery-notes.create');
    Route::post('/inventory/delivery-notes', [DeliveryNoteController::class, 'store'])->name('inventory.delivery-notes.store');
    Route::get('/inventory/delivery-notes/{deliveryNote}', [DeliveryNoteController::class, 'show'])->name('inventory.delivery-notes.show');
    Route::get('/inventory/delivery-notes/{deliveryNote}/print', [DeliveryNoteController::class, 'print'])->name('inventory.delivery-notes.print');

    Route::get('/inventory/movements', [StockMovementController::class, 'index'])->name('inventory.movements.index');

    Route::get('/inventory/transfers', [StockTransferController::class, 'index'])->name('inventory.transfers.index');
    Route::get('/inventory/transfers/create', [StockTransferController::class, 'create'])->name('inventory.transfers.create');
    Route::post('/inventory/transfers', [StockTransferController::class, 'store'])->name('inventory.transfers.store');

    Route::get('/inventory/adjustments', [StockAdjustmentController::class, 'index'])->name('inventory.adjustments.index');
    Route::get('/inventory/adjustments/create', [StockAdjustmentController::class, 'create'])->name('inventory.adjustments.create');
    Route::post('/inventory/adjustments', [StockAdjustmentController::class, 'store'])->name('inventory.adjustments.store');

    // Landed Costs Allocation
    Route::get('/inventory/landed-costs', [LandedCostController::class, 'index'])->name('inventory.landed-costs.index');
    Route::get('/inventory/landed-costs/create', [LandedCostController::class, 'create'])->name('inventory.landed-costs.create');
    Route::post('/inventory/landed-costs', [LandedCostController::class, 'store'])->name('inventory.landed-costs.store');
    Route::get('/inventory/landed-costs/{landedCost}', [LandedCostController::class, 'show'])->name('inventory.landed-costs.show');
    Route::post('/inventory/landed-costs/{landedCost}/post', [LandedCostController::class, 'post'])->name('inventory.landed-costs.post');

    // Physical Stocktake & Cycle Counting
    Route::get('/inventory/stocktakes', [StocktakeController::class, 'index'])->name('inventory.stocktakes.index');
    Route::get('/inventory/stocktakes/create', [StocktakeController::class, 'create'])->name('inventory.stocktakes.create');
    Route::post('/inventory/stocktakes', [StocktakeController::class, 'store'])->name('inventory.stocktakes.store');
    Route::get('/inventory/stocktakes/{stocktake}', [StocktakeController::class, 'show'])->name('inventory.stocktakes.show');
    Route::post('/inventory/stocktakes/{stocktake}/counts', [StocktakeController::class, 'recordCounts'])->name('inventory.stocktakes.record-counts');
    Route::post('/inventory/stocktakes/{stocktake}/finalize', [StocktakeController::class, 'finalize'])->name('inventory.stocktakes.finalize');

    // Batches & FEFO Tracking
    Route::get('/inventory/batches', [ProductBatchController::class, 'index'])->name('inventory.batches.index');
    Route::get('/inventory/batches/expiry/dashboard', [ProductBatchController::class, 'expiryDashboard'])->name('inventory.batches.expiry-dashboard');
    Route::get('/inventory/batches/create', [ProductBatchController::class, 'create'])->name('inventory.batches.create');
    Route::post('/inventory/batches', [ProductBatchController::class, 'store'])->name('inventory.batches.store');
    Route::get('/inventory/batches/recommend/fefo', [ProductBatchController::class, 'fefoRecommendation'])->name('inventory.batches.fefo');
    Route::get('/inventory/batches/{batch}', [ProductBatchController::class, 'show'])->name('inventory.batches.show');
    Route::post('/inventory/batches/{batch}/write-off', [ProductBatchController::class, 'writeOff'])->name('inventory.batches.write-off');

    // Serial Numbers & Warranty
    Route::get('/inventory/serials', [ProductSerialController::class, 'index'])->name('inventory.serials.index');
    Route::get('/inventory/serials/create', [ProductSerialController::class, 'create'])->name('inventory.serials.create');
    Route::post('/inventory/serials', [ProductSerialController::class, 'store'])->name('inventory.serials.store');
    Route::get('/inventory/serials/verify/warranty', [ProductSerialController::class, 'verifyWarranty'])->name('inventory.serials.verify-warranty');
    Route::get('/inventory/serials/{serial}', [ProductSerialController::class, 'show'])->name('inventory.serials.show');

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

    // Leaves Management
    Route::get('/hr/leaves', [LeaveRequestController::class, 'index'])->name('hr.leaves.index');
    Route::post('/hr/leaves', [LeaveRequestController::class, 'store'])->name('hr.leaves.store');
    Route::post('/hr/leaves/{leaveRequest}/approve', [LeaveRequestController::class, 'approve'])->name('hr.leaves.approve');
    Route::post('/hr/leaves/{leaveRequest}/reject', [LeaveRequestController::class, 'reject'])->name('hr.leaves.reject');

    // Employee Loans & Advances
    Route::get('/hr/loans', [EmployeeLoanController::class, 'index'])->name('hr.loans.index');
    Route::get('/hr/loans/create', [EmployeeLoanController::class, 'create'])->name('hr.loans.create');
    Route::post('/hr/loans', [EmployeeLoanController::class, 'store'])->name('hr.loans.store');
    Route::get('/hr/loans/{loan}', [EmployeeLoanController::class, 'show'])->name('hr.loans.show');

    // Employee Custodies & Advances
    Route::get('/hr/custodies', [EmployeeCustodyController::class, 'index'])->name('hr.custodies.index');
    Route::get('/hr/custodies/create', [EmployeeCustodyController::class, 'create'])->name('hr.custodies.create');
    Route::post('/hr/custodies', [EmployeeCustodyController::class, 'store'])->name('hr.custodies.store');
    Route::get('/hr/custodies/{custody}', [EmployeeCustodyController::class, 'show'])->name('hr.custodies.show');
    Route::post('/hr/custodies/{custody}/disburse', [EmployeeCustodyController::class, 'disburse'])->name('hr.custodies.disburse');
    Route::get('/hr/custodies/{custody}/settle', [EmployeeCustodyController::class, 'createSettlement'])->name('hr.custodies.settle.create');
    Route::post('/hr/custodies/{custody}/settle', [EmployeeCustodyController::class, 'storeSettlement'])->name('hr.custodies.settle.store');
    Route::get('/hr/custodies/settlements/{settlement}/print', [EmployeeCustodyController::class, 'printSettlement'])->name('hr.custodies.settlements.print');

    // End of Service Gratuity & Settlements
    Route::get('/hr/end-of-service', [EndOfServiceController::class, 'index'])->name('hr.end-of-service.index');
    Route::get('/hr/end-of-service/create', [EndOfServiceController::class, 'create'])->name('hr.end-of-service.create');
    Route::post('/hr/end-of-service/preview', [EndOfServiceController::class, 'previewCalculation'])->name('hr.end-of-service.preview');
    Route::post('/hr/end-of-service', [EndOfServiceController::class, 'store'])->name('hr.end-of-service.store');
    Route::post('/hr/end-of-service/accrue', [EndOfServiceController::class, 'postAccrual'])->name('hr.end-of-service.accrue');
    Route::get('/hr/end-of-service/export-schedule', [EndOfServiceController::class, 'exportSchedule'])->name('hr.end-of-service.export-schedule');
    Route::get('/hr/end-of-service/{settlement}', [EndOfServiceController::class, 'show'])->name('hr.end-of-service.show');
    Route::post('/hr/end-of-service/{settlement}/settle', [EndOfServiceController::class, 'settle'])->name('hr.end-of-service.settle');
    Route::get('/hr/end-of-service/{settlement}/print', [EndOfServiceController::class, 'print'])->name('hr.end-of-service.print');

    // Payroll Framework
    Route::get('/payroll/runs', [PayrollRunController::class, 'index'])->name('payroll.runs.index');
    Route::get('/payroll/runs/create', [PayrollRunController::class, 'create'])->name('payroll.runs.create');
    Route::post('/payroll/runs', [PayrollRunController::class, 'store'])->name('payroll.runs.store');
    Route::get('/payroll/runs/{payrollRun}', [PayrollRunController::class, 'show'])->name('payroll.runs.show');
    Route::post('/payroll/runs/{payrollRun}/post', [PayrollRunController::class, 'postRun'])->name('payroll.runs.post');
    Route::post('/payroll/runs/{payrollRun}/disburse', [PayrollRunController::class, 'disburse'])->name('payroll.runs.disburse');
    Route::get('/payroll/payslips/{payslip}/print', [PayrollRunController::class, 'printPayslip'])->name('payroll.payslips.print');
    Route::get('/payroll/runs/{payrollRun}/wps/sif', [PayrollRunController::class, 'downloadWpsSif'])->name('payroll.runs.wps-sif');
    Route::get('/payroll/runs/{payrollRun}/wps/csv', [PayrollRunController::class, 'downloadWpsCsv'])->name('payroll.runs.wps-csv');
    Route::get('/payroll/runs/{payrollRun}/wps/validate', [PayrollRunController::class, 'validateWps'])->name('payroll.runs.wps-validate');
    Route::get('/payroll/gosi', [GosiReportController::class, 'index'])->name('payroll.gosi.index');
    Route::get('/payroll/gosi/export', [GosiReportController::class, 'export'])->name('payroll.gosi.export');
    Route::post('/payroll/gosi/{payrollRun}/post-employer', [GosiReportController::class, 'postEmployerContribution'])->name('payroll.gosi.post-employer');

    // Fixed Assets & Depreciation
    Route::get('/assets/register', [FixedAssetController::class, 'index'])->name('assets.register.index');
    Route::get('/assets/register/create', [FixedAssetController::class, 'create'])->name('assets.register.create');
    Route::post('/assets/register', [FixedAssetController::class, 'store'])->name('assets.register.store');
    Route::get('/assets/register/{fixedAsset}', [FixedAssetController::class, 'show'])->name('assets.register.show');

    Route::get('/assets/depreciation', [DepreciationController::class, 'index'])->name('assets.depreciation.index');
    Route::post('/assets/depreciation', [DepreciationController::class, 'store'])->name('assets.depreciation.store');

    // Fixed Asset Disposal & Scrap
    Route::get('/assets/disposals', [FixedAssetDisposalController::class, 'index'])->name('assets.disposals.index');
    Route::get('/assets/disposals/create', [FixedAssetDisposalController::class, 'create'])->name('assets.disposals.create');
    Route::post('/assets/disposals', [FixedAssetDisposalController::class, 'store'])->name('assets.disposals.store');
    Route::get('/assets/disposals/{disposal}', [FixedAssetDisposalController::class, 'show'])->name('assets.disposals.show');
    Route::post('/assets/disposals/{disposal}/post', [FixedAssetDisposalController::class, 'post'])->name('assets.disposals.post');
    Route::get('/assets/disposals/{disposal}/print', [FixedAssetDisposalController::class, 'print'])->name('assets.disposals.print');

    // Fiscal Periods & Close
    Route::get('/accounting/periods', [FiscalPeriodController::class, 'index'])->name('accounting.periods.index');
    Route::post('/accounting/periods', [FiscalPeriodController::class, 'store'])->name('accounting.periods.store');
    Route::post('/accounting/periods/{fiscalPeriod}/lock', [FiscalPeriodController::class, 'toggleLock'])->name('accounting.periods.toggleLock');

    // Fiscal Year-End Closing
    Route::get('/accounting/year-end-closing', [FiscalYearClosingController::class, 'index'])->name('accounting.year-end-closing.index');
    Route::get('/accounting/year-end-closing/create', [FiscalYearClosingController::class, 'create'])->name('accounting.year-end-closing.create');
    Route::post('/accounting/year-end-closing', [FiscalYearClosingController::class, 'store'])->name('accounting.year-end-closing.store');
    Route::get('/accounting/year-end-closing/{fiscalYearClosing}', [FiscalYearClosingController::class, 'show'])->name('accounting.year-end-closing.show');
    Route::post('/accounting/year-end-closing/{fiscalYearClosing}/reopen', [FiscalYearClosingController::class, 'reopen'])->name('accounting.year-end-closing.reopen');

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
    Route::get('/sales/quotations/{quotation}/print', [SalesQuotationController::class, 'print'])->name('sales.quotations.print');
    Route::post('/sales/quotations/{quotation}/convert', [SalesQuotationController::class, 'convertToOrder'])->name('sales.quotations.convert');

    Route::get('/sales/orders', [SalesOrderController::class, 'index'])->name('sales.orders.index');
    Route::get('/sales/orders/{order}', [SalesOrderController::class, 'show'])->name('sales.orders.show');
    Route::get('/sales/orders/{order}/print', [SalesOrderController::class, 'print'])->name('sales.orders.print');
    Route::put('/sales/orders/{order}/status', [SalesOrderController::class, 'updateStatus'])->name('sales.orders.status');
    Route::post('/sales/orders/{order}/convert-to-invoice', [SalesOrderController::class, 'convertToInvoice'])->name('sales.orders.convert-to-invoice');

    // Sales Credit Notes (Customer Returns & Output Tax Deduction)
    Route::get('/sales/credit-notes', [CreditNoteController::class, 'index'])->name('sales.credit-notes.index');
    Route::get('/sales/credit-notes/create', [CreditNoteController::class, 'create'])->name('sales.credit-notes.create');
    Route::post('/sales/credit-notes', [CreditNoteController::class, 'store'])->name('sales.credit-notes.store');
    Route::get('/sales/credit-notes/{creditNote}', [CreditNoteController::class, 'show'])->name('sales.credit-notes.show');
    Route::post('/sales/credit-notes/{creditNote}/post', [CreditNoteController::class, 'post'])->name('sales.credit-notes.post');
    Route::get('/sales/credit-notes/{creditNote}/print', [CreditNoteController::class, 'print'])->name('sales.credit-notes.print');

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
    Route::middleware('module:retail_pos')->group(function () {
        Route::get('/retail/terminals', [PosTerminalController::class, 'index'])->name('retail.terminals.index');
        Route::post('/retail/terminals', [PosTerminalController::class, 'store'])->name('retail.terminals.store');
        Route::get('/retail/pos/{terminal}', [PosTerminalController::class, 'terminal'])->name('retail.pos.terminal');

        Route::get('/retail/sessions', [PosSessionController::class, 'index'])->name('retail.sessions.index');
        Route::post('/retail/sessions', [PosSessionController::class, 'store'])->name('retail.sessions.store');
        Route::get('/retail/sessions/{session}', [PosSessionController::class, 'show'])->name('retail.sessions.show');
        Route::post('/retail/sessions/{session}/close', [PosSessionController::class, 'close'])->name('retail.sessions.close');
        Route::get('/retail/sessions/{session}/x-report', [PosSessionController::class, 'xReport'])->name('retail.sessions.x-report');
        Route::get('/retail/sessions/{session}/z-report', [PosSessionController::class, 'zReport'])->name('retail.sessions.z-report');

        Route::post('/retail/orders', [PosOrderController::class, 'store'])->name('retail.orders.store');
        Route::get('/retail/orders/{order}', [PosOrderController::class, 'show'])->name('retail.orders.show');
        Route::get('/retail/orders/{order}/print', [PosOrderController::class, 'print'])->name('retail.orders.print');
    });

    // Manufacturing & Assembly
    Route::middleware('module:manufacturing')->group(function () {
        Route::get('/manufacturing/boms', [BomController::class, 'index'])->name('manufacturing.boms.index');
        Route::get('/manufacturing/boms/create', [BomController::class, 'create'])->name('manufacturing.boms.create');
        Route::post('/manufacturing/boms', [BomController::class, 'store'])->name('manufacturing.boms.store');
        Route::get('/manufacturing/boms/{bom}', [BomController::class, 'show'])->name('manufacturing.boms.show');

        Route::get('/manufacturing/orders', [ProductionOrderController::class, 'index'])->name('manufacturing.orders.index');
        Route::get('/manufacturing/orders/create', [ProductionOrderController::class, 'create'])->name('manufacturing.orders.create');
        Route::post('/manufacturing/orders', [ProductionOrderController::class, 'store'])->name('manufacturing.orders.store');
        Route::get('/manufacturing/orders/{order}', [ProductionOrderController::class, 'show'])->name('manufacturing.orders.show');
        Route::get('/manufacturing/orders/{order}/print', [ProductionOrderController::class, 'print'])->name('manufacturing.orders.print');
        Route::post('/manufacturing/orders/{order}/complete', [ProductionOrderController::class, 'complete'])->name('manufacturing.orders.complete');
    });

    // Trade & Wholesale Pricing
    Route::get('/trade/pricelists', [PriceListController::class, 'index'])->name('trade.pricelists.index');
    Route::get('/trade/pricelists/create', [PriceListController::class, 'create'])->name('trade.pricelists.create');
    Route::post('/trade/pricelists', [PriceListController::class, 'store'])->name('trade.pricelists.store');
    Route::get('/trade/pricelists/{priceList}', [PriceListController::class, 'show'])->name('trade.pricelists.show');
    Route::post('/trade/resolve-price', [PriceListController::class, 'resolvePrice'])->name('trade.resolve-price');

    // Contracting Progress Claims
    Route::middleware('module:contracting')->group(function () {
        Route::get('/contracting/claims', [ContractingClaimController::class, 'index'])->name('contracting.claims.index');
        Route::get('/contracting/claims/create', [ContractingClaimController::class, 'create'])->name('contracting.claims.create');
        Route::post('/contracting/claims', [ContractingClaimController::class, 'store'])->name('contracting.claims.store');
        Route::post('/contracting/claims/release-retention', [ContractingClaimController::class, 'releaseRetention'])->name('contracting.claims.release-retention');
        Route::get('/contracting/claims/{claim}', [ContractingClaimController::class, 'show'])->name('contracting.claims.show');
        Route::get('/contracting/claims/{claim}/print', [ContractingClaimController::class, 'print'])->name('contracting.claims.print');
        Route::post('/contracting/claims/{claim}/bill', [ContractingClaimController::class, 'bill'])->name('contracting.claims.bill');
    });

    // Master Data Bulk Import & Export Hub
    Route::get('/data-import', [DataImportController::class, 'index'])->name('data-import.index');
    Route::get('/data-import/template/{type}', [DataImportController::class, 'downloadTemplate'])->name('data-import.template');
    Route::get('/data-import/export/{type}', [DataImportController::class, 'export'])->name('data-import.export');
    Route::post('/data-import/upload', [DataImportController::class, 'import'])->name('data-import.upload');

    // Financial Governance & Multi-Level Approvals (DOA)
    Route::get('/governance/approvals', [ApprovalWorkflowController::class, 'index'])->name('governance.approvals.index');
    Route::get('/governance/approvals/{id}', [ApprovalWorkflowController::class, 'show'])->name('governance.approvals.show');
    Route::post('/governance/approvals/{id}/approve', [ApprovalWorkflowController::class, 'approve'])->name('governance.approvals.approve');
    Route::post('/governance/approvals/{id}/reject', [ApprovalWorkflowController::class, 'reject'])->name('governance.approvals.reject');
    Route::get('/governance/rules', [ApprovalWorkflowController::class, 'rules'])->name('governance.rules.index');
    Route::post('/governance/rules', [ApprovalWorkflowController::class, 'storeRule'])->name('governance.rules.store');

    // Enterprise Audit Trail & Security Center
    Route::get('/audit-logs', [AuditLogController::class, 'index'])->name('audit-logs.index');
    Route::get('/audit-logs/export', [AuditLogController::class, 'export'])->name('audit-logs.export');

    // Centralized Document Management System (DMS / Attachments)
    Route::get('/attachments', [AttachmentController::class, 'listFor'])->name('attachments.list');
    Route::post('/attachments', [AttachmentController::class, 'upload'])->name('attachments.upload');
    Route::get('/attachments/{attachment}/download', [AttachmentController::class, 'download'])->name('attachments.download');
    Route::delete('/attachments/{attachment}', [AttachmentController::class, 'destroy'])->name('attachments.destroy');

    // System Alerts & Notification Center
    Route::get('/alerts', [AlertController::class, 'index'])->name('alerts.index');
    Route::get('/alerts/unread-count', [AlertController::class, 'unreadCount'])->name('alerts.unread-count');
    Route::post('/alerts/{alert}/read', [AlertController::class, 'markAsRead'])->name('alerts.read');
    Route::post('/alerts/read-all', [AlertController::class, 'markAllAsRead'])->name('alerts.read-all');
    Route::post('/alerts/{alert}/dismiss', [AlertController::class, 'dismiss'])->name('alerts.dismiss');

    // Module Feature Flags & Activation Manager
    Route::get('/settings/modules', [ModuleController::class, 'index'])->name('settings.modules.index');
    Route::post('/settings/modules', [ModuleController::class, 'update'])->name('settings.modules.update');
    Route::post('/settings/modules/preset', [ModuleController::class, 'applyPreset'])->name('settings.modules.preset');
});

require __DIR__.'/settings.php';
