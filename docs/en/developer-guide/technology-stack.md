# Technology Stack & Verification Record

## 1. Resolved Versions

| Layer | Selected Technology | Resolved Version | Verification Evidence & Status |
|---|---|---|---|
| Runtime | PHP | 8.5.6 (ZTS Visual C++ 2022 x64) | Verified via `php -v`; extensions `pdo_pgsql`, `bcmath`, `intl`, `mbstring`, `openssl` enabled |
| Backend Framework | Laravel | 13.31.0 | Verified via `composer show laravel/framework` |
| Database Engine | PostgreSQL | 18.6 (x86_64-windows) | Verified via `psql -V` and live connection to `127.0.0.1:5432` |
| Frontend Library | React & React-DOM | 19.2.0 / 19.3.0 | Verified via `package.json` and npm registry |
| Fullstack Bridge | Inertia.js (Laravel & React) | v3.0.0 (Inertia Laravel 3.0, @inertiajs/react 3.0.0) | Verified via `composer.json` and `package.json` |
| Styling | Tailwind CSS | 4.1.11 | Tailwind v4 Vite plugin `@tailwindcss/vite` integrated with CSS-first configuration |
| Component Primitives | Radix UI + shadcn/ui | Radix Primitives (`@radix-ui/react-*`) | Verified via `components.json` with style `new-york` and Radix primitive dependencies |
| Agent Assistance | Laravel Boost | 2.8.1 | Verified via `composer show laravel/boost` |
| Bundler & Tooling | Vite | 8.0.0 | Verified via `npm run build` producing optimized production bundles |
| Test Framework | Pest PHP | 5.1 | Verified via `php artisan test` running 39 tests against PostgreSQL `erp_testing` |

## 2. Compatibility & Constraints
- Database connections: Primary `erp`, Test runner `erp_testing` on PostgreSQL 18.6.
- Direction & Internationalization: Arabic (`ar`, RTL) as default locale, English (`en`, LTR) fully supported without client/server desynchronization.
- No SQLite fallback in testing; strict PostgreSQL relational compliance.
