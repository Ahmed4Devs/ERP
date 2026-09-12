<?php

namespace App\Modules\Localization\Services;

use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Throwable;

class QrCodeSvgService
{
    /**
     * Render string payload to standalone SVG XML.
     */
    public function generateSvg(string $payload, int $size = 180): string
    {
        try {
            $renderer = new ImageRenderer(
                new RendererStyle($size, 1),
                new SvgImageBackEnd
            );

            $writer = new Writer($renderer);

            return $writer->writeString($payload);
        } catch (Throwable) {
            // Fallback lightweight SVG placeholder if BaconQrCode encounters an unexpected character/size issue
            return '<svg xmlns="http://www.w3.org/2000/svg" width="'.$size.'" height="'.$size.'" viewBox="0 0 '.$size.' '.$size.'"><rect width="100%" height="100%" fill="#f1f5f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="12" fill="#64748b">QR Error</text></svg>';
        }
    }

    /**
     * Render string payload to inline Data URI format (data:image/svg+xml;base64,...).
     */
    public function generateDataUri(string $payload, int $size = 180): string
    {
        $svg = $this->generateSvg($payload, $size);

        return 'data:image/svg+xml;base64,'.base64_encode($svg);
    }
}
