<?php

namespace App\Modules\Platform\Services;

use App\Modules\Organization\Models\Company;

class ModuleRegistry
{
    /**
     * Complete Catalog of ERP Modules.
     */
    protected array $modules = [
        'financials' => [
            'key' => 'financials',
            'name_ar' => 'المحاسبة والمالية العامة',
            'name_en' => 'Core Financials & GL',
            'description_ar' => 'دليل الحسابات، القيود اليومية، القوائم المالية، إقرارات ضريبة القيمة المضافة ZATCA، أسعار صرف SAMA، ومخصص الزكاة الشرعية.',
            'category' => 'core',
            'category_ar' => 'أساسي',
            'is_core' => true, // Cannot be disabled
            'icon' => 'Landmark',
            'default_route' => '/accounts',
        ],
        'sales' => [
            'key' => 'sales',
            'name_ar' => 'المبيعات وإدارة العملاء (CRM)',
            'name_en' => 'Sales & CRM',
            'description_ar' => 'عروض الأسعار، أوامر البيع، فواتير الخدمات، سندات القبض، الإشعارات الدائنة، وإدارة الفرص التسويقية.',
            'category' => 'commerce',
            'category_ar' => 'تجاري',
            'is_core' => false,
            'icon' => 'ShoppingBag',
            'default_route' => '/sales/orders',
        ],
        'purchasing' => [
            'key' => 'purchasing',
            'name_ar' => 'المشتريات وإدارة الموردين',
            'name_en' => 'Purchasing & Vendors',
            'description_ar' => 'طلبات الشراء الداخلية (PR)، أوامر الشراء (PO)، فواتير وسندات صرف الموردين، وبوابة الموردين الرقمية.',
            'category' => 'commerce',
            'category_ar' => 'تجاري',
            'is_core' => false,
            'icon' => 'Receipt',
            'default_route' => '/purchase-orders',
        ],
        'inventory' => [
            'key' => 'inventory',
            'name_ar' => 'المستودعات والمخزون والتكاليف',
            'name_en' => 'Inventory & Logistics',
            'description_ar' => 'سجل المنتجات والأصناف، استلام البضائع (GRN)، بيان جمركي فاسح وتكاليف الاستيراد (Landed Costs)، الجرد والتحويلات.',
            'category' => 'logistics',
            'category_ar' => 'لوجستي',
            'is_core' => false,
            'icon' => 'Boxes',
            'default_route' => '/inventory/products',
        ],
        'hr_payroll' => [
            'key' => 'hr_payroll',
            'name_ar' => 'الموارد البشرية والرواتب (WPS)',
            'name_en' => 'HR & Payroll',
            'description_ar' => 'سجل الموظفين، الحضور والإجازات، مكافأة نهاية الخدمة، التأمينات (GOSI)، ومسيرات الرواتب ونظام حماية الأجور (مدد WPS).',
            'category' => 'administration',
            'category_ar' => 'إداري',
            'is_core' => false,
            'icon' => 'Users',
            'default_route' => '/hr/employees',
        ],
        'fixed_assets' => [
            'key' => 'fixed_assets',
            'name_ar' => 'الأصول الثابتة والإهلاك الزكوي',
            'name_en' => 'Fixed Assets',
            'description_ar' => 'سجل الأصول الرأسمالية، جداول الإهلاك المحاسبي، إهلاك هيئة الزكاة والضريبة والجمارك (المادة 17)، واستبعاد وتخريد الأصول.',
            'category' => 'specialized',
            'category_ar' => 'تخصصي',
            'is_core' => false,
            'icon' => 'Layers',
            'default_route' => '/assets/register',
        ],
        'manufacturing' => [
            'key' => 'manufacturing',
            'name_ar' => 'التصنيع والإنتاج وقوائم المواد (BOM)',
            'name_en' => 'Manufacturing & Production',
            'description_ar' => 'هياكل وقوائم المواد (BOM)، أوامر الإنتاج والتشغيل، واحتساب تكاليف المواد المباشرة والتشغيلية ومرتجعات الإنتاج.',
            'category' => 'specialized',
            'category_ar' => 'تخصصي',
            'is_core' => false,
            'icon' => 'Factory',
            'default_route' => '/manufacturing/orders',
        ],
        'retail_pos' => [
            'key' => 'retail_pos',
            'name_ar' => 'نقاط البيع والتجزئة (Retail POS)',
            'name_en' => 'Point of Sale (POS)',
            'description_ar' => 'محطات البيع ونقاط الكاشير السريع، ورديات الكاشير، وإصدار الفواتير الإلكترونية المبسطة المتوافقة مع زاتكا.',
            'category' => 'specialized',
            'category_ar' => 'تخصصي',
            'is_core' => false,
            'icon' => 'Store',
            'default_route' => '/retail/terminals',
        ],
        'contracting' => [
            'key' => 'contracting',
            'name_ar' => 'المقاولات والمستخلصات الإنشائية',
            'name_en' => 'Contracting & Progress Claims',
            'description_ar' => 'المستخلصات الجارية للمشاريع، استهلاك الدفعة المقدمة، ضمان الأعمال المحتجز (1250)، وإصدار فواتير المشاريع المعتمدة.',
            'category' => 'specialized',
            'category_ar' => 'تخصصي',
            'is_core' => false,
            'icon' => 'HardHat',
            'default_route' => '/contracting/claims',
        ],
        'projects_support' => [
            'key' => 'projects_support',
            'name_ar' => 'المشاريع وبطاقات الوقت والدعم الفني',
            'name_en' => 'Projects & Service Contracts',
            'description_ar' => 'متابعة المشاريع وإنجاز المهام، بطاقات الوقت، العقود الدورية للعملاء، وتذاكر خدمة العملاء والدعم الفني.',
            'category' => 'services',
            'category_ar' => 'خدمات',
            'is_core' => false,
            'icon' => 'FolderKanban',
            'default_route' => '/projects',
        ],
        'governance' => [
            'key' => 'governance',
            'name_ar' => 'الحوكمة ومصفوفة الصلاحيات (DOA)',
            'name_en' => 'Governance & Approvals',
            'description_ar' => 'مصفوفة تفويض الصلاحيات (DOA)، دورات اعتماد المدفوعات والطلبات وسجل التدقيق والرقابة (Audit Trail).',
            'category' => 'governance',
            'category_ar' => 'حوكمة',
            'is_core' => false,
            'icon' => 'Scale',
            'default_route' => '/governance/approvals',
        ],
    ];

