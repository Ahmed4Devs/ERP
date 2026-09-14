<?php

namespace App\Modules\HR\Services;

use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\JournalEntry;
use App\Modules\Accounting\Services\PostingEngine;
use App\Shared\Context\CurrentTenant;
use InvalidArgumentException;

class PostEndOfServiceAccrualAction
{
    public function __construct(
        protected SaudiEosbCalculatorService $calculatorService,
        protected PostingEngine $postingEngine
    ) {}

    /**
     * Post the incremental End of Service provision adjustment to General Ledger.
     * DR 5140 End of Service Gratuity Expense
     * CR 2160 End of Service Provision
     */
    public function execute(string $companyId, ?string $asOfDate = null, ?float $customAmount = null): JournalEntry
    {
        $asOfDate = $asOfDate ?: now()->toDateString();
        $schedule = $this->calculatorService->getCompanyLiabilitySchedule($companyId, $asOfDate);

        $adjustmentAmount = $customAmount !== null ? $customAmount : $schedule['recommended_adjustment'];

        if ($adjustmentAmount <= 0) {
            throw new InvalidArgumentException('Current provision balance already covers or exceeds accumulated liability. No additional accrual needed.');
        }

        $currentTenant = app(CurrentTenant::class);
        $tenantId = $currentTenant->id();

        // 1. Ensure Expense Account (5140) exists
        $expenseAccount = Account::firstOrCreate(
            ['company_id' => $companyId, 'code' => '5140'],
            [
                'tenant_id' => $tenantId,
                'name' => 'End of Service Gratuity Expense',
                'name_ar' => 'مصروف مكافأة نهاية الخدمة',
                'type' => 'expense',
                'subtype' => 'operating_expense',
                'is_postable' => true,
                'is_system' => true,
            ]
        );

        // 2. Ensure Provision Liability Account (2160) exists
        $provisionAccount = Account::firstOrCreate(
            ['company_id' => $companyId, 'code' => '2160'],
            [
                'tenant_id' => $tenantId,
                'name' => 'End of Service Indemnity Provision',
                'name_ar' => 'مخصص مكافأة نهاية الخدمة المتراكمة',
                'type' => 'liability',
                'subtype' => 'payroll_payable',
                'is_postable' => true,
                'is_system' => true,
            ]
        );

        $amountStr = number_format($adjustmentAmount, 6, '.', '');

        $lines = [
            [
                'account_id' => $expenseAccount->id,
                'debit' => $amountStr,
                'credit' => '0.000000',
                'description' => "EOSB Monthly Provision Accrual - As of {$asOfDate}",
            ],
            [
                'account_id' => $provisionAccount->id,
                'debit' => '0.000000',
                'credit' => $amountStr,
                'description' => "EOSB Accumulated Indemnity Provision - As of {$asOfDate}",
            ],
        ];

        return $this->postingEngine->post([
            'company_id' => $companyId,
            'tenant_id' => $tenantId,
            'date' => $asOfDate,
            'source_type' => 'eosb_accrual',
            'source_id' => $companyId,
            'description' => "End of Service Provision Accrual - {$asOfDate}",
            'lines' => $lines,
        ]);
    }
}
