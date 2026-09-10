# ADR 0001: Modular Monolith and Structural Tenancy Architecture

## Status
Accepted

## Context
The ERP system requires strict isolation between customer organizations (Tenants), multi-company and multi-branch support per tenant, exact financial correctness, high developer ergonomics, and minimal distributed operational overhead.

## Decision
1. Adopt a **Modular Monolith** structure in Laravel under `app/Modules/` and `app/Shared/`.
2. Adopt a **Shared Database with Explicit Structural Tenancy** (`tenant_id`, `company_id`, `branch_id`).
3. Enforce context derivation from authenticated memberships on every request via `EnsureTenantAndCompanyScope` middleware.
4. Client side: React 19 SPA via Inertia.js with strict TypeScript and Tailwind v4.

## Consequences
- Single relational datastore enables atomic transactions across accounting and subledgers.
- No cross-service network latency or distributed consensus overhead.
- All models must implement strict tenancy traits and all queries must be explicitly scoped.
