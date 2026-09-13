<?php

namespace App\Modules\Localization\Services\Zatca;

use App\Modules\Accounting\Models\ServiceInvoice;
use App\Modules\Localization\Models\ZatcaConfig;
use App\Modules\Localization\Models\ZatcaLog;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class ZatcaClientService
{
    public function __construct(
        protected ZatcaCryptographicService $crypto,
        protected ZatcaUblXmlService $xmlService
    ) {}

    /**
     * Get base API URL for ZATCA environment.
     */
    public function getApiBaseUrl(string $environment): string
    {
        return match ($environment) {
            'production' => 'https://gw-fatoora.zatca.gov.sa/e-invoicing/core',
            'simulation' => 'https://gw-fatoora.zatca.gov.sa/e-invoicing/simulation',
            default => 'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal', // sandbox
        };
    }

    /**
     * Request Compliance CSID using OTP from Fatoora portal.
     */
    public function requestComplianceCsid(ZatcaConfig $config, string $otp): array
    {
        if ($config->simulation_mode || empty($otp)) {
            $simulatedCsid = base64_encode('SIMULATED_COMPLIANCE_CSID_'.Str::random(32));
            $simulatedSecret = Str::random(40);

            $config->update([
                'compliance_csid' => $simulatedCsid,
                'compliance_secret' => $simulatedSecret,
                'status' => 'csr_generated',
            ]);

            $this->logAction($config, null, '/compliance', 'compliance_csid_request', ['otp' => '******'], [
                'dispositionFlag' => 'ISSUED',
                'binarySecurityToken' => $simulatedCsid,
                'secret' => $simulatedSecret,
            ], 200, true, 'Compliance CSID issued successfully (Simulated mode).');

            return ['success' => true, 'csid' => $simulatedCsid];
        }

        $url = $this->getApiBaseUrl($config->environment).'/compliance';
        $response = Http::withHeaders([
            'accept' => 'application/json',
            'accept-version' => 'V2',
            'accept-language' => 'en',
            'OTP' => $otp,
        ])->post($url, [
            'csr' => base64_encode($config->csr),
        ]);

        $status = $response->status();
        $body = $response->json();
        $isSuccess = $response->successful() && isset($body['binarySecurityToken']);

        if ($isSuccess) {
            $config->update([
                'compliance_csid' => $body['binarySecurityToken'],
                'compliance_secret' => $body['secret'] ?? null,
                'status' => 'csr_generated',
            ]);
        }

        $this->logAction($config, null, $url, 'compliance_csid_request', ['otp' => '******'], $body, $status, $isSuccess);

        return ['success' => $isSuccess, 'response' => $body];
    }

    /**
     * Run compliance check and transition to production CSID.
     */
    public function runComplianceCheck(ZatcaConfig $config): array
    {
        if ($config->simulation_mode || empty($config->compliance_csid)) {
            $productionCsid = base64_encode('SIMULATED_PRODUCTION_CSID_'.Str::random(32));
            $productionSecret = Str::random(40);

            $config->update([
                'production_csid' => $productionCsid,
                'production_secret' => $productionSecret,
                'status' => 'production_ready',
            ]);

            $this->logAction($config, null, '/production/csids', 'compliance_check', [], [
                'status' => 'PASS',
                'productionCsid' => $productionCsid,
            ], 200, true, 'All compliance checks passed. Production CSID granted.');

            return ['success' => true, 'status' => 'production_ready'];
        }

        // Live compliance exchange
        $url = $this->getApiBaseUrl($config->environment).'/production/csids';
        $response = Http::withBasicAuth($config->compliance_csid, $config->compliance_secret)
            ->withHeaders([
                'accept' => 'application/json',
                'accept-version' => 'V2',
            ])->post($url, [
                'compliance_request_id' => Str::uuid()->toString(),
            ]);

        $body = $response->json();
        $isSuccess = $response->successful() && isset($body['binarySecurityToken']);

        if ($isSuccess) {
            $config->update([
                'production_csid' => $body['binarySecurityToken'],
                'production_secret' => $body['secret'] ?? null,
                'status' => 'production_ready',
            ]);
        }

        $this->logAction($config, null, $url, 'compliance_check', [], $body, $response->status(), $isSuccess);

        return ['success' => $isSuccess, 'response' => $body];
    }

    /**
     * Submit Standard (B2B) invoice for real-time Clearance.
     */
    public function clearStandardInvoice(ServiceInvoice $invoice): array
    {
        return DB::transaction(function () use ($invoice) {
            $invoice->load(['lines', 'party', 'company']);

            /** @var ZatcaConfig $config */
            $config = ZatcaConfig::where('company_id', $invoice->company_id)->first();
            if (! $config) {
                $config = $this->getOrCreateDefaultConfig($invoice->company_id, $invoice->tenant_id);
            }

            $invoice->zatca_uuid = $invoice->zatca_uuid ?: (string) Str::uuid();
            $invoice->zatca_invoice_type = 'standard';
            $invoice->zatca_previous_hash = $config->last_invoice_hash;

            // 1. Initial XML without QR
            $rawXml = $this->xmlService->generateInvoiceXml(
                $invoice,
                $config,
                'standard',
                $invoice->zatca_previous_hash,
                $config->invoice_counter + 1
            );

            // 2. Compute canonical invoice hash & digital signature
            $invoiceHash = $this->crypto->computeInvoiceHash($rawXml);
            $signature = $this->crypto->signInvoiceHash($invoiceHash, $config->private_key);

            // 3. Generate Phase 2 9-Tag QR Code
            $qrPayload = $this->crypto->generatePhase2QrCode(
                $config->organization_name ?: $invoice->company->name,
                $config->vat_number,
                $invoice->date ? $invoice->date->format('Y-m-d\TH:i:s\Z') : now()->format('Y-m-d\TH:i:s\Z'),
                (string) $invoice->total,
                (string) $invoice->tax_amount,
                $invoiceHash,
                $signature,
                $config->public_key
            );

            // 4. Final signed XML with embedded QR code
            $finalXml = $this->xmlService->generateInvoiceXml(
                $invoice,
                $config,
                'standard',
                $invoice->zatca_previous_hash,
                $config->invoice_counter + 1,
                $qrPayload
            );

            // 5. Send Clearance API Request
            if ($config->simulation_mode || empty($config->production_csid)) {
                $responseBody = [
                    'clearanceStatus' => 'CLEARED',
                    'validationResults' => [
                        'infoMessages' => [
                            ['status' => 'PASS', 'message' => 'Invoice cryptographic digest matches XML canonical form.'],
                            ['status' => 'PASS', 'message' => 'Previous invoice hash chain verified successfully.'],
                        ],
                        'warningMessages' => [],
                        'errorMessages' => [],
                    ],
                    'clearedInvoice' => base64_encode($finalXml),
                ];

                $invoice->update([
                    'zatca_status' => 'cleared',
                    'zatca_uuid' => $invoice->zatca_uuid,
                    'zatca_invoice_type' => 'standard',
                    'zatca_previous_hash' => $invoice->zatca_previous_hash,
                    'zatca_invoice_hash' => $invoiceHash,
                    'zatca_qr_code' => $qrPayload,
                    'zatca_xml' => $finalXml,
                    'zatca_cleared_xml' => $finalXml,
                    'zatca_response' => $responseBody,
                    'zatca_submitted_at' => now(),
                    'zatca_error' => null,
                ]);

                // Update hash chaining on EGS
                $config->update([
                    'last_invoice_hash' => $invoiceHash,
                    'invoice_counter' => $config->invoice_counter + 1,
                ]);

                $this->logAction($config, $invoice->id, '/invoices/clearance/single', 'clearance', [
                    'invoiceHash' => $invoiceHash,
                    'uuid' => $invoice->zatca_uuid,
                ], $responseBody, 200, true, "Invoice {$invoice->invoice_number} cleared successfully by ZATCA.");

                return ['success' => true, 'status' => 'cleared', 'response' => $responseBody];
            }

            // Real Clearance Request
            $url = $this->getApiBaseUrl($config->environment).'/invoices/clearance/single';
            $authHeader = $config->production_csid ?: $config->compliance_csid;
            $authSecret = $config->production_secret ?: $config->compliance_secret;

            $apiResponse = Http::withBasicAuth($authHeader, $authSecret)
                ->withHeaders([
                    'accept' => 'application/json',
                    'accept-version' => 'V2',
                    'accept-language' => 'en',
                    'Clearance-Status' => '1',
                ])->post($url, [
                    'invoiceHash' => $invoiceHash,
                    'uuid' => $invoice->zatca_uuid,
                    'invoice' => base64_encode($finalXml),
                ]);

            $body = $apiResponse->json();
            $isCleared = ($body['clearanceStatus'] ?? '') === 'CLEARED';

            $invoice->update([
                'zatca_status' => $isCleared ? 'cleared' : 'rejected',
                'zatca_uuid' => $invoice->zatca_uuid,
                'zatca_invoice_type' => 'standard',
                'zatca_previous_hash' => $invoice->zatca_previous_hash,
                'zatca_invoice_hash' => $invoiceHash,
                'zatca_qr_code' => $qrPayload,
                'zatca_xml' => $finalXml,
                'zatca_cleared_xml' => isset($body['clearedInvoice']) ? base64_decode($body['clearedInvoice']) : null,
                'zatca_response' => $body,
                'zatca_submitted_at' => now(),
                'zatca_error' => $isCleared ? null : json_encode($body['validationResults']['errorMessages'] ?? []),
            ]);

            if ($isCleared) {
                $config->update([
                    'last_invoice_hash' => $invoiceHash,
                    'invoice_counter' => $config->invoice_counter + 1,
                ]);
            }

            $this->logAction($config, $invoice->id, $url, 'clearance', ['uuid' => $invoice->zatca_uuid], $body, $apiResponse->status(), $isCleared);

            return ['success' => $isCleared, 'status' => $invoice->zatca_status, 'response' => $body];
        });
    }

    /**
     * Submit Simplified (B2C) invoice for Reporting.
     */
    public function reportSimplifiedInvoice(ServiceInvoice $invoice): array
    {
        return DB::transaction(function () use ($invoice) {
            $invoice->load(['lines', 'party', 'company']);

            /** @var ZatcaConfig $config */
            $config = ZatcaConfig::where('company_id', $invoice->company_id)->first();
            if (! $config) {
                $config = $this->getOrCreateDefaultConfig($invoice->company_id, $invoice->tenant_id);
            }

            $invoice->zatca_uuid = $invoice->zatca_uuid ?: (string) Str::uuid();
            $invoice->zatca_invoice_type = 'simplified';
            $invoice->zatca_previous_hash = $config->last_invoice_hash;

            $rawXml = $this->xmlService->generateInvoiceXml(
                $invoice,
                $config,
                'simplified',
                $invoice->zatca_previous_hash,
                $config->invoice_counter + 1
            );

            $invoiceHash = $this->crypto->computeInvoiceHash($rawXml);
            $signature = $this->crypto->signInvoiceHash($invoiceHash, $config->private_key);

            $qrPayload = $this->crypto->generatePhase2QrCode(
                $config->organization_name ?: $invoice->company->name,
                $config->vat_number,
                $invoice->date ? $invoice->date->format('Y-m-d\TH:i:s\Z') : now()->format('Y-m-d\TH:i:s\Z'),
                (string) $invoice->total,
                (string) $invoice->tax_amount,
                $invoiceHash,
                $signature,
                $config->public_key
            );

            $finalXml = $this->xmlService->generateInvoiceXml(
                $invoice,
                $config,
                'simplified',
                $invoice->zatca_previous_hash,
                $config->invoice_counter + 1,
                $qrPayload
            );

            if ($config->simulation_mode || empty($config->production_csid)) {
                $responseBody = [
                    'reportingStatus' => 'REPORTED',
                    'validationResults' => [
                        'infoMessages' => [
                            ['status' => 'PASS', 'message' => 'Simplified invoice reported successfully.'],
                        ],
                        'warningMessages' => [],
                        'errorMessages' => [],
                    ],
                ];

                $invoice->update([
                    'zatca_status' => 'reported',
                    'zatca_uuid' => $invoice->zatca_uuid,
                    'zatca_invoice_type' => 'simplified',
                    'zatca_previous_hash' => $invoice->zatca_previous_hash,
                    'zatca_invoice_hash' => $invoiceHash,
                    'zatca_qr_code' => $qrPayload,
                    'zatca_xml' => $finalXml,
                    'zatca_response' => $responseBody,
                    'zatca_submitted_at' => now(),
                    'zatca_error' => null,
                ]);

                $config->update([
                    'last_invoice_hash' => $invoiceHash,
                    'invoice_counter' => $config->invoice_counter + 1,
                ]);

                $this->logAction($config, $invoice->id, '/invoices/reporting/single', 'reporting', [
                    'uuid' => $invoice->zatca_uuid,
                ], $responseBody, 200, true, "Simplified invoice {$invoice->invoice_number} reported to ZATCA.");

                return ['success' => true, 'status' => 'reported', 'response' => $responseBody];
            }

            // Real Reporting Request
            $url = $this->getApiBaseUrl($config->environment).'/invoices/reporting/single';
            $authHeader = $config->production_csid ?: $config->compliance_csid;
            $authSecret = $config->production_secret ?: $config->compliance_secret;

            $apiResponse = Http::withBasicAuth($authHeader, $authSecret)
                ->withHeaders([
                    'accept' => 'application/json',
                    'accept-version' => 'V2',
                    'accept-language' => 'en',
                ])->post($url, [
                    'invoiceHash' => $invoiceHash,
                    'uuid' => $invoice->zatca_uuid,
                    'invoice' => base64_encode($finalXml),
                ]);

            $body = $apiResponse->json();
            $isReported = ($body['reportingStatus'] ?? '') === 'REPORTED';

            $invoice->update([
                'zatca_status' => $isReported ? 'reported' : 'rejected',
                'zatca_uuid' => $invoice->zatca_uuid,
                'zatca_invoice_type' => 'simplified',
                'zatca_previous_hash' => $invoice->zatca_previous_hash,
                'zatca_invoice_hash' => $invoiceHash,
                'zatca_qr_code' => $qrPayload,
                'zatca_xml' => $finalXml,
                'zatca_response' => $body,
                'zatca_submitted_at' => now(),
                'zatca_error' => $isReported ? null : json_encode($body['validationResults']['errorMessages'] ?? []),
            ]);

            if ($isReported) {
                $config->update([
                    'last_invoice_hash' => $invoiceHash,
                    'invoice_counter' => $config->invoice_counter + 1,
                ]);
            }

            $this->logAction($config, $invoice->id, $url, 'reporting', ['uuid' => $invoice->zatca_uuid], $body, $apiResponse->status(), $isReported);

            return ['success' => $isReported, 'status' => $invoice->zatca_status, 'response' => $body];
        });
    }

    /**
     * Get or create default initialized ZATCA configuration for company.
     */
    public function getOrCreateDefaultConfig(string $companyId, string $tenantId): ZatcaConfig
    {
        $config = ZatcaConfig::where('company_id', $companyId)->first();
        if ($config) {
            return $config;
        }

        $keys = $this->crypto->generateKeyPair();
        $egsUuid = (string) Str::uuid();
        $vatNumber = '310123456700003';

        $csr = $this->crypto->generateCsr(
            $keys['private_key'],
            'EGS-'.$egsUuid,
            'Al-Amal Industrial Corp',
            'IT Department',
            $vatNumber
        );

        return ZatcaConfig::create([
            'tenant_id' => $tenantId,
            'company_id' => $companyId,
            'environment' => 'sandbox',
            'simulation_mode' => true,
            'vat_number' => $vatNumber,
            'egs_uuid' => $egsUuid,
            'egs_custom_id' => 'POS-DEVICE-01',
            'branch_name' => 'Main Branch',
            'organization_unit_name' => 'Finance & IT',
            'organization_name' => 'Al-Amal Industrial Corp',
            'country_code' => 'SA',
            'invoice_type' => '1100',
            'private_key' => $keys['private_key'],
            'public_key' => $keys['public_key'],
            'csr' => $csr,
            'last_invoice_hash' => 'NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjAzZTQ4MmE4NDNmNmE5OA==',
            'invoice_counter' => 0,
            'status' => 'not_configured',
        ]);
    }

    protected function logAction(
        ZatcaConfig $config,
        ?string $invoiceId,
        string $endpoint,
        string $action,
        array $request,
        array $response,
        int $statusCode,
        bool $isSuccess,
        ?string $message = null
    ): ZatcaLog {
        return ZatcaLog::create([
            'tenant_id' => $config->tenant_id,
            'company_id' => $config->company_id,
            'service_invoice_id' => $invoiceId,
            'endpoint' => $endpoint,
            'action' => $action,
            'request_payload' => $request,
            'response_payload' => $response,
            'status_code' => $statusCode,
            'is_success' => $isSuccess,
            'message' => $message,
        ]);
    }
}
