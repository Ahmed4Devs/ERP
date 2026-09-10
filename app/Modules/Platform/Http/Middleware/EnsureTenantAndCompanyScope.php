<?php

namespace App\Modules\Platform\Http\Middleware;

use App\Modules\Organization\Models\Branch;
use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Models\Membership;
use App\Modules\Platform\Models\Tenant;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantAndCompanyScope
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // 1. Resolve user locale (default: ar)
        $locale = session('locale', $user?->locale ?? config('app.locale', 'ar'));
        if (! in_array($locale, ['ar', 'en'], true)) {
            $locale = 'ar';
        }
        app()->setLocale($locale);

        if (! $user) {
            return $next($request);
        }

        // 2. Resolve Active Tenant
        $sessionTenantId = session('active_tenant_id');
        $membership = null;

        if ($sessionTenantId) {
            $membership = Membership::with('tenant')
                ->where('user_id', $user->id)
                ->where('tenant_id', $sessionTenantId)
                ->where('status', 'active')
                ->first();
        }

        if (! $membership) {
            $membership = Membership::with('tenant')
                ->where('user_id', $user->id)
                ->where('status', 'active')
                ->first();

            if ($membership) {
                session(['active_tenant_id' => $membership->tenant_id]);
            }
        }

        if ($membership && $membership->tenant) {
            app(CurrentTenant::class)->set($membership->tenant);

            // 3. Resolve Active Company under Tenant
            $sessionCompanyId = session('active_company_id');
            $company = null;

            if ($sessionCompanyId) {
                $company = Company::where('tenant_id', $membership->tenant_id)
                    ->where('id', $sessionCompanyId)
                    ->where('status', 'active')
                    ->first();
            }

            if (! $company && $membership->default_company_id) {
                $company = Company::where('tenant_id', $membership->tenant_id)
                    ->where('id', $membership->default_company_id)
                    ->where('status', 'active')
                    ->first();
            }

            if (! $company) {
                $company = Company::where('tenant_id', $membership->tenant_id)
                    ->where('status', 'active')
                    ->first();
            }

            if ($company) {
                session(['active_company_id' => $company->id]);

                // 4. Resolve Active Branch under Company
                $sessionBranchId = session('active_branch_id');
                $branch = null;

                if ($sessionBranchId) {
                    $branch = Branch::where('company_id', $company->id)
                        ->where('id', $sessionBranchId)
                        ->where('status', 'active')
                        ->first();
                }

                if (! $branch) {
                    $branch = Branch::where('company_id', $company->id)
                        ->where('status', 'active')
                        ->first();
                }

                if ($branch) {
                    session(['active_branch_id' => $branch->id]);
                }

                app(CurrentCompany::class)->set($company, $branch);
            }
        }

        return $next($request);
    }
}
