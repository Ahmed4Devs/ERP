# توثيق نظام تخطيط موارد المؤسسات (ERP)

أهلاً بكم في التوثيق الشامل لنظام تخطيط موارد المؤسسات (ERP).

- [English Version (النسخة الإنجليزية)](../en/index.md)

## هيكل التوثيق

### 1. دليل المطور (Developer Guide)
- [حزمة التقنيات وسجل التحقق](developer-guide/technology-stack.md)

### 2. المعمارية والتصميم (Architecture & Design)
- [نظرة عامة على المعمارية](architecture/overview.md)
- [قرار معماري 0001: معمارية الكتلة وتعدد المستأجرين](architecture/decisions/0001-modular-monolith-and-tenancy.md)
- [مخطط علاقات الكيانات (ERD)](data/erd.md)

### 3. الأمان والحماية (Security)
- [نموذج التهديدات والضوابط الأمنية](security/model.md)
- [مصفوفة الأدوار والصلاحيات (RBAC)](security/permissions.md)
- [تقرير التحقق الأمني وفق معيار ASVS 4.0](security/verification.md)

### 4. جودة المنتج والتحقق (Product & Quality)
- [مصفوفة تتبع المتطلبات والمطابقة](product/requirements.md)
- [خارطة طريق تنفيذ المنتج](product/roadmap.md)
- [مصفوفة ضمان الجودة واختبارات القبول](quality/acceptance.md)
- [مسرد المصطلحات المعيارية](glossary.md)

### 5. التشغيل والجاهزية (Operations & Runbooks)
- [دليل النشر والجاهزية للبيئة الإنتاجية](operations/deployment.md)
- [النسخ الاحتياطي والتعافي من الكوارث وتجارب الاستعادة](operations/backup-restore.md)
- [دليل المراقبة وفحص السلامة والجاهزية التشغيلية](operations/monitoring.md)

### 6. الإصدارات والاعتماد (Releases)
- [مصفوفة التحقق الشامل للإصدار v1.0.0-GA](releases/release-matrix.md)
