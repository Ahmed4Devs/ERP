<?php

namespace App\Modules\Platform\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Platform\Models\AuditLog;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AuditLogController extends Controller
{
    public function index(Request $request): Response
    {
        $tenantId = app(CurrentTenant::class)->id();
        $companyId = app(CurrentCompany::class)->id();

        $query = AuditLog::where('tenant_id', $tenantId)
            ->where(function ($q) use ($companyId): void {
                $q->where('company_id', $companyId)->orWhereNull('company_id');
            })
            ->with(['user:id,name,email'])
            ->when($request->search, function ($q, $search): void {
                $q->where(function ($sq) use ($search): void {
                    $sq->where('action', 'ilike', "%{$search}%")
                        ->orWhere('entity_type', 'ilike', "%{$search}%")
                        ->orWhere('entity_id', 'ilike', "%{$search}%")
                        ->orWhere('ip_address', 'ilike', "%{$search}%")
                        ->orWhereHas('user', fn ($uq) => $uq->where('name', 'ilike', "%{$search}%")->orWhere('email', 'ilike', "%{$search}%"));
                });
            })
            ->when($request->action, fn ($q) => $q->where('action', $request->action))
            ->when($request->entity_type, fn ($q) => $q->where('entity_type', $request->entity_type))
            ->when($request->user_id, fn ($q) => $q->where('user_id', $request->user_id))
            ->when($request->from_date, fn ($q) => $q->whereDate('created_at', '>=', $request->from_date))
            ->when($request->to_date, fn ($q) => $q->whereDate('created_at', '<=', $request->to_date))
            ->latest('created_at');

        $logs = (clone $query)->paginate(20)->withQueryString();

        // Metrics
        $totalLast30Days = AuditLog::where('tenant_id', $tenantId)
            ->where('created_at', '>=', now()->subDays(30))
            ->count();

        $activeUsersCount = AuditLog::where('tenant_id', $tenantId)
            ->where('created_at', '>=', now()->subDays(30))
            ->distinct('user_id')
            ->count('user_id');

        $actions = AuditLog::where('tenant_id', $tenantId)
            ->whereNotNull('action')
            ->distinct()
            ->pluck('action')
            ->values();

        $entityTypes = AuditLog::where('tenant_id', $tenantId)
            ->whereNotNull('entity_type')
            ->distinct()
            ->pluck('entity_type')
            ->values();

        $users = User::whereHas('memberships', fn ($m) => $m->where('tenant_id', $tenantId))
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        return Inertia::render('Platform/AuditLogs/Index', [
            'logs' => $logs,
            'metrics' => [
                'total_last_30_days' => $totalLast30Days,
                'active_users_count' => $activeUsersCount,
                'filtered_count' => $logs->total(),
            ],
            'filters' => [
                'search' => $request->search,
                'action' => $request->action,
                'entity_type' => $request->entity_type,
                'user_id' => $request->user_id,
                'from_date' => $request->from_date,
                'to_date' => $request->to_date,
            ],
            'availableActions' => $actions,
            'availableEntities' => $entityTypes,
            'users' => $users,
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        $tenantId = app(CurrentTenant::class)->id();
        $companyId = app(CurrentCompany::class)->id();

        $query = AuditLog::where('tenant_id', $tenantId)
            ->where(function ($q) use ($companyId): void {
                $q->where('company_id', $companyId)->orWhereNull('company_id');
            })
            ->with(['user:id,name,email'])
            ->when($request->search, function ($q, $search): void {
                $q->where(function ($sq) use ($search): void {
                    $sq->where('action', 'ilike', "%{$search}%")
                        ->orWhere('entity_type', 'ilike', "%{$search}%")
                        ->orWhere('entity_id', 'ilike', "%{$search}%")
                        ->orWhere('ip_address', 'ilike', "%{$search}%");
                });
            })
            ->when($request->action, fn ($q) => $q->where('action', $request->action))
            ->when($request->entity_type, fn ($q) => $q->where('entity_type', $request->entity_type))
            ->when($request->user_id, fn ($q) => $q->where('user_id', $request->user_id))
            ->when($request->from_date, fn ($q) => $q->whereDate('created_at', '>=', $request->from_date))
            ->when($request->to_date, fn ($q) => $q->whereDate('created_at', '<=', $request->to_date))
            ->latest('created_at')
            ->limit(2000);

        $filename = 'Audit_Trail_'.now()->format('Ymd_His').'.csv';

        return response()->streamDownload(function () use ($query): void {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID', 'IP Address', 'User Agent']);

            $query->chunk(200, function ($chunk) use ($handle): void {
                foreach ($chunk as $log) {
                    fputcsv($handle, [
                        $log->created_at?->toIso8601String(),
                        $log->user?->name ?? 'System',
                        $log->action,
                        $log->entity_type ?? '',
                        $log->entity_id ?? '',
                        $log->ip_address ?? '',
                        $log->user_agent ?? '',
                    ]);
                }
            });

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }
}
