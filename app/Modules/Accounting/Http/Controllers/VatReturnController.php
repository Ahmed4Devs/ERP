<?php

namespace App\Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Models\VatReturn;
use App\Modules\Accounting\Queries\VatReturnQuery;
use App\Modules\Accounting\Services\FileVatReturnAction;
use App\Modules\Localization\Services\QrCodeSvgService;
use App\Modules\Localization\Services\TafqeetService;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class VatReturnController extends Controller
{
    public function __construct(
        protected VatReturnQuery $query,
        protected FileVatReturnAction $fileAction
    ) {}

    public function index(Request $request): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $vatReturns = VatReturn::where('company_id', $companyId)
            ->with(['filedByUser', 'journalEntry'])
            ->when($request->search, function ($q, $search): void {
                $q->where(function ($sq) use ($search): void {
                    $sq->where('return_number', 'ilike', "%{$search}%")
                        ->orWhere('tax_period', 'ilike', "%{$search}%");
                });
            })
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->latest('start_date')
            ->paginate(15)
            ->withQueryString();

        $totalPayable = VatReturn::where('company_id', $companyId)->sum('final_net_payable');
        $filedCount = VatReturn::where('company_id', $companyId)->where('status', 'filed')->count();
        $draftCount = VatReturn::where('company_id', $companyId)->where('status', 'draft')->count();

        return Inertia::render('Accounting/VatReturns/Index', [
            'vatReturns' => $vatReturns,
            'metrics' => [
                'total_payable' => (float) $totalPayable,
                'filed_count' => $filedCount,
                'draft_count' => $draftCount,
            ],
            'filters' => [
                'search' => $request->search,
                'status' => $request->status,
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        $companyId = app(CurrentCompany::class)->id();
        $year = (int) ($request->year ?: now()->year);
        $periodType = $request->period_type ?: 'quarterly';

        if ($periodType === 'quarterly') {
            $quarter = (int) ($request->quarter ?: ceil(now()->month / 3));
            $startMonth = ($quarter - 1) * 3 + 1;
            $endMonth = $quarter * 3;

            $startDate = Carbon::create($year, $startMonth, 1)->startOfMonth()->toDateString();
            $endDate = Carbon::create($year, $endMonth, 1)->endOfMonth()->toDateString();
            $taxPeriod = "{$year}-Q{$quarter}";
        } else {
            $month = (int) ($request->month ?: now()->month);
            $startDate = Carbon::create($year, $month, 1)->startOfMonth()->toDateString();
            $endDate = Carbon::create($year, $month, 1)->endOfMonth()->toDateString();
            $taxPeriod = sprintf('%04d-%02d', $year, $month);
        }

        if ($request->start_date && $request->end_date) {
            $startDate = $request->start_date;
            $endDate = $request->end_date;
            $taxPeriod = "Custom {$startDate} to {$endDate}";
        }

        $aggregated = $this->query->execute($startDate, $endDate, $companyId);
        $returnNumber = 'VAT-'.str_replace([' ', '-', ':'], '', $taxPeriod).'-'.strtoupper(bin2hex(random_bytes(2)));

        return Inertia::render('Accounting/VatReturns/Create', [
            'periodType' => $periodType,
            'taxPeriod' => $taxPeriod,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'year' => $year,
            'returnNumber' => $returnNumber,
            'aggregated' => $aggregated,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'return_number' => 'required|string|max:50',
            'period_type' => 'required|string|in:quarterly,monthly,custom',
            'tax_period' => 'required|string|max:50',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'standard_sales_amount' => 'required|numeric',
            'standard_sales_vat' => 'required|numeric',
            'standard_sales_adjustment' => 'nullable|numeric',
            'zero_rated_sales_amount' => 'nullable|numeric',
            'exempt_sales_amount' => 'nullable|numeric',
            'total_sales_amount' => 'required|numeric',
            'total_output_vat' => 'required|numeric',
            'standard_purchases_amount' => 'required|numeric',
            'standard_purchases_vat' => 'required|numeric',
            'standard_purchases_adjustment' => 'nullable|numeric',
            'imports_vat_amount' => 'nullable|numeric',
            'zero_rated_purchases_amount' => 'nullable|numeric',
            'exempt_purchases_amount' => 'nullable|numeric',
            'total_purchases_amount' => 'required|numeric',
            'total_input_vat' => 'required|numeric',
            'net_vat_due' => 'required|numeric',
            'previous_period_credit' => 'nullable|numeric',
            'final_net_payable' => 'required|numeric',
            'notes' => 'nullable|string',
        ]);

        $tenantId = app(CurrentTenant::class)->id();
        $companyId = app(CurrentCompany::class)->id();

        $vatReturn = VatReturn::create([
            'tenant_id' => $tenantId,
            'company_id' => $companyId,
            ...$validated,
            'status' => 'draft',
        ]);

        return redirect()->route('accounting.vat-returns.show', $vatReturn->id)
            ->with('success', "VAT Return {$vatReturn->return_number} generated successfully.");
    }

    public function show(VatReturn $vatReturn): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        if ($vatReturn->company_id !== $companyId) {
            abort(403);
        }

        $vatReturn->load(['company', 'filedByUser', 'journalEntry.lines.account']);

        $details = $this->query->execute(
            $vatReturn->start_date->toDateString(),
            $vatReturn->end_date->toDateString(),
            $companyId
        );

        return Inertia::render('Accounting/VatReturns/Show', [
            'vatReturn' => $vatReturn,
            'details' => $details,
        ]);
    }

    public function file(VatReturn $vatReturn): RedirectResponse
    {
        $companyId = app(CurrentCompany::class)->id();

        if ($vatReturn->company_id !== $companyId) {
            abort(403);
        }

        $this->fileAction->execute($vatReturn, auth()->id());

        return back()->with('success', "VAT Return {$vatReturn->return_number} officially filed with ZATCA settlement recorded.");
    }

    public function print(VatReturn $vatReturn, QrCodeSvgService $qrSvgService, TafqeetService $tafqeetService): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        if ($vatReturn->company_id !== $companyId) {
            abort(403);
        }

        $vatReturn->load(['company', 'filedByUser', 'journalEntry']);
        $company = $vatReturn->company ?: app(CurrentCompany::class)->get();

        $netPayable = (float) $vatReturn->final_net_payable;
        $vatNumber = $company->tax_number ?: '300000000000003';

        $qrPayload = "ZATCA VAT Return: {$vatReturn->return_number} | Period: {$vatReturn->tax_period} | VAT #: {$vatNumber} | Net: {$netPayable} SAR";
        $qrCodeDataUri = $qrSvgService->generateDataUri($qrPayload, 160);

        return Inertia::render('Accounting/VatReturns/Print', [
            'vatReturn' => $vatReturn,
            'company' => $company,
            'qrCodeDataUri' => $qrCodeDataUri,
            'amountInWords' => [
                'ar' => $tafqeetService->inArabic(abs($netPayable)),
                'en' => $tafqeetService->inEnglish(abs($netPayable)),
            ],
        ]);
    }

    public function export(VatReturn $vatReturn): StreamedResponse
    {
        $companyId = app(CurrentCompany::class)->id();

        if ($vatReturn->company_id !== $companyId) {
            abort(403);
        }

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"vat-return-{$vatReturn->tax_period}.csv\"",
        ];

        $callback = function () use ($vatReturn): void {
            $handle = fopen('php://output', 'w');
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF)); // BOM for Excel UTF-8

            fputcsv($handle, ['ZATCA Value Added Tax Return / إقرار ضريبة القيمة المضافة']);
            fputcsv($handle, ['Return Number', $vatReturn->return_number]);
            fputcsv($handle, ['Tax Period', $vatReturn->tax_period]);
            fputcsv($handle, ['Period Dates', "{$vatReturn->start_date} to {$vatReturn->end_date}"]);
            fputcsv($handle, ['Status', $vatReturn->status]);
            fputcsv($handle, []);

            fputcsv($handle, ['Line #', 'Description (Arabic)', 'Description (English)', 'Amount (SAR)', 'Adjustment (SAR)', 'VAT Amount (SAR)']);

            // Output VAT lines
            fputcsv($handle, ['1', 'المبيعات الخاضعة للنسبة الأساسية', 'Standard rated sales', $vatReturn->standard_sales_amount, $vatReturn->standard_sales_adjustment, $vatReturn->standard_sales_vat]);
            fputcsv($handle, ['2', 'المبيعات للمواطنين (الخدمات الخاصة المعفاة)', 'Sales to citizens (exempt private services)', '0.00', '0.00', '0.00']);
            fputcsv($handle, ['3', 'المبيعات المحلية الخاضعة لنسبة الصفر', 'Zero rated domestic sales', $vatReturn->zero_rated_sales_amount, '0.00', '0.00']);
            fputcsv($handle, ['4', 'الصادرات', 'Exports', '0.00', '0.00', '0.00']);
            fputcsv($handle, ['5', 'المبيعات المعفاة', 'Exempt sales', $vatReturn->exempt_sales_amount, '0.00', '0.00']);
            fputcsv($handle, ['6', 'إجمالي المبيعات وضريبة المخرجات', 'Total Sales & Output VAT', $vatReturn->total_sales_amount, '0.00', $vatReturn->total_output_vat]);
            fputcsv($handle, []);

            // Input VAT lines
            fputcsv($handle, ['7', 'المشتريات الخاضعة للنسبة الأساسية', 'Standard rated purchases', $vatReturn->standard_purchases_amount, $vatReturn->standard_purchases_adjustment, $vatReturn->standard_purchases_vat]);
            fputcsv($handle, ['8', 'الاستيرادات الخاضعة للضريبة المدفوعة بالجمارك', 'Imports subject to VAT paid at customs', '0.00', '0.00', $vatReturn->imports_vat_amount]);
            fputcsv($handle, ['9', 'المشتريات الخاضعة لنسبة الصفر', 'Zero rated purchases', $vatReturn->zero_rated_purchases_amount, '0.00', '0.00']);
            fputcsv($handle, ['10', 'المشتريات المعفاة', 'Exempt purchases', $vatReturn->exempt_purchases_amount, '0.00', '0.00']);
            fputcsv($handle, ['11', 'إجمالي المشتريات وضريبة المدخلات', 'Total Purchases & Input VAT', $vatReturn->total_purchases_amount, '0.00', $vatReturn->total_input_vat]);
            fputcsv($handle, []);

            // Net result
            fputcsv($handle, ['12', 'صافي الضريبة المستحقة للفترة', 'Net VAT due for the period', '', '', $vatReturn->net_vat_due]);
            fputcsv($handle, ['13', 'رصيد دائن مرحل من فترات سابقة', 'Credit carried forward', '', '', $vatReturn->previous_period_credit]);
            fputcsv($handle, ['14', 'صافي الضريبة الواجب سدادها / (المستردة)', 'Total Net VAT Payable / (Refundable)', '', '', $vatReturn->final_net_payable]);

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }
}
