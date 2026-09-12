<?php

namespace App\Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\Models\ProductCategory;
use App\Modules\Inventory\Models\Warehouse;
use App\Modules\Inventory\Queries\InventoryValuationQuery;
use App\Modules\Platform\Services\CsvExportService;
use App\Shared\Context\CurrentCompany;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

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

    public function exportValuation(
        Request $request,
        InventoryValuationQuery $query,
        CsvExportService $csvService
    ): StreamedResponse {
        $filters = [
            'warehouse_id' => $request->warehouse_id,
            'category_id' => $request->category_id,
            'search' => $request->search,
        ];

        $reportData = $query->execute($filters);

        $headers = [
            'رمز الصنف / SKU',
            'اسم الصنف / Product Name',
            'الاسم بالعربي / Name AR',
            'التصنيف / Category',
            'المستودع / Warehouse',
            'الكمية المتوفرة / Quantity on Hand',
            'متوسط التكلفة / Moving Avg Cost',
            'إجمالي القيمة / Total Value (SAR)',
        ];

        $rows = [];
        foreach ($reportData['items'] as $item) {
            $rows[] = [
                $item['sku'],
                $item['name'],
                $item['name_ar'] ?? '',
                $item['category_name'] ?? 'General',
                $item['warehouse_name'] ?? '',
                number_format((float) $item['quantity_on_hand'], 2),
                number_format((float) $item['moving_average_cost'], 2),
                number_format((float) $item['total_value'], 2),
            ];
        }

        $rows[] = [
            'إجمالي التقييم المخزني / Total Valuation',
            '',
            '',
            '',
            '',
            '',
            '',
            number_format((float) $reportData['total_valuation'], 2),
        ];

        $today = now()->toDateString();

        return $csvService->stream("inventory-valuation-{$today}.csv", $headers, $rows);
    }
}
