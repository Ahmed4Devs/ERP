<?php

namespace Database\Seeders;

use App\Models\User;
use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\FiscalPeriod;
use App\Modules\Assets\Models\AssetCategory;
use App\Modules\Assets\Models\FixedAsset;
use App\Modules\Contracting\Models\ContractingClaim;
use App\Modules\Contracting\Models\ContractingClaimItem;
use App\Modules\Contracts\Models\Contract;
use App\Modules\Contracts\Models\ContractLine;
use App\Modules\CRM\Models\Lead;
use App\Modules\HR\Models\Department;
use App\Modules\HR\Models\Designation;
use App\Modules\HR\Models\Employee;
use App\Modules\Inventory\Models\Product;
use App\Modules\Inventory\Models\ProductCategory;
use App\Modules\Inventory\Models\UnitOfMeasure;
use App\Modules\Inventory\Models\Warehouse;
use App\Modules\Inventory\Models\WarehouseLocation;
use App\Modules\Manufacturing\Models\BillOfMaterial;
use App\Modules\Manufacturing\Models\BomItem;
use App\Modules\Manufacturing\Models\ProductionOrder;
use App\Modules\Manufacturing\Models\ProductionOrderItem;
use App\Modules\MasterData\Models\CustomerProfile;
use App\Modules\MasterData\Models\Party;
use App\Modules\Organization\Models\Branch;
use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Models\Membership;
use App\Modules\Platform\Models\Permission;
use App\Modules\Platform\Models\Role;
use App\Modules\Platform\Models\Tenant;
use App\Modules\Projects\Models\Project;
use App\Modules\Projects\Models\ProjectTask;
use App\Modules\Projects\Models\ProjectTimesheet;
use App\Modules\Purchasing\Models\VendorProfile;
use App\Modules\Retail\Models\PosSession;
use App\Modules\Retail\Models\PosTerminal;
use App\Modules\Sales\Models\SalesOrder;
use App\Modules\Sales\Models\SalesOrderLine;
use App\Modules\Sales\Models\SalesQuotation;
use App\Modules\Sales\Models\SalesQuotationLine;
use App\Modules\Support\Models\SupportTicket;
use App\Modules\Support\Models\SupportTicketMessage;
use App\Modules\Trade\Models\PriceList;
use App\Modules\Trade\Models\PriceListItem;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create Core Permissions
        $permissions = [
            ['name' => 'platform.tenant.manage', 'description' => 'Manage Tenant Settings', 'module' => 'Platform'],
            ['name' => 'organization.company.view', 'description' => 'View Companies', 'module' => 'Organization'],
            ['name' => 'organization.company.manage', 'description' => 'Manage Companies', 'module' => 'Organization'],
            ['name' => 'organization.branch.manage', 'description' => 'Manage Branches', 'module' => 'Organization'],
            ['name' => 'masterdata.party.view', 'description' => 'View Parties/Customers', 'module' => 'MasterData'],
            ['name' => 'masterdata.party.create', 'description' => 'Create Parties/Customers', 'module' => 'MasterData'],
            ['name' => 'masterdata.party.delete', 'description' => 'Delete Parties/Customers', 'module' => 'MasterData'],
            ['name' => 'accounting.account.view', 'description' => 'View Accounts', 'module' => 'Accounting'],
            ['name' => 'accounting.invoice.view', 'description' => 'View Accounting Invoices', 'module' => 'Accounting'],
            ['name' => 'accounting.invoice.post', 'description' => 'Post Accounting Invoices', 'module' => 'Accounting'],
            ['name' => 'accounting.receipt.post', 'description' => 'Post Receipts', 'module' => 'Accounting'],
            ['name' => 'accounting.report.view', 'description' => 'View Financial Reports', 'module' => 'Accounting'],
            ['name' => 'accounting.period.manage', 'description' => 'Manage Fiscal Periods and Locks', 'module' => 'Accounting'],
            ['name' => 'purchasing.order.view', 'description' => 'View Purchase Orders', 'module' => 'Purchasing'],
            ['name' => 'purchasing.order.manage', 'description' => 'Manage Purchase Orders', 'module' => 'Purchasing'],
            ['name' => 'purchasing.bill.view', 'description' => 'View Vendor Bills', 'module' => 'Purchasing'],
            ['name' => 'purchasing.bill.post', 'description' => 'Post Vendor Bills', 'module' => 'Purchasing'],
            ['name' => 'purchasing.payment.post', 'description' => 'Post Vendor Payments', 'module' => 'Purchasing'],
            ['name' => 'treasury.transfer.post', 'description' => 'Post Treasury Transfers', 'module' => 'Treasury'],
            ['name' => 'inventory.product.view', 'description' => 'View Products', 'module' => 'Inventory'],
            ['name' => 'inventory.product.manage', 'description' => 'Manage Products', 'module' => 'Inventory'],
            ['name' => 'inventory.warehouse.view', 'description' => 'View Warehouses', 'module' => 'Inventory'],
            ['name' => 'inventory.warehouse.manage', 'description' => 'Manage Warehouses', 'module' => 'Inventory'],
            ['name' => 'inventory.receipt.view', 'description' => 'View Goods Receipts', 'module' => 'Inventory'],
            ['name' => 'inventory.receipt.post', 'description' => 'Post Goods Receipts', 'module' => 'Inventory'],
            ['name' => 'inventory.movement.view', 'description' => 'View Stock Movements', 'module' => 'Inventory'],
            ['name' => 'inventory.transfer.view', 'description' => 'View Stock Transfers', 'module' => 'Inventory'],
            ['name' => 'inventory.transfer.post', 'description' => 'Post Stock Transfers', 'module' => 'Inventory'],
            ['name' => 'inventory.adjustment.view', 'description' => 'View Stock Adjustments', 'module' => 'Inventory'],
            ['name' => 'inventory.adjustment.post', 'description' => 'Post Stock Adjustments', 'module' => 'Inventory'],
            ['name' => 'inventory.valuation.view', 'description' => 'View Inventory Valuation Report', 'module' => 'Inventory'],
            ['name' => 'hr.employee.view', 'description' => 'View Employees & Departments', 'module' => 'HR'],
            ['name' => 'hr.employee.manage', 'description' => 'Manage Employees & Attendance', 'module' => 'HR'],
            ['name' => 'payroll.run.view', 'description' => 'View Payroll Runs & Payslips', 'module' => 'Payroll'],
            ['name' => 'payroll.run.post', 'description' => 'Post & Disburse Payroll Runs', 'module' => 'Payroll'],
            ['name' => 'assets.register.view', 'description' => 'View Fixed Assets Register', 'module' => 'Assets'],
            ['name' => 'assets.register.manage', 'description' => 'Manage Fixed Assets & Categories', 'module' => 'Assets'],
            ['name' => 'assets.depreciation.post', 'description' => 'Post Asset Depreciation Runs', 'module' => 'Assets'],
            ['name' => 'crm.lead.view', 'description' => 'View CRM Leads', 'module' => 'CRM'],
            ['name' => 'crm.lead.manage', 'description' => 'Manage CRM Leads & Pipeline', 'module' => 'CRM'],
            ['name' => 'sales.quotation.view', 'description' => 'View Sales Quotations', 'module' => 'Sales'],
            ['name' => 'sales.quotation.manage', 'description' => 'Manage Sales Quotations', 'module' => 'Sales'],
            ['name' => 'sales.order.view', 'description' => 'View Sales Orders', 'module' => 'Sales'],
            ['name' => 'sales.order.manage', 'description' => 'Manage Sales Orders', 'module' => 'Sales'],
            ['name' => 'projects.project.view', 'description' => 'View Projects', 'module' => 'Projects'],
            ['name' => 'projects.project.manage', 'description' => 'Manage Projects & Tasks', 'module' => 'Projects'],
            ['name' => 'projects.timesheet.manage', 'description' => 'Manage Project Timesheets', 'module' => 'Projects'],
            ['name' => 'contracts.contract.view', 'description' => 'View Recurring Contracts', 'module' => 'Contracts'],
            ['name' => 'contracts.contract.manage', 'description' => 'Manage Recurring Contracts', 'module' => 'Contracts'],
            ['name' => 'support.ticket.view', 'description' => 'View Support Tickets', 'module' => 'Support'],
            ['name' => 'support.ticket.manage', 'description' => 'Manage Support Tickets & Messages', 'module' => 'Support'],
            ['name' => 'retail.pos.view', 'description' => 'View POS Terminals & Sessions', 'module' => 'Retail'],
            ['name' => 'retail.pos.manage', 'description' => 'Manage POS Terminals & Settings', 'module' => 'Retail'],
            ['name' => 'retail.pos.transact', 'description' => 'Operate POS Checkout & Sessions', 'module' => 'Retail'],
            ['name' => 'manufacturing.bom.view', 'description' => 'View Bills of Materials', 'module' => 'Manufacturing'],
            ['name' => 'manufacturing.bom.manage', 'description' => 'Manage Bills of Materials', 'module' => 'Manufacturing'],
            ['name' => 'manufacturing.order.view', 'description' => 'View Production Orders', 'module' => 'Manufacturing'],
            ['name' => 'manufacturing.order.manage', 'description' => 'Manage & Execute Production Orders', 'module' => 'Manufacturing'],
            ['name' => 'trade.pricelist.view', 'description' => 'View Price Lists & Tiers', 'module' => 'Trade'],
            ['name' => 'trade.pricelist.manage', 'description' => 'Manage Price Lists & Wholesale Tiers', 'module' => 'Trade'],
            ['name' => 'contracting.claim.view', 'description' => 'View Contracting Progress Claims', 'module' => 'Contracting'],
            ['name' => 'contracting.claim.manage', 'description' => 'Manage & Bill Contracting Claims', 'module' => 'Contracting'],
        ];

        $permissionModels = [];
        foreach ($permissions as $p) {
            $permissionModels[$p['name']] = Permission::firstOrCreate(
                ['name' => $p['name']],
                ['description' => $p['description'], 'module' => $p['module']]
            );
        }

        // 2. Setup Tenant A: "Al-Amal Group" (مجموعة الأمل)
        $tenantA = Tenant::firstOrCreate(
            ['slug' => 'al-amal'],
            [
                'name' => 'Al-Amal Group (مجموعة الأمل)',
                'status' => 'active',
                'settings' => ['theme' => 'corporate'],
            ]
        );

        $companyA1 = Company::firstOrCreate(
            ['tenant_id' => $tenantA->id, 'name' => 'Al-Amal Trading Est. (مؤسسة الأمل للتجارة)'],
            [
                'legal_name' => 'Al-Amal Commercial Trading LLC',
                'tax_number' => '300123456700003',
                'currency' => 'SAR',
                'status' => 'active',
            ]
        );

        $branchA1 = Branch::firstOrCreate(
            ['company_id' => $companyA1->id, 'code' => 'BR-RUH-01'],
            [
                'tenant_id' => $tenantA->id,
                'name' => 'Riyadh Main HQ (فرع الرياض الرئيسي)',
                'is_headquarters' => true,
                'status' => 'active',
            ]
        );

        $branchA2 = Branch::firstOrCreate(
            ['company_id' => $companyA1->id, 'code' => 'BR-DMM-01'],
            [
                'tenant_id' => $tenantA->id,
                'name' => 'Dammam Showroom (معرض الدمام)',
                'is_headquarters' => false,
                'status' => 'active',
            ]
        );

        $companyA2 = Company::firstOrCreate(
            ['tenant_id' => $tenantA->id, 'name' => 'Al-Amal Logistics (شركة الأمل للخدمات اللوجستية)'],
            [
                'legal_name' => 'Al-Amal Transport & Logistics Co.',
                'tax_number' => '300987654300003',
                'currency' => 'SAR',
                'status' => 'active',
            ]
        );

        $branchA3 = Branch::firstOrCreate(
            ['company_id' => $companyA2->id, 'code' => 'BR-JED-01'],
            [
                'tenant_id' => $tenantA->id,
                'name' => 'Jeddah Port Hub (مركز ميناء جدة)',
                'is_headquarters' => true,
                'status' => 'active',
            ]
        );

        // Users for Tenant A
        $userA1 = User::firstOrCreate(
            ['email' => 'admin@alamal.com'],
            [
                'name' => 'Ahmed Al-Amal (أحمد الأمل)',
                'password' => Hash::make('password123'),
                'locale' => 'ar',
                'email_verified_at' => now(),
            ]
        );

        $userA2 = User::firstOrCreate(
            ['email' => 'accountant@alamal.com'],
            [
                'name' => 'Sarah Al-Mansoor (سارة المنصور)',
                'password' => Hash::make('password123'),
                'locale' => 'ar',
                'email_verified_at' => now(),
            ]
        );

        // Roles for Tenant A
        $roleAdminA = Role::firstOrCreate(
            ['tenant_id' => $tenantA->id, 'slug' => 'super-admin'],
            [
                'name' => 'Super Administrator (مدير النظام الأعلى)',
                'is_system' => true,
            ]
        );
        $roleAdminA->permissions()->sync(array_values(array_map(fn ($m) => $m->id, $permissionModels)));

        // Memberships for Tenant A
        $membershipA1 = Membership::firstOrCreate(
            ['user_id' => $userA1->id, 'tenant_id' => $tenantA->id],
            [
                'default_company_id' => $companyA1->id,
                'is_owner' => true,
                'status' => 'active',
            ]
        );
        if (! $membershipA1->roles()->where('role_id', $roleAdminA->id)->exists()) {
            $membershipA1->roles()->attach($roleAdminA->id);
        }

        $membershipA2 = Membership::firstOrCreate(
            ['user_id' => $userA2->id, 'tenant_id' => $tenantA->id],
            [
                'default_company_id' => $companyA1->id,
                'is_owner' => false,
                'status' => 'active',
            ]
        );

        // Master Data Parties for Tenant A
        $partyA1 = Party::firstOrCreate(
            ['tenant_id' => $tenantA->id, 'name' => 'Al-Safwa Commercial Group'],
            [
                'name_ar' => 'مجموعة الصفوة التجارية',
                'type' => 'customer',
                'tax_id' => '310456789000003',
                'email' => 'info@safwa-group.sa',
                'phone' => '+966114567890',
                'status' => 'active',
            ]
        );

        CustomerProfile::firstOrCreate(
            ['company_id' => $companyA1->id, 'party_id' => $partyA1->id],
            [
                'tenant_id' => $tenantA->id,
                'credit_limit' => 50000.00,
                'payment_terms_days' => 30,
                'currency' => 'SAR',
                'is_active' => true,
            ]
        );

        $partyA2 = Party::firstOrCreate(
            ['tenant_id' => $tenantA->id, 'name' => 'Riyadh General Contracting'],
            [
                'name_ar' => 'شركة مقاولات الرياض العامة',
                'type' => 'customer',
                'tax_id' => '310987654000003',
                'email' => 'contact@riyadhcontracting.com',
                'phone' => '+966112345678',
                'status' => 'active',
            ]
        );

        CustomerProfile::firstOrCreate(
            ['company_id' => $companyA1->id, 'party_id' => $partyA2->id],
            [
                'tenant_id' => $tenantA->id,
                'credit_limit' => 120000.00,
                'payment_terms_days' => 45,
                'currency' => 'SAR',
                'is_active' => true,
            ]
        );

        $partyA3 = Party::firstOrCreate(
            ['tenant_id' => $tenantA->id, 'name' => 'Delta Tech Solutions Ltd'],
            [
                'name_ar' => 'شركة حلول دلتا التقنية المحدودة',
                'type' => 'vendor',
                'tax_id' => '310555666700003',
                'email' => 'billing@deltatech.sa',
                'phone' => '+966119998877',
                'status' => 'active',
            ]
        );

        VendorProfile::firstOrCreate(
            ['company_id' => $companyA1->id, 'party_id' => $partyA3->id],
            [
                'tenant_id' => $tenantA->id,
                'credit_limit' => 200000.00,
                'payment_terms_days' => 30,
                'currency' => 'SAR',
                'is_active' => true,
            ]
        );

        // 3. Setup Tenant B: "Al-Binaa Holding" (شركة البناء القابضة) - For Isolation Testing
        $tenantB = Tenant::firstOrCreate(
            ['slug' => 'al-binaa'],
            [
                'name' => 'Al-Binaa Holding (شركة البناء القابضة)',
                'status' => 'active',
                'settings' => ['theme' => 'industrial'],
            ]
        );

        $companyB1 = Company::firstOrCreate(
            ['tenant_id' => $tenantB->id, 'name' => 'Al-Binaa Heavy Industries (البناء للصناعات الثقيلة)'],
            [
                'legal_name' => 'Al-Binaa Industrial Corporation',
                'tax_number' => '311122233300003',
                'currency' => 'USD',
                'status' => 'active',
            ]
        );

        $branchB1 = Branch::firstOrCreate(
            ['company_id' => $companyB1->id, 'code' => 'BR-DXB-01'],
            [
                'tenant_id' => $tenantB->id,
                'name' => 'Dubai Regional Hub (المقر الإقليمي بدبي)',
                'is_headquarters' => true,
                'status' => 'active',
            ]
        );

        $userB1 = User::firstOrCreate(
            ['email' => 'admin@albinaa.com'],
            [
                'name' => 'Khalid Al-Binaa (خالد البناء)',
                'password' => Hash::make('password123'),
                'locale' => 'en',
                'email_verified_at' => now(),
            ]
        );

        $membershipB1 = Membership::firstOrCreate(
            ['user_id' => $userB1->id, 'tenant_id' => $tenantB->id],
            [
                'default_company_id' => $companyB1->id,
                'is_owner' => true,
                'status' => 'active',
            ]
        );

        $partyB1 = Party::firstOrCreate(
            ['tenant_id' => $tenantB->id, 'name' => 'Gulf Mega Projects Corp'],
            [
                'name_ar' => 'شركة مشاريع الخليج الكبرى',
                'type' => 'customer',
                'tax_id' => '100200300400003',
                'email' => 'procurement@gulfmegaprojects.com',
                'phone' => '+97143219876',
                'status' => 'active',
            ]
        );

        CustomerProfile::firstOrCreate(
            ['company_id' => $companyB1->id, 'party_id' => $partyB1->id],
            [
                'tenant_id' => $tenantB->id,
                'credit_limit' => 500000.00,
                'payment_terms_days' => 60,
                'currency' => 'USD',
                'is_active' => true,
            ]
        );

        // 4. Seed Standard Chart of Accounts & Fiscal Periods
        $this->seedCompanyAccountsAndPeriods($tenantA, $companyA1);
        $this->seedCompanyAccountsAndPeriods($tenantA, $companyA2);
        $this->seedCompanyAccountsAndPeriods($tenantB, $companyB1);

        // 5. Seed Inventory Master Data
        $this->seedInventoryMasterData($tenantA, $companyA1, $branchA1, $branchA2);

        // 6. Seed Workforce & Asset Master Data
        $this->seedWorkforceAndAssetMasterData($tenantA, $companyA1, $branchA1);

        // 7. Seed Commercial Operations, CRM & Services
        $this->seedCommercialOperationsMasterData($tenantA, $companyA1, $userA1, $partyA1);

        // 8. Seed Industry Vertical Packs (Retail, Manufacturing, Trade, Contracting)
        $this->seedIndustryVerticalMasterData($tenantA, $companyA1, $branchA1, $userA1, $partyA1, $partyA2);
    }

    private function seedCompanyAccountsAndPeriods(Tenant $tenant, Company $company): void
    {
        FiscalPeriod::firstOrCreate(
            ['company_id' => $company->id, 'name' => 'FY-2026'],
            [
                'tenant_id' => $tenant->id,
                'start_date' => '2026-01-01',
                'end_date' => '2026-12-31',
                'is_locked' => false,
            ]
        );

        $standardAccounts = [
            ['code' => '1010', 'name' => 'Cash on Hand', 'name_ar' => 'النقدية في الصندوق', 'type' => 'asset', 'subtype' => 'cash'],
            ['code' => '1020', 'name' => 'Bank Current Account', 'name_ar' => 'الحساب الجاري لدى البنك', 'type' => 'asset', 'subtype' => 'bank'],
            ['code' => '1150', 'name' => 'Test Tax Recoverable (Input Tax 10%)', 'name_ar' => 'ضريبة الاختبار المستردة (مدخلات 10%)', 'type' => 'asset', 'subtype' => 'tax_receivable', 'is_system' => true],
            ['code' => '1200', 'name' => 'Accounts Receivable Control', 'name_ar' => 'الذمم المدينة (العملاء)', 'type' => 'asset', 'subtype' => 'receivable', 'is_system' => true],
            ['code' => '1300', 'name' => 'Merchandise Inventory', 'name_ar' => 'مخزون بضاعة بالمستودع', 'type' => 'asset', 'subtype' => 'inventory', 'is_system' => true],
            ['code' => '1500', 'name' => 'Fixed Assets - Equipment & Tech', 'name_ar' => 'الأصول الثابتة - المعدات والتقنية', 'type' => 'asset', 'subtype' => 'fixed_asset'],
            ['code' => '1590', 'name' => 'Accumulated Depreciation', 'name_ar' => 'مجمع الإهلاك المتراكم', 'type' => 'asset', 'subtype' => 'contra_asset'],
            ['code' => '2010', 'name' => 'Accounts Payable Control', 'name_ar' => 'الذمم الدائنة (الموردين)', 'type' => 'liability', 'subtype' => 'payable', 'is_system' => true],
            ['code' => '2020', 'name' => 'GRNI Clearing (Goods Received Not Invoiced)', 'name_ar' => 'حساب وسيط استلام بضائع غير مفوترة', 'type' => 'liability', 'subtype' => 'clearing', 'is_system' => true],
            ['code' => '2030', 'name' => 'Accrued Salaries & Payroll Payable', 'name_ar' => 'مستحقات الرواتب والأجور الدائنة', 'type' => 'liability', 'subtype' => 'payroll_payable', 'is_system' => true],
            ['code' => '2040', 'name' => 'Social Insurance / GOSI Payable', 'name_ar' => 'مخصص التأمينات الاجتماعية المستحقة', 'type' => 'liability', 'subtype' => 'tax_payable', 'is_system' => true],
            ['code' => '2150', 'name' => 'Test Tax Liability (10%)', 'name_ar' => 'مخصص ضريبة الاختبار (10%)', 'type' => 'liability', 'subtype' => 'tax_payable', 'is_system' => true],
            ['code' => '3010', 'name' => 'Share Capital', 'name_ar' => 'رأس المال المدفوع', 'type' => 'equity', 'subtype' => 'equity'],
            ['code' => '4100', 'name' => 'Consulting & Service Revenue', 'name_ar' => 'إيرادات الخدمات والاستشارات', 'type' => 'revenue', 'subtype' => 'operating_revenue'],
            ['code' => '5000', 'name' => 'Cost of Goods Sold (COGS)', 'name_ar' => 'تكلفة البضاعة المباعة', 'type' => 'expense', 'subtype' => 'cost_of_sales', 'is_system' => true],
            ['code' => '5100', 'name' => 'General & Administrative Expenses', 'name_ar' => 'المصروفات العمومية والإدارية', 'type' => 'expense', 'subtype' => 'operating_expense'],
            ['code' => '5110', 'name' => 'Salaries & Wages Expense', 'name_ar' => 'مصروفات الرواتب والأجور', 'type' => 'expense', 'subtype' => 'operating_expense'],
            ['code' => '5120', 'name' => 'Employee Allowances & Benefits', 'name_ar' => 'مصروفات البدلات والمزايا', 'type' => 'expense', 'subtype' => 'operating_expense'],
            ['code' => '5200', 'name' => 'IT & Software Expenses', 'name_ar' => 'مصروفات تقنية المعلومات والبرمجيات', 'type' => 'expense', 'subtype' => 'operating_expense'],
            ['code' => '5300', 'name' => 'Depreciation Expense', 'name_ar' => 'مصروف إهلاك الأصول الثابتة', 'type' => 'expense', 'subtype' => 'depreciation'],
            ['code' => '5900', 'name' => 'Inventory Variance & Adjustments', 'name_ar' => 'فروقات وتسويات المخزون', 'type' => 'expense', 'subtype' => 'inventory_adjustment', 'is_system' => false],
        ];

        foreach ($standardAccounts as $acc) {
            Account::firstOrCreate(
                ['company_id' => $company->id, 'code' => $acc['code']],
                [
                    'tenant_id' => $tenant->id,
                    'name' => $acc['name'],
                    'name_ar' => $acc['name_ar'],
                    'type' => $acc['type'],
                    'subtype' => $acc['subtype'] ?? null,
                    'currency' => $company->currency,
                    'is_postable' => true,
                    'is_system' => $acc['is_system'] ?? false,
                    'current_balance' => '0.000000',
                ]
            );
        }
    }

    private function seedInventoryMasterData(Tenant $tenant, Company $company, Branch $branch1, Branch $branch2): void
    {
        // 1. Units of Measure
        $uomPcs = UnitOfMeasure::firstOrCreate(
            ['tenant_id' => $tenant->id, 'code' => 'PCS'],
            ['name' => 'Piece', 'name_ar' => 'قطعة', 'symbol' => 'pc', 'is_active' => true]
        );
        $uomKg = UnitOfMeasure::firstOrCreate(
            ['tenant_id' => $tenant->id, 'code' => 'KG'],
            ['name' => 'Kilogram', 'name_ar' => 'كيلوجرام', 'symbol' => 'kg', 'is_active' => true]
        );
        $uomBox = UnitOfMeasure::firstOrCreate(
            ['tenant_id' => $tenant->id, 'code' => 'BOX'],
            ['name' => 'Box', 'name_ar' => 'صندوق', 'symbol' => 'bx', 'is_active' => true]
        );

        // 2. Product Categories
        $catIT = ProductCategory::firstOrCreate(
            ['tenant_id' => $tenant->id, 'code' => 'CAT-IT'],
            ['company_id' => $company->id, 'name' => 'IT & Electronics', 'name_ar' => 'أجهزة وتقنية المعلومات', 'is_active' => true]
        );
        $catOffice = ProductCategory::firstOrCreate(
            ['tenant_id' => $tenant->id, 'code' => 'CAT-OFFICE'],
            ['company_id' => $company->id, 'name' => 'Office Furniture & Supplies', 'name_ar' => 'أثاث ومستلزمات مكتبية', 'is_active' => true]
        );

        // 3. Warehouses & Locations
        $wh1 = Warehouse::firstOrCreate(
            ['company_id' => $company->id, 'code' => 'WH-RUH-01'],
            [
                'tenant_id' => $tenant->id,
                'branch_id' => $branch1->id,
                'name' => 'Riyadh Central Warehouse',
                'name_ar' => 'مستودع الرياض الرئيسي',
                'address' => 'King Fahd Industrial Zone, Riyadh',
                'is_default' => true,
                'is_active' => true,
            ]
        );
        WarehouseLocation::firstOrCreate(
            ['warehouse_id' => $wh1->id, 'code' => 'DEFAULT'],
            ['tenant_id' => $tenant->id, 'company_id' => $company->id, 'name' => 'Default Location', 'name_ar' => 'الموقع الافتراضي', 'is_active' => true]
        );

        $wh2 = Warehouse::firstOrCreate(
            ['company_id' => $company->id, 'code' => 'WH-DMM-01'],
            [
                'tenant_id' => $tenant->id,
                'branch_id' => $branch2->id,
                'name' => 'Dammam Depot',
                'name_ar' => 'مستودع الدمام',
                'address' => 'Dammam Port Area',
                'is_default' => false,
                'is_active' => true,
            ]
        );
        WarehouseLocation::firstOrCreate(
            ['warehouse_id' => $wh2->id, 'code' => 'DEFAULT'],
            ['tenant_id' => $tenant->id, 'company_id' => $company->id, 'name' => 'Default Location', 'name_ar' => 'الموقع الافتراضي', 'is_active' => true]
        );

        // 4. Products
        $invAcc = Account::where('company_id', $company->id)->where('code', '1300')->first();
        $cogsAcc = Account::where('company_id', $company->id)->where('code', '5000')->first();
        $revAcc = Account::where('company_id', $company->id)->where('code', '4100')->first();
        $grniAcc = Account::where('company_id', $company->id)->where('code', '2020')->first();

        Product::firstOrCreate(
            ['company_id' => $company->id, 'sku' => 'PRD-LAP-001'],
            [
                'tenant_id' => $tenant->id,
                'category_id' => $catIT->id,
                'unit_id' => $uomPcs->id,
                'barcode' => '628100010001',
                'name' => 'Dell Latitude 5540 Laptop 16GB RAM',
                'name_ar' => 'حاسب محمول ديل لاتيتيود 5540 ذاكرة 16 جيجابايت',
                'description' => 'High performance business laptop with 13th Gen Intel Core i7',
                'type' => 'storable',
                'standard_cost' => '3500.000000',
                'moving_average_cost' => '0.000000',
                'list_price' => '4500.000000',
                'inventory_account_id' => $invAcc?->id,
                'cogs_account_id' => $cogsAcc?->id,
                'revenue_account_id' => $revAcc?->id,
                'grni_account_id' => $grniAcc?->id,
                'tax_rate' => '0.100000',
                'is_active' => true,
            ]
        );

        Product::firstOrCreate(
            ['company_id' => $company->id, 'sku' => 'PRD-MON-001'],
            [
                'tenant_id' => $tenant->id,
                'category_id' => $catIT->id,
                'unit_id' => $uomPcs->id,
                'barcode' => '628100010002',
                'name' => 'Dell 27" UltraSharp 4K Monitor',
                'name_ar' => 'شاشة ديل 27 بوصة ألترا شارب بدقة 4K',
                'description' => 'Professional color-accurate 4K USB-C monitor',
                'type' => 'storable',
                'standard_cost' => '1200.000000',
                'moving_average_cost' => '0.000000',
                'list_price' => '1750.000000',
                'inventory_account_id' => $invAcc?->id,
                'cogs_account_id' => $cogsAcc?->id,
                'revenue_account_id' => $revAcc?->id,
                'grni_account_id' => $grniAcc?->id,
                'tax_rate' => '0.100000',
                'is_active' => true,
            ]
        );

        Product::firstOrCreate(
            ['company_id' => $company->id, 'sku' => 'PRD-CHAIR-001'],
            [
                'tenant_id' => $tenant->id,
                'category_id' => $catOffice->id,
                'unit_id' => $uomPcs->id,
                'barcode' => '628100010003',
                'name' => 'Ergonomic Executive Mesh Chair',
                'name_ar' => 'كرسي مكتبي تنفيذي طبي مريح',
                'description' => 'Adjustable lumbar support ergonomic mesh office chair',
                'type' => 'storable',
                'standard_cost' => '600.000000',
                'moving_average_cost' => '0.000000',
                'list_price' => '950.000000',
                'inventory_account_id' => $invAcc?->id,
                'cogs_account_id' => $cogsAcc?->id,
                'revenue_account_id' => $revAcc?->id,
                'grni_account_id' => $grniAcc?->id,
                'tax_rate' => '0.100000',
                'is_active' => true,
            ]
        );
    }

    private function seedWorkforceAndAssetMasterData(Tenant $tenant, Company $company, Branch $branch): void
    {
        // 1. Departments
        $deptIT = Department::firstOrCreate(
            ['company_id' => $company->id, 'code' => 'DEP-IT'],
            [
                'tenant_id' => $tenant->id,
                'name' => 'Information Technology',
                'name_ar' => 'قسم تقنية المعلومات',
                'is_active' => true,
            ]
        );

        $deptOps = Department::firstOrCreate(
            ['company_id' => $company->id, 'code' => 'DEP-OPS'],
            [
                'tenant_id' => $tenant->id,
                'name' => 'Operations & Logistics',
                'name_ar' => 'قسم العمليات واللوجستيات',
                'is_active' => true,
            ]
        );

        // 2. Designations
        $desDev = Designation::firstOrCreate(
            ['company_id' => $company->id, 'code' => 'DES-DEV'],
            [
                'tenant_id' => $tenant->id,
                'title' => 'Senior Software Engineer',
                'title_ar' => 'مهندس برمجيات أول',
                'description' => 'Core application development',
                'is_active' => true,
            ]
        );

        $desMgr = Designation::firstOrCreate(
            ['company_id' => $company->id, 'code' => 'DES-MGR'],
            [
                'tenant_id' => $tenant->id,
                'title' => 'Operations Manager',
                'title_ar' => 'مدير العمليات',
                'description' => 'Overseeing warehouse and distribution',
                'is_active' => true,
            ]
        );

        // 3. Employee
        $emp1 = Employee::firstOrCreate(
            ['company_id' => $company->id, 'employee_number' => 'EMP-001'],
            [
                'tenant_id' => $tenant->id,
                'branch_id' => $branch->id,
                'department_id' => $deptIT->id,
                'designation_id' => $desDev->id,
                'first_name' => 'Zaid',
                'last_name' => 'Al-Harbi',
                'first_name_ar' => 'زيد',
                'last_name_ar' => 'الحربي',
                'email' => 'zaid.harbi@alamal.com',
                'phone' => '+966551234567',
                'national_id' => '1088776655',
                'hire_date' => '2026-01-01',
                'status' => 'active',
                'basic_salary' => '12000.000000',
                'housing_allowance' => '3000.000000',
                'transport_allowance' => '1000.000000',
                'other_allowances' => '500.000000',
                'bank_name' => 'Al-Rajhi Bank',
                'iban' => 'SA0380000000608010167519',
            ]
        );

        // Set manager of DEP-IT
        if (! $deptIT->manager_id) {
            $deptIT->update(['manager_id' => $emp1->id]);
        }

        // 4. Asset Categories
        $fixedAssetAcc = Account::where('company_id', $company->id)->where('code', '1500')->first();
        $accumDeprAcc = Account::where('company_id', $company->id)->where('code', '1590')->first();
        $deprExpAcc = Account::where('company_id', $company->id)->where('code', '5300')->first();

        $catIT = AssetCategory::firstOrCreate(
            ['company_id' => $company->id, 'code' => 'AST-IT'],
            [
                'tenant_id' => $tenant->id,
                'name' => 'IT & Network Infrastructure',
                'name_ar' => 'أجهزة وتقنية الشبكات',
                'depreciation_method' => 'straight_line',
                'useful_life_months' => 48,
                'asset_account_id' => $fixedAssetAcc?->id,
                'accumulated_depreciation_account_id' => $accumDeprAcc?->id,
                'depreciation_expense_account_id' => $deprExpAcc?->id,
            ]
        );

        $catFurn = AssetCategory::firstOrCreate(
            ['company_id' => $company->id, 'code' => 'AST-FURN'],
            [
                'tenant_id' => $tenant->id,
                'name' => 'Office Furniture & Fixtures',
                'name_ar' => 'أثاث وتجهيزات مكتبية',
                'depreciation_method' => 'straight_line',
                'useful_life_months' => 60,
                'asset_account_id' => $fixedAssetAcc?->id,
                'accumulated_depreciation_account_id' => $accumDeprAcc?->id,
                'depreciation_expense_account_id' => $deprExpAcc?->id,
            ]
        );

        // 5. Fixed Asset
        FixedAsset::firstOrCreate(
            ['company_id' => $company->id, 'asset_tag' => 'AST-SRV-001'],
            [
                'tenant_id' => $tenant->id,
                'branch_id' => $branch->id,
                'category_id' => $catIT->id,
                'name' => 'Enterprise Rack Server HPE ProLiant DL380',
                'name_ar' => 'خادم مركزي برو ليانت DL380 من إتش بي',
                'serial_number' => 'HPE-SRV-2026-99',
                'purchase_date' => '2026-01-01',
                'in_service_date' => '2026-01-01',
                'acquisition_cost' => '48000.000000',
                'salvage_value' => '0.000000',
                'useful_life_months' => 48,
                'depreciation_method' => 'straight_line',
                'accumulated_depreciation' => '0.000000',
                'net_book_value' => '48000.000000',
                'status' => 'active',
                'asset_account_id' => $fixedAssetAcc?->id,
                'accumulated_depreciation_account_id' => $accumDeprAcc?->id,
                'depreciation_expense_account_id' => $deprExpAcc?->id,
            ]
        );
    }

    private function seedCommercialOperationsMasterData(Tenant $tenant, Company $company, User $user, Party $party): void
    {
        // 1. CRM Lead
        $lead = Lead::firstOrCreate(
            ['company_id' => $company->id, 'lead_number' => 'LEAD-2026-001'],
            [
                'tenant_id' => $tenant->id,
                'title' => 'Enterprise Cloud ERP Implementation',
                'party_id' => $party->id,
                'contact_name' => 'Fahad Al-Sulaiman',
                'email' => 'fahad@alsafwa.com',
                'phone' => '+966501112233',
                'company_name' => 'Al-Safwa Trading Group',
                'source' => 'referral',
                'status' => 'qualified',
                'estimated_value' => '75000.000000',
                'probability_percent' => 70,
                'assigned_user_id' => $user->id,
                'notes' => 'High-priority prospective lead for Q4 ERP rollout',
            ]
        );

        // 2. Sales Quotation
        $quote = SalesQuotation::firstOrCreate(
            ['company_id' => $company->id, 'quote_number' => 'QT-2026-0001'],
            [
                'tenant_id' => $tenant->id,
                'lead_id' => $lead->id,
                'customer_id' => $party->id,
                'issue_date' => '2026-09-01',
                'valid_until' => '2026-10-01',
                'subtotal' => '50000.000000',
                'tax_rate' => '0.100000',
                'tax_amount' => '5000.000000',
                'discount_amount' => '0.000000',
                'total_amount' => '55000.000000',
                'status' => 'accepted',
                'notes' => 'Quotation for ERP Consulting & Deployment',
            ]
        );

        SalesQuotationLine::firstOrCreate(
            ['quotation_id' => $quote->id, 'description' => 'ERP System Architecture & Setup'],
            [
                'tenant_id' => $tenant->id,
                'company_id' => $company->id,
                'quantity' => '1.000000',
                'unit_price' => '50000.000000',
                'discount_amount' => '0.000000',
                'tax_amount' => '5000.000000',
                'line_total' => '55000.000000',
            ]
        );

        // 3. Sales Order
        $salesOrder = SalesOrder::firstOrCreate(
            ['company_id' => $company->id, 'order_number' => 'SO-2026-0001'],
            [
                'tenant_id' => $tenant->id,
                'quotation_id' => $quote->id,
                'customer_id' => $party->id,
                'order_date' => '2026-09-05',
                'delivery_date' => '2026-11-30',
                'subtotal' => '50000.000000',
                'tax_rate' => '0.100000',
                'tax_amount' => '5000.000000',
                'discount_amount' => '0.000000',
                'total_amount' => '55000.000000',
                'status' => 'confirmed',
                'invoicing_status' => 'unbilled',
                'notes' => 'Sales Order for ERP Deployment',
            ]
        );

        SalesOrderLine::firstOrCreate(
            ['sales_order_id' => $salesOrder->id, 'description' => 'ERP System Architecture & Setup'],
            [
                'tenant_id' => $tenant->id,
                'company_id' => $company->id,
                'quantity' => '1.000000',
                'unit_price' => '50000.000000',
                'tax_amount' => '5000.000000',
                'line_total' => '55000.000000',
            ]
        );

        // 4. Project & Timesheet
        $emp = Employee::where('company_id', $company->id)->first();
        $project = Project::firstOrCreate(
            ['company_id' => $company->id, 'project_number' => 'PRJ-2026-001'],
            [
                'tenant_id' => $tenant->id,
                'name' => 'Al-Safwa ERP Modernization',
                'name_ar' => 'مشروع تطوير نظام إدارة الموارد - الصفوة',
                'customer_id' => $party->id,
                'sales_order_id' => $salesOrder->id,
                'manager_id' => $emp?->id,
                'start_date' => '2026-09-01',
                'end_date' => '2026-12-31',
                'budget_cost' => '25000.000000',
                'budget_revenue' => '55000.000000',
                'status' => 'in_progress',
                'notes' => 'Turnkey ERP implementation project',
            ]
        );

        $task1 = ProjectTask::firstOrCreate(
            ['project_id' => $project->id, 'title' => 'Core Ledger & Accounting Setup'],
            [
                'tenant_id' => $tenant->id,
                'company_id' => $company->id,
                'estimated_hours' => 40.00,
                'actual_hours' => 20.00,
                'status' => 'in_progress',
                'priority' => 'high',
                'due_date' => '2026-09-25',
            ]
        );

        if ($emp) {
            $hourlyCost = bcdiv((string) $emp->basic_salary, '240', 6);
            $hours = '20.00';
            $totalCost = bcmul($hourlyCost, $hours, 6);
            $billingRate = '250.000000';
            $totalBillable = bcmul($billingRate, $hours, 6);

            ProjectTimesheet::firstOrCreate(
                ['project_id' => $project->id, 'date' => '2026-09-10'],
                [
                    'tenant_id' => $tenant->id,
                    'company_id' => $company->id,
                    'task_id' => $task1->id,
                    'employee_id' => $emp->id,
                    'hours' => $hours,
                    'hourly_cost' => $hourlyCost,
                    'hourly_billing_rate' => $billingRate,
                    'total_cost' => $totalCost,
                    'total_billable' => $totalBillable,
                    'is_billable' => true,
                    'is_billed' => false,
                    'notes' => 'Implemented double-entry rules and CoA migration',
                ]
            );
        }

        // 5. Contract & Subscription
        $contract = Contract::firstOrCreate(
            ['company_id' => $company->id, 'contract_number' => 'CNT-2026-001'],
            [
                'tenant_id' => $tenant->id,
                'customer_id' => $party->id,
                'project_id' => $project->id,
                'title' => 'Annual ERP Support & Cloud SLA',
                'title_ar' => 'عقد الدعم الفني السنوي والحوسبة السحابية',
                'start_date' => '2026-10-01',
                'end_date' => '2027-09-30',
                'billing_cycle' => 'monthly',
                'recurring_amount' => '4500.000000',
                'tax_rate' => '0.100000',
                'next_billing_date' => '2026-10-01',
                'status' => 'active',
                'auto_renew' => true,
                'notes' => 'Monthly recurring maintenance retainer',
            ]
        );

        ContractLine::firstOrCreate(
            ['contract_id' => $contract->id, 'description' => '24/7 SLA Technical Retainer & Monitoring'],
            [
                'tenant_id' => $tenant->id,
                'company_id' => $company->id,
                'quantity' => '1.000000',
                'unit_price' => '4500.000000',
                'line_total' => '4500.000000',
            ]
        );

        // 6. Support Ticket
        $ticket = SupportTicket::firstOrCreate(
            ['company_id' => $company->id, 'ticket_number' => 'TCK-2026-0001'],
            [
                'tenant_id' => $tenant->id,
                'customer_id' => $party->id,
                'project_id' => $project->id,
                'contact_name' => 'Fahad Al-Sulaiman',
                'contact_email' => 'fahad@alsafwa.com',
                'subject' => 'Request Assistance with Custom Chart of Accounts Import',
                'description' => 'We need help validating the opening balances and ledger hierarchy.',
                'priority' => 'high',
                'status' => 'open',
                'assigned_user_id' => $user->id,
            ]
        );

        SupportTicketMessage::firstOrCreate(
            ['ticket_id' => $ticket->id, 'message' => 'Initial inquiry submitted by customer.'],
            [
                'tenant_id' => $tenant->id,
                'company_id' => $company->id,
                'user_id' => null,
                'sender_type' => 'customer',
                'sender_name' => 'Fahad Al-Sulaiman',
            ]
        );
    }

    private function seedIndustryVerticalMasterData(
        Tenant $tenant,
        Company $company,
        Branch $branch,
        User $user,
        Party $party1,
        Party $party2
    ): void {
        $cashAcc = Account::where('company_id', $company->id)->where('code', '1010')->first();
        $warehouse = Warehouse::where('company_id', $company->id)->where('code', 'WH-RUH-01')->first();

        // 1. POS Terminal & Initial Open Session
        if ($cashAcc && $warehouse) {
            $terminal = PosTerminal::firstOrCreate(
                ['company_id' => $company->id, 'code' => 'POS-RUH-01'],
                [
                    'tenant_id' => $tenant->id,
                    'branch_id' => $branch->id,
                    'warehouse_id' => $warehouse->id,
                    'cash_account_id' => $cashAcc->id,
                    'name' => 'Riyadh Flagship Retail POS 01 (نقطة بيع فرع الرياض الرئيسية)',
                    'status' => 'active',
                ]
            );

            PosSession::firstOrCreate(
                ['company_id' => $company->id, 'session_number' => 'SES-202609-001'],
                [
                    'tenant_id' => $tenant->id,
                    'terminal_id' => $terminal->id,
                    'user_id' => $user->id,
                    'opening_cash' => '1000.000000',
                    'closing_cash' => null,
                    'expected_cash' => '1000.000000',
                    'cash_difference' => '0.000000',
                    'status' => 'open',
                    'opened_at' => now(),
                    'notes' => 'Morning shift opening float verified.',
                ]
            );
        }

        // 2. Manufacturing: BOM & Production Order for Executive Workstation Bundle
        $lap = Product::where('company_id', $company->id)->where('sku', 'PRD-LAP-001')->first();
        $mon = Product::where('company_id', $company->id)->where('sku', 'PRD-MON-001')->first();
        $chair = Product::where('company_id', $company->id)->where('sku', 'PRD-CHAIR-001')->first();
        $uomPcs = UnitOfMeasure::where('tenant_id', $tenant->id)->where('code', 'PCS')->first();
        $catIT = $lap?->category;

        $invAcc = Account::where('company_id', $company->id)->where('code', '1300')->first();
        $cogsAcc = Account::where('company_id', $company->id)->where('code', '5000')->first();
        $revAcc = Account::where('company_id', $company->id)->where('code', '4100')->first();
        $grniAcc = Account::where('company_id', $company->id)->where('code', '2020')->first();

        $bundleProduct = Product::firstOrCreate(
            ['company_id' => $company->id, 'sku' => 'PRD-BUNDLE-001'],
            [
                'tenant_id' => $tenant->id,
                'category_id' => $catIT?->id,
                'unit_id' => $uomPcs?->id,
                'barcode' => '628100010099',
                'name' => 'Complete Executive Workstation Bundle (حزمة محطة العمل التنفيذية المتكاملة)',
                'name_ar' => 'حزمة محطة العمل التنفيذية المتكاملة',
                'description' => 'Turnkey bundled workstation including Laptop, 4K Monitor, and Ergonomic Chair',
                'type' => 'storable',
                'standard_cost' => '5300.000000',
                'moving_average_cost' => '0.000000',
                'list_price' => '6999.000000',
                'inventory_account_id' => $invAcc?->id,
                'cogs_account_id' => $cogsAcc?->id,
                'revenue_account_id' => $revAcc?->id,
                'grni_account_id' => $grniAcc?->id,
                'tax_rate' => '0.100000',
                'is_active' => true,
            ]
        );

        $bom = BillOfMaterial::firstOrCreate(
            ['company_id' => $company->id, 'bom_code' => 'BOM-WS-001'],
            [
                'tenant_id' => $tenant->id,
                'product_id' => $bundleProduct->id,
                'yield_quantity' => '1.000000',
                'version' => 'v1.0',
                'is_active' => true,
                'notes' => 'Assembly BOM for Executive Workstation package.',
            ]
        );

        if ($lap) {
            BomItem::firstOrCreate(
                ['bom_id' => $bom->id, 'product_id' => $lap->id],
                ['tenant_id' => $tenant->id, 'company_id' => $company->id, 'quantity' => '1.000000', 'scrap_percentage' => '0.0000']
            );
        }
        if ($mon) {
            BomItem::firstOrCreate(
                ['bom_id' => $bom->id, 'product_id' => $mon->id],
                ['tenant_id' => $tenant->id, 'company_id' => $company->id, 'quantity' => '1.000000', 'scrap_percentage' => '0.0000']
            );
        }
        if ($chair) {
            BomItem::firstOrCreate(
                ['bom_id' => $bom->id, 'product_id' => $chair->id],
                ['tenant_id' => $tenant->id, 'company_id' => $company->id, 'quantity' => '1.000000', 'scrap_percentage' => '0.0000']
            );
        }

        if ($warehouse) {
            $prodOrder = ProductionOrder::firstOrCreate(
                ['company_id' => $company->id, 'order_number' => 'MO-2026-0001'],
                [
                    'tenant_id' => $tenant->id,
                    'bom_id' => $bom->id,
                    'finished_product_id' => $bundleProduct->id,
                    'source_warehouse_id' => $warehouse->id,
                    'destination_warehouse_id' => $warehouse->id,
                    'target_quantity' => '5.000000',
                    'produced_quantity' => '0.000000',
                    'total_material_cost' => '0.000000',
                    'unit_material_cost' => '0.000000',
                    'status' => 'draft',
                    'start_date' => '2026-09-15',
                    'notes' => 'Batch assembly of 5 executive workstation sets.',
                ]
            );

            if ($lap) {
                ProductionOrderItem::firstOrCreate(
                    ['production_order_id' => $prodOrder->id, 'product_id' => $lap->id],
                    ['tenant_id' => $tenant->id, 'company_id' => $company->id, 'planned_quantity' => '5.000000', 'consumed_quantity' => '0.000000']
                );
            }
            if ($mon) {
                ProductionOrderItem::firstOrCreate(
                    ['production_order_id' => $prodOrder->id, 'product_id' => $mon->id],
                    ['tenant_id' => $tenant->id, 'company_id' => $company->id, 'planned_quantity' => '5.000000', 'consumed_quantity' => '0.000000']
                );
            }
            if ($chair) {
                ProductionOrderItem::firstOrCreate(
                    ['production_order_id' => $prodOrder->id, 'product_id' => $chair->id],
                    ['tenant_id' => $tenant->id, 'company_id' => $company->id, 'planned_quantity' => '5.000000', 'consumed_quantity' => '0.000000']
                );
            }
        }

        // 3. Trade: Wholesale Tiered Price List
        $priceList = PriceList::firstOrCreate(
            ['company_id' => $company->id, 'code' => 'PL-WHOLESALE-VIP'],
            [
                'tenant_id' => $tenant->id,
                'name' => 'VIP Corporate Wholesale Tier (قائمة أسعار الجملة لكبار العملاء)',
                'name_ar' => 'قائمة أسعار الجملة لكبار العملاء',
                'currency' => 'SAR',
                'is_default' => true,
                'is_active' => true,
            ]
        );

        if ($lap) {
            PriceListItem::firstOrCreate(
                ['price_list_id' => $priceList->id, 'product_id' => $lap->id, 'min_quantity' => '1.000000'],
                ['tenant_id' => $tenant->id, 'company_id' => $company->id, 'price' => '4200.000000', 'discount_percentage' => '0.0000']
            );
            PriceListItem::firstOrCreate(
                ['price_list_id' => $priceList->id, 'product_id' => $lap->id, 'min_quantity' => '10.000000'],
                ['tenant_id' => $tenant->id, 'company_id' => $company->id, 'price' => '4200.000000', 'discount_percentage' => '5.0000']
            );
            PriceListItem::firstOrCreate(
                ['price_list_id' => $priceList->id, 'product_id' => $lap->id, 'min_quantity' => '50.000000'],
                ['tenant_id' => $tenant->id, 'company_id' => $company->id, 'price' => '4200.000000', 'discount_percentage' => '10.0000']
            );
        }

        // 4. Contracting: Project Progress Claim with 5% Retention
        $project = Project::where('company_id', $company->id)->first();
        if ($project) {
            $claim = ContractingClaim::firstOrCreate(
                ['company_id' => $company->id, 'claim_number' => 'CLM-2026-001'],
                [
                    'tenant_id' => $tenant->id,
                    'project_id' => $project->id,
                    'customer_id' => $party2->id,
                    'claim_date' => '2026-09-10',
                    'contract_value' => '500000.000000',
                    'previous_billed_amount' => '0.000000',
                    'current_work_amount' => '75000.000000',
                    'retention_rate' => '0.0500',
                    'retention_amount' => '3750.000000',
                    'net_claim_amount' => '71250.000000',
                    'tax_amount' => '7125.000000',
                    'total_amount' => '78375.000000',
                    'status' => 'draft',
                    'notes' => 'Claim #1: Foundation engineering & architectural baseline completion.',
                ]
            );

            ContractingClaimItem::firstOrCreate(
                ['claim_id' => $claim->id, 'work_description' => 'Foundation Engineering & Excavation Milestone'],
                [
                    'tenant_id' => $tenant->id,
                    'company_id' => $company->id,
                    'scheduled_value' => '150000.000000',
                    'previous_percentage' => '0.0000',
                    'current_percentage' => '0.5000',
                    'current_amount' => '75000.000000',
                ]
            );
        }
    }
}
