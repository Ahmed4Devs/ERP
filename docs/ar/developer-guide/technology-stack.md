# حزمة التقنيات وسجل التحقق (Technology Stack)

## 1. الإصدارات المعتمدة والمتحقق منها

| الطبقة | التقنية المختارة | الإصدار المعتمد | دليل وحالة التحقق |
|---|---|---|---|
| بيئة التشغيل (Runtime) | PHP | 8.5.6 (ZTS Visual C++ 2022 x64) | تم التحقق عبر `php -v`؛ تفعيل ملحقات `pdo_pgsql`, `bcmath`, `intl`, `mbstring`, `openssl` |
| إطار العمل الخلفي (Backend) | Laravel | 13.31.0 | تم التحقق عبر `composer show laravel/framework` |
| محرك قاعدة البيانات (Database) | PostgreSQL | 18.6 (x86_64-windows) | تم التحقق عبر `psql -V` والاتصال النشط بالمنفذ `5432` |
| واجهة المستخدم (Frontend) | React & React-DOM | 19.2.0 / 19.3.0 | تم التحقق عبر `package.json` وسجل npm الرسمي |
| جسر الربط الكامل (Bridge) | Inertia.js (Laravel & React) | v3.0.0 (Inertia Laravel 3.0, @inertiajs/react 3.0.0) | تم التحقق عبر `composer.json` و `package.json` |
| التصميم والتنسيق (Styling) | Tailwind CSS | 4.1.11 | إصدار Tailwind v4 عبر إضافة Vite `@tailwindcss/vite` مع تكوين CSS المباشر |
| مكتبة المكونات الأساسية | Radix UI + shadcn/ui | Radix Primitives (`@radix-ui/react-*`) | تم التحقق عبر `components.json` بنمط `new-york` مع حزم Radix UI المعتمدة |
| مساعد الذكاء الاصطناعي | Laravel Boost | 2.8.1 | تم التحقق عبر `composer show laravel/boost` |
| أداة البناء (Bundler) | Vite | 8.0.0 | تم التحقق عبر `npm run build` لتوليد حزم الإنتاج بنجاح |
| إطار الاختبارات (Testing) | Pest PHP | 5.1 | تم التحقق عبر `php artisan test` بتشغيل 39 اختباراً ضد قاعدة بيانات PostgreSQL `erp_testing` |

## 2. التوافق والقيود المعمارية
- اتصالات قاعدة البيانات: الأساسية `erp`، وبيئة الاختبارات `erp_testing` على PostgreSQL 18.6.
- دعم الاتجاهات واللغات: اللغة العربية (`ar`، RTL) هي اللغة الافتراضية مع دعم كامل للغة الإنجليزية (`en`، LTR).
- منع استخدام SQLite في الاختبارات؛ الالتزام التام ببيئة PostgreSQL الحقيقية.
