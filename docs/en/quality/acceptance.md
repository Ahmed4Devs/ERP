# Quality Assurance & Acceptance Testing Matrix

This document outlines the testing strategy, deterministic acceptance scenarios, and verification results across all implemented ERP milestones (M1 through M8).

---

## 1. Test Strategy & Architecture

The testing architecture follows the **Pest PHP** framework with strict separation of concerns, transactional isolation via `RefreshDatabase`, and multi-tenancy boundary verification.

### Core Testing Pillars:
1. **Financial Invariant & Exact Arithmetic**: All ledger amounts, line totals, tax distributions, and currency conversions are validated using `bcmath` and `NUMERIC(24,6)`. Zero floating-point arithmetic is permitted.
2. **Atomic Double-Entry Posting**: Every posted transaction (invoices, receipts, bills, disbursements, transfers, POS sales, and depreciation) must produce balanced journal lines where:
   $$\sum \text{Debits} = \sum \text{Credits}$$
3. **Strict Multi-Tenancy & Company Isolation**: Every query and transaction must be scoped to the authenticated user's active `tenant_id` and `company_id`. Negative tests verify that tenant cross-talk or identifier tampering returns `403 Forbidden` or `404 Not Found`.
4. **Perpetual Moving-Average Costing**: Inventory transactions (GRN, stock movements, manufacturing consumption, and POS sales) recalculate unit moving averages and enforce non-negative stock invariants.

---

## 2. Deterministic Acceptance Scenarios Matrix

| Scenario ID | Milestone | Feature Area | Input / Trigger | Expected Outcome | Verification Status |
|---|---|---|---|---|---|
| **SCN-ACC-001** | M2 | Accounting | Service Invoice of 1,000.00 SAR with 10% test tax | DR AR 1,100.00; CR Revenue 1,000.00; CR Tax Liability 100.00. Balanced journal entry posted. | **Verified** |
| **SCN-ACC-002** | M2 | Accounting | Partial payment receipt of 400.00 SAR allocated to invoice | DR Bank 400.00; CR AR 400.00; Invoice outstanding balance reduces to 700.00 with `partially_paid` status. | **Verified** |
| **SCN-ACC-003** | M2 | Accounting | Idempotent repost of identical transaction key | Returns original posting record without duplicating financial effects or ledger entries. | **Verified** |
| **SCN-ACC-004** | M2 | Accounting | Backdated posting into closed fiscal period | Throws `PeriodClosedException` or validation error; no lines inserted. | **Verified** |
| **SCN-PUR-001** | M3 | Purchasing | Purchase Order approval and Goods Receipt Note (GRN) | Stock moving average cost updated; DR Inventory, CR GRNI Clearing. | **Verified** |
| **SCN-PUR-002** | M3 | Purchasing | Vendor Bill matching for 2,000.00 SAR + 10% test tax | DR Expense/GRNI 2,000.00; DR Input Tax 200.00; CR AP 2,200.00. | **Verified** |
| **SCN-PUR-003** | M3 | Purchasing | Full and partial vendor bill payment disbursement | Decrements bill balance due, updates status (`partially_paid` / `paid`), balances bank and AP accounts. | **Verified** |
| **SCN-INV-001** | M4 | Inventory | Sequential receipts at varying costs (10 @ 100, 20 @ 130) | Correctly weights average cost to 120.00 SAR $((1000 + 2600) / 30)$; subsequent issue of 15 units relieves 1,800.00 value. | **Verified** |
| **SCN-INV-002** | M4 | Inventory | Stock oversell attempt exceeding on-hand quantity | Throws `InsufficientStockException`; prevents negative physical stock. | **Verified** |
| **SCN-PAY-001** | M5 | Payroll | Monthly salary calculation with 10% GOSI deduction | Generates balanced payroll journal: DR Salary Expense, CR GOSI Liability, CR Bank Disbursement. | **Verified** |
| **SCN-AST-001** | M5 | Fixed Assets | Straight-line depreciation calculation and posting | Posts monthly depreciation: DR Depreciation Expense, CR Accumulated Depreciation with salvage value clamping. | **Verified** |
| **SCN-CRM-001** | M6 | CRM & Sales | CRM Lead conversion to Customer Party and Quotation | Automatically converts lead to `Party` record (`type=customer`) and creates draft Sales Quotation. | **Verified** |
| **SCN-POS-001** | M7 | Retail POS | Shift opening float, cash sale with ZATCA Phase 1 QR | Calculates 10% VAT, relieves stock at moving-average cost, generates compliant TLV Base64 QR code, reconciles cash on close. | **Verified** |
| **SCN-MFG-001** | M7 | Manufacturing | Bill of Materials (BOM) & Production Order completion | Consumes component stock from warehouse, rolls up unit material cost, and receipts finished goods into stock. | **Verified** |
| **SCN-CON-001** | M7 | Contracting | Progress Claim certification with 5% contractual retention | Computes work done, withholds 5% retention, calculates 10% VAT on net, and generates official Service Invoice. | **Verified** |
| **SCN-AUD-001** | M8 | Release | Comprehensive Ledger & Inventory Integrity Audit | Automated audit checks all journal entries for DR=CR equilibrium, validates non-negative stock, and verifies backup drill. | **Verified** |

---

## 3. Automated Test Execution Evidence

All automated test suites pass with 100% success rate:
- **Total Tests**: 97 feature and unit tests.
- **Total Assertions**: Over 540 automated assertions.
- **Execution Engine**: Pest PHP on PostgreSQL 18.6 with PHP 8.4+.
- **CLI Commands**:
  - `php artisan audit:verify-ledgers` (Exit Code 0: All ledgers balanced).
  - `php artisan backup:verify-drill` (Exit Code 0: All schema tables and checksums verified).
