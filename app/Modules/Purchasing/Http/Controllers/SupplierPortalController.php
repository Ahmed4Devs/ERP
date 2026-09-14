<?php

namespace App\Modules\Purchasing\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Purchasing\Models\PurchaseOrder;
use App\Modules\Purchasing\Models\VendorBill;
use App\Modules\Purchasing\Models\VendorProfile;
use App\Modules\Purchasing\Queries\VendorStatementQuery;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SupplierPortalController extends Controller
{
    /**
     * Resolve the active vendor profile by its secure token.
     */
    protected function resolveVendorProfile(string $token): VendorProfile
    {
        $profile = VendorProfile::withoutGlobalScope('company_scope')
            ->where('portal_token', $token)
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
     * Supplier / Vendor Digital Self-Service Portal Dashboard.
     */
    public function dashboard(Request $request, string $token, VendorStatementQuery $statementQuery): Response
    {
        $profile = $this->resolveVendorProfile($token);
        $company = $profile->company;
        $party = $profile->party;

        // 1. Financial Telemetry for the Vendor
        $outstandingBalance = (float) VendorBill::where('company_id', $profile->company_id)
            ->where('party_id', $profile->party_id)
            ->whereIn('status', ['posted', 'partially_paid'])
            ->sum('balance_due');

        $totalInvoiced = (float) VendorBill::where('company_id', $profile->company_id)
            ->where('party_id', $profile->party_id)
            ->whereIn('status', ['posted', 'partially_paid', 'paid'])
            ->sum('total');

        $totalPaid = (float) VendorBill::where('company_id', $profile->company_id)
            ->where('party_id', $profile->party_id)
            ->sum('amount_paid');

        $openPurchaseOrders = PurchaseOrder::where('company_id', $profile->company_id)
            ->where('party_id', $profile->party_id)
            ->whereIn('status', ['draft', 'approved', 'sent'])
            ->get(['id', 'total']);

        $openPurchaseOrdersCount = $openPurchaseOrders->count();
        $openPurchaseOrdersValue = (float) $openPurchaseOrders->sum('total');

        // 2. Fetch Vendor Bills
        $bills = VendorBill::where('company_id', $profile->company_id)
            ->where('party_id', $profile->party_id)
            ->latest('date')
            ->take(50)
            ->get()
            ->map(fn ($bill) => [
                'id' => $bill->id,
                'bill_number' => $bill->bill_number,
                'vendor_invoice_ref' => $bill->vendor_invoice_ref,
                'date' => $bill->date?->toDateString(),
                'due_date' => $bill->due_date?->toDateString(),
                'subtotal' => (float) $bill->subtotal,
                'tax_amount' => (float) $bill->tax_amount,
                'total' => (float) $bill->total,
                'amount_paid' => (float) $bill->amount_paid,
                'balance_due' => (float) $bill->balance_due,
                'status' => $bill->status,
            ]);

        // 3. Fetch Purchase Orders
        $orders = PurchaseOrder::where('company_id', $profile->company_id)
            ->where('party_id', $profile->party_id)
            ->latest('date')
            ->take(50)
            ->get()
            ->map(fn ($ord) => [
                'id' => $ord->id,
                'po_number' => $ord->po_number,
                'date' => $ord->date?->toDateString(),
                'expected_delivery_date' => $ord->expected_delivery_date?->toDateString(),
                'subtotal' => (float) $ord->subtotal,
                'tax_amount' => (float) $ord->tax_amount,
                'total' => (float) $ord->total,
                'status' => $ord->status,
                'currency' => $ord->currency ?: 'SAR',
            ]);

        // 4. Compute Dynamic Statement of Account (default: past 90 days or requested period)
        $startDate = $request->query('start_date', now()->subDays(90)->toDateString());
        $endDate = $request->query('end_date', now()->toDateString());
        $statement = $statementQuery->execute($profile->party_id, $startDate, $endDate);

        return Inertia::render('Portal/Supplier/Dashboard', [
            'vendor' => [
                'id' => $party->id,
                'name' => $party->name,
                'name_ar' => $party->name_ar,
                'tax_number' => $party->tax_number,
                'commercial_register' => $party->commercial_register,
                'email' => $party->email,
                'phone' => $party->phone,
                'currency' => $profile->currency ?: 'SAR',
                'payment_terms_days' => $profile->payment_terms_days,
            ],
            'company' => [
                'id' => $company->id,
                'name' => $company->legal_name ?: $company->name,
                'tax_number' => $company->tax_number,
                'email' => $company->settings['email'] ?? null,
                'phone' => $company->settings['phone'] ?? null,
                'currency' => 'SAR',
            ],
            'metrics' => [
                'outstanding_balance' => $outstandingBalance,
                'total_invoiced' => $totalInvoiced,
                'total_paid' => $totalPaid,
                'open_orders_count' => $openPurchaseOrdersCount,
                'open_orders_value' => $openPurchaseOrdersValue,
            ],
            'bills' => $bills,
            'orders' => $orders,
            'statement' => $statement,
            'dateRange' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'portalToken' => $token,
        ]);
    }

    /**
     * Export statement of account as formatted CSV for the supplier.
     */
    public function exportStatement(Request $request, string $token, VendorStatementQuery $statementQuery): StreamedResponse
    {
        $profile = $this->resolveVendorProfile($token);

        $startDate = $request->query('start_date', now()->startOfYear()->toDateString());
        $endDate = $request->query('end_date', now()->toDateString());
        $statement = $statementQuery->execute($profile->party_id, $startDate, $endDate);

        $vendorName = $profile->party?->name ?: 'Vendor';
        $filename = "Statement_{$vendorName}_{$startDate}_to_{$endDate}.csv";

        return response()->streamDownload(function () use ($statement, $profile, $startDate, $endDate): void {
            $handle = fopen('php://output', 'w');
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF)); // UTF-8 BOM

            // Header Meta
            fputcsv($handle, ['كشف حساب المورد / Vendor Statement of Account']);
            fputcsv($handle, ['المورد / Vendor', $profile->party?->name, 'الرقم الضريبي', $profile->party?->tax_number ?: '-']);
            fputcsv($handle, ['الشركة / Client', $profile->company?->legal_name ?: $profile->company?->name, 'الرقم الضريبي', $profile->company?->tax_number ?: '-']);
            fputcsv($handle, ['الفترة من / From', $startDate, 'إلى / To', $endDate]);
            fputcsv($handle, ['الرصيد الافتتاحي / Opening Balance', number_format($statement['opening_balance'], 2, '.', '')]);
            fputcsv($handle, []);

            // Column Titles
            fputcsv($handle, [
                'التاريخ / Date',
                'نوع الحركة / Type',
                'المرجع / Reference',
                'البيان / Notes',
                'مدين (سداد) / Debit',
                'دائن (فواتير) / Credit',
                'الرصيد الجاري / Running Balance',
            ]);

            // Data Rows
            foreach ($statement['transactions'] as $tx) {
                fputcsv($handle, [
                    $tx['date'],
                    $tx['type_ar'].' ('.$tx['type'].')',
                    $tx['reference'],
                    $tx['notes'] ?: '-',
                    $tx['debit'] > 0 ? number_format($tx['debit'], 2, '.', '') : '0.00',
                    $tx['credit'] > 0 ? number_format($tx['credit'], 2, '.', '') : '0.00',
                    number_format($tx['balance'], 2, '.', ''),
                ]);
            }

            fputcsv($handle, []);
            fputcsv($handle, [
                'الإجمالي / Totals',
                '',
                '',
                '',
                number_format($statement['total_debit'], 2, '.', ''),
                number_format($statement['total_credit'], 2, '.', ''),
                number_format($statement['closing_balance'], 2, '.', ''),
            ]);

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    /**
     * Admin action to rotate and regenerate supplier portal token.
     */
    public function regenerateToken(VendorProfile $profile): RedirectResponse
    {
        $companyId = app(CurrentCompany::class)->id();
        if ($profile->company_id !== $companyId) {
            abort(403);
        }

        $profile->portal_token = bin2hex(random_bytes(24));
        $profile->save();

        return back()->with('success', 'تم تجديد رابط بوابة المورد الرقمية بنجاح.');
    }
}
