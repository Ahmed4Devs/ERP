<?php

namespace App\Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Queries\CustomerStatementQuery;
use App\Modules\MasterData\Models\Party;
use App\Modules\Platform\Services\CsvExportService;
use App\Modules\Purchasing\Queries\VendorStatementQuery;
use App\Shared\Context\CurrentCompany;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StatementController extends Controller
{
    public function customerStatement(Request $request, CustomerStatementQuery $query): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $customerId = $request->customer_id;
        $startDate = $request->start_date ?: now()->startOfMonth()->toDateString();
        $endDate = $request->end_date ?: now()->toDateString();

        $customers = Party::whereHas('customerProfiles', fn ($q) => $q->where('company_id', $companyId))
            ->orWhere('type', 'customer')
            ->orderBy('name', 'asc')
            ->get(['id', 'name', 'name_ar', 'tax_id', 'phone']);

        $report = null;
        if ($customerId) {
            $report = $query->execute($customerId, $startDate, $endDate);
        } elseif ($customers->isNotEmpty()) {
            $customerId = $customers->first()->id;
            $report = $query->execute($customerId, $startDate, $endDate);
        }

        return Inertia::render('Accounting/Reports/CustomerStatement', [
            'report' => $report,
            'customers' => $customers,
            'filters' => [
                'customer_id' => $customerId,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'company' => $currentCompany->get(),
        ]);
    }

    public function exportCustomerStatement(
        Request $request,
        CustomerStatementQuery $query,
        CsvExportService $csvService
    ): StreamedResponse {
        $customerId = $request->customer_id;
        $startDate = $request->start_date ?: now()->startOfMonth()->toDateString();
        $endDate = $request->end_date ?: now()->toDateString();

        if (! $customerId) {
            abort(400, 'Customer ID is required for export.');
        }

        $report = $query->execute($customerId, $startDate, $endDate);
        $customerName = $report['customer'] ? ($report['customer']->name_ar ?: $report['customer']->name) : 'Customer';

        $headers = [
            'التاريخ / Date',
            'نوع الحركة / Type',
            'رقم المرجع / Reference',
            'مدين (فواتير) / Debit',
            'دائن (سداد) / Credit',
            'الرصيد التراكمي / Running Balance',
            'ملاحظات / Notes',
        ];

        $rows = [];
        // Opening balance row
        $rows[] = [
            $startDate,
            'رصيد افتتاحي / Opening Balance',
            '-',
            '-',
            '-',
            number_format((float) $report['opening_balance'], 2),
            'الرصيد السابق قبل الفترة',
        ];

        foreach ($report['transactions'] as $tx) {
            $rows[] = [
                $tx['date'],
                $tx['type_ar'] ?: $tx['type'],
                $tx['reference'],
                number_format((float) $tx['debit'], 2),
                number_format((float) $tx['credit'], 2),
                number_format((float) $tx['balance'], 2),
                $tx['notes'] ?? '',
            ];
        }

        // Closing balance summary row
        $rows[] = [
            $endDate,
            'الرصيد الختامي / Closing Balance',
            'Total Movements',
            number_format((float) $report['total_debit'], 2),
            number_format((float) $report['total_credit'], 2),
            number_format((float) $report['closing_balance'], 2),
            'صافي الرصيد المستحق',
        ];

        $slug = preg_replace('/[^A-Za-z0-9_\-]/', '_', $report['customer']?->name ?? 'customer');

        return $csvService->stream("customer-statement-{$slug}-{$startDate}-to-{$endDate}.csv", $headers, $rows);
    }

    public function vendorStatement(Request $request, VendorStatementQuery $query): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $vendorId = $request->vendor_id;
        $startDate = $request->start_date ?: now()->startOfMonth()->toDateString();
        $endDate = $request->end_date ?: now()->toDateString();

        $vendors = Party::whereHas('vendorProfiles', fn ($q) => $q->where('company_id', $companyId))
            ->orWhere('type', 'vendor')
            ->orderBy('name', 'asc')
            ->get(['id', 'name', 'name_ar', 'tax_id', 'phone']);

        $report = null;
        if ($vendorId) {
            $report = $query->execute($vendorId, $startDate, $endDate);
        } elseif ($vendors->isNotEmpty()) {
            $vendorId = $vendors->first()->id;
            $report = $query->execute($vendorId, $startDate, $endDate);
        }

        return Inertia::render('Accounting/Reports/VendorStatement', [
            'report' => $report,
            'vendors' => $vendors,
            'filters' => [
                'vendor_id' => $vendorId,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'company' => $currentCompany->get(),
        ]);
    }

    public function exportVendorStatement(
        Request $request,
        VendorStatementQuery $query,
        CsvExportService $csvService
    ): StreamedResponse {
        $vendorId = $request->vendor_id;
        $startDate = $request->start_date ?: now()->startOfMonth()->toDateString();
        $endDate = $request->end_date ?: now()->toDateString();

        if (! $vendorId) {
            abort(400, 'Vendor ID is required for export.');
        }

        $report = $query->execute($vendorId, $startDate, $endDate);

        $headers = [
            'التاريخ / Date',
            'نوع الحركة / Type',
            'رقم المرجع / Reference',
            'مدين (سداد) / Debit',
            'دائن (فواتير) / Credit',
            'الرصيد التراكمي / Running Balance',
            'ملاحظات / Notes',
        ];

        $rows = [];
        // Opening balance row
        $rows[] = [
            $startDate,
            'رصيد افتتاحي / Opening Balance',
            '-',
            '-',
            '-',
            number_format((float) $report['opening_balance'], 2),
            'الرصيد السابق قبل الفترة',
        ];

        foreach ($report['transactions'] as $tx) {
            $rows[] = [
                $tx['date'],
                $tx['type_ar'] ?: $tx['type'],
                $tx['reference'],
                number_format((float) $tx['debit'], 2),
                number_format((float) $tx['credit'], 2),
                number_format((float) $tx['balance'], 2),
                $tx['notes'] ?? '',
            ];
        }

        // Closing balance summary row
        $rows[] = [
            $endDate,
            'الرصيد الختامي / Closing Balance',
            'Total Movements',
            number_format((float) $report['total_debit'], 2),
            number_format((float) $report['total_credit'], 2),
            number_format((float) $report['closing_balance'], 2),
            'صافي الرصيد المستحق للمورد',
        ];

        $slug = preg_replace('/[^A-Za-z0-9_\-]/', '_', $report['vendor']?->name ?? 'vendor');

        return $csvService->stream("vendor-statement-{$slug}-{$startDate}-to-{$endDate}.csv", $headers, $rows);
    }
}
