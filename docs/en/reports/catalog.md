# Financial Reports Catalog

## 1. Trial Balance (`/reports/trial-balance`)
- **Objective**: Verifies the fundamental mathematical equilibrium of the double-entry accounting ledger across all active postable accounts for a given legal company.
- **Parameters**:
  - `as_of_date` (Date, default: today): Upper boundary for journal entry inclusion.
- **Metrics Calculated**:
  - Account Debit Total: $\sum \text{Debits}$ posted to the account.
  - Account Credit Total: $\sum \text{Credits}$ posted to the account.
  - Net Debit: $\text{Debit} - \text{Credit}$ (when $\text{Debit} > \text{Credit}$).
  - Net Credit: $\text{Credit} - \text{Debit}$ (when $\text{Credit} > \text{Debit}$).
  - Grand Total Net Debit & Grand Total Net Credit.
  - Equilibrium Status: Boolean flag asserting $\text{Grand Total Debit} == \text{Grand Total Credit}$.

---

## 2. General Ledger (`/reports/general-ledger`)
- **Objective**: Displays chronological journal transaction lines and running balance computations for financial auditing.
- **Parameters**:
  - `account_id` (UUID, optional): Filter by a specific postable account.
  - `start_date` (Date, optional): Period start date.
  - `end_date` (Date, default: today): Period end date.
- **Output Details**:
  - Date, Entry Number, Line Description, Debit, Credit.
  - Running Balance: Continuously evaluated using `bcmath` taking account normal balance convention (Debit-normal for Assets/Expenses; Credit-normal for Liabilities/Equity/Revenue) into account.

---

## 3. Accounts Receivable Aging (`/reports/ar-aging`)
- **Objective**: Segregates unpaid and partially paid customer receivables by delinquency age brackets to monitor working capital and credit risk.
- **Parameters**:
  - `as_of_date` (Date, default: today): Age computation anchor.
- **Aging Brackets**:
  - **Current (0 to 30 Days)**: Due date not reached or overdue $\le 30$ days.
  - **31 to 60 Days**: Overdue by 31 to 60 days.
  - **61 to 90 Days**: Overdue by 61 to 90 days.
  - **Over 90 Days**: Overdue by $> 90$ days.
  - **Total Outstanding**: Sum of all overdue and current balances grouped by customer.
