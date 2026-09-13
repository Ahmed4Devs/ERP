<?php

namespace App\Modules\Localization\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Models\ServiceInvoice;
use App\Modules\Localization\Models\ZatcaConfig;
use App\Modules\Localization\Models\ZatcaLog;
use App\Modules\Localization\Services\Zatca\ZatcaClientService;
use App\Modules\Localization\Services\Zatca\ZatcaCryptographicService;
use App\Shared\Context\CurrentCompany;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;

class ZatcaIntegrationController extends Controller
{
    public function __construct(
        protected ZatcaClientService $clientService,
        protected ZatcaCryptographicService $crypto
    ) {}

    public function index(): Response
    {
        $company = app(CurrentCompany::class)->get();
        $config = $this->clientService->getOrCreateDefaultConfig($company->id, $company->tenant_id);

        $metrics = [
            'cleared_invoices_count' => ServiceInvoice::where('company_id', $company->id)->where('zatca_status', 'cleared')->count(),
            'reported_invoices_count' => ServiceInvoice::where('company_id', $company->id)->where('zatca_status', 'reported')->count(),
            'pending_invoices_count' => ServiceInvoice::where('company_id', $company->id)->where('zatca_status', 'not_submitted')->count(),
            'rejected_invoices_count' => ServiceInvoice::where('company_id', $company->id)->where('zatca_status', 'rejected')->count(),
        ];

        $recentInvoices = ServiceInvoice::where('company_id', $company->id)
            ->whereNotNull('zatca_status')
            ->latest('date')
            ->limit(10)
            ->get(['id', 'invoice_number', 'date', 'total', 'zatca_status', 'zatca_invoice_type', 'zatca_submitted_at']);

        $logs = ZatcaLog::where('company_id', $company->id)
            ->latest()
            ->limit(15)
            ->get();

        return Inertia::render('settings/Zatca/Index', [
            'config' => $config,
            'metrics' => $metrics,
            'recentInvoices' => $recentInvoices,
            'logs' => $logs,
        ]);
    }

    public function updateConfig(Request $request): RedirectResponse
    {
        $company = app(CurrentCompany::class)->get();
        $config = ZatcaConfig::where('company_id', $company->id)->firstOrFail();

        $validated = $request->validate([
            'environment' => ['required', 'in:sandbox,simulation,production'],
            'simulation_mode' => ['required', 'boolean'],
            'vat_number' => ['required', 'string', 'size:15'],
            'branch_name' => ['nullable', 'string', 'max:255'],
            'organization_name' => ['nullable', 'string', 'max:255'],
            'egs_custom_id' => ['nullable', 'string', 'max:100'],
        ]);

        $config->update($validated);

        return back()->with('success', 'تم تحديث إعدادات بوابة زاتكا بنجاح.');
    }

    public function generateCsr(Request $request): RedirectResponse
    {
        $company = app(CurrentCompany::class)->get();
        $config = ZatcaConfig::where('company_id', $company->id)->firstOrFail();

        $keys = $this->crypto->generateKeyPair();
        $csr = $this->crypto->generateCsr(
            $keys['private_key'],
            'EGS-'.$config->egs_uuid,
            $config->organization_name ?: $company->name,
            $config->organization_unit_name ?: 'IT Dept',
            $config->vat_number
        );

        $config->update([
            'private_key' => $keys['private_key'],
            'public_key' => $keys['public_key'],
            'csr' => $csr,
            'status' => 'csr_generated',
        ]);

        return back()->with('success', 'تم توليد مفاتيح التشفير (ECC Keypair) وملف طلب الشهادة (CSR) بنجاح.');
    }

    public function requestCsid(Request $request): RedirectResponse
    {
        $company = app(CurrentCompany::class)->get();
        $config = ZatcaConfig::where('company_id', $company->id)->firstOrFail();

        $validated = $request->validate([
            'otp' => ['nullable', 'string'],
        ]);

        $res = $this->clientService->requestComplianceCsid($config, $validated['otp'] ?? '');

        if ($res['success']) {
            return back()->with('success', 'تم استلام شهادة الامتثال (Compliance CSID) بنجاح من بوابة زاتكا.');
        }

        return back()->with('error', 'فشل الحصول على شهادة الامتثال: '.json_encode($res['response'] ?? []));
    }

    public function runCompliance(Request $request): RedirectResponse
    {
        $company = app(CurrentCompany::class)->get();
        $config = ZatcaConfig::where('company_id', $company->id)->firstOrFail();

        $res = $this->clientService->runComplianceCheck($config);

        if ($res['success']) {
            return back()->with('success', 'تم اجتياز فحوصات الامتثال واستلام شهادة الإنتاج (Production CSID) بنجاح!');
        }

        return back()->with('error', 'فشل اجتياز فحوصات الامتثال: '.json_encode($res['response'] ?? []));
    }

    public function transmitInvoice(Request $request, ServiceInvoice $invoice): RedirectResponse
    {
        $type = $request->input('type', 'standard');

        if ($type === 'standard') {
            $result = $this->clientService->clearStandardInvoice($invoice);
        } else {
            $result = $this->clientService->reportSimplifiedInvoice($invoice);
        }

        if ($result['success']) {
            return back()->with('success', "تم إرسال الفاتورة {$invoice->invoice_number} واعتمادها لدى هيئة الزكاة والضريبة والجمارك ({$result['status']}).");
        }

        return back()->with('error', 'فشل اعتماد الفاتورة لدى زاتكا: '.($invoice->zatca_error ?? 'خطأ في التحقق'));
    }

    public function downloadXml(ServiceInvoice $invoice): HttpResponse
    {
        $xml = $invoice->zatca_cleared_xml ?: $invoice->zatca_xml;

        if (! $xml) {
            abort(404, 'XML file not available for this invoice.');
        }

        return response($xml, 200, [
            'Content-Type' => 'application/xml',
            'Content-Disposition' => "attachment; filename=\"zatca-invoice-{$invoice->invoice_number}.xml\"",
        ]);
    }
}
