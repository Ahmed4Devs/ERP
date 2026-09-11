<?php

namespace App\Modules\Platform\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Models\ServiceInvoice;
use App\Modules\Inventory\Models\Product;
use App\Modules\MasterData\Models\Party;
use App\Modules\Projects\Models\Project;
use App\Modules\Purchasing\Models\VendorBill;
use App\Modules\Retail\Models\PosSession;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $company = $currentCompany->get();
        $companyId = $currentCompany->id();
        $tenantId = app(CurrentTenant::class)->id();

        $stats = [
            'totalRevenue' => 0.0,
            'totalBills' => 0.0,
            'invoicesCount' => 0,
            'draftInvoicesCount' => 0,
            'customersCount' => 0,
            'productsCount' => 0,
            'posSessionsCount' => 0,
            'projectsCount' => 0,
            'currency' => $company?->currency ?? 'SAR',
        ];

        $recentInvoices = [];
        $recentBills = [];

        if ($companyId) {
            $stats['totalRevenue'] = (float) ServiceInvoice::where('company_id', $companyId)
                ->where('status', 'posted')
                ->sum('total');

            $stats['totalBills'] = (float) VendorBill::where('company_id', $companyId)
                ->sum('total');

            $stats['invoicesCount'] = ServiceInvoice::where('company_id', $companyId)->count();
            $stats['draftInvoicesCount'] = ServiceInvoice::where('company_id', $companyId)
                ->where('status', 'draft')
                ->count();

            $stats['productsCount'] = Product::where('company_id', $companyId)->count();

            $stats['posSessionsCount'] = PosSession::where('company_id', $companyId)
                ->where('status', 'open')
                ->count();

            $stats['projectsCount'] = Project::where('company_id', $companyId)
                ->where('status', 'in_progress')
                ->count();

            $recentInvoices = ServiceInvoice::where('company_id', $companyId)
                ->with(['party' => fn ($q) => $q->select('id', 'name', 'name_ar')])
                ->latest('date')
                ->take(5)
                ->get()
                ->map(fn ($inv) => [
                    'id' => $inv->id,
                    'invoice_number' => $inv->invoice_number,
                    'party_name' => $inv->party?->name ?? 'N/A',
                    'party_name_ar' => $inv->party?->name_ar ?? null,
                    'total' => (float) $inv->total,
                    'status' => $inv->status,
                    'currency' => $inv->currency,
                    'date' => $inv->date ? $inv->date->format('Y-m-d') : '',
                ])
                ->all();

            $recentBills = VendorBill::where('company_id', $companyId)
                ->with(['party' => fn ($q) => $q->select('id', 'name', 'name_ar')])
                ->latest('date')
                ->take(5)
                ->get()
                ->map(fn ($bill) => [
                    'id' => $bill->id,
                    'bill_number' => $bill->bill_number,
                    'party_name' => $bill->party?->name ?? 'N/A',
                    'party_name_ar' => $bill->party?->name_ar ?? null,
                    'total' => (float) $bill->total,
                    'status' => $bill->status,
                    'currency' => $bill->currency ?? 'SAR',
                    'date' => $bill->date ? $bill->date->format('Y-m-d') : '',
                ])
                ->all();
        }

        if ($tenantId) {
            $stats['customersCount'] = Party::where('tenant_id', $tenantId)
                ->whereIn('type', ['customer', 'both'])
                ->count();
        }

        return Inertia::render('dashboard', [
            'stats' => $stats,
            'recentInvoices' => $recentInvoices,
            'recentBills' => $recentBills,
        ]);
    }
}
