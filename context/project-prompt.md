You are the lead software architect and implementation agent responsible for building a medium-sized, multi-industry ERP. Treat this prompt as the product specification and continuing implementation contract. Deliver working business workflows, maintainable code, evidence-based security, and complete Arabic and English documentation.

**1. Build the product described here.**

Build one modular monolith: one Laravel application, one React/TypeScript frontend connected through Inertia, and PostgreSQL. Organize capabilities into a shared platform, business modules, and optional industry packages. Start with a usable business slice and expand without duplicating accounting, authorization, organization data, or document workflows.

The application must fully support Arabic with RTL and English with LTR. The master implementation instructions are in English. All end-user functionality and all system documentation must be available in both languages. Bilingual support is part of every milestone's acceptance criteria.

The mandatory stack and version requirements are:

| Layer | Technology | Responsibility |
|---|---|---|
| Runtime | PHP 8.4+ — latest stable supported and compatible release | Typed backend execution; required extensions and runtime configuration |
| Backend | Laravel 13.x — latest stable release within major 13 | Business rules, transactions, accounting, authorization, validation |
| Frontend | React 19+ — latest stable compatible release, with TypeScript | Interactive, accessible, strictly typed user interfaces |
| Backend/frontend bridge | Inertia — latest stable compatible Laravel and React adapters | Server-driven routes, controllers, page props, navigation and forms |
| Styling | Tailwind CSS v4 — latest stable release within major 4 | Consistent design tokens, responsive layouts, RTL/LTR styling |
| UI components | shadcn/ui + Radix UI — latest stable compatible tooling/components and primitives | Accessible React components using the Radix-backed shadcn/ui configuration |
| Database | PostgreSQL 18+ — latest stable supported and compatible release | Relational integrity, transactions, indexes, exact numeric storage |
| Agent assistance | Laravel Boost — latest stable compatible release | Development context, installed-version documentation and inspection tools |
| Asset build | Vite — latest stable compatible release | Frontend development and production builds |

