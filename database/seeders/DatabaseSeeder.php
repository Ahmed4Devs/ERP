<?php

namespace Database\Seeders;

use App\Models\User;
use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\FiscalPeriod;
use App\Modules\MasterData\Models\CustomerProfile;
use App\Modules\MasterData\Models\Party;
use App\Modules\Organization\Models\Branch;
use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Models\Membership;
use App\Modules\Platform\Models\Permission;
use App\Modules\Platform\Models\Role;
use App\Modules\Platform\Models\Tenant;
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
            ['code' => '1200', 'name' => 'Accounts Receivable Control', 'name_ar' => 'الذمم المدينة (العملاء)', 'type' => 'asset', 'subtype' => 'receivable', 'is_system' => true],
            ['code' => '2010', 'name' => 'Accounts Payable Control', 'name_ar' => 'الذمم الدائنة (الموردين)', 'type' => 'liability', 'subtype' => 'payable', 'is_system' => true],
            ['code' => '2150', 'name' => 'Test Tax Liability (10%)', 'name_ar' => 'مخصص ضريبة الاختبار (10%)', 'type' => 'liability', 'subtype' => 'tax_payable', 'is_system' => true],
            ['code' => '3010', 'name' => 'Share Capital', 'name_ar' => 'رأس المال المدفوع', 'type' => 'equity', 'subtype' => 'equity'],
            ['code' => '4100', 'name' => 'Consulting & Service Revenue', 'name_ar' => 'إيرادات الخدمات والاستشارات', 'type' => 'revenue', 'subtype' => 'operating_revenue'],
            ['code' => '5100', 'name' => 'General & Administrative Expenses', 'name_ar' => 'المصروفات العمومية والإدارية', 'type' => 'expense', 'subtype' => 'operating_expense'],
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
}
