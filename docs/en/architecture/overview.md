# Architecture Overview

## 1. High-Level Modular Monolith Design
The system is built as a unified Modular Monolith inside a single Laravel repository, paired with React 19 and Inertia.js on the frontend, and PostgreSQL 18 as the single relational datastore.

### Core Architectural Layers:
1. **Shared Primitives (`app/Shared`)**: Core traits (`BelongsToTenant`, `BelongsToCompany`), money value objects, execution contexts, and common audit contracts.
2. **Platform Module (`app/Modules/Platform`)**: Manages Tenants, Users, Authentication, Two-Factor Authentication (MFA), Roles & Permissions, and System Auditing.
3. **Organization Module (`app/Modules/Organization`)**: Manages Legal Companies, Branches, Departments, and Cost Centers.
4. **Master Data Module (`app/Modules/MasterData`)**: Parties (Customers/Vendors), Products/Services, Units, Tax Codes, and Currencies.
5. **Business Modules**: Accounting, Treasury, Sales, Purchasing, Inventory, HR, Payroll, etc.

## 2. Multi-Tenancy & Structural Scoping
- **Database Model**: Shared PostgreSQL database with explicit tenant and company scope.
- **Tenant**: Independent customer organization or business group. All tenant-owned records have a foreign key `tenant_id`.
- **Company**: Legal entity within a Tenant. Legal records (journals, invoices, bank accounts, inventory) carry `company_id`.
- **Branch**: Operational site belonging to a Company (`branch_id`).
- **Isolation Enforcement**: Enforced structurally at the model level via traits, Form Requests, Route Model Binding, and Authorization Policies. Global scopes alone are treated as defensive aids, not the sole security boundary.
