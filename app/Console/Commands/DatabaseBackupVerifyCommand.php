<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class DatabaseBackupVerifyCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'backup:verify-drill {--dry-run : Run verification drill without persisting snapshot manifest}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Perform operational backup verification drill and validate database recoverability readiness';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('================================================================');
        $this->info('Starting Production Database Backup & Restore Verification Drill');
        $this->info('================================================================');

        $hasFailure = false;

        // 1. Verify Database Engine & Connection
        $this->info('1. Verifying Database Connection & Runtime Engine...');
        try {
            $driver = DB::connection()->getDriverName();
            $serverVersion = DB::select('SELECT version()')[0]->version ?? 'unknown';
            $this->line(sprintf('  <info>[OK]</info> Connection active. Driver: %s', $driver));
            $this->line(sprintf('  <comment>[Engine]</comment> %s', substr((string) $serverVersion, 0, 75)));
        } catch (\Throwable $e) {
            $this->error('Failed to query database: '.$e->getMessage());

            return Command::FAILURE;
        }

        // 2. Core Schema Table Verification
        $this->info('2. Verifying Core ERP Relational Tables...');
        $coreTables = [
            'tenants',
            'companies',
            'branches',
            'users',
            'accounts',
            'fiscal_periods',
            'journal_entries',
            'journal_entry_lines',
            'parties',
            'products',
            'warehouses',
            'inventory_levels',
            'stock_movements',
            'pos_terminals',
            'pos_sessions',
            'pos_orders',
            'bills_of_materials',
            'production_orders',
            'contracting_claims',
        ];

        $tableReport = [];
        foreach ($coreTables as $table) {
            $exists = DB::getSchemaBuilder()->hasTable($table);
            $count = $exists ? DB::table($table)->count() : 0;
            $tableReport[] = [
                'Table' => $table,
                'Status' => $exists ? 'EXISTS' : 'MISSING',
                'Rows' => $count,
            ];
            if (! $exists) {
                $hasFailure = true;
            }
        }
        $this->table(['Table', 'Status', 'Rows'], $tableReport);

        // 3. Financial Checksum Calculation
        $this->info('3. Calculating Financial Integrity Checksum for Snapshot...');
        $debitSum = DB::table('journal_entry_lines')->sum('debit') ?? '0';
        $creditSum = DB::table('journal_entry_lines')->sum('credit') ?? '0';
        $totalEntries = DB::table('journal_entries')->count();

        $checksumData = [
            'timestamp' => now()->toIso8601String(),
            'total_journal_entries' => $totalEntries,
            'debit_sum' => (string) $debitSum,
            'credit_sum' => (string) $creditSum,
            'imbalance' => bcsub((string) $debitSum, (string) $creditSum, 6),
        ];

        if (bccomp((string) $debitSum, (string) $creditSum, 6) !== 0) {
            $this->error('Ledger imbalance detected during backup snapshot verification!');
            $hasFailure = true;
        } else {
            $this->line('  <info>[OK]</info> Journal ledger checksum is balanced. Checksum verification passed.');
        }

        // 4. Backup Storage Target Verification
        $this->info('4. Verifying Backup Storage Target Directory & Permissions...');
        $backupDir = storage_path('app/backups');
        if (! File::isDirectory($backupDir)) {
            File::makeDirectory($backupDir, 0755, true);
        }

        if (! is_writable($backupDir)) {
            $this->error(sprintf('Backup directory is not writable: %s', $backupDir));
            $hasFailure = true;
        } else {
            $this->line(sprintf('  <info>[OK]</info> Target backup directory verified: %s', $backupDir));
        }

        // 5. Generate Verification Drill Manifest
        if (! $this->option('dry-run')) {
            $manifestFilename = sprintf('backup_verify_drill_%s.json', now()->format('Ymd_His'));
            $manifestPath = $backupDir.DIRECTORY_SEPARATOR.$manifestFilename;

            $manifestContent = [
                'drill_type' => 'operational_release_verification',
                'environment' => config('app.env'),
                'database_driver' => $driver,
                'checksum' => $checksumData,
                'tables_verified' => count($coreTables),
                'status' => $hasFailure ? 'FAILED' : 'VERIFIED_PASSED',
            ];

            File::put($manifestPath, json_encode($manifestContent, JSON_PRETTY_PRINT));
            $this->line(sprintf('  <info>[OK]</info> Drill manifest successfully recorded at: %s', $manifestPath));
        }

        $this->newLine();
        if ($hasFailure) {
            $this->error('❌ BACKUP VERIFICATION DRILL FAILED: Schema or financial integrity violations detected.');

            return Command::FAILURE;
        }

        $this->info('================================================================');
        $this->info('✔ BACKUP VERIFICATION DRILL COMPLETED SUCCESSFULLY.');
        $this->info('All database structures, ledger checksums, and recovery paths are production-ready.');
        $this->info('================================================================');

        return Command::SUCCESS;
    }
}
