<?php

namespace App\Modules\Platform\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Models\Account;
use App\Modules\Inventory\Models\Product;
use App\Modules\MasterData\Models\CustomerProfile;
use App\Modules\MasterData\Models\Party;
use App\Modules\Platform\Services\CsvExportService;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class DataImportController extends Controller
{
    public function index(): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $stats = [
            'accounts_count' => Account::where('company_id', $companyId)->count(),
            'customers_count' => Party::whereHas('customerProfiles', fn ($q) => $q->where('company_id', $companyId))->count(),
            'products_count' => Product::where('company_id', $companyId)->count(),
        ];

        return Inertia::render('Platform/Import/Index', [
            'stats' => $stats,
        ]);
    }

    public function downloadTemplate(string $type, CsvExportService $csvService): StreamedResponse
    {
        switch ($type) {
            case 'accounts':
                $headers = ['code', 'name', 'name_ar', 'type', 'subtype'];
                $rows = [
                    ['1050', 'Petty Cash Riyadh', 'صندوق عهدة الرياض', 'asset', 'cash'],
                    ['2050', 'Short Term Accruals', 'مستحقات قصيرة الأجل', 'liability', 'current_liability'],
                    ['4150', 'Consulting Services Revenue', 'إيرادات خدمات استشارية', 'revenue', 'operating_revenue'],
                    ['5150', 'Logistics & Transport Expense', 'مصروفات لوجستية ونقل', 'expense', 'operating_expense'],
                ];

                return $csvService->stream('accounts-template.csv', $headers, $rows);

            case 'products':
                $headers = ['sku', 'name', 'name_ar', 'type', 'barcode', 'list_price', 'standard_cost'];
                $rows = [
                    ['PRD-001', 'Industrial Water Pump 15HP', 'مضخة مياه صناعية 15 حصان', 'inventory', '6281001234567', '2450.00', '1800.00'],
                    ['SRV-001', 'Annual Equipment Maintenance', 'صيانة سنوية دورية للمعدات', 'service', '', '1200.00', '400.00'],
                    ['PRD-002', 'High-Grade Steel Bolt 10mm', 'مسامير صلب مجلفن 10 ملم', 'inventory', '6281001234588', '15.50', '9.00'],
                ];

                return $csvService->stream('products-template.csv', $headers, $rows);

            case 'customers':
            default:
                $headers = ['name', 'name_ar', 'type', 'tax_id', 'email', 'phone'];
                $rows = [
                    ['Al-Futtaim Construction Co.', 'شركة الفطيم للإنشاءات', 'customer', '300123456700003', 'procurement@alfuttaim-sa.com', '+966112345678'],
                    ['Rawabi Modern Logistics', 'شركة روابي للخدمات اللوجستية', 'both', '300987654300003', 'billing@rawabi.com', '+966126789012'],
                    ['Gulf Tech Trading Est.', 'مؤسسة تقنية الخليج للتجارة', 'vendor', '300555444300003', 'sales@gulftech.com', '+966138901234'],
                ];

                return $csvService->stream('customers-template.csv', $headers, $rows);
        }
    }

    public function export(string $type, CsvExportService $csvService): StreamedResponse
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        switch ($type) {
            case 'accounts':
                $headers = ['code', 'name', 'name_ar', 'type', 'subtype', 'current_balance'];
                $accounts = Account::where('company_id', $companyId)->orderBy('code')->get();
                $rows = [];
                foreach ($accounts as $acc) {
                    $rows[] = [
                        $acc->code,
                        $acc->name,
                        $acc->name_ar ?? '',
                        $acc->type,
                        $acc->subtype ?? '',
                        number_format((float) $acc->current_balance, 2),
                    ];
                }

                return $csvService->stream('accounts-export-'.now()->toDateString().'.csv', $headers, $rows);

            case 'products':
                $headers = ['sku', 'name', 'name_ar', 'type', 'barcode', 'list_price', 'standard_cost', 'moving_average_cost'];
                $products = Product::where('company_id', $companyId)->orderBy('sku')->get();
                $rows = [];
                foreach ($products as $p) {
                    $rows[] = [
                        $p->sku,
                        $p->name,
                        $p->name_ar ?? '',
                        $p->type,
                        $p->barcode ?? '',
                        number_format((float) $p->list_price, 2),
                        number_format((float) $p->standard_cost, 2),
                        number_format((float) $p->moving_average_cost, 2),
                    ];
                }

                return $csvService->stream('products-export-'.now()->toDateString().'.csv', $headers, $rows);

            case 'customers':
            default:
                $headers = ['name', 'name_ar', 'type', 'tax_id', 'email', 'phone'];
                $parties = Party::whereHas('customerProfiles', fn ($q) => $q->where('company_id', $companyId))
                    ->orWhereHas('vendorProfiles', fn ($q) => $q->where('company_id', $companyId))
                    ->orderBy('name')
                    ->get();
                $rows = [];
                foreach ($parties as $pt) {
                    $rows[] = [
                        $pt->name,
                        $pt->name_ar ?? '',
                        $pt->type,
                        $pt->tax_id ?? '',
                        $pt->email ?? '',
                        $pt->phone ?? '',
                    ];
                }

                return $csvService->stream('parties-export-'.now()->toDateString().'.csv', $headers, $rows);
        }
    }

    public function import(Request $request): RedirectResponse
    {
        $request->validate([
            'type' => ['required', 'string', 'in:customers,accounts,products'],
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:10240'],
        ]);

        $type = $request->input('type');
        $file = $request->file('file');
        $path = $file->getRealPath();

        $rows = [];
        if (($handle = fopen($path, 'r')) !== false) {
            // Read first line and strip UTF-8 BOM if present
            $bom = fread($handle, 3);
            if ($bom !== "\xEF\xBB\xBF") {
                rewind($handle);
            }

            $header = fgetcsv($handle);
            if (! $header) {
                return back()->with('error', 'The uploaded CSV file is empty or corrupted.');
            }

            // Normalize header names to lowercase trim
            $header = array_map(fn ($h) => strtolower(trim((string) $h)), $header);

            while (($data = fgetcsv($handle)) !== false) {
                if (empty(array_filter($data, fn ($val) => trim((string) $val) !== ''))) {
                    continue; // Skip blank lines
                }
                $combined = [];
                foreach ($header as $i => $key) {
                    $combined[$key] = isset($data[$i]) ? trim((string) $data[$i]) : '';
                }
                $rows[] = $combined;
            }
            fclose($handle);
        }

        if (empty($rows)) {
            return back()->with('error', 'No valid data rows found in the uploaded CSV.');
        }

        $currentTenant = app(CurrentTenant::class);
        $currentCompany = app(CurrentCompany::class);
        $tenantId = $currentTenant->id();
        $companyId = $currentCompany->id();

        try {
            $importedCount = 0;
            DB::transaction(function () use ($type, $rows, $tenantId, $companyId, &$importedCount): void {
                if ($type === 'accounts') {
                    foreach ($rows as $row) {
                        if (empty($row['code']) || empty($row['name'])) {
                            continue;
                        }

                        Account::updateOrCreate(
                            [
                                'company_id' => $companyId,
                                'code' => $row['code'],
                            ],
                            [
                                'tenant_id' => $tenantId,
                                'name' => $row['name'],
                                'name_ar' => ! empty($row['name_ar']) ? $row['name_ar'] : null,
                                'type' => in_array($row['type'] ?? '', ['asset', 'liability', 'equity', 'revenue', 'expense']) ? $row['type'] : 'expense',
                                'subtype' => ! empty($row['subtype']) ? $row['subtype'] : 'operating_expense',
                                'currency' => 'SAR',
                                'is_postable' => true,
                            ]
                        );
                        $importedCount++;
                    }
                } elseif ($type === 'products') {
                    foreach ($rows as $row) {
                        if (empty($row['sku']) || empty($row['name'])) {
                            continue;
                        }

                        Product::updateOrCreate(
                            [
                                'company_id' => $companyId,
                                'sku' => $row['sku'],
                            ],
                            [
                                'tenant_id' => $tenantId,
                                'name' => $row['name'],
                                'name_ar' => ! empty($row['name_ar']) ? $row['name_ar'] : null,
                                'type' => in_array($row['type'] ?? '', ['inventory', 'service', 'non_inventory']) ? $row['type'] : 'inventory',
                                'barcode' => ! empty($row['barcode']) ? $row['barcode'] : null,
                                'list_price' => ! empty($row['list_price']) ? $row['list_price'] : '0.000000',
                                'standard_cost' => ! empty($row['standard_cost']) ? $row['standard_cost'] : '0.000000',
                                'moving_average_cost' => ! empty($row['standard_cost']) ? $row['standard_cost'] : '0.000000',
                                'is_active' => true,
                            ]
                        );
                        $importedCount++;
                    }
                } else {
                    // Customers & Parties
                    foreach ($rows as $row) {
                        if (empty($row['name'])) {
                            continue;
                        }

                        $party = Party::where('tenant_id', $tenantId)
                            ->where(function ($q) use ($row): void {
                                $q->where('name', $row['name']);
                                if (! empty($row['tax_id'])) {
                                    $q->orWhere('tax_id', $row['tax_id']);
                                }
                            })
                            ->first();

                        if (! $party) {
                            $party = Party::create([
                                'tenant_id' => $tenantId,
                                'name' => $row['name'],
                                'name_ar' => ! empty($row['name_ar']) ? $row['name_ar'] : null,
                                'type' => in_array($row['type'] ?? '', ['customer', 'vendor', 'both']) ? $row['type'] : 'customer',
                                'tax_id' => ! empty($row['tax_id']) ? $row['tax_id'] : null,
                                'email' => ! empty($row['email']) ? $row['email'] : null,
                                'phone' => ! empty($row['phone']) ? $row['phone'] : null,
                                'status' => 'active',
                            ]);
                        } else {
                            $party->update([
                                'name_ar' => ! empty($row['name_ar']) ? $row['name_ar'] : $party->name_ar,
                                'tax_id' => ! empty($row['tax_id']) ? $row['tax_id'] : $party->tax_id,
                                'email' => ! empty($row['email']) ? $row['email'] : $party->email,
                                'phone' => ! empty($row['phone']) ? $row['phone'] : $party->phone,
                            ]);
                        }

                        CustomerProfile::firstOrCreate(
                            [
                                'company_id' => $companyId,
                                'party_id' => $party->id,
                            ],
                            [
                                'tenant_id' => $tenantId,
                                'credit_limit' => '50000.000000',
                                'payment_terms_days' => 30,
                                'currency' => 'SAR',
                                'is_active' => true,
                            ]
                        );

                        $importedCount++;
                    }
                }
            });

            return back()->with('success', "نجح استيراد وتحديث {$importedCount} سجلاً بنجاح في النظام.");
        } catch (Throwable $e) {
            return back()->with('error', "فشل الاستيراد: {$e->getMessage()}");
        }
    }
}
