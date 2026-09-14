<?php

namespace App\Http\Middleware;

use App\Modules\Platform\Services\ModuleRegistry;
use App\Shared\Context\CurrentCompany;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureModuleEnabled
{
    public function __construct(
        protected ModuleRegistry $moduleRegistry,
        protected CurrentCompany $currentCompany
    ) {}

    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string $module): Response
    {
        $company = $this->currentCompany->get();

        if (! $this->moduleRegistry->isModuleEnabled($module, $company)) {
            $allModules = $this->moduleRegistry->getAllModules();
            $moduleName = $allModules[$module]['name_ar'] ?? $module;

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => "عذراً، موديول ({$moduleName}) غير مفعّل لاشتراك هذه المنشأة.",
                    'module' => $module,
                    'is_enabled' => false,
                    'upgrade_url' => route('settings.modules.index'),
                ], Response::HTTP_FORBIDDEN);
            }

            return redirect()->route('dashboard')->with(
                'error',
                "عذراً، موديول ({$moduleName}) غير مفعّل لاشتراك هذه المنشأة. يمكن لمدير النظام تفعيله من شاشة إعدادات الموديولات."
            );
        }

        return $next($request);
    }
}
