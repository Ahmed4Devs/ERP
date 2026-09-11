<?php

namespace App\Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Models\Account;
use App\Shared\Context\CurrentCompany;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AccountController extends Controller
{
    public function index(Request $request): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $accounts = Account::where('company_id', $companyId)
            ->when($request->type, fn ($q) => $q->where('type', $request->type))
            ->when($request->search, function ($q, $search): void {
                $q->where(function ($sq) use ($search): void {
                    $sq->where('name', 'ilike', "%{$search}%")
                        ->orWhere('name_ar', 'ilike', "%{$search}%")
                        ->orWhere('code', 'ilike', "%{$search}%");
                });
            })
            ->orderBy('code', 'asc')
            ->get();

        return Inertia::render('Accounting/Accounts/Index', [
            'accounts' => $accounts,
            'filters' => [
                'type' => $request->type,
                'search' => $request->search,
            ],
        ]);
    }
}
