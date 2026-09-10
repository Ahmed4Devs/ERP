<?php

namespace App\Modules\Platform\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Organization\Models\Branch;
use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Models\Membership;
use App\Modules\Platform\Models\Tenant;
use App\Modules\Platform\Services\AuditLogger;
use App\Shared\Context\CurrentTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ContextController extends Controller
{
    public function switchTenant(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'tenant_id' => ['required', 'string', 'uuid'],
        ]);

        $user = $request->user();

        $membership = Membership::where('user_id', $user->id)
            ->where('tenant_id', $validated['tenant_id'])
            ->where('status', 'active')
            ->firstOrFail();

        session([
            'active_tenant_id' => $membership->tenant_id,
            'active_company_id' => null,
            'active_branch_id' => null,
        ]);

        AuditLogger::log(
            action: 'tenant.switched',
            entityType: Tenant::class,
            entityId: $membership->tenant_id,
            tenantId: $membership->tenant_id
        );

        return back();
    }

    public function switchCompany(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'company_id' => ['required', 'string', 'uuid'],
        ]);

        $currentTenant = app(CurrentTenant::class);

        $company = Company::where('tenant_id', $currentTenant->id())
            ->where('id', $validated['company_id'])
            ->where('status', 'active')
            ->firstOrFail();

        session([
            'active_company_id' => $company->id,
            'active_branch_id' => null,
        ]);

        AuditLogger::log(
            action: 'company.switched',
            entityType: Company::class,
            entityId: $company->id,
            companyId: $company->id
        );

        return back();
    }

    public function switchBranch(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'branch_id' => ['required', 'string', 'uuid'],
        ]);

        $activeCompanyId = session('active_company_id');

        $branch = Branch::where('company_id', $activeCompanyId)
            ->where('id', $validated['branch_id'])
            ->where('status', 'active')
            ->firstOrFail();

        session(['active_branch_id' => $branch->id]);

        return back();
    }

    public function switchLocale(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'locale' => ['required', 'string', 'in:ar,en'],
        ]);

        $locale = $validated['locale'];
        session(['locale' => $locale]);
        app()->setLocale($locale);

        if ($user = $request->user()) {
            $user->update(['locale' => $locale]);
        }

        return back();
    }
}
