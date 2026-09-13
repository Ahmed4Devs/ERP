<?php

namespace App\Modules\Treasury\Services;

use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\JournalEntry;
use App\Modules\Accounting\Models\JournalEntryLine;
use App\Modules\Treasury\Models\Cheque;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class ChequeService
{
    /**
     * Register a new received cheque (from customer).
     */
    public function registerReceivedCheque(array $data): Cheque
    {
        return DB::transaction(function () use ($data) {
            $companyId = $data['company_id'];
            $tenantId = $data['tenant_id'];
            $amount = (float) $data['amount'];

            // Accounts: PDC Receivable Account (1030) and Customer Receivable Account (1200)
            $pdcAccount = Account::firstOrCreate(
                ['company_id' => $companyId, 'code' => '1030'],
                [
                    'tenant_id' => $tenantId,
                    'name' => 'Cheques Under Collection',
                    'name_ar' => 'شيكات برسم التحصيل',
                    'type' => 'asset',
                    'subtype' => 'current_asset',
                    'is_postable' => true,
                ]
            );

            $customerAccount = Account::firstOrCreate(
                ['company_id' => $companyId, 'code' => '1200'],
                [
                    'tenant_id' => $tenantId,
                    'name' => 'Accounts Receivable',
                    'name_ar' => 'العملاء والذمم المدينة',
                    'type' => 'asset',
                    'subtype' => 'current_asset',
                    'is_postable' => true,
                ]
            );

            // Generate initial Journal Entry
            $entry = JournalEntry::create([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'entry_number' => 'JV-PDC-REC-'.strtoupper(uniqid()),
                'date' => $data['issue_date'],
                'description' => "استلام شيك وارد رقم {$data['cheque_number']} من {$data['drawer_name']}",
                'status' => 'posted',
            ]);

            JournalEntryLine::create([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'journal_entry_id' => $entry->id,
                'account_id' => $pdcAccount->id,
                'debit' => $amount,
                'credit' => 0,
                'description' => "إثبات شيك تحت التحصيل رقم {$data['cheque_number']}",
            ]);

            JournalEntryLine::create([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'journal_entry_id' => $entry->id,
                'account_id' => $customerAccount->id,
                'debit' => 0,
                'credit' => $amount,
                'description' => "تخفيض رصيد العميل مقابل شيك رقم {$data['cheque_number']}",
            ]);

            return Cheque::create([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'type' => 'received',
                'cheque_number' => $data['cheque_number'],
                'bank_name' => $data['bank_name'],
                'drawer_name' => $data['drawer_name'],
                'payee_name' => $data['payee_name'] ?? null,
                'issue_date' => $data['issue_date'],
                'due_date' => $data['due_date'],
                'amount' => $amount,
                'currency' => $data['currency'] ?? 'SAR',
                'status' => 'in_safe',
                'party_id' => $data['party_id'] ?? null,
                'bank_account_id' => $data['bank_account_id'] ?? null,
                'pdc_account_id' => $pdcAccount->id,
                'journal_entry_id' => $entry->id,
                'notes' => $data['notes'] ?? null,
            ]);
        });
    }

    /**
     * Deposit received cheque into a bank account for collection.
     */
    public function depositReceivedCheque(string $chequeId, string $bankAccountId): Cheque
    {
        return DB::transaction(function () use ($chequeId, $bankAccountId) {
            /** @var Cheque $cheque */
            $cheque = Cheque::lockForUpdate()->findOrFail($chequeId);

            if ($cheque->type !== 'received' || $cheque->status !== 'in_safe') {
                throw new InvalidArgumentException("Cheque cannot be deposited in status: {$cheque->status}");
            }

            $cheque->status = 'under_collection';
            $cheque->bank_account_id = $bankAccountId;
            $cheque->save();

            return $cheque;
        });
    }

    /**
     * Mark received cheque as collected into bank account.
     */
    public function collectReceivedCheque(string $chequeId, ?string $date = null): Cheque
    {
        return DB::transaction(function () use ($chequeId, $date) {
            /** @var Cheque $cheque */
            $cheque = Cheque::lockForUpdate()->with('bankAccount')->findOrFail($chequeId);

            if (! in_array($cheque->status, ['in_safe', 'under_collection'])) {
                throw new InvalidArgumentException("Cheque cannot be collected in status: {$cheque->status}");
            }

            $bankAccountId = $cheque->bank_account_id;
            if (! $bankAccountId) {
                $bankAccount = Account::firstOrCreate(
                    ['company_id' => $cheque->company_id, 'code' => '1020'],
                    [
                        'tenant_id' => $cheque->tenant_id,
                        'name' => 'Al-Rajhi Bank',
                        'name_ar' => 'بنك الراجحي',
                        'type' => 'asset',
                        'subtype' => 'bank',
                        'is_postable' => true,
                    ]
                );
                $bankAccountId = $bankAccount->id;
                $cheque->bank_account_id = $bankAccountId;
            }

            $settlementDate = $date ?? now()->toDateString();

            // JV: DR Bank (1020) / CR PDC Receivable (1030)
            $entry = JournalEntry::create([
                'tenant_id' => $cheque->tenant_id,
                'company_id' => $cheque->company_id,
                'entry_number' => 'JV-PDC-COL-'.strtoupper(uniqid()),
                'date' => $settlementDate,
                'description' => "تحصيل شيك رقم {$cheque->cheque_number} في حساب البنك",
                'status' => 'posted',
            ]);

            JournalEntryLine::create([
                'tenant_id' => $cheque->tenant_id,
                'company_id' => $cheque->company_id,
                'journal_entry_id' => $entry->id,
                'account_id' => $bankAccountId,
                'debit' => $cheque->amount,
                'credit' => 0,
                'description' => "إيداع وتحصيل شيك رقم {$cheque->cheque_number}",
            ]);

            JournalEntryLine::create([
                'tenant_id' => $cheque->tenant_id,
                'company_id' => $cheque->company_id,
                'journal_entry_id' => $entry->id,
                'account_id' => $cheque->pdc_account_id,
                'debit' => 0,
                'credit' => $cheque->amount,
                'description' => "إقفال شيك تحت التحصيل رقم {$cheque->cheque_number}",
            ]);

            $cheque->status = 'collected';
            $cheque->settlement_journal_entry_id = $entry->id;
            $cheque->save();

            return $cheque;
        });
    }

    /**
     * Mark received cheque as bounced.
     */
    public function bounceReceivedCheque(string $chequeId, string $reason): Cheque
    {
        return DB::transaction(function () use ($chequeId, $reason) {
            /** @var Cheque $cheque */
            $cheque = Cheque::lockForUpdate()->findOrFail($chequeId);

            if (! in_array($cheque->status, ['in_safe', 'under_collection'])) {
                throw new InvalidArgumentException("Cheque cannot bounce in status: {$cheque->status}");
            }

            $customerAccount = Account::firstOrCreate(
                ['company_id' => $cheque->company_id, 'code' => '1200'],
                [
                    'tenant_id' => $cheque->tenant_id,
                    'name' => 'Accounts Receivable',
                    'name_ar' => 'العملاء والذمم المدينة',
                    'type' => 'asset',
                    'subtype' => 'current_asset',
                    'is_postable' => true,
                ]
            );

            // Reversal JV: DR Customer Account / CR PDC Receivable
            $entry = JournalEntry::create([
                'tenant_id' => $cheque->tenant_id,
                'company_id' => $cheque->company_id,
                'entry_number' => 'JV-PDC-BNC-'.strtoupper(uniqid()),
                'date' => now()->toDateString(),
                'description' => "ارتداد شيك رقم {$cheque->cheque_number} - السبب: {$reason}",
                'status' => 'posted',
            ]);

            JournalEntryLine::create([
                'tenant_id' => $cheque->tenant_id,
                'company_id' => $cheque->company_id,
                'journal_entry_id' => $entry->id,
                'account_id' => $customerAccount->id,
                'debit' => $cheque->amount,
                'credit' => 0,
                'description' => "إعادة إثبات مديونية العميل بسبب ارتداد شيك رقم {$cheque->cheque_number}",
            ]);

            JournalEntryLine::create([
                'tenant_id' => $cheque->tenant_id,
                'company_id' => $cheque->company_id,
                'journal_entry_id' => $entry->id,
                'account_id' => $cheque->pdc_account_id,
                'debit' => 0,
                'credit' => $cheque->amount,
                'description' => "إلغاء شيك تحت التحصيل المرتد رقم {$cheque->cheque_number}",
            ]);

            $cheque->status = 'bounced';
            $cheque->bounce_reason = $reason;
            $cheque->settlement_journal_entry_id = $entry->id;
            $cheque->save();

            return $cheque;
        });
    }

    /**
     * Register a new issued cheque (to vendor).
     */
    public function registerIssuedCheque(array $data): Cheque
    {
        return DB::transaction(function () use ($data) {
            $companyId = $data['company_id'];
            $tenantId = $data['tenant_id'];
            $amount = (float) $data['amount'];

            // PDC Payable Account (2030) and Vendor Payable Account (2100)
            $pdcPayableAccount = Account::firstOrCreate(
                ['company_id' => $companyId, 'code' => '2030'],
                [
                    'tenant_id' => $tenantId,
                    'name' => 'Cheques Payable (PDC)',
                    'name_ar' => 'شيكات آجلة الدفع',
                    'type' => 'liability',
                    'subtype' => 'current_liability',
                    'is_postable' => true,
                ]
            );

            $vendorAccount = Account::firstOrCreate(
                ['company_id' => $companyId, 'code' => '2100'],
                [
                    'tenant_id' => $tenantId,
                    'name' => 'Accounts Payable',
                    'name_ar' => 'الموردين والذمم الدائنة',
                    'type' => 'liability',
                    'subtype' => 'current_liability',
                    'is_postable' => true,
                ]
            );

            // Initial JV: DR Vendor Payable / CR PDC Payable
            $entry = JournalEntry::create([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'entry_number' => 'JV-PDC-ISS-'.strtoupper(uniqid()),
                'date' => $data['issue_date'],
                'description' => "إصدار شيك آجل رقم {$data['cheque_number']} للمستفيد {$data['payee_name']}",
                'status' => 'posted',
            ]);

            JournalEntryLine::create([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'journal_entry_id' => $entry->id,
                'account_id' => $vendorAccount->id,
                'debit' => $amount,
                'credit' => 0,
                'description' => "تخفيض مديونية المورد مقابل شيك آجل رقم {$data['cheque_number']}",
            ]);

            JournalEntryLine::create([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'journal_entry_id' => $entry->id,
                'account_id' => $pdcPayableAccount->id,
                'debit' => 0,
                'credit' => $amount,
                'description' => "إثبات شيك آجل الدفع رقم {$data['cheque_number']}",
            ]);

            return Cheque::create([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'type' => 'issued',
                'cheque_number' => $data['cheque_number'],
                'bank_name' => $data['bank_name'],
                'drawer_name' => $data['drawer_name'],
                'payee_name' => $data['payee_name'] ?? null,
                'issue_date' => $data['issue_date'],
                'due_date' => $data['due_date'],
                'amount' => $amount,
                'currency' => $data['currency'] ?? 'SAR',
                'status' => 'issued',
                'party_id' => $data['party_id'] ?? null,
                'bank_account_id' => $data['bank_account_id'] ?? null,
                'pdc_account_id' => $pdcPayableAccount->id,
                'journal_entry_id' => $entry->id,
                'notes' => $data['notes'] ?? null,
            ]);
        });
    }

    /**
     * Clear issued cheque when deducted from bank account.
     */
    public function clearIssuedCheque(string $chequeId, ?string $date = null): Cheque
    {
        return DB::transaction(function () use ($chequeId, $date) {
            /** @var Cheque $cheque */
            $cheque = Cheque::lockForUpdate()->findOrFail($chequeId);

            if ($cheque->type !== 'issued' || $cheque->status !== 'issued') {
                throw new InvalidArgumentException("Cheque cannot be cleared in status: {$cheque->status}");
            }

            $bankAccountId = $cheque->bank_account_id;
            if (! $bankAccountId) {
                $bankAccount = Account::firstOrCreate(
                    ['company_id' => $cheque->company_id, 'code' => '1020'],
                    [
                        'tenant_id' => $cheque->tenant_id,
                        'name' => 'Al-Rajhi Bank',
                        'name_ar' => 'بنك الراجحي',
                        'type' => 'asset',
                        'subtype' => 'bank',
                        'is_postable' => true,
                    ]
                );
                $bankAccountId = $bankAccount->id;
                $cheque->bank_account_id = $bankAccountId;
            }

            $settlementDate = $date ?? now()->toDateString();

            // Settlement JV: DR PDC Payable (2030) / CR Bank (1020)
            $entry = JournalEntry::create([
                'tenant_id' => $cheque->tenant_id,
                'company_id' => $cheque->company_id,
                'entry_number' => 'JV-PDC-CLR-'.strtoupper(uniqid()),
                'date' => $settlementDate,
                'description' => "صرف ومقاصة شيك صادر رقم {$cheque->cheque_number} من حساب البنك",
                'status' => 'posted',
            ]);

            JournalEntryLine::create([
                'tenant_id' => $cheque->tenant_id,
                'company_id' => $cheque->company_id,
                'journal_entry_id' => $entry->id,
                'account_id' => $cheque->pdc_account_id,
                'debit' => $cheque->amount,
                'credit' => 0,
                'description' => "إقفال شيك آجل الدفع رقم {$cheque->cheque_number}",
            ]);

            JournalEntryLine::create([
                'tenant_id' => $cheque->tenant_id,
                'company_id' => $cheque->company_id,
                'journal_entry_id' => $entry->id,
                'account_id' => $bankAccountId,
                'debit' => 0,
                'credit' => $cheque->amount,
                'description' => "سحب من حساب البنك مقابل شيك رقم {$cheque->cheque_number}",
            ]);

            $cheque->status = 'cleared';
            $cheque->settlement_journal_entry_id = $entry->id;
            $cheque->save();

            return $cheque;
        });
    }
}
