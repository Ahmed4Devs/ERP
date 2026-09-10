# Entity Relationship Diagram (ERD) — Foundation Layer

```mermaid
erDiagram
    TENANTS ||--o{ COMPANIES : "owns"
    TENANTS ||--o{ MEMBERSHIPS : "has"
    TENANTS ||--o{ PARTIES : "scopes"
    TENANTS ||--o{ AUDIT_LOGS : "records"
    
    COMPANIES ||--o{ BRANCHES : "contains"
    COMPANIES ||--o{ CUSTOMER_PROFILES : "configures"
    
    USERS ||--o{ MEMBERSHIPS : "belongs to"
    MEMBERSHIPS ||--o{ MEMBERSHIP_ROLES : "assigned"
    ROLES ||--o{ MEMBERSHIP_ROLES : "grants"
    ROLES ||--o{ ROLE_PERMISSIONS : "contains"
    PERMISSIONS ||--o{ ROLE_PERMISSIONS : "defines"
    
    PARTIES ||--o{ CUSTOMER_PROFILES : "has company profile"
```

## Description of Entities
1. **Tenants**: Independent organization tenant boundary (`id`, `name`, `slug`, `status`).
2. **Companies**: Legal operating entities under a Tenant (`id`, `tenant_id`, `name`, `currency`, `tax_number`).
3. **Branches**: Physical / operational branches under a Company (`id`, `company_id`, `name`, `code`).
4. **Users**: Identity accounts (`id`, `name`, `email`, `password`, `locale`).
5. **Memberships**: Bridge connecting User to Tenant with status, role, and default company.
6. **Parties**: Shared business entities across tenant (`id`, `tenant_id`, `name`, `type`).
7. **CustomerProfiles**: Company-specific accounts and credit settings for a Party (`id`, `company_id`, `party_id`).
8. **AuditLogs**: Immutable record of sensitive actions (`id`, `tenant_id`, `company_id`, `user_id`, `action`, `entity_type`, `entity_id`, `payload`, `ip_address`).
