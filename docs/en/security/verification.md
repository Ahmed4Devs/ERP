# OWASP ASVS 4.0 Security Verification Report

This document specifies the security controls, threat model mitigations, and ASVS 4.0 verification evidence for the ERP modular monolith.

---

## 1. Security Architecture & Threat Model Overview

The system enforces defence-in-depth across multiple application layers:
- **Tenant & Legal Entity Scoping**: Every relational table containing business data is scoped with `tenant_id` and, where applicable, `company_id`. Global model scopes and controller guards strictly reject cross-tenant data access.
- **Financial Immutability**: Posted journal entries, invoice line items, and stock movement records are write-once, immutable records. Any business adjustment or correction requires an explicit reversing transaction or compensating credit note.
- **Exact Numeric Invariants**: All monetary calculations and inventory quantities use `NUMERIC(24,6)` and PHP `bcmath` functions, precluding floating-point precision flaws or rounding exploits.

---

## 2. OWASP ASVS 4.0 Requirement Mapping

| ASVS Category | Requirement Summary | Implementation Mechanism | Automated Verification | Status |
|---|---|---|---|---|
| **V1: Architecture** | Multi-tenant logical isolation and explicit trust boundaries | `BelongsToTenant` trait, `CurrentTenant` and `CurrentCompany` scoped singletons. | `TenancyIsolationTest`, `SecurityComplianceTest` | **Verified** |
| **V2: Authentication** | Secure credential storage and multi-factor authentication | Laravel Fortify, Bcrypt password hashing, TOTP two-factor authentication, and WebAuthn Passkeys. | `AuthTest`, `SecurityComplianceTest` | **Verified** |
| **V3: Session Mgmt** | Session fixation prevention and CSRF protection | Encrypted HTTP-only cookies, strict session regeneration on login, CSRF tokens on all POST/PUT/DELETE requests. | `SecurityComplianceTest` | **Verified** |
| **V4: Access Control** | Role-Based Access Control (RBAC) and least privilege | Explicit permission assignments on memberships, route middleware, and controller policy gates. | `SecurityComplianceTest`, `TenancyIsolationTest` | **Verified** |
| **V5: Input Validation** | Strict input validation and decimal precision checks | Form Request validation rules, numeric boundary enforcement (`min:0`), and non-negative stock policies. | `SecurityComplianceTest`, `ReleaseVerificationTest` | **Verified** |
| **V8: Data Protection** | Immutable audit trails and sensitive data redaction | Dedicated `audit_logs` table capturing mutation events, IP addresses, user IDs, and before/after state snapshots. | `SecurityComplianceTest` | **Verified** |

---

## 3. Negative Isolation Test Evidence

Automated security feature tests (`tests/Feature/Release/SecurityComplianceTest.php` and `tests/Feature/Platform/TenancyIsolationTest.php`) deterministically confirm:
1. **Unauthenticated Access**: Direct requests to protected endpoints (`/dashboard`, `/accounting/periods`, `/vendor-bills`, `/retail/terminals`, `/manufacturing/orders`) redirect to `/login`.
2. **Cross-Tenant Prevention**: When a user belonging to Tenant B attempts to view or modify resources owned by Tenant A (such as POS terminals, progress claims, or production orders), the application returns `403 Forbidden` or `404 Not Found`.
3. **Cross-Company Boundary**: Users cannot switch their active session context to a company that does not belong to their active tenant.
4. **Oversell Prevention**: High-concurrency or excessive quantity purchase/sale attempts exceeding available warehouse stock throw `InsufficientStockException`.
