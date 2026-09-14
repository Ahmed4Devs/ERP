<?php

namespace App\Modules\Platform\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Platform\Services\ModuleRegistry;
use App\Shared\Context\CurrentCompany;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ModuleController extends Controller
{
    public function __construct(
        protected ModuleRegistry $moduleRegistry,
        protected CurrentCompany $currentCompany
    ) {}

    /**
     * Display the Module Activation & Feature Flags Management screen.
     */
    public function index(Request $request): Response
    {
        $company = $this->currentCompany->get();

        $allModules = $this->moduleRegistry->getAllModules();
        $presets = $this->moduleRegistry->getPresets();
        $enabledModules = $this->moduleRegistry->getEnabledModulesForCompany($company);

        return Inertia::render('Platform/Modules/Index', [
            'modules' => array_values($allModules),
            'presets' => array_values($presets),
            'enabledModules' => $enabledModules,
            'company' => $company ? [
                'id' => $company->id,
                'name' => $company->name,
                'legal_name' => $company->legal_name,
            ] : null,
        ]);
    }

    /**
     * Update active modules for the current company.
     */
    public function update(Request $request): RedirectResponse
    {
        $company = $this->currentCompany->get();

        if (! $company) {
            return back()->with('error', 'يجب اختيار منشأة لتعديل إعدادات الموديولات.');
        }

        $validated = $request->validate([
            'enabled_modules' => ['required', 'array'],
            'enabled_modules.*' => ['string'],
        ]);

        $this->moduleRegistry->updateCompanyModules($company, $validated['enabled_modules']);

        return back()->with('success', 'تم حفظ وتحديث إعدادات الموديولات المفعلة للمنشأة بنجاح.');
    }

    /**
     * Apply an industry bundle preset to the current company.
     */
    public function applyPreset(Request $request): RedirectResponse
    {
        $company = $this->currentCompany->get();

        if (! $company) {
            return back()->with('error', 'يجب اختيار منشأة لتطبيق الباقة.');
        }

        $validated = $request->validate([
            'preset' => ['required', 'string'],
        ]);

        try {
            $this->moduleRegistry->applyPreset($company, $validated['preset']);
            $presetName = $this->moduleRegistry->getPresets()[$validated['preset']]['name_ar'] ?? $validated['preset'];

            return back()->with('success', "تم تطبيق ({$presetName}) وتحديث موديولات المنشأة بنجاح.");
        } catch (\InvalidArgumentException $e) {
            return back()->with('error', $e->getMessage());
        }
    }
}
