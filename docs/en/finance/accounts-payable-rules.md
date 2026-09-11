# Accounts Payable (A/P) Rules & Accounting Invariants

## Overview
Accounts Payable (A/P) governs supplier liabilities, invoice verification, recoverable tax accounting, and settlement disbursements. In accordance with the ERP core principles, all A/P operations are strictly multi-tenant, company-isolated, and atomic.

---

## 1. Accounting Invariants & Balanced Journal Entries

### 1.1 Vendor Bill Recognition
When a vendor bill is posted, it creates an immutable, balanced double-entry journal entry:

$$\sum \text{Debits} = \sum \text{Credits}$$

- **Debit:** Expense Accounts (e.g., `5100 General Expenses`, `5200 IT & Software Expenses`) for the taxable subtotal.
- **Debit:** Test Tax Recoverable (`1150 Test Tax Recoverable`) for the 10% input tax.
- **Credit:** Accounts Payable Control (`2010 Accounts Payable`) for the full invoice total.

```
Example: 2,000 SAR bill with 10% test tax (200 SAR)
------------------------------------------------------------
DR   5200 IT & Software Expenses       2,000.00 SAR
DR   1150 Test Tax Recoverable           200.00 SAR
CR   2010 Accounts Payable (A/P)       2,200.00 SAR
```

### 1.2 Input Tax (Recoverable) vs. Output Tax (Liability)
- **Customer Sales Invoices:** Credit Output Tax Liability (`2150 Test Tax Liability`).
- **Vendor Purchase Bills:** Debit Recoverable Input Tax (`1150 Test Tax Recoverable`).
- Net tax position = `2150 (Credit)` - `1150 (Debit)`.

### 1.3 Vendor Payment & Disbursement
When a disbursement is recorded:
- **Debit:** Accounts Payable Control (`2010 Accounts Payable`) for the payment amount.
- **Credit:** Bank or Cash Account (`1020 Main Bank Account` or `1010 Petty Cash`) for the payment amount.

```
Example: 1,000 SAR payment via bank transfer
------------------------------------------------------------
DR   2010 Accounts Payable (A/P)       1,000.00 SAR
CR   1020 Main Operating Bank Account  1,000.00 SAR
```

---

## 2. Multi-Level State Machine

### 2.1 Purchase Order Lifecycle
```
[Draft] ---> (Approve) ---> [Approved] ---> (Bill Received) ---> [Billed]
   |                           |
   +-------> [Cancelled] <-----+
```

### 2.2 Vendor Bill Lifecycle
```
[Draft] ---> (Post Action) ---> [Posted]
                                   |
                +------------------+------------------+
                |                                     |
         (Partial Payment)                     (Full Payment)
                v                                     v
       [Partially Paid] ---> (Final Payment) ---> [Paid]
```

### 2.3 Idempotency & Concurrency Invariants
- Posting an already posted vendor bill (`status in ['posted', 'partially_paid', 'paid']`) raises a `PostingConflictException` (HTTP 409).
- Double-click protection via client-side locking and database transaction locks.
- Closed fiscal periods strictly prevent bill posting or payment allocation.

---

## 3. Accounts Payable Aging Engine
The A/P aging engine aggregates unpaid bills by vendor and classifies them into standardized maturity brackets relative to a target calculation date ($T_{\text{asOf}}$):

1. **Current (0–30 Days):** Due date within 30 days of calculation date ($T_{\text{due}} \ge T_{\text{asOf}} - 30$).
2. **31–60 Days:** $T_{\text{asOf}} - 60 \le T_{\text{due}} < T_{\text{asOf}} - 30$.
3. **61–90 Days:** $T_{\text{asOf}} - 90 \le T_{\text{due}} < T_{\text{asOf}} - 60$.
4. **Over 90 Days:** $T_{\text{due}} < T_{\text{asOf}} - 90$.

All computations use `NUMERIC(24,6)` and `bcmath` to ensure zero floating-point drift.
