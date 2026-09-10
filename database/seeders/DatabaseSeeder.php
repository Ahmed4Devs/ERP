<?php

namespace Database\Seeders;

use App\Models\User;
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
            ['name' => 'accounting.invoice.view', 'description' => 'View Accounting Invoices', 'module' => 'Accounting'],
            ['name' => 'accounting.invoice.post', 'description' => 'Post Accounting Invoices', 'module' => 'Accounting'],
        ];

        $permissionModels = [];
        foreach ($permissions as $p) {
            $permissionModels[$p['name']] = Permission::firstOrCreate(
                ['name' => $p['name']],
                ['description' => $p['description'], 'module' => $p['module']]
            );
        }

        // 2. Setup Tenant A: "Al-Amal Group" (مجموعة الأمل)
        $tenantA = Tenant::create([
            'name' => 'Al-Amal Group (مجموعة الأمل)',
            'slug' => 'al-amal',
            'status' => 'active',
            'settings' => ['theme' => 'corporate'],
        ]);

        $companyA1 = Company::create([
            'tenant_id' => $tenantA->id,
            'name' => 'Al-Amal Trading Est. (مؤسسة الأمل للتجارة)',
            'legal_name' => 'Al-Amal Commercial Trading LLC',
            'tax_number' => '300123456700003',
            'currency' => 'SAR',
            'status' => 'active',
        ]);

        $branchA1 = Branch::create([
            'tenant_id' => $tenantA->id,
            'company_id' => $companyA1->id,
            'name' => 'Riyadh Main HQ (فرع الرياض الرئيسي)',
            'code' => 'BR-RUH-01',
            'is_headquarters' => true,
            'status' => 'active',
        ]);

        $branchA2 = Branch::create([
            'tenant_id' => $tenantA->id,
            'company_id' => $companyA1->id,
            'name' => 'Dammam Showroom (معرض الدمام)',
            'code' => 'BR-DMM-01',
            'is_headquarters' => false,
            'status' => 'active',
        ]);

        $companyA2 = Company::create([
            'tenant_id' => $tenantA->id,
            'name' => 'Al-Amal Logistics (شركة الأمل للخدمات اللوجستية)',
            'legal_name' => 'Al-Amal Transport & Logistics Co.',
            'tax_number' => '300987654300003',
            'currency' => 'SAR',
            'status' => 'active',
        ]);

        $branchA3 = Branch::create([
            'tenant_id' => $tenantA->id,
            'company_id' => $companyA2->id,
            'name' => 'Jeddah Port Hub (مركز ميناء جدة)',
            'code' => 'BR-JED-01',
            'is_headquarters' => true,
            'status' => 'active',
        ]);

        // Users for Tenant A
        $userA1 = User::create([
            'name' => 'Ahmed Al-Amal (أحمد الأمل)',
            'email' => 'admin@alamal.com',
            'password' => Hash::make('password123'),
            'locale' => 'ar',
            'email_verified_at' => now(),
        ]);

        $userA2 = User::create([
            'name' => 'Sarah Al-Mansoor (سارة المنصور)',
            'email' => 'accountant@alamal.com',
            'password' => Hash::make('password123'),
            'locale' => 'ar',
            'email_verified_at' => now(),
        ]);

        // Roles for Tenant A
        $roleAdminA = Role::create([
            'tenant_id' => $tenantA->id,
            'name' => 'Super Administrator (مدير النظام الأعلى)',
            'slug' => 'super-admin',
            'is_system' => true,
        ]);
        $roleAdminA->permissions()->sync(array_values(array_map(fn ($m) => $m->id, $permissionModels)));

        // Memberships for Tenant A
        $membershipA1 = Membership::create([
            'user_id' => $userA1->id,
            'tenant_id' => $tenantA->id,
            'default_company_id' => $companyA1->id,
            'is_owner' => true,
            'status' => 'active',
        ]);
        $membershipA1->roles()->attach($roleAdminA->id);

        $membershipA2 = Membership::create([
            'user_id' => $userA2->id,
            'tenant_id' => $tenantA->id,
            'default_company_id' => $companyA1->id,
            'is_owner' => false,
            'status' => 'active',
        ]);

        // Master Data Parties for Tenant A
        $partyA1 = Party::create([
            'tenant_id' => $tenantA->id,
            'name' => 'Al-Safwa Commercial Group',
            'name_ar' => 'مجموعة الصفوة التجارية',
            'type' => 'customer',
            'tax_id' => '310456789000003',
            'email' => 'info@safwa-group.sa',
            'phone' => '+966114567890',
            'status' => 'active',
        ]);

        CustomerProfile::create([
            'tenant_id' => $tenantA->id,
            'company_id' => $companyA1->id,
            'party_id' => $partyA1->id,
            'credit_limit' => 50000.00,
            'payment_terms_days' => 30,
            'currency' => 'SAR',
            'is_active' => true,
        ]);

        $partyA2 = Party::create([
            'tenant_id' => $tenantA->id,
            'name' => 'Riyadh General Contracting',
            'name_ar' => 'شركة مقاولات الرياض العامة',
            'type' => 'customer',
            'tax_id' => '310987654000003',
            'email' => 'contact@riyadhcontracting.com',
            'phone' => '+966112345678',
            'status' => 'active',
        ]);

        CustomerProfile::create([
            'tenant_id' => $tenantA->id,
            'company_id' => $companyA1->id,
            'party_id' => $partyA2->id,
            'credit_limit' => 120000.00,
            'payment_terms_days' => 45,
            'currency' => 'SAR',
            'is_active' => true,
        ]);

        // 3. Setup Tenant B: "Al-Binaa Holding" (شركة البناء القابضة) - For Isolation Testing
        $tenantB = Tenant::create([
            'name' => 'Al-Binaa Holding (شركة البناء القابضة)',
            'slug' => 'al-binaa',
            'status' => 'active',
            'settings' => ['theme' => 'industrial'],
        ]);

        $companyB1 = Company::create([
            'tenant_id' => $tenantB->id,
            'name' => 'Al-Binaa Heavy Industries (البناء للصناعات الثقيلة)',
            'legal_name' => 'Al-Binaa Industrial Corporation',
            'tax_number' => '311122233300003',
            'currency' => 'USD',
            'status' => 'active',
        ]);

        $branchB1 = Branch::create([
            'tenant_id' => $tenantB->id,
            'company_id' => $companyB1->id,
            'name' => 'Dubai Regional Hub (المقر الإقليمي بدبي)',
            'code' => 'BR-DXB-01',
            'is_headquarters' => true,
            'status' => 'active',
        ]);

        $userB1 = User::create([
            'name' => 'Khalid Al-Binaa (خالد البناء)',
            'email' => 'admin@albinaa.com',
            'password' => Hash::make('password123'),
            'locale' => 'en',
            'email_verified_at' => now(),
        ]);

        $membershipB1 = Membership::create([
            'user_id' => $userB1->id,
            'tenant_id' => $tenantB->id,
            'default_company_id' => $companyB1->id,
            'is_owner' => true,
            'status' => 'active',
        ]);

        $partyB1 = Party::create([
            'tenant_id' => $tenantB->id,
            'name' => 'Gulf Mega Projects Corp',
            'name_ar' => 'شركة مشاريع الخليج الكبرى',
            'type' => 'customer',
            'tax_id' => '100200300400003',
            'email' => 'procurement@gulfmegaprojects.com',
            'phone' => '+97143219876',
            'status' => 'active',
        ]);

        CustomerProfile::create([
            'tenant_id' => $tenantB->id,
            'company_id' => $companyB1->id,
            'party_id' => $partyB1->id,
            'credit_limit' => 500000.00,
            'payment_terms_days' => 60,
            'currency' => 'USD',
            'is_active' => true,
        ]);
    }
}
