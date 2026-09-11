<?php

namespace App\Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Models\FiscalPeriod;
use App\Modules\Accounting\Services\CloseFiscalPeriodAction;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FiscalPeriodController extends Controller
{
    public function index(): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $periods = FiscalPeriod::where('company_id', $companyId)
            ->orderBy('start_date', 'desc')
            ->get();

        return Inertia::render('Accounting/Periods/Index', [
            'periods' => $periods,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $companyId = app(CurrentCompany::class)->id();
        $tenantId = app(CurrentTenant::class)->id();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
        ]);

        FiscalPeriod::create([
            'tenant_id' => $tenantId,
            'company_id' => $companyId,
            'name' => $validated['name'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'is_locked' => false,
        ]);

        return redirect()->back()->with('success', 'Fiscal period created successfully.');
    }

    public function toggleLock(FiscalPeriod $fiscalPeriod, CloseFiscalPeriodAction $action): RedirectResponse
    {
        $action->execute($fiscalPeriod, ! $fiscalPeriod->is_locked);

        $state = $fiscalPeriod->is_locked ? 'locked' : 'unlocked';

        return redirect()->back()->with('success', "Fiscal period '{$fiscalPeriod->name}' is now {$state}.");
    }
}
