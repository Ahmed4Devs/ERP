# Treasury & Cash Control

## Overview
Treasury and Cash Control ensures total visibility, reconciliation, and integrity over liquid assets, bank accounts, and petty cash funds across all legal entities in the multi-tenant ERP platform.

---

## 1. Fund Transfers Between Internal Accounts

### 1.1 Double-Entry GL Invariant
Internal transfers between bank and cash accounts must maintain exact double-entry balance:
$$\text{Debit (Destination)} = \text{Credit (Source)}$$

```
Example: 5,000 SAR transfer from Petty Cash (1010) to Bank (1020)
-----------------------------------------------------------------
DR   1020 Main Operating Bank Account    5,000.00 SAR
CR   1010 Petty Cash Fund               5,000.00 SAR
```

### 1.2 Invariants & Validation Rules
- **Non-Identical Accounts:** The source and destination accounts cannot be the same entity account (`from_account_id != to_account_id`).
- **Postability Check:** Both accounts must have `is_postable = true` and belong to the active legal company.
- **Strict Positive Amount:** Transfer amounts must be strictly positive (`amount > 0`).
- **Closed Period Lock:** Transfers dated within closed fiscal periods are strictly rejected.

---

## 2. Liquidity & Cash Flow Controls
- **Real-time Running Balance:** Every cash or bank movement updates the cached `current_balance` on the `accounts` table atomically.
- **Disbursement Authorization:** Vendor payments can only draw from authorized cash/bank asset accounts (`subtype in ['bank', 'cash', 'current_asset']`).
- **Reconciliation Audit Trail:** Each transfer creates a linked `JournalEntry` with reference numbers, notes, and audit timestamps.
