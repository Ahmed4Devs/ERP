<?php

namespace App\Modules\Localization\Services;

class ZatcaQrCodeService
{
    /**
     * Generate standard ZATCA Phase 1 & 2 compliant Base64 TLV string.
     *
     * @param  string  $timestamp  ISO 8601 formatted date string
     * @param  string  $totalWithVat  Total amount including VAT
     * @param  string  $vatTotal  Total VAT amount
     * @return string Base64 encoded TLV payload
     */
    public function generateTlvPayload(
        string $sellerName,
        string $vatNumber,
        string $timestamp,
        string $totalWithVat,
        string $vatTotal
    ): string {
        $tlv = $this->packTag(1, $sellerName).
               $this->packTag(2, $vatNumber).
               $this->packTag(3, $timestamp).
               $this->packTag(4, $totalWithVat).
               $this->packTag(5, $vatTotal);

        return base64_encode($tlv);
    }

    /**
     * Alias for generateTlvPayload for backward/forward compatibility.
     */
    public function generateBase64Tlv(
        string $sellerName,
        string $vatNumber,
        string $timestamp,
        string $totalWithVat,
        string $vatTotal
    ): string {
        return $this->generateTlvPayload($sellerName, $vatNumber, $timestamp, $totalWithVat, $vatTotal);
    }

    /**
     * Pack single Tag-Length-Value component.
     */
    protected function packTag(int $tag, string $value): string
    {
        $tagByte = chr($tag);
        $len = strlen($value);
        $lenByte = chr($len);

        return $tagByte.$lenByte.$value;
    }
}