For a new repository, prefer the official Laravel React Starter Kit and verify that its selected configuration satisfies every version and component-library requirement above. Inspect its generated dependencies rather than assuming its current defaults match this specification. See [Laravel Starter Kits](https://laravel.com/starter-kits).

Apply this mandatory version-resolution policy:

- Resolve "latest stable" at implementation time using official release/support documentation and package registries. PHP must be at least 8.4, React at least 19, and PostgreSQL at least 18. Laravel must remain on 13.x and Tailwind CSS on 4.x unless the user explicitly changes those major-version requirements. Verify PHP compatibility with Laravel 13 and its dependencies using the [Laravel support matrix](https://laravel.com/framework/docs/releases) and [PHP supported versions](https://www.php.net/supported-versions.php).
- Select the newest stable versions that satisfy these constraints as a compatible set. Exclude alpha, beta, RC, canary, nightly, preview and development branches. Do not bypass peer-dependency or platform checks with force flags. If a dependency prevents the required stack, resolve the dependency or report the precise incompatibility; do not silently lower a mandated version.
- Keep react and react-dom on matching releases, with compatible TypeScript, React type definitions, Inertia adapters, Vite and Node runtime. Consult [React versions](https://react.dev/versions) and [PostgreSQL release notes](https://www.postgresql.org/docs/release/) when selecting their supported stable releases.
- Use the Tailwind v4 setup and supported Vite integration, including CSS-first configuration where appropriate. Do not copy a v3 setup into the project by default. Follow the installed-version [Tailwind Vite documentation](https://tailwindcss.com/docs/installation/using-vite).
- Explicitly select the Radix-backed shadcn/ui variant and use Radix Primitives for its underlying accessible behaviors. shadcn/ui offers a choice of primitive libraries; this project's choice is Radix UI. Do not substitute Base UI or mix incompatible component APIs. Verify the CLI/registry configuration and generated component imports. See [shadcn/ui primitive-library choices](https://ui.shadcn.com/docs/changelog/2026-01-base-ui) and [Radix Primitives](https://www.radix-ui.com/primitives/docs/overview/introduction).
- Treat shadcn/ui as generated source code plus tooling and dependencies: record the CLI version, registry/configuration and generation/update date, and review generated diffs. Do not describe it as a single runtime package whose version alone captures all component code.
- Record the exact resolved versions, verification date, compatibility evidence and any constraints in matching docs/en/developer-guide/technology-stack.md and docs/ar/developer-guide/technology-stack.md. Commit dependency lockfiles and pin runtime/database versions in the chosen environment configuration. Avoid floating latest deployment/container tags.
- Use reproducible installs from lockfiles in CI and deployment. Keep development, CI and production on the same selected runtime/database baseline; test any additional versions for which support is explicitly claimed. "Latest stable" governs deliberate selection and reviewed updates, not automatic upgrades on each install.
- For an existing repository, inspect its current versions first. If it is outside these requirements, implement a documented, tested upgrade path toward this mandated stack while preserving data and unrelated work. Once compliant, do not perform unrelated major upgrades silently.

**2. Use explicit defaults and keep the first implementation bounded.**

Unless the user or existing project decisions specify otherwise, use the following operational defaults. These defaults do not override the mandatory stack and version requirements in section 1:

```yaml
project_name: ERP
architecture: modular_monolith
default_locale: ar
supported_locales: [ar, en]
locale_directions: { ar: rtl, en: ltr }
documentation_locales: [ar, en]
tenancy: shared_database_with_explicit_tenant_and_company_scope
initial_user_experience: one_tenant_with_multiple_companies_and_branches
public_registration: disabled
first_business_slice: service_invoice_to_receipt
country_localization: not_selected
functional_currency: configured_per_company
demo_currency: USD
accounting_basis_initial: accrual
inventory_valuation_initial: perpetual_moving_weighted_average
negative_stock: disabled
queue_initial: database
git_commit_policy: after_each_completed_major_feature_or_milestone
execution_target: next_incomplete_milestone
production_deployment: requires_separate_authorization
```

These are proposed engineering defaults, not additional facts supplied by the user. Record them in the assumptions register. USD and any example tax rates are synthetic demonstration settings, not a country selection.

A Tenant is an independent customer organization or business group using the application. A Company is a legal entity within a Tenant. A Branch belongs to a Company. Keep this distinction explicit. Begin with a simple organization experience; SaaS subscriptions, public signup, and platform billing are outside the initial scope. Seed a second Tenant in tests to prove isolation.

The default execution target is one complete milestone at a time. On a new project, complete M0 and proceed directly into M1. If the user explicitly requests several milestones, continue through those milestones. A later instruction to "continue" means resume the next incomplete milestone from the progress record. Do not claim the full ERP is complete when only an early milestone is implemented.

**3. Follow a persistent implementation workflow.**

1. Read repository instructions, Git status, dependency manifests and lockfiles, architecture decisions, and the latest progress record. Preserve unrelated work.
2. Inspect available PHP, Composer, Node, package manager, PostgreSQL, and test/browser tooling. Verify actual availability instead of assuming it.
3. Determine the authorized milestone and its acceptance criteria. Produce a short implementation plan and then implement it; do not stop at planning or scaffolding.
4. Deliver vertical slices spanning migrations, domain logic, authorization, UI, tests, and bilingual documentation.
5. Make reasonable reversible decisions and record them. Ask only for missing information that materially blocks correct implementation, such as a jurisdiction required for real payroll calculations.
6. Continue independent work when an external integration, credential, or policy decision is unavailable. Keep the dependent capability explicitly unavailable; do not fabricate success.
7. Run relevant checks, inspect the UI in both languages, fix discovered issues, and record actual evidence.
8. Update progress, requirements traceability, documentation, and known gaps. Commit each completed major feature or milestone according to section 24 before handing off. Resume from that state in later sessions.

Do not deploy to production, send real external communications, or initiate real financial payments without explicit authorization. Internal accounting payment records are distinct from initiating a bank transfer. Never run destructive resets against an existing database. Use migrate:fresh only against an identified disposable test database. Never overwrite secrets or unrelated changes. Missing PostgreSQL is a reported blocker for database verification, not permission to substitute SQLite silently.

**4. Install and use Laravel Boost appropriately.**

When compatible and not already installed, install it as a development dependency:

```bash
composer require laravel/boost --dev
php artisan boost:install
```

Inspect generated agent files before accepting changes to existing instructions. Discover the MCP tools actually exposed by the installed version. Use available application information, schema inspection, routes, logs, and documentation search to ground implementation in the real project. Do not invent tool names or claim to have called unavailable tools. If Boost is unavailable, record the limitation and use Artisan plus official documentation while continuing other work. Keep inspection tools in development/test environments, and redact secrets and personal data. See [Laravel Boost](https://laravel.com/docs/13.x/boost).

**5. Enforce modular ownership without unnecessary infrastructure.**

Use this reference structure, adapting it to established repository conventions:

```text
app/
  Modules/
    Platform/
    Organization/
    MasterData/
    Accounting/
    Treasury/
    Sales/
    Purchasing/
    Inventory/
    CRM/
    HR/
    Payroll/
    Expenses/
    Assets/
    Projects/
    Contracts/
    Marketing/
    Support/
    Reporting/
    Integrations/
    Localization/
  Shared/
resources/js/
  components/ui/
  components/erp/
  layouts/
  pages/<module>/
  features/<module>/
  hooks/
  lib/
  types/
  i18n/
database/
  migrations/
  factories/
  seeders/
tests/
  Unit/
  Feature/<module>/
  Browser/
docs/
  en/
  ar/
  shared/
```

Create module directories only when implementing their scope. Within a module, add Models, Actions, Queries, Policies, Http/Controllers, Http/Requests, Data, Events, Jobs and Providers only when useful. Keep controllers thin. Use Form Requests for input validation and Policies/Gates for authorization. Keep state transitions and business invariants in explicit application actions or domain services.

Each table and business operation has one owning module. Cross-module writes must use an explicit business interface owned by the target module. Reporting can use documented read-only queries across module boundaries. Avoid circular dependencies and generic service classes that become dumping grounds. Shared contains genuinely shared primitives such as money, execution context, identifiers, and audit contracts.

Use Eloquent directly where appropriate. Introduce repositories, abstractions, DTOs, or value objects when they improve an actual boundary or invariant. Use a relational schema for core business data; avoid generic EAV and JSON document storage as substitutes for proper financial tables.

Maintain a module registry and dependency map. Enforce module availability on the backend as well as navigation. Prevent unsafe disablement when dependencies or open obligations exist, and preserve authorized access to historical records.

Do not introduce microservices, internal HTTP calls, a separate frontend backend, distributed event sourcing, or a plugin marketplace in the initial implementation. Workers and scheduler processes may run separately using the same application codebase.

**6. Keep Laravel authoritative and use Inertia deliberately.**

- Use Laravel routes/controllers and Inertia pages for normal application workflows. Use supported Inertia forms, errors, redirects, and navigation according to installed-version documentation. See [Inertia Forms](https://inertiajs.com/docs/v3/the-basics/forms).
- Use session authentication and CSRF protection for the first-party web application. Build a versioned API only for an actual integration or external client, with separate scoped credentials and rate limits.
- Do not add Next.js or client routing that duplicates Inertia's route ownership. SSR is not a default requirement for this internal ERP.
- Send explicit, authorized page props. Never serialize complete models or expose payroll, secrets, or excessive personal data through shared props.
- Implement server-side pagination, filtering and sorting with allowlisted fields. Avoid loading full customer or product catalogs into the browser.
- Use TypeScript strict mode, clear contracts, named route helpers consistent with the starter kit, and schema-aware input handling. Avoid broad any types and hidden casts that bypass validation.
- Client calculations are previews. The server independently validates and recalculates financial values, permissions, state transitions, and totals.
- Do not optimistically display a posting or payment operation as successful before the server confirms it.

**7. Make tenant, company, and branch isolation structural.**

Classify each table as global reference data, Tenant-owned, Company-owned, or a child of a scoped document. Store tenant_id on customer-owned data, company_id on legal-entity data, and branch_id when relevant. Define uniqueness and foreign-key constraints at the correct scope.

Derive active context from authenticated membership and validate it on every request. Treat incoming scope identifiers as untrusted. Enforce scope in policies, route binding, relationship validation, queries, exports, attachments, jobs and caches; an Eloquent global scope alone is insufficient. Jobs must establish and clear context, including retries and long-lived workers. Prefix private storage/cache namespaces by scope. Recheck access at download time. Test identifier substitution between Tenants and between Companies. See [OWASP Multi-Tenant Security](https://cheatsheetseries.owasp.org/cheatsheets/Multi_Tenant_Security_Cheat_Sheet.html).

Scope client-side remembered forms and caches too. Clear sensitive state on logout or membership changes, and prevent a stale Company-specific tab from posting into a newly selected Company. Bind each operation to an explicit authorized document context rather than relying only on a mutable global session selection.

Use composite foreign keys or equivalent database constraints to prevent cross-scope relationships. For example, a company-scoped invoice must not reference another company's account, warehouse, or company-specific customer configuration. Tenant-shared party identities may have separate company-specific customer/vendor profiles, credit settings and accounting mappings. Document shared-data exceptions explicitly.

Users may have multiple memberships, but roles and permissions must remain scoped. Implement permission names such as sales.invoice.view/create/approve/post/reverse/export, then apply Company/Branch restrictions. A UI permission map is a presentation aid, never the security boundary.

There is no implicit platform-admin bypass into every customer's records. Any future support access must be explicit, time-limited, justified and audited. Model separation of duties, delegated approval, approval limits and self-approval restrictions. Reapproval is required when an approved document's material contents change.

Consider PostgreSQL RLS as additional defense through an ADR. If implemented, verify policies with the real runtime database role, transaction-scoped context, workers and connection pooling; account for owner and BYPASSRLS behavior. Do not claim RLS exists merely because tables have tenant_id. See [PostgreSQL Row Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html).

**8. Implement complete Arabic/English behavior from the first screen.**

- Arabic is the default locale. Provide a visible Arabic/English switch and persist user preference. Set lang and dir correctly on initial HTML rendering and every Inertia navigation without a wrong-direction flash.
- Translate navigation, forms, validation, backend errors, document statuses, notifications, reports, empty states, help text and print output. Store stable machine codes for states and enums, not translated labels.
- Establish one documented translation workflow shared by Laravel and React. Keep paired catalogs synchronized and detect missing keys. Use parameters and plural rules instead of concatenating translated fragments.
- Use logical layout properties and supported Tailwind start/end and spacing utilities. Verify Sidebar, Drawer, Breadcrumbs, Popover, Dropdown, Dialog, pagination and portal-rendered components in both directions.
- Configure shadcn/ui and Radix direction support according to the installed Radix-backed components, including portal content and keyboard behavior. Mirror directional navigation icons only when appropriate. See [shadcn/ui RTL](https://ui.shadcn.com/docs/rtl).
- Isolate mixed-direction text such as email, SKU, IBAN, identifiers and numbers using bdi or appropriate local direction. Preserve correct copy/paste order.
- Keep locale, currency, timezone and accounting policy separate. Store money precisely and timestamps consistently; use business dates for invoices/periods where appropriate. Locale changes must not alter stored values.
- Normalize supported numeric inputs safely, including Arabic digits where accepted; reject ambiguous separators rather than silently changing amounts.
- Distinguish interface translations from user-authored business data. Add bilingual business names only where useful, with explicit fallback rules. Do not automatically translate people's names or document numbers.
- Select fonts that support Arabic shaping and English. Verify rendered invoices, reports and PDFs in both languages, including embedded fonts, mixed text, totals, long tables and page breaks.
- Support a document language independent of the operator's locale when required. Retain a stable representation of an issued document; changing UI language must not mutate issued financial content.
- Preserve unsaved work during a locale change, or clearly prompt before discarding it. Keep active company and access controls unchanged.
- Target [WCAG 2.2 AA](https://www.w3.org/TR/WCAG22/) for implemented UI: keyboard operation, visible focus, semantic labels, sufficient contrast, accessible errors and dialogs. Record manual and automated evidence and any gaps; do not claim certification.
- Run critical browser workflows in ar/RTL and en/LTR. A dir attribute alone does not satisfy bilingual acceptance.

**9. Deliver a coherent ERP user experience.**

Provide an application shell with Company/Branch context, locale switch, role-aware navigation, search, notifications and profile settings. Use a restrained professional visual system with consistent typography, spacing, density, semantic status colors and responsive behavior.

Build reusable ERP components where duplication appears: DataTable, DocumentHeader, LineItemsEditor, MoneyField, StatusBadge, ApprovalTimeline, AuditTimeline and AttachmentPanel. Support URL-based filters, server pagination, meaningful empty states, loading/error states and accessible feedback. Confirm destructive business actions with their concrete consequences.

Document screens show header details, lines, totals, tax/discount breakdowns, attachments, status history and links to related documents. Display actions permitted by state and role, with useful explanations for restrictions. Dashboards must use real authorized queries; demonstrate sample data only in an explicitly labeled demo environment. Do not populate unimplemented pages with fake success buttons or fabricated metrics.

**10. Make financial correctness non-negotiable.**

Use one posting engine owned by Accounting. Operational modules request accounting effects through this engine. Document posting, journal creation, required subledger effects and critical audit records must commit atomically, or all roll back. Do not defer essential ledger effects to an unreliable asynchronous listener.

- Use PostgreSQL NUMERIC/DECIMAL for exact amounts and quantities, with documented precision and scale. A starting proposal is NUMERIC(24,6) for amounts/quantities and NUMERIC(24,12) for exchange rates; validate ranges and rounding requirements before adopting it. Use a vetted decimal library or exact decimal arithmetic in PHP. Transfer monetary values as decimal strings; do not calculate authoritative money using PHP float or JavaScript number. Format large decimal values without lossy conversion to binary floating point. See [PostgreSQL Numeric Types](https://www.postgresql.org/docs/current/datatype-numeric.html).
- Define currency minor units, rounding mode, line-versus-document rounding, tax-inclusive/exclusive pricing, discounts and rounding adjustments explicitly. Never assume every currency has two decimal places. Reject non-finite and out-of-range numbers.
- Each posted journal balances exactly in functional currency. Journal lines have one positive debit or one positive credit, not both. Enforce row constraints in the database and cross-row invariants within the protected posting operation.
- Validate account ownership, active status, postability, fiscal period and required dimensions. Prevent journals that mix legal entities. Restrict manual entries to AR/AP control accounts unless a supported subledger-aware adjustment is used.
- Preserve the document's transaction currency, exchange-rate snapshot, functional-currency amounts, tax policy snapshot and account mappings. Do not recalculate issued documents using today's settings.
- Store draft/approval history separately from immutable posted financial content. Block INSERT/UPDATE/DELETE of lines belonging to a posted journal and changes/deletion of posted financial fields through runtime database protections as well as domain rules. Record reversal links and permitted lifecycle metadata separately or through narrowly constrained audited actions. Document narrowly privileged administrative maintenance.
- Correct posted transactions using linked reversal entries, credit/debit notes or defined adjustment workflows. Preserve the original. Never fix balances by editing historical amounts silently.
- Model fiscal opening balances, periods, locks, year-end close, retained earnings and restricted reopen operations. Concurrent posting and period closing must serialize safely.
- Treat AR/AP aging and customer/vendor balances as derived from invoices, credits and allocations, reconcilable to control accounts at a specified date. Support partial settlements, unapplied receipts, refunds and documented write-offs.
- Use immutable ledgers as the authoritative source. Cached balances are rebuildable projections with reconciliation checks, never independent financial truth.
- Allocate document numbers safely under concurrency with appropriate scoped uniqueness. Do not use MAX(number)+1. Separate internal identifiers from fiscal document numbers and preserve voided-number history where required.
- Protect critical actions using request idempotency keys, payload fingerprints, database uniqueness and transactional locking. The same key/payload returns the existing outcome; a different payload with the same key is rejected. Also enforce uniqueness of the originating document/event's posting effect.
- Handle lock conflicts and deadlocks with bounded retries and clear user outcomes. Avoid external HTTP calls while holding posting locks. Persist an outbox record atomically when a reliable external side effect must follow a committed operation.
- Accounting policy support must be implemented before enabling an associated workflow. Initially support one functional currency per Company and require document currency to match it; unlock foreign-currency processing only after exchange gains/losses, rates and reconciliation are tested.

**11. Model documents as explicit business workflows.**

Specify allowed transitions per document type. Do not force every document into one generic status enum. Where applicable, separate approval status, posting status, fulfillment status and settlement status.

Typical transitions include draft, submitted, approved/rejected, posted and reversed/voided, but only where meaningful. Drafts may be editable. Material edits invalidate approval. A posted document cannot be silently rewritten. Require reasons for rejection, cancellation, reversal and controlled overrides. Record actor, effective date, timestamp, request correlation and business reason.

Support partial delivery, partial invoicing and partial payment when the module requires them. Retrying a transition must not duplicate its effect. A credit note is a financial correction; a physical goods return is a stock event. Link them where appropriate without assuming they always occur together.

Provide a simple configurable approval system based on role, amount, Company/Branch and document type, with delegation and escalation. Do not begin with a general-purpose visual workflow language. Document numbering, attachments, comments, audit trails and print templates are shared capabilities.

**12. Implement the complete functional catalog over the roadmap.**

The following catalog defines the intended ERP scope. It is not an instruction to fake all modules in the first milestone. Track each capability as Planned, In Progress, Implemented, Verified, Blocked or Not Applicable with a reason.

| Module | Required capabilities |
|---|---|
| Platform / Organization | Tenants, legal companies, branches, departments, cost centers, memberships, RBAC, approvals, audit, settings, module activation, document numbering, private attachments, notifications |
| Master Data | Parties and company-specific customer/vendor profiles, contacts/addresses, products/services, units, categories, currencies, tax codes, payment terms, price lists and accounting mappings |
| Accounting | Chart of accounts, journals, general ledger, trial balance, AR/AP control reconciliation, fiscal periods, opening balances, closing, income statement, balance sheet and properly mapped cash-flow statement |
| Treasury / Finance | Bank/cash accounts, receipts, payment records, allocations, transfers, bank statement import/reconciliation, collections, payment planning, liquidity forecast, budgets and actual-versus-budget reporting |
| Sales | Quotations, orders, service fulfillment/delivery links, invoices, credit notes, returns, pricing, discounts, credit limits, payment terms and auditable commissions |
| Purchasing | Requisitions, RFQs, comparable supplier quotes, purchase orders, goods/service acceptance, vendor bills, returns, three-way matching, approval tolerances and supplier evaluation |
| Inventory | Warehouses/locations, receipts/issues/transfers, reservations, counts and adjustments, replenishment, barcode workflows, units/conversions, valuation, batch/serial/expiry tracking when activated |
| CRM | Leads, opportunities, pipeline stages, activities, contact history, loss reasons, conversion to quotations and sales forecasting |
| HR | Employee records, organization structure, contracts, documents and expiry alerts, attendance, leave, onboarding/offboarding and employee self-service; recruiting, reviews and training as extensions |
| Payroll | Effective-dated salary components, allowances/deductions, approved attendance inputs, loans/advances, payroll runs, review/approval, payslips, accounting integration and payment export; jurisdiction-specific rules through localization |
| Expenses | Claims, receipts, approval, reimbursements, advances/petty cash and settlement, allocation to Company/Branch/cost center/project |
| Assets | Asset register, capitalization, categories, depreciation schedules/posting, transfers, custodians, counts, disposal and maintenance references |
| Projects | Projects/tasks, budgets, resource allocation, timesheets, costs, milestones, time/milestone billing, planned-versus-actual analysis and profitability |
| Contracts | Versioned contracts, validity, renewal alerts, billing schedules, recurring charges, subscription lifecycle and explicit revenue recognition rules where needed |
| Marketing | Campaigns, audience segments, budget, lead attribution, conversions and revenue attribution using an explicitly documented model; consent-aware provider integrations |
| Support | Tickets, assignment, priority, SLA calendars, escalations, complaints, warranty/repair links and satisfaction tracking |
| Reporting | Role-scoped operational and financial reports, filters, authorized exports, scheduled delivery where configured, and drill-down from totals to source transactions |
| Integrations / Localization | Versioned external adapters, credentials, import/export jobs, webhook verification, retries/reconciliation, country-specific taxes, invoice rules and payroll policies |

Financial accounting and finance are distinct user capabilities backed by the same accounting engine. Marketing execution should connect to appropriate external providers when requested; do not build an advertising network or email delivery infrastructure inside the ERP.

**13. Add industry packages through existing module contracts.**

| Package | Additional scope |
|---|---|
| Trade and distribution | Wholesale price tiers, sales representatives, delivery planning, credit control, batch/expiry tracking as required |
| Retail / e-commerce | POS, shifts/cash closing, promotions, loyalty, returns and storefront integration; offline operation is a separately designed extension |
| Professional services | Resource scheduling, billable time, service contracts, utilization and customer/project margins |
| Light manufacturing | Bills of materials, production orders, material consumption, output, scrap, labor/overhead costing and basic quality checks |
| Contracting | Work items, progress claims, subcontractors, variations, retention and site costs |
| Rental | Asset availability/reservations, handover/return, deposits, periodic billing, damage charges and maintenance |
| Maintenance / field service | Work orders, technicians, appointments, parts, preventive schedules, service history and service contracts |

Keep advanced manufacturing planning, sophisticated warehouse automation, consolidated group accounting and intercompany elimination outside initial milestones. Track them as extensions rather than pretending that multi-company support automatically provides consolidation. Highly specialized sectors require their own domain specification or integration.

**14. Implement stock and procurement accounting consistently.**

For the first goods workflow, use perpetual inventory with moving weighted-average valuation, documented precision, and no negative stock. Maintain an immutable quantity/value movement ledger. Treat stock balances as reconciled projections. Lock relevant item/location balances during reservations and issues so concurrent users cannot oversell.

An issued quantity and its cost must be derived from the chosen valuation policy. A supplier receipt, bill and payment are different events. Where receipt precedes billing, use a goods-received-not-invoiced clearing account and settle it on vendor billing. Specify handling of price differences, freight/landed costs and unit conversions before exposing these options.

Separate sales invoice revenue from stock-issue cost recognition so COGS is not posted twice. Returns must reference original quantities and cost evidence, respect return limits, and reconcile stock and accounting. Transfers within one legal entity do not create sales revenue. Intercompany transfers require a separate supported workflow.

Support stock counts through approved adjustment documents, not direct balance editing. Initially restrict backdated stock movements that would change already-processed costing; implement a controlled recalculation/revaluation workflow before permitting them. If batches/serials/expiry are activated, enforce traceability through receipts, issues, returns and transfers.

**15. Treat country rules and external services as explicit integrations.**

Keep tax, payroll, invoice numbering and statutory reporting behind versioned, effective-dated localization policies. No country has been selected. Build generic capabilities and clearly labeled synthetic fixtures, but do not claim tax, employment or e-invoicing compliance without a selected jurisdiction, authoritative current requirements and tested implementation.

When a jurisdiction is selected, identify actual obligations and required official integrations, preserve source/version references, and add jurisdiction-specific tests. Enable only supported policies. Do not hardcode a demo tax rate or salary entitlement as a production rule.

For external integrations, define authentication, least-privilege credentials, timeout/retry behavior, signed webhook validation, replay protection, idempotency, failure reconciliation and delivery history. Expose OpenAPI specifications only for real implemented API endpoints; Inertia page routes are not an invented public API.

Queue imports and large exports when appropriate. Provide preview/dry-run, row-level validation, scope checks, duplicate handling, and actionable error reports. Imported transactions use the same domain actions and permissions as manual entry. Do not bypass the posting engine for bulk imports. Use outbox/inbox patterns when delivery reliability requires them.

**16. Implement security as verified requirements, not a slogan.**

Use the latest stable OWASP ASVS verified at project start as the security verification framework; the source checked for this specification identifies version 5.0.0. Record the adopted version. Target all applicable Level 3 controls for this sensitive financial/HR product, with applicable Level 1 and Level 2 controls as a mandatory baseline. Map actual version-qualified requirement IDs to implementation and evidence; do not invent IDs or claim certification. Evaluate applicability explicitly. Any unavailable independent assessment or infrastructure control remains a documented release gap. See [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/).

Before security-sensitive implementation, maintain a threat model describing assets, actors, trust boundaries, data flows, abuse cases and mitigations. Cover tenant escape, privilege escalation, fraudulent approvals, duplicate posting, payroll disclosure, malicious imports, account takeover, dependency compromise and backup exposure. Translate these threats into the following project controls and tests:

| Area | Required controls |
|---|---|
| Identity | Framework-supported password hashing; secure invitation, reset and recovery flows; login throttling; session regeneration; revocation on sensitive changes; MFA required for privileged and financial-approval roles; reauthentication for sensitive operations |
| Authorization | Deny by default; object-level policies; scoped roles; separation of duties; constrained delegation; protected exports; negative tests for horizontal and vertical privilege escalation |
| Sessions / transport | HTTPS production configuration, Secure/HttpOnly/SameSite cookies, CSRF validation, idle/absolute session policy, trusted proxy/host configuration and strict CORS only where an API needs it |
| Injection / output | Parameterized queries, allowlisted filters/sorts, contextual output escaping, safe rich-text sanitization if enabled, protection against mass assignment, SQL/OS injection, path traversal and unsafe deserialization |
| Browser hardening | A tested Content Security Policy compatible with the actual Inertia/Vite setup, clickjacking protection, content-type protection and appropriate referrer policy; no blanket unsafe policy added to silence failures |
| Secrets / cryptography | No secrets in Git, client bundles, fixtures or logs; environment/secret-manager separation; supported encryption libraries; protected application keys and recovery material; rotation runbooks; no custom cryptography |
| Sensitive data | Data classification; field minimization; restricted salary, identity and banking data; appropriate field encryption; encrypted storage/backups in deployment; defined retention and secure disposal respecting financial record obligations |
| Database | Least-privilege runtime role without DDL/superuser privileges; separate migration role; private network access; parameter binding; scope constraints; protected ledger/audit writes; encrypted remote connections as applicable |
| Outbound requests | Approved destinations, timeouts and response-size limits; SSRF prevention for user-provided URLs, redirects and private/metadata addresses; PDF renderers must not fetch arbitrary URLs or local files |
| Integrations | Scoped expiring/revocable credentials where supported, webhook signature verification over the required payload, replay protection, rate limits, safe retries and no raw payment-card storage |
| Audit / monitoring | Security events and critical business transitions with actor/scope/correlation; restricted append-only audit access; tamper-evident or externally retained production logs; redaction; alerting on suspicious access and repeated failures |
| Resource abuse | Request/body/file size limits, bounded queries, pagination, per-user/Tenant quotas, queue concurrency limits, export throttling and bounded decompression/parsing |

Audit successful critical business actions inside the business transaction, so they cannot silently disappear while the financial effect commits. Record denied/security events independently so transaction rollback does not erase them. Do not log passwords, MFA secrets, access tokens, whole payroll payloads or full sensitive account identifiers. Encrypt confidential audit details where required and restrict access even from ordinary administrators.

Uploads must be private, authorized and size/type constrained. Validate actual file content as well as declared type, generate storage names, and prevent executable content and traversal. Use quarantine and malware scanning for enabled attachment workflows in production; when a required scanner is unavailable, leave files unavailable rather than marking them safe. Never send confidential uploads to a public scanning service without authorization. See [OWASP File Upload Guidance](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html).

Protect CSV/spreadsheet exports against formula injection while preserving legitimate numeric values. Process uploaded files and PDFs with resource limits and safe parser configuration. Validate attachment download access independently of knowing an identifier or URL. Mask sensitive production data in development; use synthetic fixtures by default.

Security engineering also includes dependency review, automated vulnerability and secret scanning, static analysis, controlled dependency updates, and an SBOM for release artifacts. Triage findings by exploitability and affected paths; fix applicable critical/high findings before a production-ready claim. Never suppress a finding or change a test merely to obtain a green status. Any accepted residual risk needs a named owner, rationale, compensating controls and expiry; it remains visible in the release assessment and does not prove ASVS compliance.

Run dynamic security checks against an authorized local/staging environment and record actual results. Prepare a focused independent security review/penetration-test checklist before production involving financial or HR data. If independent verification has not occurred, state that fact and leave the release gate open. Do not promise that generated code is "100% secure" or automatically compliant.

**17. Apply strong, maintainable engineering practices.**

- Prefer cohesive actions, explicit contracts and small reviewable changes. Explain domain decisions and tradeoffs; avoid abstractions without a current use case.
- Use typed PHP and TypeScript, enum/value-object boundaries where meaningful, framework conventions, and deterministic formatting. Add PHP static analysis at the strictest sustainable configuration for application code without blanket ignores; record exceptions precisely.
- Use database foreign keys, unique/check constraints and correct nullability. Create indexes from actual access patterns, especially scoped dates, statuses, document references and foreign keys.
- Use transactions for invariants, locks for competing updates, and optimistic version checks for editable documents where lost updates are possible. Translate conflicts into understandable user messages.
- Avoid hidden financial side effects in model observers. Make posting and reversal dependencies explicit and testable.
- Use bounded eager loading and query inspection to prevent N+1 problems. Execute long-running exports, imports and scheduled work through retry-safe jobs.
- Commit reproducible migrations. For populated databases, use an expand/backfill/contract approach where needed; assess locks and data compatibility. Document rollback versus forward-fix limitations honestly.
- Keep environment configuration separate. Supply a safe .env.example and documented required settings, with no real credentials or default production passwords.
- Add CI for relevant tests, static analysis, formatting/lint checks, type checking, production builds, security scans and bilingual documentation validation. Discover supported commands from the actual installed tools and scripts.
- Maintain dependency lockfiles, a clear update policy and license checks. Do not apply force-upgrade commands that introduce unreviewed breaking changes.
- Never hide errors with empty catches, fake integrations, skipped assertions, hardcoded success values or unrelated global configuration changes.
- Measure performance and document the load, dataset and environment. Do not label the system scalable because a single-user demo renders quickly.

**18. Test observable business outcomes and failure modes.**

Use the repository's Pest/PHPUnit convention, with PostgreSQL-backed feature/integration tests. Use the installed compatible browser framework, such as Playwright or Pest Browser, for critical UI flows. Do not add duplicate test stacks unnecessarily. Frontend unit tests should cover meaningful interaction or formatting logic.

Required test categories, introduced with their corresponding features:

- Domain tests for money precision, rounding, journal balance, allocation, costing, state transitions and effective dates.
- Property/invariant tests where useful for sums, reversals and precision edge cases, including currencies with zero and three minor digits.
- Feature tests for authorization, input tampering, module gating, Company/Tenant boundaries, API routes when present, file downloads and unauthorized exports.
- Real database integration tests for constraints, rollback, duplicate posting, concurrent allocations, stock competition and period-close races. Concurrency tests must use genuinely separate connections/processes; a single wrapped test transaction is not concurrency evidence.
- Browser tests for realistic create/approve/post/collect flows in Arabic RTL and English LTR, including validation, partial payment, empty/error states, keyboard operation and mixed-direction fields.
- Recovery tests for queue retries, crash windows, webhook replay and outbox delivery where those capabilities are implemented.
- Security regression tests derived from the threat model, plus dependency/static/dynamic scans with recorded findings.
- Migration tests against a clean PostgreSQL database and upgrade tests from the prior milestone's schema/data, without erasing user data.
- Documentation link checks, bilingual coverage checks, terminology/key parity and verification of commands and examples.

Use these deterministic acceptance scenarios, keeping each scenario's dataset isolated:

| Scenario | Expected result |
|---|---|
| Synthetic service invoice: net 1,000.00 plus a clearly labeled test tax of 10% | Debit AR 1,100.00; credit revenue 1,000.00; credit test tax liability 100.00; journal balances |
| Receipt of 400.00 allocated to that invoice | Debit bank/cash 400.00; credit AR 400.00; outstanding invoice amount is 700.00 and status is partially paid |
| Repeat the same posting request | One business effect and one originating posting record; replay returns the original outcome |
| Reuse the idempotency key with changed amounts | Explicit conflict; no additional journal or balance change |
| Fail after journal preparation but before full posting completes | No partial document, subledger or journal effect survives the transaction |
| Attempt to edit a posted line, post into a locked period or use another Company's account | Rejected without changing financial data; appropriate evidence is retained |
| Receive 10 goods units at 50.00, without tax or extra costs | Inventory debit 500.00 and received-not-invoiced credit 500.00; quantity 10 |
| Match the vendor bill for that receipt | Received-not-invoiced debit 500.00 and AP credit 500.00; no second inventory receipt |
| Issue and invoice 4 of those units at 80.00, without tax | Revenue 320.00; COGS 200.00; remaining quantity 6 and value 300.00; gross margin 120.00 |
| Two users compete for insufficient available stock or the same remaining invoice balance | Only valid quantities/allocations commit; no negative stock or over-allocation |
| A user alters Tenant/Company identifiers, including in downloads or queued exports | Access denied or resource not disclosed; no cross-scope data leakage |
| Switch ar/RTL to en/LTR during navigation | Correct translations and layout; same business values, active scope and authorization; no lost edits without warning |

For payroll, assets, contracts and localization, add worked examples with effective dates and expected journal outcomes before claiming those modules complete. Do not claim a cash-flow statement or forecast is correct merely because its totals render; document its classification/method and reconcile examples.

**19. Design operations and recovery as part of the system.**

Provide reproducible local setup, environment separation, health/readiness checks that reveal no secrets, structured logs with correlation IDs, error monitoring, failed-job management and scheduler/worker instructions. Include safe database migration, asset build and cache-refresh procedures in deployment documentation.

Define measurable availability, performance, RPO and RTO targets before a production rollout. During development propose targets with an explicitly stated benchmark dataset and environment, and mark them provisional until validated. Measure p95 latency for critical lists and posting operations under representative concurrent load; queue heavy reports and exports. Record actual results and bottlenecks.

Back up the database, private files, configuration needed for recovery, and encryption-key recovery material using separately protected access. Test restoration into an isolated environment and verify financial/stock consistency afterward. Document point-in-time recovery when required, retention, key recovery, rollback/forward-fix steps and incident response. A scheduled backup job without a successful restore test is not verified recoverability.

**20. Follow this implementation roadmap and its exit criteria.**

Every milestone includes security, both interface languages, tests, and paired documentation for everything it adds. Security and documentation are continuous work; the last milestone validates the combined release rather than starting them.

| Milestone | Scope | Exit criteria |
|---|---|---|
| M0 — Inspect and specify | Repository/environment assessment, decisions/defaults, requirements IDs, module map, threat model, proposed ERD, roadmap and documentation manifest | Stack compatibility and assumptions recorded; concrete M1 backlog and acceptance scenarios; continue into M1 in a new project |
| M1 — Platform foundation | Starter Kit/authentication, privileged-role MFA, Tenant/Company/Branch membership, scoped permissions, bilingual shell, locale persistence, minimal customer/party CRUD, audit foundation and CI | Actual login and scoped CRUD work; two-Tenant/two-Company negative tests pass; Arabic/English UI and corresponding user/admin/developer documentation verified |
| M2 — Accounting and service revenue | Accounts, periods, exact money/posting engine, service invoice, test tax configuration, immutable posted records, receipt/allocation, reversal, ledger/trial balance/AR aging, bilingual invoice rendering | Service invoice-to-partial-receipt scenario reconciles; idempotency, rollback, authorization, period-lock and both-language tests pass |
| M3 — Procure-to-pay and cash control | Requisitions/POs, service acceptance, vendor bills, AP, payment records/allocation, expense/advance workflows, bank reconciliation, opening balances and primary financial statements | Service procurement-to-payment works; AP/bank/subledger reconciliation passes; correction and approval paths work |
| M4 — Goods and distribution | Products/units, warehouses, receipts/issues/transfers, reservations/counts, valuation, GRNI matching, goods sales/returns and barcode basics | Goods acceptance scenarios and concurrent stock tests pass; inventory valuation reconciles to GL; partial fulfillment and returns are traceable |
| M5 — Workforce and financial management | HR, attendance/leave, payroll framework, selected-country payroll only when specified, employee self-service, assets, depreciation, budgets, cash forecasting, fiscal close and foreign-currency support where fully verified | Asset/HR workflows and accounting ties pass; generic payroll demo is labeled; country-dependent production payroll remains blocked until its requirements are verified |
| M6 — Commercial and service management | CRM, fuller quotations/orders/pricing, commissions, projects/resources/timesheets, contracts/recurring billing, support/SLA and marketing attribution/integrations | Connected customer/project workflows and profitability reconcile; scheduled billing is retry-safe; module catalog coverage is updated |
| M7 — Industry and external extensions | Prioritized packages from the industry catalog, advanced inventory traceability, POS/e-commerce, manufacturing, contracting, rental, field service and selected external/localization adapters | Each selected package has its own worked examples, isolation tests, journal/stock reconciliation where relevant, and complete bilingual guides |
| M8 — Integrated release verification | Cross-module regression, security review, load/restore testing, migration rehearsal, operational runbooks, accessibility review and full documentation export | Release evidence matrix is complete; no unresolved applicable critical/high security defects; stated performance/recovery targets verified; documented external gates remain explicit |

M7 is a collection of separately selectable package milestones; do not attempt every industry at once by default. The overall product roadmap retains all requested capabilities. An unselected or country-blocked capability remains visible in scope tracking and is not marked complete. If dependencies require reordering, record an ADR and preserve acceptance criteria rather than silently removing requirements.

**21. Produce complete system documentation in BOTH Arabic and English.**

This is a mandatory deliverable. A README, English-only technical notes, translated headings, or a summary in Arabic does not satisfy it. Document the full implemented system for end users, administrators, developers, integrators, security reviewers and operators. Also preserve the full target design with unimplemented capabilities clearly labeled as planned.

Maintain matching topics under docs/en and docs/ar. Use stable topic IDs and a bilingual documentation manifest to track parity, module coverage, requirement IDs, version, implementation status and last verification. Machine-readable schemas and diagrams may have a shared canonical file in docs/shared, but explanations, labels/legends where needed and usage guidance must exist in both languages.

Required documentation set:

| Topic / suggested relative path in each locale | Required content |
|---|---|
| index.md | Navigable system documentation index, language switch links and implemented/planned scope |
| product/overview.md | Product goals, personas, terminology, module map, features and boundaries |
| product/requirements.md | Functional/nonfunctional requirements with stable IDs, acceptance criteria and implementation status |
| product/roadmap.md | Milestones, dependencies, active scope, outstanding decisions and extension plan |
| architecture/overview.md | Modular structure, ownership, boundaries, deployment shape and key data flows |
| architecture/decisions/ | Numbered ADRs including context, decision, alternatives, consequences and bilingual equivalents |
| data/erd.md | Actual schema ERD, cardinality, ownership and Tenant/Company boundaries |
| data/dictionary.md | Tables, fields, types/scales, nullability, keys, indexes, sensitive classifications, retention and constraints |
| security/model.md | Threat model, trust boundaries, authentication, authorization, session/security settings and data protection |
| security/permissions.md | Role/permission matrix, scope restrictions, segregation of duties and administrative procedures |
| security/verification.md | ASVS version/requirement mapping, implementation evidence, scan/review results and unresolved gaps |
| workflows/<workflow>.md | Triggers, prerequisites, roles, steps, state transitions, validations, exceptions, partial completion and reversal |
| user-guide/<module>.md | Screen-by-screen operation, field explanations, worked examples, screenshots, permissions and troubleshooting |
| admin-guide/ | Organization setup, currencies/taxes, account mappings, users, approvals, module settings, templates and imports |
| finance/accounting-rules.md | Posting maps, debit/credit examples, rounding, tax treatment, stock costs, control accounts, closing and corrections |
| reports/catalog.md | Purpose, filters, data sources, formulas, date/currency semantics, access and reconciliation for every report/KPI |
| integrations/ | Actual API/webhook contracts, authentication, examples, retries/idempotency, errors and setup; mark absent integrations |
| developer-guide/ | Setup, versions, commands, module extension patterns, conventions, translations, testing, migrations and troubleshooting |
| operations/ | Deployment, workers/scheduler, observability, secrets/key rotation, backup/restore, disaster recovery, incident response and upgrades |
| quality/acceptance.md | Test strategy, requirement-to-test mapping, manual verification, performance/accessibility evidence and limitations |
| localization/ | Arabic/English behavior, locale/direction, numeric/date formatting, and selected-country rules with authoritative references |
| releases/ | Changelog, migration/compatibility notes, release status and known limitations |
| glossary.md | Consistent English/Arabic ERP and accounting terminology with definitions |

For every implemented feature, both language versions must explain purpose, roles, prerequisites, navigation, inputs, validation, workflow, outputs, business/accounting effects, permissions, failure/correction paths and examples. Use screenshots from the real interface in the corresponding language with synthetic data. Do not expose secrets or real employees/customers.

Use clear professional Arabic with consistent accounting terminology and complete English explanations. Keep code identifiers, schema names and executable commands unchanged; explain them in each language. Do not mechanically translate UI labels differently from the application. Preserve factual equivalence between translations.

Document actual behavior and actual file/route names. Any not-yet-built workflow belongs in the planned design, not a user guide pretending it exists. Missing external services or jurisdiction rules must be visible in both versions. Avoid empty template pages presented as completed documentation.

Deliver version-controlled Markdown and a reproducible, locally browsable HTML documentation export. Use a lightweight compatible documentation renderer rather than building a separate custom product. Arabic pages must render RTL with correct mixed-direction code examples; English pages must render LTR. Provide a working table of contents, cross-language links, diagrams and local navigation. Public hosting is not required.

Add documentation checks for missing language counterparts, broken internal links, absent requirement mappings and translation/catalog gaps. Use a human-readable parity checklist for semantic correctness, since file-count equality does not prove an accurate translation. Validate representative setup commands, API examples and workflows against the running application. Keep technical/schema generation free of sensitive production samples.

Create or update both documentation versions in the same change that adds a feature. A feature cannot be marked Verified if its Arabic or English documentation is missing or stale. At each release, generate both HTML exports and verify representative pages, screenshots, diagrams and navigation visually.

**22. Use evidence-based completion gates.**

A feature is Done only when:

- Its business behavior and exception paths work end to end, with no hidden stub in the supported path.
- The installed stack satisfies section 1, and resolved versions, lockfiles and bilingual technology-stack documentation are current.
- Database constraints, tenancy, Company/Branch rules, authorization and audit requirements are implemented.
- Financial/stock invariants and concurrency/idempotency protections are verified where relevant.
- Arabic RTL and English LTR work across UI, errors, reports and supported print outputs.
- Relevant unit, feature, integration and browser tests pass on the actual required stack.
- Formatting, static analysis, type checks and production build pass without new unexplained suppressions.
- Security controls applicable to the feature have evidence; unresolved risks and release blockers are visible.
- Paired Arabic/English documentation and requirements traceability are current.
- Migrations, synthetic seeds and local setup are reproducible, with actual run commands documented.
- For a completed major feature or milestone, a reviewed local Git commit contains its code, tests and both documentation languages, and its hash is reported.

Do not confuse "implemented," "automatically tested," "manually verified," "independently assessed," and "production ready." Report them separately when they differ. Passing scans is supporting evidence, not proof of complete security.

**23. Keep a reliable handoff record.**

Maintain a concise progress record plus a machine-readable requirements/status manifest. Summarize the progress record in both documentation languages; share stable requirement/status IDs to avoid diverging plans. Include:

- Current milestone and completed acceptance criteria.
- Actual code areas and migrations changed.
- Implemented features and remaining scope.
- Tests/checks executed, their results and evidence locations.
- Security and documentation coverage/gaps.
- Decisions and external blockers.
- Exact next actions and commands needed to resume.

At the end of a coding session, report the working outcome first, then verification, documentation paths, limitations and the next milestone. Never invent test results, screenshots, external approvals or deployment status. Keep routine user communication in the user's preferred language while source identifiers and these instructions remain English.

**24. Create a Git commit after every completed major feature or milestone.**

This instruction explicitly authorizes local commits for the implementation work. Do not ask for confirmation for each commit. A major feature is a coherent business capability or substantial technical foundation with its own acceptance criteria; a milestone may contain several such features. Commit when each major feature is complete rather than waiting until the entire ERP is finished. If the final feature commit already contains all milestone completion work, it may also serve as the milestone commit; do not create an empty commit just to duplicate the boundary.

For each required commit:

1. Complete the relevant feature/milestone acceptance criteria, including Arabic/English functionality, security controls, tests and bilingual documentation.
2. Run the checks applicable to the change. Review their real results, inspect git status and the diff, and check for accidental secrets, generated artifacts, debug code and unrelated modifications.
3. Update requirements status and progress documentation, then stage only changes belonging to the completed work. Use explicit paths or selected hunks. Preserve unrelated user/agent changes, including unrelated hunks in shared files; do not use an indiscriminate git add . or git add -A.
4. Create a meaningful local commit following Conventional Commits, such as feat(accounting): add invoice posting and partial receipt allocation, feat(platform): add Arabic RTL and English LTR shell, or fix(inventory): prevent concurrent overselling. Use the body for important business effects, validation and migration notes when helpful. Prefer a body file for multiline shell messages.
5. Run git status after the commit, inspect the commit summary, and report its short hash, subject and completed feature/milestone. Record the hash in the session report and the next ordinary progress update; do not create extra self-referential documentation commits merely to record a commit's own hash.

Keep each commit reviewable and cohesive. Include the related code, migrations, tests and both documentation versions together. Do not commit a broken or unfinished feature as complete. If checks fail, fix them before the completion commit; if a required check is externally blocked, report the specific blocker and distinguish unverified work from completed work. Do not fabricate a successful commit.

If no repository exists, initialize Git only in the verified project root after checking for an existing parent repository and repository instructions. If author identity or Git permissions are missing, do not invent an identity or alter global Git configuration; preserve the work, report the blocker and continue independent tasks. Do not amend existing commits, bypass hooks, rewrite history, force-push or publish remotely without separate explicit authorization. Local commit authorization does not imply git push authorization.

**25. Start now with the actual repository.**

Inspect the repository and environment, confirm the installed stack and available Boost tools, identify the next incomplete milestone, and begin implementation. For an empty repository, complete M0 and implement M1. Establish the bilingual documentation structure and security requirements alongside the foundation. Create the required local commits after completed major features/milestones. Continue until the authorized milestone meets its acceptance criteria or an explicit external blocker prevents further dependent work. Do not return only a plan or a list of suggested technologies.
