# Product Implementation Roadmap

| Milestone | Scope Summary | Key Deliverables | Status |
|---|---|---|---|
| M0 — Inspect & Specify | Tech stack validation, threat model, ADRs, initial ERD, bilingual docs skeleton | Stack compatibility record, ADR-0001, ASVS baseline, documentation tree | Complete |
| M1 — Platform Foundation | Authentication, MFA, Tenancy, Companies, Branches, RBAC, Bilingual Shell, Party CRUD, Negative isolation tests | Working login, tenant/company switcher, party CRUD, negative Pest tests | Complete |
| M2 — Accounting & Service Revenue | Accounts, periods, exact posting engine, service invoices, receipts, allocations, trial balance, AR aging | Service invoice-to-receipt cycle, balancing journals, PDF/print rendering | Complete |
| M3 — Procure-to-Pay & Cash Control | POs, vendor bills, AP, payment records/allocations, expenses, bank reconciliation | Vendor profiles, PO approval workflow, Vendor bills with 10% test recoverable tax, AP payments & allocations, Treasury transfers, AP Aging report | Complete |
| M4 — Goods & Distribution | Products, units, warehouses, inventory movements, weighted-average valuation, non-negative stock enforcement, GRNI matching, transfers, adjustments | Moving weighted-average costing engine, Goods Receipts with GRNI clearing GL, Inter-warehouse transfers, Stock adjustments, Inventory Valuation report | Complete |
| M5 — Workforce & Financial Management | HR, attendance, payroll framework, asset register, depreciation, budgets, fiscal close | Asset register, depreciation journal, payroll run | Complete |
| M6 — Commercial & Service Management | CRM, quotations, project timesheets, recurring contracts, support tickets | Lead conversion, sales quotes & orders, project profitability, contract recurring billing, support SLA tickets | Complete |
| M7 — Industry & External Packages | Trade & distribution, retail POS, contracting, light manufacturing, localization | Touchscreen Retail POS with perpetual inventory & ZATCA QR, Light Manufacturing BOM & Production Orders, Wholesale Tier Pricing, Contracting Progress Claims & Retention | Complete |
| M8 — Release Verification | Full regression, ASVS review, backup/restore drills, accessibility verification, audit export | Production release readiness | Planned |
