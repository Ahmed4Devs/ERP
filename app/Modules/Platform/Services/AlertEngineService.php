<?php

namespace App\Modules\Platform\Services;

use App\Modules\Inventory\Models\InventoryLevel;
use App\Modules\Inventory\Models\Product;
use App\Modules\Platform\Models\SystemAlert;
use App\Modules\Treasury\Models\BankGuarantee;
use App\Modules\Treasury\Models\Cheque;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;

class AlertEngineService
{
    /**
     * Scan all critical modules for maturity dates, expirations, and stock shortages.
     */
    public function scanAllAlerts(?string $companyId = null): int
    {
        $currentCompany = app(CurrentCompany::class);
        $currentTenant = app(CurrentTenant::class);

        $companyId = $companyId ?: $currentCompany->id();
        $tenantId = $currentTenant->id();

        $alertsCreated = 0;

        // 1. Scan PDC Cheques due within 7 days
        $dueCheques = Cheque::where('company_id', $companyId)
            ->where('status', 'in_safe')
            ->whereDate('due_date', '<=', now()->addDays(7)->toDateString())
            ->get();

        foreach ($dueCheques as $cheque) {
            $exists = SystemAlert::where('company_id', $companyId)
                ->where('alert_type', 'cheque_due')
                ->where('source_id', $cheque->id)
                ->where('is_dismissed', false)
                ->exists();

            if (! $exists) {
                SystemAlert::create([
                    'tenant_id' => $tenantId,
                    'company_id' => $companyId,
                    'alert_type' => 'cheque_due',
                    'title' => "Cheque #{$cheque->cheque_number} Due Soon",
                    'title_ar' => "شيك رقم {$cheque->cheque_number} يستحق قريباً",
                    'message' => "Cheque #{$cheque->cheque_number} for {$cheque->amount} {$cheque->currency} is due on {$cheque->due_date->toDateString()}.",
                    'message_ar' => "الشيك رقم {$cheque->cheque_number} بمبلغ {$cheque->amount} {$cheque->currency} يستحق في تاريخ {$cheque->due_date->toDateString()}.",
                    'severity' => 'warning',
                    'source_type' => Cheque::class,
                    'source_id' => $cheque->id,
                    'action_url' => "/treasury/cheques/{$cheque->id}",
                ]);
                $alertsCreated++;
            }
        }

        // 2. Scan Bank Guarantees expiring within 14 days
        $expiringGuarantees = BankGuarantee::where('company_id', $companyId)
            ->where('status', 'active')
            ->whereDate('expiry_date', '<=', now()->addDays(14)->toDateString())
            ->get();

        foreach ($expiringGuarantees as $bg) {
            $exists = SystemAlert::where('company_id', $companyId)
                ->where('alert_type', 'guarantee_expiring')
                ->where('source_id', $bg->id)
                ->where('is_dismissed', false)
                ->exists();

            if (! $exists) {
                SystemAlert::create([
                    'tenant_id' => $tenantId,
                    'company_id' => $companyId,
                    'alert_type' => 'guarantee_expiring',
                    'title' => "Bank Guarantee #{$bg->guarantee_number} Expiring Soon",
                    'title_ar' => "خطاب ضمان بنكي رقم {$bg->guarantee_number} قارب على الانتهاء",
                    'message' => "Bank Guarantee #{$bg->guarantee_number} ({$bg->type}) of {$bg->amount} {$bg->currency} expires on {$bg->expiry_date->toDateString()}.",
                    'message_ar' => "خطاب الضمان البنكي رقم {$bg->guarantee_number} بمبلغ {$bg->amount} {$bg->currency} ينتهي في تاريخ {$bg->expiry_date->toDateString()}.",
                    'severity' => 'critical',
                    'source_type' => BankGuarantee::class,
                    'source_id' => $bg->id,
                    'action_url' => '/treasury/bank-guarantees',
                ]);
                $alertsCreated++;
            }
        }

        // 3. Scan Low Stock Items (Stock on Hand <= 5)
        $products = Product::where('company_id', $companyId)->where('is_active', true)->get();
        foreach ($products as $product) {
            $onHand = (float) InventoryLevel::where('product_id', $product->id)->sum('quantity_on_hand');
            if ($onHand <= 5.0) {
                $exists = SystemAlert::where('company_id', $companyId)
                    ->where('alert_type', 'low_stock')
                    ->where('source_id', $product->id)
                    ->where('is_dismissed', false)
                    ->where('created_at', '>=', now()->subDays(3))
                    ->exists();

                if (! $exists) {
                    SystemAlert::create([
                        'tenant_id' => $tenantId,
                        'company_id' => $companyId,
                        'alert_type' => 'low_stock',
                        'title' => "Low Stock Alert: {$product->name}",
                        'title_ar' => "تنبيه نقص مخزون: {$product->name}",
                        'message' => "Product {$product->sku} ({$product->name}) has only {$onHand} units remaining on hand.",
                        'message_ar' => "الصنف {$product->sku} ({$product->name}) متبقي منه فقط {$onHand} وحدات في المستودع.",
                        'severity' => 'warning',
                        'source_type' => Product::class,
                        'source_id' => $product->id,
                        'action_url' => '/inventory/products',
                    ]);
                    $alertsCreated++;
                }
            }
        }

        return $alertsCreated;
    }
}
