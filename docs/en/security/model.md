# Security Threat Model & Controls (OWASP ASVS 5.0.0)

## 1. Security Baseline & Standards
The system adopts OWASP ASVS (Application Security Verification Standard) version 5.0.0, targeting all applicable Level 3 controls for sensitive enterprise/financial data, with Level 1 and Level 2 controls as mandatory baselines.

## 2. Threat Analysis & Mitigations

| Threat Vector | Potential Impact | Architecture Mitigation |
|---|---|---|
| Tenant Escape | Unauthorized access to another customer's data | Composite foreign keys, tenant-scoped queries, middleware verification, route binding authorization |
| Horizontal Company Escalation | Cross-company modification of financial records | Explicit company context verification on all mutation operations; isolation policies |
| Fraudulent Approvals / Tampering | Alteration of approved/posted documents | Immutability of posted ledgers, distinct approval states, audit logging |
| Account Takeover | Compromise of privileged administrative roles | Mandatory Multi-Factor Authentication (MFA/TOTP/Passkeys) for privileged roles |
| Injection Attacks | SQL/Command/XSS injection | Parameterized Eloquent queries, strict React JSX escaping, Form Request validation |
| Data Exfiltration via Exports | Unauthorized mass data downloads | Permission-checked queued exports, scoped filters, audit logged downloads |
