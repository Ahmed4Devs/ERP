# General Accounting Rules and Posting Engine Specifications

## 1. Authoritative Precision and Storage Standards
- **Database Column Definition**: All monetary amounts, balances, tax figures, exchange rates, and quantities are stored as `NUMERIC(24,6)`.
- **Runtime Arithmetic Engine**: PHP runtime floating-point math (`float`) is strictly prohibited for monetary calculations. All additions, subtractions, multiplications, comparisons, and divisions use `bcmath` functions (`bcadd`, `bcsub`, `bcmul`, `bcdiv`, `bccomp`) with an explicit scale of 6 decimal places.

## 2. Double-Entry Invariants
- **Debit-Credit Balance Rule**: For any journal entry, the absolute sum of line debits MUST equal the sum of line credits:
  $$\sum \text{debits} = \sum \text{credits}$$
  Any transaction failing this check is immediately rejected with a `PostingException` prior to commit.
- **Line Non-Negativity**: Every debit and credit field must be $\ge 0$. Negative values are prevented by both database-level check constraints (`chk_jel_non_negative`) and application validation.
- **Mutual Exclusivity**: A journal entry line must contain either a debit or a credit, never both (`chk_jel_mutually_exclusive`).

## 3. Fiscal Periods and Locking
- Every journal entry must be booked within an active fiscal period (`fiscal_periods`).
- **Closed Period Lock**: If the posting date falls within a fiscal period with `status = 'closed'`, posting is strictly blocked.
- Period dates and statuses are checked atomically inside the database transaction.

## 4. Multi-Tenant and Legal Company Scoping
- Accounts, journal entries, and lines strictly belong to a specific `company_id`.
- Cross-company account postings within a single journal entry are prohibited and rejected with `PostingException`.
- Only postable accounts (`is_postable = true`) may receive line entries.

## 5. Immutability and Auditability
- **Posted Record Immutability**: Once a `JournalEntry` has status `posted`, it cannot be updated, edited, or deleted. Eloquent model hooks (`updating` and `deleting`) on `JournalEntry` and `JournalEntryLine` throw exceptions if modification is attempted.
- **Reversal Only**: Corrections must be made via compensating reverse journal entries (`ReverseJournalEntryAction`). The reversal journal links back to the original via `reversal_of_id`.

## 6. Idempotency Guarantees
- The posting engine accepts an optional `idempotency_key`.
- **Replay Verification**: If an existing journal entry is found with the same key:
  - If the SHA-256 payload hash matches the stored `request_hash`, the engine safely replays and returns the existing `JournalEntry` without re-executing accounting mutations.
  - If the key matches but the payload hash differs, the engine throws a `PostingConflictException` (HTTP 409 Conflict).

## 7. Account Balances Maintenance
- Account current balances are updated atomically within the same database transaction as the journal entry lines.
- Asset and Expense accounts increase on Debit and decrease on Credit.
- Liability, Equity, and Revenue accounts increase on Credit and decrease on Debit.
