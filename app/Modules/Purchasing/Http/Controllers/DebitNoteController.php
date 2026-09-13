<?php

namespace App\Modules\Purchasing\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\Models\Product;
use App\Modules\Inventory\Models\Warehouse;
use App\Modules\Localization\Services\QrCodeSvgService;
use App\Modules\Localization\Services\TafqeetService;
use App\Modules\MasterData\Models\Party;
use App\Modules\Organization\Models\Branch;
use App\Modules\Organization\Models\Company;
use App\Modules\Purchasing\Models\DebitNote;
use App\Modules\Purchasing\Models\DebitNoteLine;
use App\Modules\Purchasing\Models\VendorBill;
use App\Modules\Purchasing\Services\PostDebitNoteAction;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DebitNoteController extends Controller
{
    public function index(Request $request): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $query = DebitNote::where('company_id', $companyId)
            ->with(['vendor', 'branch'])
            ->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search): void {
                $q->where('debit_note_number', 'like', "%{$search}%")
                    ->orWhereHas('vendor', function ($vq) use ($search): void {
                        $vq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $debitNotes = $query->paginate(15)->withQueryString();

        $metrics = [
            'total_notes' => DebitNote::where('company_id', $companyId)->count(),
            'posted_count' => DebitNote::where('company_id', $companyId)->where('status', 'posted')->count(),
            'total_debited' => DebitNote::where('company_id', $companyId)->where('status', 'posted')->sum('total'),
        ];

        return Inertia::render('Purchasing/DebitNotes/Index', [
            'debitNotes' => $debitNotes,
            'metrics' => $metrics,
            'filters' => $request->only(['status', 'search']),
        ]);
    }

    public function create(): Response
    {
        $companyId = app(CurrentCompany::class)->id();
        $tenantId = app(CurrentTenant::class)->id();

        $vendors = Party::where('tenant_id', $tenantId)->where('type', 'vendor')->get(['id', 'name']);
        $bills = VendorBill::where('company_id', $companyId)->where('status', 'posted')->latest()->take(50)->get(['id', 'bill_number', 'party_id', 'total']);
        $products = Product::where('company_id', $companyId)->get(['id', 'name', 'sku', 'list_price', 'standard_cost']);
        $warehouses = Warehouse::where('company_id', $companyId)->get(['id', 'name']);
        $branches = Branch::where('company_id', $companyId)->get(['id', 'name']);

        return Inertia::render('Purchasing/DebitNotes/Create', [
            'vendors' => $vendors,
            'bills' => $bills,
            'products' => $products,
            'warehouses' => $warehouses,
            'branches' => $branches,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $companyId = app(CurrentCompany::class)->id();
        $tenantId = app(CurrentTenant::class)->id();

        $validated = $request->validate([
            'vendor_id' => ['required', 'string', 'uuid'],
            'vendor_bill_id' => ['nullable', 'string', 'uuid'],
            'branch_id' => ['nullable', 'string', 'uuid'],
            'date' => ['required', 'date'],
            'reason' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.description' => ['required', 'string'],
            'lines.*.product_id' => ['nullable', 'string', 'uuid'],
            'lines.*.warehouse_id' => ['nullable', 'string', 'uuid'],
            'lines.*.quantity' => ['required', 'numeric', 'min:0.0001'],
            'lines.*.unit_price' => ['required', 'numeric', 'min:0'],
            'lines.*.tax_rate' => ['nullable', 'numeric', 'min:0', 'max:1'],
        ]);

        $debitNoteNumber = 'DN-'.date('Ymd').'-'.strtoupper(bin2hex(random_bytes(3)));

        $debitNote = DB::transaction(function () use ($tenantId, $companyId, $validated, $debitNoteNumber) {
            $subtotal = '0.000000';
            $taxAmount = '0.000000';
            $total = '0.000000';

            $note = DebitNote::create([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'branch_id' => $validated['branch_id'] ?? null,
                'vendor_id' => $validated['vendor_id'],
                'vendor_bill_id' => $validated['vendor_bill_id'] ?? null,
                'debit_note_number' => $debitNoteNumber,
                'date' => $validated['date'],
                'reason' => $validated['reason'] ?? null,
                'subtotal' => '0.000000',
                'tax_amount' => '0.000000',
                'total' => '0.000000',
                'status' => 'draft',
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($validated['lines'] as $line) {
                $qty = (string) $line['quantity'];
                $price = (string) $line['unit_price'];
                $taxRate = isset($line['tax_rate']) ? (string) $line['tax_rate'] : '0.1500';

                $lineSubtotal = bcmul($qty, $price, 6);
                $lineTax = bcmul($lineSubtotal, $taxRate, 6);
                $lineTotal = bcadd($lineSubtotal, $lineTax, 6);

                DebitNoteLine::create([
                    'tenant_id' => $tenantId,
                    'company_id' => $companyId,
                    'debit_note_id' => $note->id,
                    'product_id' => $line['product_id'] ?? null,
                    'warehouse_id' => $line['warehouse_id'] ?? null,
                    'description' => $line['description'],
                    'quantity' => $qty,
                    'unit_price' => $price,
                    'subtotal' => $lineSubtotal,
                    'tax_rate' => $taxRate,
                    'tax_amount' => $lineTax,
                    'total' => $lineTotal,
                ]);

                $subtotal = bcadd($subtotal, $lineSubtotal, 6);
                $taxAmount = bcadd($taxAmount, $lineTax, 6);
                $total = bcadd($total, $lineTotal, 6);
            }

            $note->update([
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'total' => $total,
            ]);

            return $note;
        });

        return redirect()->route('purchasing.debit-notes.show', $debitNote->id)
            ->with('success', 'تم إنشاء مسودة الإشعار المدين بنجاح.');
    }

    public function show(DebitNote $debitNote): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        if ($debitNote->company_id !== $companyId) {
            abort(403);
        }

        $debitNote->load([
            'vendor',
            'vendorBill',
            'branch',
            'lines.product',
            'lines.warehouse',
            'journalEntry.lines.account',
        ]);

        return Inertia::render('Purchasing/DebitNotes/Show', [
            'debitNote' => $debitNote,
        ]);
    }

    public function post(Request $request, DebitNote $debitNote, PostDebitNoteAction $action): RedirectResponse
    {
        $companyId = app(CurrentCompany::class)->id();

        if ($debitNote->company_id !== $companyId) {
            abort(403);
        }

        $action->execute($debitNote, $request->user()?->id);

        return redirect()->route('purchasing.debit-notes.show', $debitNote->id)
            ->with('success', 'تم ترحيل الإشعار المدين وعكس ضريبة المدخلات وإخراج البضاعة المرتجعة بنجاح.');
    }

    public function print(DebitNote $debitNote, QrCodeSvgService $qrSvgService, TafqeetService $tafqeetService): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        if ($debitNote->company_id !== $companyId) {
            abort(403);
        }

        $debitNote->load(['vendor', 'lines.product', 'branch']);
        $company = Company::findOrFail($companyId);

        $qrPayload = "DN: {$debitNote->debit_note_number} | Vendor: {$debitNote->vendor?->name} | Total: {$debitNote->total} SAR | VAT: {$debitNote->tax_amount} SAR | Date: {$debitNote->date}";
        $qrCodeDataUri = $qrSvgService->generateDataUri($qrPayload, 160);

        $totalVal = (float) $debitNote->total;

        return Inertia::render('Purchasing/DebitNotes/Print', [
            'debitNote' => $debitNote,
            'company' => $company,
            'qrCodeDataUri' => $qrCodeDataUri,
            'amountInWords' => [
                'ar' => $tafqeetService->inArabic($totalVal),
                'en' => $tafqeetService->inEnglish($totalVal),
            ],
        ]);
    }
}
