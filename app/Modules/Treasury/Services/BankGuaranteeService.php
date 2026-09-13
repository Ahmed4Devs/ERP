<?php

namespace App\Modules\Treasury\Services;

use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\JournalEntry;
use App\Modules\Accounting\Models\JournalEntryLine;
use App\Modules\Treasury\Models\BankGuarantee;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class BankGuaranteeService
{
    /**
     * Register and issue a new bank guarantee with margin & commission journal entries.
     */
    public function issueGuarantee(array $data): BankGuarantee
    {
        return DB::transaction(function () use ($data) {
            $companyId = $data['company_id'];
            $tenantId = $data['tenant_id'];
            $amount = (float) $data['amount'];
            $marginPercentage = (float) ($data['margin_percentage'] ?? 0);
            $marginAmount = isset($data['margin_amount'])
                ? (float) $data['margin_amount']
                : round(($amount * $marginPercentage) / 100, 4);
            $commissionAmount = (float) ($data['commission_amount'] ?? 0);

            // Accounts:
            // Bank Account
            $bankAccountId = $data['bank_account_id'] ?? null;
            if (! $bankAccountId) {
                $bankAccount = Account::firstOrCreate(
                    ['company_id' => $companyId, 'code' => '1020'],
                    [
                        'tenant_id' => $tenantId,
                        'name' => 'Bank Account',
                        'name_ar' => 'حساب البنك الرئيسي',
                        'type' => 'asset',
                        'subtype' => 'bank',
                        'is_postable' => true,
                    ]
                );
                $bankAccountId = $bankAccount->id;
            }

            // Margin Account (Asset: 1040 Cash Margins / تأمينات خطابات ضمان)
            $marginAccountId = $data['margin_account_id'] ?? null;
            if (! $marginAccountId) {
                $marginAccount = Account::firstOrCreate(
                    ['company_id' => $companyId, 'code' => '1040'],
                    [
                        'tenant_id' => $tenantId,
                        'name' => 'Bank Guarantee Margins',
                        'name_ar' => 'غطاء خطابات الضمان المصرفية',
                        'type' => 'asset',
                        'subtype' => 'current_asset',
                        'is_postable' => true,
                    ]
                );
                $marginAccountId = $marginAccount->id;
            }

            // Commission Account (Expense: 5240 Bank Charges)
            $commissionAccount = Account::firstOrCreate(
                ['company_id' => $companyId, 'code' => '5240'],
                [
                    'tenant_id' => $tenantId,
                    'name' => 'Bank Charges & Commissions',
                    'name_ar' => 'عمولات ومصاريف بنكية',
                    'type' => 'expense',
                    'subtype' => 'operating_expense',
                    'is_postable' => true,
                ]
            );

            $journalEntryId = null;
            $totalDeduction = $marginAmount + $commissionAmount;

            if ($totalDeduction > 0) {
                $entry = JournalEntry::create([
                    'tenant_id' => $tenantId,
                    'company_id' => $companyId,
                    'entry_number' => 'JV-LG-ISS-'.strtoupper(uniqid()),
                    'date' => $data['issue_date'],
                    'description' => "إصدار خطاب ضمان بنكي رقم {$data['guarantee_number']} لصالح {$data['beneficiary_name']}",
                    'status' => 'posted',
                ]);

                if ($marginAmount > 0) {
                    JournalEntryLine::create([
                        'tenant_id' => $tenantId,
                        'company_id' => $companyId,
                        'journal_entry_id' => $entry->id,
                        'account_id' => $marginAccountId,
                        'debit' => $marginAmount,
                        'credit' => 0,
                        'description' => "تأمين نقدي لخطاب ضمان رقم {$data['guarantee_number']}",
                    ]);
                }

                if ($commissionAmount > 0) {
                    JournalEntryLine::create([
                        'tenant_id' => $tenantId,
                        'company_id' => $companyId,
                        'journal_entry_id' => $entry->id,
                        'account_id' => $commissionAccount->id,
                        'debit' => $commissionAmount,
                        'credit' => 0,
                        'description' => "عمولة بنكية لإصدار خطاب ضمان رقم {$data['guarantee_number']}",
                    ]);
                }

                JournalEntryLine::create([
                    'tenant_id' => $tenantId,
                    'company_id' => $companyId,
                    'journal_entry_id' => $entry->id,
                    'account_id' => $bankAccountId,
                    'debit' => 0,
                    'credit' => $totalDeduction,
                    'description' => "خصم غطاء ومصاريف خطاب ضمان رقم {$data['guarantee_number']}",
                ]);

                $journalEntryId = $entry->id;
            }

            return BankGuarantee::create([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'guarantee_number' => $data['guarantee_number'],
                'type' => $data['type'],
                'beneficiary_name' => $data['beneficiary_name'],
                'issuing_bank' => $data['issuing_bank'],
                'amount' => $amount,
                'margin_percentage' => $marginPercentage,
                'margin_amount' => $marginAmount,
                'commission_amount' => $commissionAmount,
                'bank_account_id' => $bankAccountId,
                'margin_account_id' => $marginAccountId,
                'journal_entry_id' => $journalEntryId,
                'issue_date' => $data['issue_date'],
                'expiry_date' => $data['expiry_date'],
                'status' => 'active',
                'project_id' => $data['project_id'] ?? null,
                'notes' => $data['notes'] ?? null,
            ]);
        });
    }

    /**
     * Release bank guarantee and refund cash margin to bank account.
     */
    public function releaseGuarantee(string $guaranteeId, ?string $releaseDate = null): BankGuarantee
    {
        return DB::transaction(function () use ($guaranteeId, $releaseDate) {
            /** @var BankGuarantee $guarantee */
            $guarantee = BankGuarantee::lockForUpdate()->findOrFail($guaranteeId);

            if (! in_array($guarantee->status, ['active', 'renewed'])) {
                throw new InvalidArgumentException("Guarantee cannot be released in status: {$guarantee->status}");
            }

            $date = $releaseDate ?? now()->toDateString();

            if ($guarantee->margin_amount > 0 && $guarantee->bank_account_id && $guarantee->margin_account_id) {
                $entry = JournalEntry::create([
                    'tenant_id' => $guarantee->tenant_id,
                    'company_id' => $guarantee->company_id,
                    'entry_number' => 'JV-LG-REL-'.strtoupper(uniqid()),
                    'date' => $date,
                    'description' => "إفراج عن خطاب ضمان بنكي واسترداد الغطاء رقم {$guarantee->guarantee_number}",
                    'status' => 'posted',
                ]);

                // DR Bank Account / CR Margin Account
                JournalEntryLine::create([
                    'tenant_id' => $guarantee->tenant_id,
                    'company_id' => $guarantee->company_id,
                    'journal_entry_id' => $entry->id,
                    'account_id' => $guarantee->bank_account_id,
                    'debit' => $guarantee->margin_amount,
                    'credit' => 0,
                    'description' => "استرداد غطاء خطاب الضمان المفرج عنه رقم {$guarantee->guarantee_number}",
                ]);

                JournalEntryLine::create([
                    'tenant_id' => $guarantee->tenant_id,
                    'company_id' => $guarantee->company_id,
                    'journal_entry_id' => $entry->id,
                    'account_id' => $guarantee->margin_account_id,
                    'debit' => 0,
                    'credit' => $guarantee->margin_amount,
                    'description' => "إقفال حساب غطاء خطاب الضمان رقم {$guarantee->guarantee_number}",
                ]);
            }

            $guarantee->status = 'released';
            $guarantee->save();

            return $guarantee;
        });
    }

    /**
     * Renew bank guarantee with updated expiry date and optional renewal fee.
     */
    public function renewGuarantee(string $guaranteeId, string $newExpiryDate, float $renewalFee = 0): BankGuarantee
    {
        return DB::transaction(function () use ($guaranteeId, $newExpiryDate, $renewalFee) {
            /** @var BankGuarantee $guarantee */
            $guarantee = BankGuarantee::lockForUpdate()->findOrFail($guaranteeId);

            if (! in_array($guarantee->status, ['active', 'renewed'])) {
                throw new InvalidArgumentException("Guarantee cannot be renewed in status: {$guarantee->status}");
            }

            if ($renewalFee > 0 && $guarantee->bank_account_id) {
                $commissionAccount = Account::firstOrCreate(
                    ['company_id' => $guarantee->company_id, 'code' => '5240'],
                    [
                        'tenant_id' => $guarantee->tenant_id,
                        'name' => 'Bank Charges & Commissions',
                        'name_ar' => 'عمولات ومصاريف بنكية',
                        'type' => 'expense',
                        'subtype' => 'operating_expense',
                        'is_postable' => true,
                    ]
                );

                $entry = JournalEntry::create([
                    'tenant_id' => $guarantee->tenant_id,
                    'company_id' => $guarantee->company_id,
                    'entry_number' => 'JV-LG-RNW-'.strtoupper(uniqid()),
                    'date' => now()->toDateString(),
                    'description' => "رسوم تجديد خطاب ضمان بنكي رقم {$guarantee->guarantee_number}",
                    'status' => 'posted',
                ]);

                JournalEntryLine::create([
                    'tenant_id' => $guarantee->tenant_id,
                    'company_id' => $guarantee->company_id,
                    'journal_entry_id' => $entry->id,
                    'account_id' => $commissionAccount->id,
                    'debit' => $renewalFee,
                    'credit' => 0,
                    'description' => "عمولة تجديد خطاب ضمان رقم {$guarantee->guarantee_number}",
                ]);

                JournalEntryLine::create([
                    'tenant_id' => $guarantee->tenant_id,
                    'company_id' => $guarantee->company_id,
                    'journal_entry_id' => $entry->id,
                    'account_id' => $guarantee->bank_account_id,
                    'debit' => 0,
                    'credit' => $renewalFee,
                    'description' => "خصم عمولة تجديد خطاب ضمان رقم {$guarantee->guarantee_number}",
                ]);
            }

            $guarantee->expiry_date = $newExpiryDate;
            $guarantee->status = 'renewed';
            $guarantee->save();

            return $guarantee;
        });
    }
}
