<?php

namespace App\Http\Middleware;

use App\Modules\Organization\Models\Branch;
use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Services\ModuleRegistry;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $currentTenant = app(CurrentTenant::class);
        $currentCompany = app(CurrentCompany::class);
        $user = $request->user();

        $companies = [];
        $branches = [];
        $tenants = [];

        if ($user && $currentTenant->check()) {
            $companies = Company::where('tenant_id', $currentTenant->id())
                ->where('status', 'active')
                ->get(['id', 'name', 'currency', 'tax_number']);

            if ($currentCompany->check()) {
                $branches = Branch::where('company_id', $currentCompany->id())
                    ->where('status', 'active')
                    ->get(['id', 'name', 'code']);
            }

            $tenants = $user->tenants()->get(['tenants.id', 'tenants.name', 'tenants.slug']);
        }

        return [
            ...parent::share($request),
            'name' => config('app.name', 'ERP'),
            'locale' => app()->getLocale(),
            'direction' => app()->getLocale() === 'ar' ? 'rtl' : 'ltr',
            'auth' => [
                'user' => $user,
                'tenant' => $currentTenant->get(),
                'company' => $currentCompany->get(),
                'branch' => $currentCompany->branch(),
                'companies' => $companies,
                'branches' => $branches,
                'tenants' => $tenants,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'enabledModules' => app(ModuleRegistry::class)->getEnabledModulesForCompany($currentCompany->get()),
        ];
    }
}
