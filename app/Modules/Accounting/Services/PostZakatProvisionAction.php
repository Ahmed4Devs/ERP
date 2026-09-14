<?php

namespace App\Modules\Accounting\Services;

use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\JournalEntry;
use App\Shared\Context\CurrentTenant;
use InvalidArgumentException;

class PostZakatProvisionAction
{
    public function __construct(
        protected ZakatCalculationService $zakatService,
        protected PostingEngine $postingEngine
    ) {}

    /**
     * Post the Annual Zakat Provision Accrual to the General Ledger.
     * DR 5150 Zakat Expense (مصروف الزكاة الشرعية)
     * CR 2060 Zakat Provision (مخصص الزكاة الشرعية المستحقة)
     */
    public function execute(string $companyId, int $taxYear, ?float $customAmount = null, array $options = []): JournalEntry
    {
        $schedule = $this->zakatService->calculateZakatSchedule($companyId, $taxYear, $options);
        $amount = $customAmount !== null ? $customAmount : $schedule['calculation']['recommended_adjustment'];

        if ($amount <= 0) {
            throw new InvalidArgumentException('Existing Zakat provision balance already equals or exceeds the calculated annual liability. No additional accrual required.');
        }

        $currentTenant = app(CurrentTenant::class);
        $tenantId = $currentTenant->id();
        $date = "{$taxYear}-12-31";

        // 1. Ensure Expense Account 5150 (مصروف الزكاة الشرعية) exists
        $expenseAccount = Account::firstOrCreate(
            ['company_id' => $companyId, 'code' => '5150'],
            [
                'tenant_id' => $tenantId,
                'name' => 'Zakat Expense',
                'name_ar' => 'مصروف الزكاة الشرعية',
                'type' => 'expense',
                'subtype' => 'operating_expense',
                'is_postable' => true,
                'is_system' => true,
            ]
        );

        // 2. Ensure Liability Account 2060 (مخصص الزكاة الشرعية) exists
        $provisionAccount = Account::firstOrCreate(
            ['company_id' => $companyId, 'code' => '2060'],
            [
                'tenant_id' => $tenantId,
                'name' => 'Zakat Provision',
                'name_ar' => 'مخصص الزكاة الشرعية المستحقة',
                'type' => 'liability',
                'subtype' => 'tax_payable',
                'is_postable' => true,
                'is_system' => true,
            ]
        );

        $amountStr = number_format($amount, 6, '.', '');

        $lines = [
            [
                'account_id' => $expenseAccount->id,
                'debit' => $amountStr,
                'credit' => '0.000000',
                'description' => "Annual Zakat Expense Accrual - Tax Year {$taxYear}",
            ],
            [
                'account_id' => $provisionAccount->id,
                'debit' => '0.000000',
                'credit' => $amountStr,
                'description' => "Annual Zakat Provision Liability - Tax Year {$taxYear}",
            ],
        ];

        return $this->postingEngine->post([
            'company_id' => $companyId,
            'tenant_id' => $tenantId,
            'date' => $date,
            'source_type' => 'zakat_provision',
            'source_id' => $companyId,
            'description' => "Annual Zakat Provision Accrual - Tax Year {$taxYear}",
            'lines' => $lines,
        ]);
    }
}
