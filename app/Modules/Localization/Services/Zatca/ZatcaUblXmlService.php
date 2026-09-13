<?php

namespace App\Modules\Localization\Services\Zatca;

use App\Modules\Accounting\Models\ServiceInvoice;
use App\Modules\Localization\Models\ZatcaConfig;
use Illuminate\Support\Str;

class ZatcaUblXmlService
{
    /**
     * Build standard ZATCA compliant UBL 2.1 XML document.
     */
    public function generateInvoiceXml(
        ServiceInvoice $invoice,
        ZatcaConfig $config,
        string $invoiceType = 'standard',
        ?string $previousHash = null,
        ?int $counter = null,
        ?string $qrCode = null
    ): string {
        $uuid = $invoice->zatca_uuid ?: (string) Str::uuid();
        $pih = $previousHash ?: $config->last_invoice_hash;
        $icv = $counter ?: ($config->invoice_counter + 1);

        $subTypeCode = $invoiceType === 'standard' ? '0100000' : '0200000';
        $issueDate = $invoice->date ? $invoice->date->format('Y-m-d') : now()->format('Y-m-d');
        $issueTime = now()->format('H:i:s');

        $subtotal = number_format((float) $invoice->subtotal, 2, '.', '');
        $taxAmount = number_format((float) $invoice->tax_amount, 2, '.', '');
        $total = number_format((float) $invoice->total, 2, '.', '');

        $sellerName = htmlspecialchars($config->organization_name ?: $invoice->company->name ?? 'Company', ENT_XML1);
        $sellerVat = htmlspecialchars($config->vat_number, ENT_XML1);
        $branchName = htmlspecialchars($config->branch_name ?: 'Riyadh Main', ENT_XML1);

        $customerName = htmlspecialchars($invoice->party?->name ?? 'Walk-in Customer', ENT_XML1);
        $customerVat = htmlspecialchars($invoice->party?->tax_id ?? '300000000000003', ENT_XML1);

        $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n";
        $xml .= '<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" ';
        $xml .= 'xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" ';
        $xml .= 'xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" ';
        $xml .= 'xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">'."\n";

        // UBL Profile & Identification
        $xml .= "    <cbc:ProfileID>reporting:1.0</cbc:ProfileID>\n";
        $xml .= "    <cbc:ID>{$invoice->invoice_number}</cbc:ID>\n";
        $xml .= "    <cbc:UUID>{$uuid}</cbc:UUID>\n";
        $xml .= "    <cbc:IssueDate>{$issueDate}</cbc:IssueDate>\n";
        $xml .= "    <cbc:IssueTime>{$issueTime}</cbc:IssueTime>\n";
        $xml .= "    <cbc:InvoiceTypeCode name=\"{$subTypeCode}\">388</cbc:InvoiceTypeCode>\n";
        $xml .= "    <cbc:DocumentCurrencyCode>SAR</cbc:DocumentCurrencyCode>\n";
        $xml .= "    <cbc:TaxCurrencyCode>SAR</cbc:TaxCurrencyCode>\n";

        // Invoice Counter Value (ICV)
        $xml .= "    <cac:AdditionalDocumentReference>\n";
        $xml .= "        <cbc:ID>ICV</cbc:ID>\n";
        $xml .= "        <cbc:UUID>{$icv}</cbc:UUID>\n";
        $xml .= "    </cac:AdditionalDocumentReference>\n";

        // Previous Invoice Hash (PIH)
        $xml .= "    <cac:AdditionalDocumentReference>\n";
        $xml .= "        <cbc:ID>PIH</cbc:ID>\n";
        $xml .= "        <cac:Attachment>\n";
        $xml .= "            <cbc:EmbeddedDocumentBinaryObject mimeCode=\"text/plain\">{$pih}</cbc:EmbeddedDocumentBinaryObject>\n";
        $xml .= "        </cac:Attachment>\n";
        $xml .= "    </cac:AdditionalDocumentReference>\n";

        // QR Code Reference (if present)
        if ($qrCode) {
            $xml .= "    <cac:AdditionalDocumentReference>\n";
            $xml .= "        <cbc:ID>QR</cbc:ID>\n";
            $xml .= "        <cac:Attachment>\n";
            $xml .= "            <cbc:EmbeddedDocumentBinaryObject mimeCode=\"text/plain\">{$qrCode}</cbc:EmbeddedDocumentBinaryObject>\n";
            $xml .= "        </cac:Attachment>\n";
            $xml .= "    </cac:AdditionalDocumentReference>\n";
        }

        // Supplier (Seller) Party
        $xml .= "    <cac:AccountingSupplierParty>\n";
        $xml .= "        <cac:Party>\n";
        $xml .= "            <cac:PartyIdentification>\n";
        $xml .= "                <cbc:ID schemeID=\"CRN\">1010000000</cbc:ID>\n";
        $xml .= "            </cac:PartyIdentification>\n";
        $xml .= "            <cac:PostalAddress>\n";
        $xml .= "                <cbc:StreetName>King Fahd Road</cbc:StreetName>\n";
        $xml .= "                <cbc:BuildingNumber>1234</cbc:BuildingNumber>\n";
        $xml .= "                <cbc:CitySubdivisionName>{$branchName}</cbc:CitySubdivisionName>\n";
        $xml .= "                <cbc:CityName>Riyadh</cbc:CityName>\n";
        $xml .= "                <cbc:PostalZone>12345</cbc:PostalZone>\n";
        $xml .= "                <cac:Country>\n";
        $xml .= "                    <cbc:IdentificationCode>SA</cbc:IdentificationCode>\n";
        $xml .= "                </cac:Country>\n";
        $xml .= "            </cac:PostalAddress>\n";
        $xml .= "            <cac:PartyTaxScheme>\n";
        $xml .= "                <cbc:CompanyID>{$sellerVat}</cbc:CompanyID>\n";
        $xml .= "                <cac:TaxScheme>\n";
        $xml .= "                    <cbc:ID>VAT</cbc:ID>\n";
        $xml .= "                </cac:TaxScheme>\n";
        $xml .= "            </cac:PartyTaxScheme>\n";
        $xml .= "            <cac:PartyLegalEntity>\n";
        $xml .= "                <cbc:RegistrationName>{$sellerName}</cbc:RegistrationName>\n";
        $xml .= "            </cac:PartyLegalEntity>\n";
        $xml .= "        </cac:Party>\n";
        $xml .= "    </cac:AccountingSupplierParty>\n";

        // Customer (Buyer) Party
        $xml .= "    <cac:AccountingCustomerParty>\n";
        $xml .= "        <cac:Party>\n";
        $xml .= "            <cac:PostalAddress>\n";
        $xml .= "                <cbc:StreetName>Olaya St</cbc:StreetName>\n";
        $xml .= "                <cbc:BuildingNumber>5678</cbc:BuildingNumber>\n";
        $xml .= "                <cbc:CityName>Riyadh</cbc:CityName>\n";
        $xml .= "                <cbc:PostalZone>11564</cbc:PostalZone>\n";
        $xml .= "                <cac:Country>\n";
        $xml .= "                    <cbc:IdentificationCode>SA</cbc:IdentificationCode>\n";
        $xml .= "                </cac:Country>\n";
        $xml .= "            </cac:PostalAddress>\n";
        if ($invoiceType === 'standard') {
            $xml .= "            <cac:PartyTaxScheme>\n";
            $xml .= "                <cbc:CompanyID>{$customerVat}</cbc:CompanyID>\n";
            $xml .= "                <cac:TaxScheme>\n";
            $xml .= "                    <cbc:ID>VAT</cbc:ID>\n";
            $xml .= "                </cac:TaxScheme>\n";
            $xml .= "            </cac:PartyTaxScheme>\n";
        }
        $xml .= "            <cac:PartyLegalEntity>\n";
        $xml .= "                <cbc:RegistrationName>{$customerName}</cbc:RegistrationName>\n";
        $xml .= "            </cac:PartyLegalEntity>\n";
        $xml .= "        </cac:Party>\n";
        $xml .= "    </cac:AccountingCustomerParty>\n";

        // Delivery
        $xml .= "    <cac:Delivery>\n";
        $xml .= "        <cbc:ActualDeliveryDate>{$issueDate}</cbc:ActualDeliveryDate>\n";
        $xml .= "    </cac:Delivery>\n";

        // Payment Means (10 = In cash, 42 = Payment to bank account)
        $xml .= "    <cac:PaymentMeans>\n";
        $xml .= "        <cbc:PaymentMeansCode>42</cbc:PaymentMeansCode>\n";
        $xml .= "    </cac:PaymentMeans>\n";

        // Tax Total
        $xml .= "    <cac:TaxTotal>\n";
        $xml .= "        <cbc:TaxAmount currencyID=\"SAR\">{$taxAmount}</cbc:TaxAmount>\n";
        $xml .= "        <cac:TaxSubtotal>\n";
        $xml .= "            <cbc:TaxableAmount currencyID=\"SAR\">{$subtotal}</cbc:TaxableAmount>\n";
        $xml .= "            <cbc:TaxAmount currencyID=\"SAR\">{$taxAmount}</cbc:TaxAmount>\n";
        $xml .= "            <cac:TaxCategory>\n";
        $xml .= "                <cbc:ID>S</cbc:ID>\n";
        $xml .= "                <cbc:Percent>15.00</cbc:Percent>\n";
        $xml .= "                <cac:TaxScheme>\n";
        $xml .= "                    <cbc:ID>VAT</cbc:ID>\n";
        $xml .= "                </cac:TaxScheme>\n";
        $xml .= "            </cac:TaxCategory>\n";
        $xml .= "        </cac:TaxSubtotal>\n";
        $xml .= "    </cac:TaxTotal>\n";

        // Legal Monetary Total
        $xml .= "    <cac:LegalMonetaryTotal>\n";
        $xml .= "        <cbc:LineExtensionAmount currencyID=\"SAR\">{$subtotal}</cbc:LineExtensionAmount>\n";
        $xml .= "        <cbc:TaxExclusiveAmount currencyID=\"SAR\">{$subtotal}</cbc:TaxExclusiveAmount>\n";
        $xml .= "        <cbc:TaxInclusiveAmount currencyID=\"SAR\">{$total}</cbc:TaxInclusiveAmount>\n";
        $xml .= "        <cbc:PayableAmount currencyID=\"SAR\">{$total}</cbc:PayableAmount>\n";
        $xml .= "    </cac:LegalMonetaryTotal>\n";

        // Invoice Lines
        $lines = $invoice->lines ?? [];
        if (count($lines) === 0) {
            // Default single line for general service invoice
            $xml .= "    <cac:InvoiceLine>\n";
            $xml .= "        <cbc:ID>1</cbc:ID>\n";
            $xml .= "        <cbc:InvoicedQuantity unitCode=\"PCE\">1.00</cbc:InvoicedQuantity>\n";
            $xml .= "        <cbc:LineExtensionAmount currencyID=\"SAR\">{$subtotal}</cbc:LineExtensionAmount>\n";
            $xml .= "        <cac:TaxTotal>\n";
            $xml .= "            <cbc:TaxAmount currencyID=\"SAR\">{$taxAmount}</cbc:TaxAmount>\n";
            $xml .= "            <cbc:RoundingAmount currencyID=\"SAR\">{$total}</cbc:RoundingAmount>\n";
            $xml .= "        </cac:TaxTotal>\n";
            $xml .= "        <cac:Item>\n";
            $xml .= "            <cbc:Name>Services Rendered</cbc:Name>\n";
            $xml .= "            <cac:ClassifiedTaxCategory>\n";
            $xml .= "                <cbc:ID>S</cbc:ID>\n";
            $xml .= "                <cbc:Percent>15.00</cbc:Percent>\n";
            $xml .= "                <cac:TaxScheme>\n";
            $xml .= "                    <cbc:ID>VAT</cbc:ID>\n";
            $xml .= "                </cac:TaxScheme>\n";
            $xml .= "            </cac:ClassifiedTaxCategory>\n";
            $xml .= "        </cac:Item>\n";
            $xml .= "        <cac:Price>\n";
            $xml .= "            <cbc:PriceAmount currencyID=\"SAR\">{$subtotal}</cbc:PriceAmount>\n";
            $xml .= "        </cac:Price>\n";
            $xml .= "    </cac:InvoiceLine>\n";
        } else {
            $lineNumber = 1;
            foreach ($lines as $line) {
                $lineQty = number_format((float) ($line->quantity ?? 1), 2, '.', '');
                $lineAmount = number_format((float) ($line->subtotal ?? $line->amount ?? 0), 2, '.', '');
                $lineTax = number_format((float) ($line->tax_amount ?? 0), 2, '.', '');
                $lineUnit = number_format((float) ($line->unit_price ?? $lineAmount), 2, '.', '');
                $lineDesc = htmlspecialchars($line->description ?? "Item {$lineNumber}", ENT_XML1);

                $xml .= "    <cac:InvoiceLine>\n";
                $xml .= "        <cbc:ID>{$lineNumber}</cbc:ID>\n";
                $xml .= "        <cbc:InvoicedQuantity unitCode=\"PCE\">{$lineQty}</cbc:InvoicedQuantity>\n";
                $xml .= "        <cbc:LineExtensionAmount currencyID=\"SAR\">{$lineAmount}</cbc:LineExtensionAmount>\n";
                $xml .= "        <cac:TaxTotal>\n";
                $xml .= "            <cbc:TaxAmount currencyID=\"SAR\">{$lineTax}</cbc:TaxAmount>\n";
                $xml .= '            <cbc:RoundingAmount currencyID="SAR">'.number_format((float) $lineAmount + (float) $lineTax, 2, '.', '')."</cbc:RoundingAmount>\n";
                $xml .= "        </cac:TaxTotal>\n";
                $xml .= "        <cac:Item>\n";
                $xml .= "            <cbc:Name>{$lineDesc}</cbc:Name>\n";
                $xml .= "            <cac:ClassifiedTaxCategory>\n";
                $xml .= "                <cbc:ID>S</cbc:ID>\n";
                $xml .= "                <cbc:Percent>15.00</cbc:Percent>\n";
                $xml .= "                <cac:TaxScheme>\n";
                $xml .= "                    <cbc:ID>VAT</cbc:ID>\n";
                $xml .= "                </cac:TaxScheme>\n";
                $xml .= "            </cac:ClassifiedTaxCategory>\n";
                $xml .= "        </cac:Item>\n";
                $xml .= "        <cac:Price>\n";
                $xml .= "            <cbc:PriceAmount currencyID=\"SAR\">{$lineUnit}</cbc:PriceAmount>\n";
                $xml .= "        </cac:Price>\n";
                $xml .= "    </cac:InvoiceLine>\n";
                $lineNumber++;
            }
        }

        $xml .= '</Invoice>';

        return $xml;
    }
}
