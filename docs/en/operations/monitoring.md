# Monitoring, Health Checks & Observability Runbook

This runbook outlines application health checks, queue monitoring, structured logging, and performance metrics for the ERP modular monolith.

---

## 1. Application Health Checks

Laravel provides a built-in lightweight health check endpoint at `/up`.

### Endpoint: `GET /up`
- **Response**: HTTP 200 OK
- **Use Case**: Load balancer health checks, Kubernetes liveness/readiness probes, and uptime monitoring (e.g. BetterStack, Datadog).
- **Security**: Contains no secrets, database credentials, or system internals.

---

## 2. Queue & Background Job Observability

Background tasks (notifications, report generation, scheduled contract billing) are managed via database or Redis queues.

### Operational CLI Commands:
```bash
# Monitor active queue status
php artisan queue:monitor default --max=100

# View failed background jobs
php artisan queue:failed

# Retry all failed jobs after issue resolution
php artisan queue:retry all

# Flush / prune obsolete failed jobs
php artisan queue:prune-failed --hours=72
```

---

## 3. Structured Logging & Correlation IDs

Production logs use structured JSON formatting to facilitate ingestion into centralised log management platforms (OpenSearch, ELK, Grafana Loki).

### Log Entry Schema:
```json
{
  "timestamp": "2026-09-11T14:15:30.123456Z",
  "level": "INFO",
  "message": "POS Sale completed and balanced journal posted.",
  "context": {
    "tenant_id": "01a090d3-a1e6-7347-87a2-bf9f764f715c",
    "company_id": "01a090d3-a1e9-733d-a75e-a2a5fc976ef3",
    "user_id": 14,
    "terminal_id": "01a090d3-a1fa-7890-bcde-fa1234567890",
    "receipt_number": "POS-REC-202609-0012",
    "total_amount": "1650.000000",
    "ip_address": "192.168.1.100"
  }
}
```

### Sensitive Data Redaction:
All logging handlers automatically redact:
- `password`, `password_confirmation`
- `token`, `secret`, `api_key`
- Credit card / tender credentials

---

## 4. Performance Latency Targets (SLA & SLO)

| Operation | Target p50 | Target p95 | Target p99 |
|---|---|---|---|
| **POS Barcode Scan & Cart Update** | < 30 ms | < 80 ms | < 150 ms |
| **Atomic POS Checkout & GL Posting** | < 100 ms | < 250 ms | < 500 ms |
| **Sales Quotation / Order Approval** | < 80 ms | < 200 ms | < 400 ms |
| **Inventory Movement & Valuation** | < 90 ms | < 220 ms | < 450 ms |
| **Financial Statements Query (Trial Balance)** | < 150 ms | < 350 ms | < 800 ms |
