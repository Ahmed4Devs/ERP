# النسخ الاحتياطي والتعافي من الكوارث وتجارب الاستعادة

تحدد هذه الوثيقة سياسة التعافي من الكوارث، وإجراءات النسخ الاحتياطي المؤتمتة، والاستعادة عند نقطة زمنية محددة (PITR)، وتجارب التحقق الدوري لنظام تخطيط الموارد المؤسسية (ERP).

---

## 1. أهداف التعافي واستراتيجية النسخ الاحتياطي

| المعيار | الهدف في الإنتاج | البنية التقنية المطبقة |
|---|---|---|
| **نقطة التعافي المستهدفة (RPO)** | **أقل من 15 دقيقة** | أرشفة مستمرة لسجلات المعاملات (WAL) في خوادم تخزين سحابية خارجية معزولة. |
| **زمن التعافي المستهدف (RTO)** | **أقل من 60 دقيقة** | نصوص استعادة مؤتمتة وتجهيز مسبق لنسخ احتياطية ساخنة (Hot-Standby). |
| **سياسة الاحتفاظ** | 30 يوماً / 12 شهراً | لقطات مشفرة مع قفل حماية ضد الحذف (WORM Immutability). |

---

## 2. إجراء النسخ الاحتياطي المؤتمت

### النسخ المنطقي الكامل (مجدول يومياً عبر Cron)
إنشاء نسخة احتياطية مضغوطة مع ضمان اتساق المعاملات:
```bash
#!/usr/bin/env bash
set -eo pipefail

BACKUP_DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/erp"
BACKUP_FILE="${BACKUP_DIR}/erp_backup_${BACKUP_DATE}.dump"

mkdir -p "${BACKUP_DIR}"

# تصدير متسق لقاعدة البيانات بالصيغة المخصصة
pg_dump -h 127.0.0.1 -U erp_app -d erp_production \
  --format=custom \
  --compress=9 \
  --no-owner \
  --file="${BACKUP_FILE}"

# تشفير ملف النسخة الاحتياطية باستخدام GPG
gpg --batch --yes --encrypt --recipient ops@yourdomain.com "${BACKUP_FILE}"
rm -f "${BACKUP_FILE}"

# رفع الملف المشفر إلى خادم تخزين خارجي معزول
aws s3 cp "${BACKUP_FILE}.gpg" s3://erp-disaster-recovery-backups/daily/
```

---

## 3. خطوات استعادة قاعدة البيانات (Runbook)

### الخطوة 1: تجهيز قاعدة بيانات اختبارية نظيفة ومعزولة
```bash
createdb -h 127.0.0.1 -U postgres erp_restore_target
```

### الخطوة 2: فك التشفير واستعادة البيانات
```bash
# فك التشفير
gpg --decrypt "${BACKUP_FILE}.gpg" > /tmp/restore.dump

# الاستعادة باستخدام pg_restore مع تعدد المسارات
pg_restore -h 127.0.0.1 -U postgres -d erp_restore_target \
  --clean \
  --if-exists \
  --no-owner \
  --jobs=4 \
  /tmp/restore.dump

rm -f /tmp/restore.dump
```

### الخطوة 3: التحقق المالي وسلامة الدفاتر
تشغيل أدوات التحقق المالية والقيود على قاعدة البيانات المستعادة:
```bash
DB_DATABASE=erp_restore_target php artisan audit:verify-ledgers
DB_DATABASE=erp_restore_target php artisan backup:verify-drill
```

---

## 4. أمر التحقق التشغيلي المدمج

يوفر النظام أمراً مخصصاً لمحاكاة والتحقق من جاهزية النسخ الاحتياطي:
```bash
php artisan backup:verify-drill
```

### الفحوصات المنفذة عبر الأمر:
1. **محرك واتصال قاعدة البيانات**: التحقق من اتصال PostgreSQL 18+ وإصدار المحرك.
2. **سلامة الجداول الأساسية**: التأكد من وجود كافة الجداول الـ 19 الرئيسية (`tenants`, `companies`, `accounts`, `journal_entries`, `pos_orders`, إلخ) وإحصاء صفوفها.
3. **التوازن المالي لدفاتر الأستاذ**: احتساب مجاميع المدين والدائن لجميع قيود اليومية وضمان توازنها التام بفارق صفري.
4. **مستودع حفظ النسخ**: فحص صلاحيات الكتابة على مجلد `storage/app/backups/` وتوليد ملف بيان تدقيق موثق بصيغة JSON.
