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
