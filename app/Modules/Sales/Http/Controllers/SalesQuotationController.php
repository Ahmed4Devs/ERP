<?php

namespace App\Modules\Sales\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\CRM\Models\Lead;
use App\Modules\Inventory\Models\Product;
use App\Modules\MasterData\Models\Party;
use App\Modules\Sales\Models\SalesQuotation;
use App\Modules\Sales\Models\SalesQuotationLine;
use App\Modules\Sales\Services\ConvertQuotationToOrderAction;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SalesQuotationController extends Controller
{
    public function index(Request $request): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $quotations = SalesQuotation::where('company_id', $companyId)
            ->with(['customer', 'lead'])
            ->when($request->search, function ($q, $search): void {
                $q->where(function ($sq) use ($search): void {
                    $sq->where('quote_number', 'ilike', "%{$search}%")
                        ->orWhereHas('customer', fn ($cq) => $cq->where('name', 'ilike', "%{$search}%")->orWhere('name_ar', 'ilike', "%{$search}%"));
                });
            })
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->latest('issue_date')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Sales/Quotations/Index', [
            'quotations' => $quotations,
            'filters' => [
                'search' => $request->search,
                'status' => $request->status,
            ],
        ]);
    }

    public function create(): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $customers = Party::where(function ($q) use ($companyId): void {
            $q->whereHas('customerProfiles', fn ($cq) => $cq->where('company_id', $companyId))
                ->orWhereIn('type', ['customer', 'both']);
        })
            ->orderBy('name', 'asc')
            ->get(['id', 'name', 'name_ar']);

        $products = Product::where('company_id', $companyId)
            ->where('is_active', true)
            ->orderBy('name', 'asc')
            ->get(['id', 'sku', 'name', 'name_ar', 'sales_price']);

        $leads = Lead::where('company_id', $companyId)
            ->whereIn('status', ['qualified', 'proposal', 'won'])
            ->orderBy('title', 'asc')
            ->get(['id', 'title', 'party_id']);

        return Inertia::render('Sales/Quotations/Create', [
            'customers' => $customers,
            'products' => $products,
            'leads' => $leads,
            'defaultIssueDate' => now()->toDateString(),
            'defaultValidUntil' => now()->addDays(30)->toDateString(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $currentTenant = app(CurrentTenant::class);
        $currentCompany = app(CurrentCompany::class);

        $validated = $request->validate([
            'customer_id' => 'required|uuid|exists:parties,id',
            'lead_id' => 'nullable|uuid|exists:crm_leads,id',
            'issue_date' => 'required|date',
            'valid_until' => 'required|date|after_or_equal:issue_date',
            'discount_amount' => 'nullable|numeric|min:0',
            'terms_and_conditions' => 'nullable|string',
            'notes' => 'nullable|string',
            'lines' => 'required|array|min:1',
            'lines.*.product_id' => 'nullable|uuid|exists:products,id',
            'lines.*.description' => 'required|string|max:255',
            'lines.*.quantity' => 'required|numeric|min:0.000001',
            'lines.*.unit_price' => 'required|numeric|min:0',
            'lines.*.discount_amount' => 'nullable|numeric|min:0',
        ]);

        $quotation = DB::transaction(function () use ($validated, $currentTenant, $currentCompany) {
            $quoteNumber = 'QT-'.date('Ymd').'-'.strtoupper(substr(uniqid(), -4));
            $taxRate = '0.100000'; // 10% test tax

            $subtotal = '0.000000';
            $computedLines = [];

            foreach ($validated['lines'] as $line) {
                $qty = number_format((float) $line['quantity'], 6, '.', '');
                $price = number_format((float) $line['unit_price'], 6, '.', '');
                $disc = number_format((float) ($line['discount_amount'] ?? 0), 6, '.', '');

                $lineSub = bcsub(bcmul($qty, $price, 6), $disc, 6);
                $lineTax = bcmul($lineSub, $taxRate, 6);
                $lineTotal = bcadd($lineSub, $lineTax, 6);

                $subtotal = bcadd($subtotal, $lineSub, 6);

                $computedLines[] = [
                    'product_id' => $line['product_id'] ?? null,
                    'description' => $line['description'],
                    'quantity' => $qty,
                    'unit_price' => $price,
                    'discount_amount' => $disc,
                    'tax_amount' => $lineTax,
                    'line_total' => $lineTotal,
                ];
            }

            $overallDiscount = number_format((float) ($validated['discount_amount'] ?? 0), 6, '.', '');
            $netSubtotal = bcsub($subtotal, $overallDiscount, 6);
            if (bccomp($netSubtotal, '0.000000', 6) < 0) {
                $netSubtotal = '0.000000';
            }

            $taxAmount = bcmul($netSubtotal, $taxRate, 6);
            $totalAmount = bcadd($netSubtotal, $taxAmount, 6);

            $quote = SalesQuotation::create([
                'tenant_id' => $currentTenant->id(),
                'company_id' => $currentCompany->id(),
                'quote_number' => $quoteNumber,
                'customer_id' => $validated['customer_id'],
                'lead_id' => $validated['lead_id'] ?? null,
                'issue_date' => $validated['issue_date'],
                'valid_until' => $validated['valid_until'],
                'subtotal' => $subtotal,
                'tax_rate' => $taxRate,
                'tax_amount' => $taxAmount,
                'discount_amount' => $overallDiscount,
                'total_amount' => $totalAmount,
                'status' => 'draft',
                'terms_and_conditions' => $validated['terms_and_conditions'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($computedLines as $cl) {
                SalesQuotationLine::create([
                    'tenant_id' => $currentTenant->id(),
                    'company_id' => $currentCompany->id(),
                    'quotation_id' => $quote->id,
                    'product_id' => $cl['product_id'],
                    'description' => $cl['description'],
                    'quantity' => $cl['quantity'],
                    'unit_price' => $cl['unit_price'],
                    'discount_amount' => $cl['discount_amount'],
                    'tax_amount' => $cl['tax_amount'],
                    'line_total' => $cl['line_total'],
                ]);
            }

            return $quote;
        });

        return redirect()->route('sales.quotations.show', $quotation->id)
            ->with('success', 'Sales Quotation created successfully.');
    }

    public function show(SalesQuotation $quotation): Response
    {
        $quotation->load(['customer', 'lead', 'lines.product', 'salesOrder']);

        return Inertia::render('Sales/Quotations/Show', [
            'quotation' => $quotation,
        ]);
    }

    public function convertToOrder(SalesQuotation $quotation, ConvertQuotationToOrderAction $action): RedirectResponse
    {
        $order = $action->execute($quotation);

        return redirect()->route('sales.orders.show', $order->id)
            ->with('success', 'Quotation successfully converted to Sales Order.');
    }
}
