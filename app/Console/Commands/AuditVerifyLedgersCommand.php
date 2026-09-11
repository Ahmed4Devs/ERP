<?php

namespace App\Console\Commands;

use App\Modules\Accounting\Models\JournalEntry;
use App\Modules\Accounting\Models\JournalEntryLine;
use App\Modules\Inventory\Models\InventoryLevel;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class AuditVerifyLedgersCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'audit:verify-ledgers {--company= : Optional company ID to scope the audit}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Audit all general ledger entries, journal line balance, orphan records, and inventory levels for mathematical integrity';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Starting Enterprise Ledger & Inventory Integrity Audit...');
        $companyId = $this->option('company');

        $hasErrors = false;

        // 1. Audit Journal Entries Balance
        $this->info('1. Auditing individual Journal Entries for DR/CR balance...');
        $entriesQuery = JournalEntry::with('lines');
        if ($companyId) {
            $entriesQuery->where('company_id', $companyId);
        }

        $totalEntriesChecked = 0;
        $unbalancedEntries = [];

        foreach ($entriesQuery->cursor() as $entry) {
            $totalEntriesChecked++;
            $totalDebit = '0.000000';
            $totalCredit = '0.000000';

            foreach ($entry->lines as $line) {
                $totalDebit = bcadd($totalDebit, (string) $line->debit, 6);
                $totalCredit = bcadd($totalCredit, (string) $line->credit, 6);
            }

            if (bccomp($totalDebit, $totalCredit, 6) !== 0) {
                $unbalancedEntries[] = [
                    'entry_id' => $entry->id,
                    'entry_number' => $entry->entry_number,
                    'company_id' => $entry->company_id,
                    'debit' => $totalDebit,
                    'credit' => $totalCredit,
                    'diff' => bcsub($totalDebit, $totalCredit, 6),
                ];
                $hasErrors = true;
            }
        }

        if (count($unbalancedEntries) > 0) {
            $this->error(sprintf('Found %d unbalanced journal entries!', count($unbalancedEntries)));
            $this->table(['Entry ID', 'Number', 'Company', 'Debit', 'Credit', 'Difference'], $unbalancedEntries);
        } else {
            $this->line(sprintf('  <info>[OK]</info> %d journal entries checked. All entries perfectly balanced.', $totalEntriesChecked));
        }

        // 2. Audit Grand System Totals
        $this->info('2. Auditing Grand Total Debits vs Credits across posted lines...');
        $linesQuery = JournalEntryLine::query();
        if ($companyId) {
            $linesQuery->where('company_id', $companyId);
        }

        $grandDebit = (string) ($linesQuery->sum('debit') ?? '0');
        $grandCredit = (string) ($linesQuery->sum('credit') ?? '0');

        $this->table(
            ['Metric', 'Total Amount'],
            [
                ['Grand Total Debits', number_format((float) $grandDebit, 6)],
                ['Grand Total Credits', number_format((float) $grandCredit, 6)],
                ['Net Imbalance', number_format((float) bcsub($grandDebit, $grandCredit, 6), 6)],
            ]
        );

        if (bccomp($grandDebit, $grandCredit, 6) !== 0) {
            $this->error('Grand total debits do not match grand total credits!');
            $hasErrors = true;
        } else {
            $this->line('  <info>[OK]</info> System grand totals are in absolute mathematical equilibrium.');
        }

        // 3. Audit for Orphan Journal Lines or Missing Accounts
        $this->info('3. Auditing for orphan journal lines and missing accounts...');
        $orphanLines = JournalEntryLine::whereNotExists(function ($query): void {
            $query->select(DB::raw(1))
                ->from('journal_entries')
                ->whereColumn('journal_entries.id', 'journal_entry_lines.journal_entry_id');
        })->count();

        $missingAccountLines = JournalEntryLine::whereNotExists(function ($query): void {
            $query->select(DB::raw(1))
                ->from('accounts')
                ->whereColumn('accounts.id', 'journal_entry_lines.account_id');
        })->count();

        if ($orphanLines > 0 || $missingAccountLines > 0) {
            $this->error(sprintf('Found %d orphan lines and %d lines with missing accounts!', $orphanLines, $missingAccountLines));
            $hasErrors = true;
        } else {
            $this->line('  <info>[OK]</info> Zero orphan lines and zero broken account relationships.');
        }

        // 4. Audit Multi-Tenancy Scoping Consistency
        $this->info('4. Auditing relational tenant-id consistency...');
        $mismatchedTenantLines = DB::table('journal_entry_lines')
            ->join('journal_entries', 'journal_entries.id', '=', 'journal_entry_lines.journal_entry_id')
            ->whereColumn('journal_entry_lines.tenant_id', '!=', 'journal_entries.tenant_id')
            ->count();

        if ($mismatchedTenantLines > 0) {
            $this->error(sprintf('Found %d lines with mismatched tenant_id against parent entry!', $mismatchedTenantLines));
            $hasErrors = true;
        } else {
            $this->line('  <info>[OK]</info> All journal line tenant scopes match their parent entries.');
        }

        // 5. Audit Non-Negative Inventory Policy
        $this->info('5. Auditing Inventory Levels for non-negative stock enforcement...');
        $inventoryQuery = InventoryLevel::query();
        if ($companyId) {
            $inventoryQuery->where('company_id', $companyId);
        }

        $totalStockRecords = $inventoryQuery->count();
        $negativeStockRecords = (clone $inventoryQuery)
            ->where(function ($query): void {
                $query->where('quantity_on_hand', '<', 0)
                    ->orWhere('quantity_available', '<', 0)
                    ->orWhere('total_value', '<', 0);
            })
            ->get();

        if ($negativeStockRecords->count() > 0) {
            $this->error(sprintf('Found %d inventory records violating non-negative stock policy!', $negativeStockRecords->count()));
            $badRows = $negativeStockRecords->map(fn ($r) => [
                'ID' => $r->id,
                'Product' => $r->product_id,
                'Warehouse' => $r->warehouse_id,
                'On Hand' => $r->quantity_on_hand,
                'Available' => $r->quantity_available,
                'Total Value' => $r->total_value,
            ])->toArray();
            $this->table(['ID', 'Product', 'Warehouse', 'On Hand', 'Available', 'Total Value'], $badRows);
            $hasErrors = true;
        } else {
            $this->line(sprintf('  <info>[OK]</info> %d inventory levels checked. Zero negative stock violations.', $totalStockRecords));
        }

        $this->newLine();
        if ($hasErrors) {
            $this->error('INTEGRITY AUDIT FAILED: Discrepancies detected.');

            return Command::FAILURE;
        }

        $this->info('================================================================');
        $this->info('✔ INTEGRITY AUDIT PASSED: All enterprise financial and inventory records are verified.');
        $this->info('================================================================');

        return Command::SUCCESS;
    }
}
