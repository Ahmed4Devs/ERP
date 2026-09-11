# Product Implementation Roadmap

| Milestone | Scope Summary | Key Deliverables | Status |
|---|---|---|---|
| M0 — Inspect & Specify | Tech stack validation, threat model, ADRs, initial ERD, bilingual docs skeleton | Stack compatibility record, ADR-0001, ASVS baseline, documentation tree | Complete |
| M1 — Platform Foundation | Authentication, MFA, Tenancy, Companies, Branches, RBAC, Bilingual Shell, Party CRUD, Negative isolation tests | Working login, tenant/company switcher, party CRUD, negative Pest tests | Complete |
| M2 — Accounting & Service Revenue | Accounts, periods, exact posting engine, service invoices, receipts, allocations, trial balance, AR aging | Service invoice-to-receipt cycle, balancing journals, PDF/print rendering | Complete |
| M3 — Procure-to-Pay & Cash Control | POs, vendor bills, AP, payment records/allocations, expenses, bank reconciliation | AP subledger, matching, bank reconciliation | Planned |
| M4 — Goods & Distribution | Products, units, warehouses, inventory movements, weighted-average valuation, GRNI matching | Stock ledger, COGS, moving average costing | Planned |
| M5 — Workforce & Financial Management | HR, attendance, payroll framework, asset register, depreciation, budgets, fiscal close | Asset register, depreciation journal, payroll run | Planned |
| M6 — Commercial & Service Management | CRM, quotations, project timesheets, recurring contracts, support tickets | Project profitability, contract billing | Planned |
| M7 — Industry & External Packages | Trade & distribution, retail POS, contracting, light manufacturing, localization | Specialized industry workflows | Planned |
| M8 — Release Verification | Full regression, ASVS review, backup/restore drills, accessibility verification, audit export | Production release readiness | Planned |
