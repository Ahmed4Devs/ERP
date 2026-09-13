<?php

namespace App\Modules\Platform\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Platform\Models\Attachment;
use App\Modules\Platform\Services\AttachmentService;
use App\Shared\Context\CurrentCompany;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AttachmentController extends Controller
{
    public function __construct(
        protected AttachmentService $attachmentService
    ) {}

    public function listFor(Request $request): JsonResponse
    {
        $request->validate([
            'attachable_type' => ['required', 'string'],
            'attachable_id' => ['required', 'string'],
        ]);

        $currentCompany = app(CurrentCompany::class);

        $attachments = Attachment::where('company_id', $currentCompany->id())
            ->where('attachable_type', $request->input('attachable_type'))
            ->where('attachable_id', $request->input('attachable_id'))
            ->with('uploadedBy')
            ->latest()
            ->get();

        return response()->json($attachments);
    }

    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'max:20480'], // max 20MB
            'attachable_type' => ['required', 'string'],
            'attachable_id' => ['required', 'string'],
            'category' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
        ]);

        $modelClass = $request->input('attachable_type');
        if (! class_exists($modelClass)) {
            return response()->json(['message' => 'Invalid attachable type.'], 422);
        }

        $attachable = $modelClass::findOrFail($request->input('attachable_id'));

        $attachment = $this->attachmentService->upload(
            $request->file('file'),
            $attachable,
            [
                'category' => $request->input('category', 'general'),
                'description' => $request->input('description'),
            ]
        );

        return response()->json([
            'message' => 'File uploaded successfully.',
            'attachment' => $attachment->load('uploadedBy'),
        ], 201);
    }

    public function download(Attachment $attachment): StreamedResponse
    {
        return $this->attachmentService->download($attachment);
    }

    public function destroy(Attachment $attachment): JsonResponse
    {
        $this->attachmentService->delete($attachment);

        return response()->json(['message' => 'Attachment deleted successfully.']);
    }
}
