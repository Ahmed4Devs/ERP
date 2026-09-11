# Payroll Accounting & Compensation Framework

## Overview
The Payroll module generates monthly payslips, automates synthetic social insurance contributions (GOSI test rate), creates balanced double-entry General Ledger postings for expenses and payroll liabilities, and manages bank disbursement settlement.

---

## 1. Payroll Run Generation Engine
Payroll is generated on a per-company basis for a specific year and month (`PAY-YYYY-MM`):
1. **Scope:** Gathers all `active` employees in the legal entity.
2. **Components per Payslip:**
   - **Basic Salary:** Contractual monthly wage.
   - **Allowances:** Housing, transport, other allowances, and attendance overtime.
   - **Gross Salary:** Base pay + total allowances.
   - **Social Insurance / GOSI Deduction:** Calculated at 10% test contribution rate on basic salary:
     $$\text{Deduction} = \text{Basic Salary} \times 0.100000$$
   - **Net Salary:**
     $$\text{Net Salary} = \text{Gross Salary} - \text{Deductions}$$

---

## 2. Double-Entry General Ledger Posting
Posting a payroll run creates an immutable, balanced GL journal entry through the transactional `PostingEngine`:

| Line | Account Code & Name | Type | Nature | Amount |
|---|---|---|---|---|
| **Debit** | `5110 Salaries & Wages Expense` | Expense | DR | Total Basic Salaries |
| **Debit** | `5120 Employee Allowances & Benefits` | Expense | DR | Total Allowances + Overtime |
| **Credit** | `2030 Accrued Salaries & Payroll Payable` | Liability | CR | Total Net Salaries |
| **Credit** | `2040 Social Insurance / GOSI Payable` | Liability | CR | Total Deductions |

$$\sum \text{Debits} = \text{Total Basic} + \text{Total Allowances} = \text{Gross Pay}$$
$$\sum \text{Credits} = \text{Total Net} + \text{Total Deductions} = \text{Gross Pay}$$

The journal is strictly balanced to 6 decimal precision.

---

## 3. Bank Disbursement & Settlement
When salaries are disbursed via electronic bank transfer:
- **Disbursement Entry:**
  - **Debit:** `2030 Accrued Salaries & Payroll Payable` (clears the salary liability)
  - **Credit:** `1020 Bank Current Account` (reduces bank cash balance)
- Once posted, the payroll run status transitions to `paid` and employee payslips are marked as paid.
