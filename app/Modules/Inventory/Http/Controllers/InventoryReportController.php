<?php

namespace App\Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\Models\ProductCategory;
use App\Modules\Inventory\Models\Warehouse;
use App\Modules\Inventory\Queries\InventoryValuationQuery;
use App\Shared\Context\CurrentCompany;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InventoryReportController extends Controller
{
    public function valuation(Request $request, InventoryValuationQuery $query): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $filters = [
            'warehouse_id' => $request->warehouse_id,
            'category_id' => $request->category_id,
            'search' => $request->search,
        ];

        $reportData = $query->execute($filters);

        $warehouses = Warehouse::where('company_id', $companyId)->get(['id', 'code', 'name']);
        $categories = ProductCategory::where(function ($q) use ($companyId): void {
            $q->where('company_id', $companyId)->orWhereNull('company_id');
        })->get(['id', 'code', 'name']);

        return Inertia::render('Inventory/Reports/Valuation', [
            'report' => $reportData,
            'warehouses' => $warehouses,
            'categories' => $categories,
            'filters' => $filters,
        ]);
    }
}
