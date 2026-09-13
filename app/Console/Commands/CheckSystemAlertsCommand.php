<?php

namespace App\Console\Commands;

use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Services\AlertEngineService;
use Illuminate\Console\Command;

class CheckSystemAlertsCommand extends Command
{
    protected $signature = 'erp:check-alerts {--company= : Specific company ID to scan}';

    protected $description = 'Scan enterprise records for cheque maturity, bank guarantee expirations, and inventory shortages';

    public function handle(AlertEngineService $alertEngine): int
    {
        $companyId = $this->option('company');

        if ($companyId) {
            $count = $alertEngine->scanAllAlerts($companyId);
            $this->info("Scanned company {$companyId}: created {$count} new alert(s).");

            return Command::SUCCESS;
        }

        $companies = Company::all();
        $total = 0;

        foreach ($companies as $company) {
            $count = $alertEngine->scanAllAlerts($company->id);
            $total += $count;
            $this->line("Company {$company->name} ({$company->id}): {$count} alert(s) generated.");
        }

        $this->info("System scan completed. Total alerts generated: {$total}.");

        return Command::SUCCESS;
    }
}
