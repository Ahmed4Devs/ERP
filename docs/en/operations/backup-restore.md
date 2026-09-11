# Database Backup, Disaster Recovery & Restore Drills

This document defines the disaster recovery policy, backup automation routines, Point-in-Time Recovery (PITR) procedures, and periodic restore verification drills for the ERP application.

---

## 1. Recovery Objectives & Backup Strategy

| Metric | Production Target | Technical Architecture |
|---|---|---|
| **Recovery Point Objective (RPO)** | **< 15 Minutes** | Continuous PostgreSQL Write-Ahead Log (WAL) archiving to off-site object storage. |
| **Recovery Time Objective (RTO)** | **< 60 Minutes** | Automated restoration scripts with pre-configured hot-standby instances. |
| **Backup Retention** | 30 Daily / 12 Monthly | Encrypted snapshots with immutable retention locks (WORM). |

---

## 2. Automated Backup Execution

### Logical Dump (Daily Automated Cron)
Create a daily compressed logical dump with consistent transactions:
```bash
#!/usr/bin/env bash
set -eo pipefail

BACKUP_DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/erp"
BACKUP_FILE="${BACKUP_DIR}/erp_backup_${BACKUP_DATE}.dump"

mkdir -p "${BACKUP_DIR}"

# Execute consistent transactional pg_dump using custom directory format
pg_dump -h 127.0.0.1 -U erp_app -d erp_production \
  --format=custom \
  --compress=9 \
  --no-owner \
  --file="${BACKUP_FILE}"

# Encrypt backup archive with GPG
gpg --batch --yes --encrypt --recipient ops@yourdomain.com "${BACKUP_FILE}"
rm -f "${BACKUP_FILE}"

# Sync encrypted backup to remote off-site storage
aws s3 cp "${BACKUP_FILE}.gpg" s3://erp-disaster-recovery-backups/daily/
```

---

## 3. Database Restoration Runbook

### Step 1: Prepare Clean Isolated Target Database
```bash
# Create disposable target restore database
createdb -h 127.0.0.1 -U postgres erp_restore_target
```

### Step 2: Decrypt and Restore Archive
```bash
# Decrypt archive
gpg --decrypt "${BACKUP_FILE}.gpg" > /tmp/restore.dump

# Restore into target database using pg_restore
pg_restore -h 127.0.0.1 -U postgres -d erp_restore_target \
  --clean \
  --if-exists \
  --no-owner \
  --jobs=4 \
  /tmp/restore.dump

rm -f /tmp/restore.dump
```

### Step 3: Verify Integrity & Financial Equilibrium
Run the ERP ledger and schema verification tools against the restored target database:
```bash
DB_DATABASE=erp_restore_target php artisan audit:verify-ledgers
DB_DATABASE=erp_restore_target php artisan backup:verify-drill
```

---

## 4. Operational Restore Verification Command

The system includes a dedicated CLI command to simulate and verify backup integrity:
```bash
php artisan backup:verify-drill
```

### Verification Checks Performed:
1. **Database Engine & Connection**: Verifies live PostgreSQL 18+ connection and driver version.
2. **Schema Table Completeness**: Confirms existence and row counts across all 19 core ERP tables (`tenants`, `companies`, `accounts`, `journal_entries`, `pos_orders`, `contracting_claims`, etc.).
3. **Financial Ledger Checksum**: Calculates system-wide sum of debits and sum of credits across all journal lines, guaranteeing zero imbalance.
4. **Backup Target Storage**: Checks write permissions on `storage/app/backups/` and generates an auditable JSON snapshot manifest.
