<?php

namespace App\Modules\Accounting\Services;

use App\Modules\Accounting\Exceptions\PostingException;
use App\Modules\Accounting\Models\JournalEntry;
use App\Modules\Platform\Services\AuditLogger;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Support\Facades\DB;

class ReverseJournalEntryAction
{
    public function __construct(
        protected PostingEngine $postingEngine
    ) {}

    public function execute(JournalEntry|string $journalEntry, ?string $reason = null, ?string $reversalDate = null): JournalEntry
    {
        $currentTenant = app(CurrentTenant::class);
        $currentCompany = app(CurrentCompany::class);

        $tenantId = $currentTenant->id();
        $companyId = $currentCompany->id();

        $entry = $journalEntry instanceof JournalEntry
            ? $journalEntry->loadMissing('lines')
            : JournalEntry::where('company_id', $companyId)
                ->with('lines')
                ->findOrFail($journalEntry);

        if ($entry->status !== 'posted') {
            throw new PostingException("Cannot reverse journal entry with status '{$entry->status}'.");
        }

        $date = $reversalDate ?? now()->toDateString();
        $reasonText = $reason ?? "Reversal of {$entry->entry_number}";

        return DB::transaction(function () use ($tenantId, $companyId, $entry, $date, $reasonText): JournalEntry {
            // Swap debits and credits
            $reversalLines = [];
            foreach ($entry->lines as $line) {
                $reversalLines[] = [
                    'account_id' => $line->account_id,
                    'debit' => $line->credit,
                    'credit' => $line->debit,
                    'description' => "Reversal: {$line->description}",
                ];
            }

            $reversalEntry = $this->postingEngine->post([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'date' => $date,
                'description' => $reasonText,
                'source_type' => 'reversal',
                'source_id' => $entry->id,
                'reversal_of_id' => $entry->id,
                'lines' => $reversalLines,
            ]);

            $entry->update(['status' => 'reversed']);

            AuditLogger::log(
                action: 'journal_entry.reversed',
                entityType: JournalEntry::class,
                entityId: $entry->id,
                companyId: $companyId,
                tenantId: $tenantId
            );

            return $reversalEntry;
        });
    }
}
