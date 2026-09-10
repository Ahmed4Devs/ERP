# Role & Permission Matrix (RBAC)

## 1. Permission Naming & Structure
Permissions follow the pattern: `{module}.{resource}.{action}`
Examples:
- `platform.tenant.manage`
- `organization.company.view`
- `organization.company.create`
- `organization.branch.manage`
- `masterdata.party.view`
- `masterdata.party.create`
- `masterdata.party.update`
- `accounting.invoice.view`
- `accounting.invoice.post`

## 2. Standard Roles
1. **Tenant Super Admin**: Global administration of tenant settings, companies, branches, and memberships.
2. **Company Administrator**: Administration of legal entity settings, local master data, and local user roles.
3. **Financial Controller / Accountant**: Access to accounting engines, posting, bank accounts, journals. Mandatory MFA required.
4. **Sales / Operations Officer**: Creation and management of quotations, orders, customers, and delivery notes.
5. **Auditor / Read-Only**: Scoped visibility to financial and operational records without mutation capabilities.
