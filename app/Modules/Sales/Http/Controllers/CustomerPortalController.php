<?php

namespace App\Modules\Sales\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Models\ServiceInvoice;
use App\Modules\Accounting\Queries\CustomerStatementQuery;
use App\Modules\Localization\Services\QrCodeSvgService;
use App\Modules\Localization\Services\TafqeetService;
use App\Modules\Localization\Services\ZatcaQrCodeService;
use App\Modules\MasterData\Models\CustomerProfile;
use App\Modules\Sales\Models\SalesOrder;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CustomerPortalController extends Controller
{
    /**
     * Resolve the active customer profile by its secure token.
     */
    protected function resolveCustomerProfile(string $token): CustomerProfile
    {
        $profile = CustomerProfile::where('portal_token', $token)
            ->where('portal_access_enabled', true)
            ->where('is_active', true)
            ->with(['party', 'company.tenant'])
            ->firstOrFail();

        // Initialize tenant and company context for query safety
        if ($profile->company) {
            if ($profile->company->tenant) {
                app(CurrentTenant::class)->set($profile->company->tenant);
            }
            app(CurrentCompany::class)->set($profile->company);
        }

        return $profile;
    }

    /**
     * Customer Portal Main Interactive Dashboard.
     */
    public function dashboard(Request $request, string $token, CustomerStatementQuery $statementQuery): Response
    {
        $profile = $this->resolveCustomerProfile($token);
        $company = $profile->company;
        $party = $profile->party;

        // 1. Calculate Key Financial Telemetry
        $creditLimit = (float) $profile->credit_limit;
        $outstandingBalance = (float) ServiceInvoice::where('company_id', $profile->company_id)
            ->where('party_id', $profile->party_id)
            ->whereIn('status', ['posted', 'partially_paid'])
            ->sum('balance_due');

        $availableCredit = max(0, $creditLimit - $outstandingBalance);

        $totalInvoiced = (float) ServiceInvoice::where('company_id', $profile->company_id)
            ->where('party_id', $profile->party_id)
            ->whereIn('status', ['posted', 'partially_paid', 'paid'])
            ->sum('total');

        $totalPaid = (float) ServiceInvoice::where('company_id', $profile->company_id)
            ->where('party_id', $profile->party_id)
            ->sum('amount_paid');

        // 2. Fetch Customer Invoices
        $invoices = ServiceInvoice::where('company_id', $profile->company_id)
            ->where('party_id', $profile->party_id)
            ->latest('date')
            ->take(50)
            ->get()
            ->map(fn ($inv) => [
                'id' => $inv->id,
                'invoice_number' => $inv->invoice_number,
                'date' => $inv->date?->toDateString(),
                'due_date' => $inv->due_date?->toDateString(),
                'subtotal' => (float) $inv->subtotal,
                'tax_amount' => (float) $inv->tax_amount,
                'total' => (float) $inv->total,
                'amount_paid' => (float) $inv->amount_paid,
                'balance_due' => (float) $inv->balance_due,
                'status' => $inv->status,
                'zatca_status' => $inv->zatca_status,
                'has_xml' => ! empty($inv->zatca_cleared_xml ?: $inv->zatca_xml),
            ]);

        // 3. Fetch Customer Sales Orders
        $orders = SalesOrder::where('company_id', $profile->company_id)
            ->where('customer_id', $profile->party_id)
            ->latest('order_date')
            ->take(50)
            ->get()
            ->map(fn ($ord) => [
                'id' => $ord->id,
                'order_number' => $ord->order_number,
                'order_date' => $ord->order_date?->toDateString(),
                'delivery_date' => $ord->delivery_date?->toDateString(),
                'total_amount' => (float) $ord->total_amount,
                'status' => $ord->status,
                'invoicing_status' => $ord->invoicing_status,
            ]);

        // 4. Statement of Account
        $startDate = $request->query('start_date', now()->startOfYear()->toDateString());
        $endDate = $request->query('end_date', now()->toDateString());
        $statement = $statementQuery->execute($profile->party_id, $startDate, $endDate);

        return Inertia::render('Portal/Customer/Dashboard', [
            'portalToken' => $token,
            'customer' => [
                'id' => $party->id,
                'name' => $party->name,
                'name_ar' => $party->name_ar,
                'tax_id' => $party->tax_id,
                'email' => $party->email,
                'phone' => $party->phone,
                'address' => $party->address,
                'currency' => $profile->currency ?: 'SAR',
                'payment_terms_days' => $profile->payment_terms_days,
            ],
            'company' => [
                'name' => $company->name,
                'legal_name' => $company->legal_name,
                'tax_number' => $company->tax_number,
                'currency' => $company->currency ?: 'SAR',
                'settings' => $company->settings,
            ],
            'metrics' => [
                'credit_limit' => $creditLimit,
                'outstanding_balance' => $outstandingBalance,
                'available_credit' => $availableCredit,
                'total_invoiced' => $totalInvoiced,
                'total_paid' => $totalPaid,
                'invoices_count' => count($invoices),
                'orders_count' => count($orders),
            ],
            'invoices' => $invoices,
            'orders' => $orders,
            'statement' => $statement,
            'statementFilters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ]);
    }

    /**
     * Download ZATCA Compliant UBL 2.1 XML for an invoice.
     */
    public function downloadInvoiceXml(string $token, string $invoiceId): HttpResponse
    {
        $profile = $this->resolveCustomerProfile($token);

        $invoice = ServiceInvoice::where('company_id', $profile->company_id)
            ->where('party_id', $profile->party_id)
            ->findOrFail($invoiceId);

        $xml = $invoice->zatca_cleared_xml ?: $invoice->zatca_xml;

        if (! $xml) {
            abort(404, 'ZATCA XML not available for this invoice.');
        }

        return response($xml, 200, [
            'Content-Type' => 'application/xml',
            'Content-Disposition' => "attachment; filename=\"zatca-invoice-{$invoice->invoice_number}.xml\"",
        ]);
    }

    /**
     * Display printable ZATCA Tax Invoice with standard Phase 2 QR Code.
     */
    public function printInvoice(
        string $token,
        string $invoiceId,
        ZatcaQrCodeService $zatcaQrService,
        QrCodeSvgService $qrSvgService,
        TafqeetService $tafqeetService
    ): Response {
        $profile = $this->resolveCustomerProfile($token);

        $invoice = ServiceInvoice::where('company_id', $profile->company_id)
            ->where('party_id', $profile->party_id)
            ->with([
                'party',
                'lines.revenueAccount',
                'company',
                'branch',
            ])
            ->findOrFail($invoiceId);

        $company = $invoice->company ?: $profile->company;
        $sellerName = $company?->legal_name ?: ($company?->name ?: 'شركة الحلول المتكاملة للأعمال');
        $vatNumber = $company?->tax_number ?: '300123456700003';
        $timestamp = $invoice->created_at ? $invoice->created_at->toIso8601String() : now()->toIso8601String();

        $tlvBase64 = $zatcaQrService->generateBase64Tlv(
            sellerName: $sellerName,
            vatNumber: $vatNumber,
            timestamp: $timestamp,
            totalWithVat: (string) $invoice->total,
            vatTotal: (string) $invoice->tax_amount
        );

        $qrCodeDataUri = $qrSvgService->generateDataUri($tlvBase64, 180);

        return Inertia::render('Accounting/Invoices/Print', [
            'invoice' => $invoice,
            'company' => $company,
            'qrCodeDataUri' => $qrCodeDataUri,
            'amountInWords' => [
                'ar' => $tafqeetService->inArabic($invoice->total),
                'en' => $tafqeetService->inEnglish($invoice->total),
            ],
            'backUrl' => route('portal.dashboard', ['token' => $token]),
        ]);
    }

    /**
     * Export statement of account as formatted CSV for the customer.
     */
    public function exportStatement(Request $request, string $token, CustomerStatementQuery $statementQuery): StreamedResponse
    {
        $profile = $this->resolveCustomerProfile($token);

        $startDate = $request->query('start_date', now()->startOfYear()->toDateString());
        $endDate = $request->query('end_date', now()->toDateString());
        $statement = $statementQuery->execute($profile->party_id, $startDate, $endDate);

        $filename = "Statement_{$profile->party?->name}_{$startDate}_to_{$endDate}.csv";

        return response()->streamDownload(function () use ($statement, $profile, $startDate, $endDate): void {
            $handle = fopen('php://output', 'w');
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF)); // UTF-8 BOM

            fputcsv($handle, ['Customer Statement of Account / كشف حساب عميل']);
            fputcsv($handle, ['Customer / العميل', $profile->party?->name, $profile->party?->name_ar]);
            fputcsv($handle, ['VAT ID / الرقم الضريبي', $profile->party?->tax_id]);
            fputcsv($handle, ['Period / الفترة', "{$startDate} - {$endDate}"]);
            fputcsv($handle, ['Opening Balance / الرصيد الافتتاحي', number_format($statement['opening_balance'], 2)]);
            fputcsv($handle, []);

            fputcsv($handle, [
                'Date / التاريخ',
                'Type / النوع',
                'Reference / المرجع',
                'Debit / مدين',
                'Credit / دائن',
                'Balance / الرصيد الجاري',
                'Notes / ملاحظات',
            ]);

            foreach ($statement['transactions'] as $tx) {
                fputcsv($handle, [
                    $tx['date'],
                    $tx['type_ar'] ?: $tx['type'],
                    $tx['reference'],
                    number_format($tx['debit'], 2),
                    number_format($tx['credit'], 2),
                    number_format($tx['balance'], 2),
                    $tx['notes'] ?? '',
                ]);
            }

            fputcsv($handle, []);
            fputcsv($handle, [
                'Totals / الإجمالي',
                '',
                '',
                number_format($statement['total_debit'], 2),
                number_format($statement['total_credit'], 2),
                number_format($statement['closing_balance'], 2),
            ]);

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    /**
     * Admin action to regenerate a customer's portal token.
     */
    public function regenerateToken(Request $request, CustomerProfile $profile): RedirectResponse
    {
        $profile->portal_token = bin2hex(random_bytes(24));
        $profile->portal_access_enabled = true;
        $profile->save();

        return back()->with('success', 'Customer portal access link generated successfully.');
    }
}
