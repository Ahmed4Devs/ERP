# Requirements Traceability Matrix

| Requirement ID | Module | Description | Milestone | Verification Status |
|---|---|---|---|---|
| REQ-PLT-001 | Platform | Multi-tenant shared database with explicit structural scoping (`tenant_id`) | M1 | Verified |
| REQ-PLT-002 | Platform | Bilingual UI support with seamless Arabic (RTL) and English (LTR) switching | M1 | Verified |
| REQ-PLT-003 | Platform | Role-Based Access Control (RBAC) with scoped memberships | M1 | Verified |
| REQ-PLT-004 | Platform | Mandatory Multi-Factor Authentication (MFA) for privileged & financial roles | M1 | Verified |
| REQ-PLT-005 | Platform | Structural audit logging for security and business state mutations | M1 | Verified |
| REQ-ORG-001 | Organization | Legal Company entity management under Tenants (`company_id`) | M1 | Verified |
| REQ-ORG-002 | Organization | Branch operational site management under Companies (`branch_id`) | M1 | Verified |
| REQ-MST-001 | Master Data | Parties management (Customers & Vendors) with company-specific profiles | M1 | Verified |
| REQ-ACC-001 | Accounting | Atomic posting engine with exact numeric precision (`NUMERIC(24,6)`) | M2 | Verified |
| REQ-ACC-002 | Accounting | Service invoice to partial receipt allocation | M2 | Verified |
| REQ-PUR-001 | Purchasing | Purchase Order lifecycle with approval workflow and vendor bill matching | M3 | Verified |
| REQ-PUR-002 | Purchasing | Vendor bill posting with 10% test recoverable tax & payment disbursement allocation | M3 | Verified |
| REQ-TRS-001 | Treasury | Internal treasury cash/bank fund transfers with balanced double-entry GL | M3 | Verified |
| REQ-REP-002 | Reports | Accounts Payable Aging report grouped by supplier across 30-day brackets | M3 | Verified |
| REQ-INV-001 | Inventory | Perpetual moving-average valuation with atomic Goods Receipt & GRNI clearing | M4 | Verified |
| REQ-INV-002 | Inventory | Internal multi-warehouse stock transfers and physical inventory adjustments | M4 | Verified |
| REQ-HR-001 | Human Resources | Employee directory, salary components, departments, and attendance tracking | M5 | Verified |
| REQ-PAY-001 | Payroll | Monthly payroll calculation, 10% GOSI deduction, double-entry GL posting & disbursement | M5 | Verified |
| REQ-AST-001 | Fixed Assets | Fixed assets register, straight-line depreciation engine with salvage value clamping | M5 | Verified |
| REQ-ACC-003 | Accounting | Fiscal period locking enforcement preventing backdated postings into closed periods | M5 | Verified |
