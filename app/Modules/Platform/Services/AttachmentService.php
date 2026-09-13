<?php

namespace App\Modules\Platform\Services;

use App\Modules\Platform\Models\Attachment;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AttachmentService
{
    /**
     * Upload and link a file to an attachable model.
     */
    public function upload(UploadedFile $file, Model $attachable, array $metadata = []): Attachment
    {
        $currentTenant = app(CurrentTenant::class);
        $currentCompany = app(CurrentCompany::class);

        $tenantId = $metadata['tenant_id'] ?? $currentTenant->id();
        $companyId = $metadata['company_id'] ?? $currentCompany->id();

        $originalName = $file->getClientOriginalName();
        $mimeType = $file->getClientMimeType() ?: 'application/octet-stream';
        $fileSize = $file->getSize();

        // Store file in secure tenant/company folder
        $path = $file->store("attachments/{$companyId}", 'local');

        return Attachment::create([
            'tenant_id' => $tenantId,
            'company_id' => $companyId,
            'attachable_type' => $attachable->getMorphClass(),
            'attachable_id' => (string) $attachable->getKey(),
            'file_name' => $originalName,
            'file_path' => $path,
            'file_size' => $fileSize,
            'mime_type' => $mimeType,
            'category' => $metadata['category'] ?? 'general',
            'description' => $metadata['description'] ?? null,
            'uploaded_by_id' => auth()->id(),
        ]);
    }

    /**
     * Download the attachment securely with proper headers.
     */
    public function download(Attachment $attachment): StreamedResponse
    {
        $currentCompany = app(CurrentCompany::class);
        if ($attachment->company_id !== $currentCompany->id()) {
            abort(403, 'Unauthorized attachment access.');
        }

        if (! Storage::disk('local')->exists($attachment->file_path)) {
            abort(404, 'File not found in storage.');
        }

        return Storage::disk('local')->download(
            $attachment->file_path,
            $attachment->file_name,
            ['Content-Type' => $attachment->mime_type]
        );
    }

    /**
     * Delete an attachment and its stored file.
     */
    public function delete(Attachment $attachment): bool
    {
        $currentCompany = app(CurrentCompany::class);
        if ($attachment->company_id !== $currentCompany->id()) {
            abort(403, 'Unauthorized attachment delete.');
        }

        if (Storage::disk('local')->exists($attachment->file_path)) {
            Storage::disk('local')->delete($attachment->file_path);
        }

        return (bool) $attachment->delete();
    }
}