    /**
     * Commercial Pre-Packaged Industry Bundles.
     */
    protected array $presets = [
        'retail' => [
            'key' => 'retail',
            'name_ar' => 'باقة المتاجر والتجزئة والسوبرماركت',
            'name_en' => 'Retail & POS Bundle',
            'description_ar' => 'المحاسبة، المبيعات، المخزون، ونقاط البيع (POS). مصممة للمعارض ومتاجر التجزئة ومحلات التموين.',
            'icon' => 'Store',
            'modules' => ['financials', 'sales', 'inventory', 'retail_pos'],
        ],
        'trading' => [
            'key' => 'trading',
            'name_ar' => 'باقة الشركات التجارية وتجارة الجملة',
            'name_en' => 'Trading & Distribution Bundle',
            'description_ar' => 'المحاسبة، المبيعات، المشتريات، المستودعات، والموارد البشرية. مثالية للمستوردين وموزعي الجملة.',
            'icon' => 'Truck',
            'modules' => ['financials', 'sales', 'purchasing', 'inventory', 'hr_payroll', 'governance'],
        ],
        'contracting' => [
            'key' => 'contracting',
            'name_ar' => 'باقة المقاولات والإنشاءات الهندسية',
            'name_en' => 'Contracting & Construction Bundle',
            'description_ar' => 'المحاسبة، المشتريات، المقاولات، المشاريع، الأصول الثابتة، والحوكمة. للشركات الإنشائية والمطورين.',
            'icon' => 'HardHat',
            'modules' => ['financials', 'purchasing', 'contracting', 'projects_support', 'fixed_assets', 'hr_payroll', 'governance'],
        ],
        'manufacturing' => [
            'key' => 'manufacturing',
            'name_ar' => 'باقة المصانع والشركات الصناعية',
            'name_en' => 'Industrial & Manufacturing Bundle',
            'description_ar' => 'المحاسبة، المشتريات، المستودعات، خطوط التصنيع والإنتاج (BOM)، والأصول الثابتة. للمصانع والورش.',
            'icon' => 'Factory',
            'modules' => ['financials', 'purchasing', 'inventory', 'manufacturing', 'fixed_assets', 'hr_payroll', 'governance'],
        ],
        'services' => [
            'key' => 'services',
            'name_ar' => 'باقة الشركات الخدمية والاستشارية',
            'name_en' => 'Professional Services Bundle',
            'description_ar' => 'المحاسبة، المبيعات، الموارد البشرية، إدارة المشاريع والدعم الفني. للمكاتب الهندسية والشركات الاستشارية.',
            'icon' => 'FolderKanban',
            'modules' => ['financials', 'sales', 'hr_payroll', 'projects_support', 'governance'],
        ],
        'all' => [
            'key' => 'all',
            'name_ar' => 'الباقة الشاملة المتكاملة (Enterprise Full)',
            'name_en' => 'Full Enterprise Suite',
            'description_ar' => 'تفعيل جميع موديولات النظام الـ 11 بلا استثناء لكبرى المجموعات والشركات القابضة متعددة الأنشطة.',
            'icon' => 'ShieldCheck',
            'modules' => [
                'financials', 'sales', 'purchasing', 'inventory', 'hr_payroll',
                'fixed_assets', 'manufacturing', 'retail_pos', 'contracting',
                'projects_support', 'governance',
            ],
        ],
    ];

