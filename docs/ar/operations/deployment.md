# دليل النشر والجاهزية للبيئة الإنتاجية

يوضح هذا الدليل المتطلبات الأساسية، والهيكلية، وتكوين البيئة، وخطوات النشر التنفيذية لنظام تخطيط الموارد المؤسسية (ERP) في بيئة الإنتاج الفعلية.

---

## 1. المتطلبات الأساسية والبيئة القياسية الموصى بها

| المكون | الحد الأدنى للإصدار | التكوين الموصى به للإنتاج |
|---|---|---|
| **نظام التشغيل** | Linux (Ubuntu 24.04 LTS / Debian 12) | Ubuntu 24.04 LTS x86_64 |
| **بيئة تشغيل PHP** | PHP 8.4+ | PHP 8.4 / 8.5 مع إضافات: `bcmath`, `pgsql`, `pdo_pgsql`, `opcache`, `intl`, `mbstring`, `zip` |
| **محرك قاعدة البيانات** | PostgreSQL 18+ | عنقود عالي التوافر PostgreSQL 18 مع أرشفة سجلات WAL |
| **خادم الويب** | Nginx 1.26+ أو FrankenPHP 1.4+ | وكيل عكسي Nginx مع تشفير TLS 1.3 |
| **بيئة Node.js** | Node.js 22 LTS | تجميع حزم واجهات المستخدم عبر Vite |
| **قوائم الانتظار والتخزين المؤقت** | Redis 7+ أو جداول قاعدة البيانات | Redis 7+ مع مصادقة آمنة ولقطات حفظ مستمرة |

---

## 2. إعدادات متغيرات البيئة للإنتاج (`.env.production`)

تأكد من ضبط متغيرات البيئة الحساسة بشكل صحيح:

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

## 3. خطوات النشر التشغيلي خطوة بخطوة

### الخطوة 1: استنساخ المستودع وتثبيت حزم PHP
```bash
git clone https://github.com/organization/erp.git /var/www/erp
cd /var/www/erp

# تثبيت الحزم للإنتاج دون حزم التطوير
composer install --no-dev --optimize-autoloader --no-interaction
```

### الخطوة 2: بناء وتجميع أصول الواجهة الأمامية
```bash
# تثبيت حزم الواجهة وبناء الملفات النهائية
npm ci
npm run build
```

### الخطوة 3: ترحيل قاعدة البيانات وتهيئة البيانات الأساسية
```bash
# تنفيذ الهجرات بأمان في وضع الإنتاج
php artisan migrate --force --no-interaction

# (للتثبيت لأول مرة) زراعة الأدوار والعملات الافتراضية
php artisan db:seed --class=DatabaseSeeder --force
```

### الخطوة 4: تحسين الأداء والتخزين المؤقت
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### الخطوة 5: تشغيل معالجات المهام وجدولة الأوامر
قم بإعداد خدمة systemd لمعالجة مهام الخلفية:
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

إضافة مجدول أوامر Laravel إلى cron (`crontab -e -u www-data`):
```cron
* * * * * cd /var/www/erp && php artisan schedule:run >> /dev/null 2>&1
```

### الخطوة 6: التحقق النهائي من الجاهزية والنزاهة
قم بتشغيل أوامر التدقيق والتحقق التشغيلي:
```bash
php artisan audit:verify-ledgers
php artisan backup:verify-drill
```
يجب أن ينتهي كلا الأمرين بالرمز `0` قبل فتح حركة المرور للعملاء.
