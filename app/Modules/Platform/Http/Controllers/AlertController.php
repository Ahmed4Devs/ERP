<?php

namespace App\Modules\Platform\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Platform\Models\SystemAlert;
use App\Modules\Platform\Services\AlertEngineService;
use App\Shared\Context\CurrentCompany;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AlertController extends Controller
{
    public function __construct(
        protected AlertEngineService $alertEngine
    ) {}

    public function index(Request $request): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        // Run auto-scan when viewing alerts page
        $this->alertEngine->scanAllAlerts($companyId);

        $severity = $request->input('severity');
        $type = $request->input('type');

        $query = SystemAlert::where('company_id', $companyId)
            ->where('is_dismissed', false);

        if ($severity) {
            $query->where('severity', $severity);
        }

        if ($type) {
            $query->where('alert_type', $type);
        }

        $alerts = $query->latest()->paginate(20)->withQueryString();

        $unreadCount = SystemAlert::where('company_id', $companyId)
            ->where('is_read', false)
            ->where('is_dismissed', false)
            ->count();

        return Inertia::render('Platform/Alerts/Index', [
            'alerts' => $alerts,
            'unreadCount' => $unreadCount,
            'filters' => [
                'severity' => $severity,
                'type' => $type,
            ],
        ]);
    }

    public function unreadCount(Request $request): JsonResponse
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $count = SystemAlert::where('company_id', $companyId)
            ->where('is_read', false)
            ->where('is_dismissed', false)
            ->count();

        $recentAlerts = SystemAlert::where('company_id', $companyId)
            ->where('is_dismissed', false)
            ->latest()
            ->take(5)
            ->get(['id', 'alert_type', 'title', 'title_ar', 'severity', 'action_url', 'is_read', 'created_at']);

        return response()->json([
            'unread_count' => $count,
            'recent' => $recentAlerts,
        ]);
    }

    public function markAsRead(SystemAlert $alert): JsonResponse
    {
        $currentCompany = app(CurrentCompany::class);
        if ($alert->company_id !== $currentCompany->id()) {
            abort(403);
        }

        $alert->update([
            'is_read' => true,
            'read_at' => now(),
        ]);

        return response()->json(['message' => 'Alert marked as read.']);
    }

    public function markAllAsRead(Request $request): RedirectResponse
    {
        $currentCompany = app(CurrentCompany::class);

        SystemAlert::where('company_id', $currentCompany->id())
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        return back()->with('success', 'All alerts marked as read.');
    }

    public function dismiss(SystemAlert $alert): JsonResponse
    {
        $currentCompany = app(CurrentCompany::class);
        if ($alert->company_id !== $currentCompany->id()) {
            abort(403);
        }

        $alert->update([
            'is_dismissed' => true,
        ]);

        return response()->json(['message' => 'Alert dismissed.']);
    }
}
