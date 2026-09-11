# Production Deployment & Environment Guide

This guide details the prerequisites, architecture, environment configuration, and execution runbook for deploying the ERP application in a production environment.

---

## 1. System Prerequisites & Architecture Baseline

| Component | Minimum Version | Recommended Production Baseline |
|---|---|---|
| **Operating System** | Linux (Ubuntu 24.04 LTS / Debian 12) | Ubuntu 24.04 LTS x86_64 |
| **PHP Runtime** | PHP 8.4+ | PHP 8.4 / 8.5 with `bcmath`, `pgsql`, `pdo_pgsql`, `opcache`, `intl`, `mbstring`, `zip` |
| **Database Engine** | PostgreSQL 18+ | PostgreSQL 18 High-Availability Cluster with WAL Archiving |
| **Web Server** | Nginx 1.26+ or FrankenPHP 1.4+ | Nginx reverse proxy with TLS 1.3 termination |
| **Node.js Runtime** | Node.js 22 LTS | Node.js 22 LTS for Vite asset compilation |
| **Queue / Cache** | Redis 7+ or PostgreSQL Database Queue | Redis 7+ with password authentication and persistent snapshots |

---

## 2. Environment Configuration (`.env.production`)

Ensure the following critical production environment variables are properly set:

```env
APP_NAME=ERP
APP_ENV=production
APP_DEBUG=false
APP_URL=https://erp.yourdomain.com
APP_KEY=base64:...

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=erp_production
DB_USERNAME=erp_app
DB_PASSWORD=SecureProductionSecretHere
DB_CHARSET=utf8

QUEUE_CONNECTION=database
CACHE_STORE=database
SESSION_DRIVER=database
SESSION_SECURE_COOKIE=true
SESSION_HTTP_ONLY=true
SESSION_SAME_SITE=lax

BCMATH_SCALE=6
DEFAULT_LOCALE=ar
```

---

## 3. Step-by-Step Production Deployment Runbook

### Step 1: Clone and Install Backend Dependencies
```bash
git clone https://github.com/organization/erp.git /var/www/erp
cd /var/www/erp

# Install PHP dependencies without dev packages
composer install --no-dev --optimize-autoloader --no-interaction
```

### Step 2: Build Frontend Assets
```bash
# Install Node dependencies and compile production bundles
npm ci
npm run build
```

### Step 3: Run Database Migrations & Seed System Roles
```bash
# Run migrations safely in production mode
php artisan migrate --force --no-interaction

# (Optional initial install) Seed baseline roles and currencies
php artisan db:seed --class=DatabaseSeeder --force
```

### Step 4: Warm Caches & Optimize Performance
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Step 5: Start Queue Workers & Scheduler
Set up a systemd service for queue workers:
```ini
[Unit]
Description=ERP Queue Worker
After=network.target

[Service]
User=www-data
Group=www-data
Restart=always
ExecStart=/usr/bin/php /var/www/erp/artisan queue:work --sleep=3 --tries=3 --max-time=3600

[Install]
WantedBy=multi-user.target
```

Add the Laravel scheduler to cron (`crontab -e -u www-data`):
```cron
* * * * * cd /var/www/erp && php artisan schedule:run >> /dev/null 2>&1
```

### Step 6: Verify Production Readiness
Execute the automated audit and backup verification tools:
```bash
php artisan audit:verify-ledgers
php artisan backup:verify-drill
```
Both commands must exit with status `0` before routing public traffic.
