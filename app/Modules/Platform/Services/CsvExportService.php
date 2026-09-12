<?php

namespace App\Modules\Platform\Services;

use Symfony\Component\HttpFoundation\StreamedResponse;

class CsvExportService
{
    /**
     * Generate streamed CSV response with UTF-8 BOM for Microsoft Excel compatibility.
     *
     * @param  string  $filename  Download filename (e.g. 'trial-balance-2026-09-12.csv')
     * @param  array<int, string>  $headers  Header column labels (Arabic or English)
     * @param  iterable<int, array<int, mixed>>  $rows  Data rows generator or array
     */
    public function stream(string $filename, array $headers, iterable $rows): StreamedResponse
    {
        $response = new StreamedResponse(function () use ($headers, $rows): void {
            $handle = fopen('php://output', 'w');

            // UTF-8 BOM for Microsoft Excel Arabic rendering
            fwrite($handle, "\xEF\xBB\xBF");

            // Write CSV column headers
            fputcsv($handle, $headers);

            // Stream rows efficiently
            foreach ($rows as $row) {
                fputcsv($handle, (array) $row);
            }

            fclose($handle);
        });

        $response->headers->set('Content-Type', 'text/csv; charset=UTF-8');
        $response->headers->set('Content-Disposition', "attachment; filename=\"{$filename}\"");
        $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0');
        $response->headers->set('Pragma', 'no-cache');

        return $response;
    }
}
