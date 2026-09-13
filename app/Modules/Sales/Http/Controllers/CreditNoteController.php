<?php

namespace App\Modules\Sales\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Models\ServiceInvoice;
use App\Modules\Inventory\Models\Product;
use App\Modules\Inventory\Models\Warehouse;
use App\Modules\Localization\Services\QrCodeSvgService;
use App\Modules\Localization\Services\TafqeetService;
use App\Modules\MasterData\Models\Party;
use App\Modules\Organization\Models\Branch;
use App\Modules\Organization\Models\Company;
use App\Modules\Sales\Models\CreditNote;
use App\Modules\Sales\Models\CreditNoteLine;
use App\Modules\Sales\Services\PostCreditNoteAction;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CreditNoteController extends Controller
{
    public function index(Request $request): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $query = CreditNote::where('company_id', $companyId)
            ->with(['customer', 'branch'])
            ->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search): void {
                $q->where('credit_note_number', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($cq) use ($search): void {
                        $cq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $creditNotes = $query->paginate(15)->withQueryString();

        $metrics = [
            'total_notes' => CreditNote::where('company_id', $companyId)->count(),
            'posted_count' => CreditNote::where('company_id', $companyId)->where('status', 'posted')->count(),
            'total_refunded' => CreditNote::where('company_id', $companyId)->where('status', 'posted')->sum('total'),
        ];

        return Inertia::render('Sales/CreditNotes/Index', [
            'creditNotes' => $creditNotes,
            'metrics' => $metrics,
            'filters' => $request->only(['status', 'search']),
        ]);
    }

    public function create(): Response
    {
        $companyId = app(CurrentCompany::class)->id();
        $tenantId = app(CurrentTenant::class)->id();

        $customers = Party::where('tenant_id', $tenantId)->where('type', 'customer')->get(['id', 'name']);
        $invoices = ServiceInvoice::where('company_id', $companyId)->where('status', 'posted')->latest()->take(50)->get(['id', 'invoice_number', 'party_id', 'total']);
        $products = Product::where('company_id', $companyId)->get(['id', 'name', 'sku', 'list_price', 'standard_cost']);
        $warehouses = Warehouse::where('company_id', $companyId)->get(['id', 'name']);
        $branches = Branch::where('company_id', $companyId)->get(['id', 'name']);

        return Inertia::render('Sales/CreditNotes/Create', [
            'customers' => $customers,
            'invoices' => $invoices,
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
            'customer_id' => ['required', 'string', 'uuid'],
            'invoice_id' => ['nullable', 'string', 'uuid'],
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

        $creditNoteNumber = 'CN-'.date('Ymd').'-'.strtoupper(bin2hex(random_bytes(3)));

        $creditNote = DB::transaction(function () use ($tenantId, $companyId, $validated, $creditNoteNumber) {
            $subtotal = '0.000000';
            $taxAmount = '0.000000';
            $total = '0.000000';

            $note = CreditNote::create([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'branch_id' => $validated['branch_id'] ?? null,
                'customer_id' => $validated['customer_id'],
                'invoice_id' => $validated['invoice_id'] ?? null,
                'credit_note_number' => $creditNoteNumber,
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

                CreditNoteLine::create([
                    'tenant_id' => $tenantId,
                    'company_id' => $companyId,
                    'credit_note_id' => $note->id,
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

        return redirect()->route('sales.credit-notes.show', $creditNote->id)
            ->with('success', 'تم إنشاء مسودة الإشعار الدائن بنجاح.');
    }

    public function show(CreditNote $creditNote): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        if ($creditNote->company_id !== $companyId) {
            abort(403);
        }

        $creditNote->load([
            'customer',
            'invoice',
            'branch',
            'lines.product',
            'lines.warehouse',
            'journalEntry.lines.account',
            'costingJournalEntry.lines.account',
        ]);

        return Inertia::render('Sales/CreditNotes/Show', [
            'creditNote' => $creditNote,
        ]);
    }

    public function post(Request $request, CreditNote $creditNote, PostCreditNoteAction $action): RedirectResponse
    {
        $companyId = app(CurrentCompany::class)->id();

        if ($creditNote->company_id !== $companyId) {
            abort(403);
        }

        $action->execute($creditNote, $request->user()?->id);

        return redirect()->route('sales.credit-notes.show', $creditNote->id)
            ->with('success', 'تم ترحيل الإشعار الدائن وعكس الإيراد وضريبة المخرجات واسترداد المخزون بنجاح.');
    }

    public function print(CreditNote $creditNote, QrCodeSvgService $qrSvgService, TafqeetService $tafqeetService): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        if ($creditNote->company_id !== $companyId) {
            abort(403);
        }

        $creditNote->load(['customer', 'lines.product', 'branch']);
        $company = Company::findOrFail($companyId);

        $qrPayload = "CN: {$creditNote->credit_note_number} | Cust: {$creditNote->customer?->name} | Total: {$creditNote->total} SAR | VAT: {$creditNote->tax_amount} SAR | Date: {$creditNote->date}";
        $qrCodeDataUri = $qrSvgService->generateDataUri($qrPayload, 160);

        $totalVal = (float) $creditNote->total;

        return Inertia::render('Sales/CreditNotes/Print', [
            'creditNote' => $creditNote,
            'company' => $company,
            'qrCodeDataUri' => $qrCodeDataUri,
            'amountInWords' => [
                'ar' => $tafqeetService->inArabic($totalVal),
                'en' => $tafqeetService->inEnglish($totalVal),
            ],
        ]);
    }
}