    /**
     * Get all registered modules.
     *
     * @return array<string, array>
     */
    public function getAllModules(): array
    {
        return $this->modules;
    }

    /**
     * Get all industry preset packages.
     *
     * @return array<string, array>
     */
    public function getPresets(): array
    {
        return $this->presets;
    }

    /**
     * Determine enabled modules for a company.
     *
     * If the company has not configured custom modules yet, all registered modules are
     * considered active to guarantee 100% zero-regression across historical fixtures and existing test runs.
     * Core financials is always enforced.
     *
     * @return array<string>
     */
    public function getEnabledModulesForCompany(?Company $company): array
    {
        if (! $company) {
            return array_keys($this->modules);
        }

        $settings = $company->settings ?? [];

        // If company has explicit module settings, use them (and always enforce financials)
        if (isset($settings['enabled_modules']) && is_array($settings['enabled_modules'])) {
            $enabled = array_values(array_unique(array_merge(['financials'], $settings['enabled_modules'])));

            // Filter to only known valid module keys
            return array_values(array_intersect($enabled, array_keys($this->modules)));
        }

        // Default: all modules are available until explicitly customized
        return array_keys($this->modules);
    }

    /**
     * Check if a specific module is enabled for a company.
     */
    public function isModuleEnabled(string $moduleKey, ?Company $company): bool
    {
        // Core financials cannot be disabled
        if ($moduleKey === 'financials') {
            return true;
        }

        $enabledModules = $this->getEnabledModulesForCompany($company);

        return in_array($moduleKey, $enabledModules, true);
    }

    /**
     * Update active modules for a company.
     *
     * @param  array<string>  $moduleKeys
     */
    public function updateCompanyModules(Company $company, array $moduleKeys): Company
    {
        // Enforce Core Financials
        if (! in_array('financials', $moduleKeys, true)) {
            $moduleKeys[] = 'financials';
        }

        // Keep only valid module keys
        $validKeys = array_values(array_intersect($moduleKeys, array_keys($this->modules)));

        $settings = $company->settings ?? [];
        $settings['enabled_modules'] = $validKeys;
        $settings['modules_updated_at'] = now()->toIso8601String();

        $company->settings = $settings;
        $company->save();

        return $company;
    }

    /**
     * Apply a pre-packaged industry preset to a company.
     */
    public function applyPreset(Company $company, string $presetKey): Company
    {
        if (! isset($this->presets[$presetKey])) {
            throw new \InvalidArgumentException("Unknown industry preset [{$presetKey}].");
        }

        $moduleKeys = $this->presets[$presetKey]['modules'];

        return $this->updateCompanyModules($company, $moduleKeys);
    }
}
