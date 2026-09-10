<?php

namespace App\Modules\Platform\Services;

use App\Modules\Platform\Models\AuditLog;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Support\Facades\Request;

class AuditLogger
{
    /**
     * Log a security or business state mutation event.
     *
     * @param  array<string, mixed>|null  $oldValues
     * @param  array<string, mixed>|null  $newValues
     */
    public static function log(
        string $action,
        ?string $entityType = null,
        ?string $entityId = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?string $companyId = null,
        ?string $tenantId = null
    ): AuditLog {
        $currentTenant = app(CurrentTenant::class);
        $currentCompany = app(CurrentCompany::class);

        $resolvedTenantId = $tenantId ?? $currentTenant->id();
        $resolvedCompanyId = $companyId ?? $currentCompany->id();

        return AuditLog::create([
            'tenant_id' => $resolvedTenantId,
            'company_id' => $resolvedCompanyId,
            'user_id' => auth()->id(),
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
            'created_at' => now(),
        ]);
    }
}
