import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Landmark, Upload, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface Account {
    id: string;
    code: string;
    name: string;
    name_ar?: string;
    current_balance: string;
}

interface Props {
    bankAccounts: Account[];
}

export default function BankReconciliationCreate({ bankAccounts }: Props) {
    const { isRtl } = useTranslation();

    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const { data, setData, post, processing, errors } = useForm({
        bank_account_id: bankAccounts[0]?.id || '',
        statement_number: `STMT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-01`,
        statement_date: today,
        start_date: firstDayOfMonth,
        end_date: today,
        opening_balance: '0',
        closing_balance: '0',
        notes: '',
        csv_file: null as File | null,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/accounting/bank-reconciliation');
    };

    return (
        <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto w-full">
            <Head title={isRtl ? 'بدء كشف تسوية بنكية جديدة' : 'New Bank Statement Reconciliation'} />

            {/* Header */}
            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon">
                    <Link href="/accounting/bank-reconciliation">
                        {isRtl ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <Landmark className="h-6 w-6 text-indigo-600" />
                        <span>{isRtl ? 'بدء كشف تسوية ومطابقة بنكية' : 'Create Bank Statement Reconciliation'}</span>
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {isRtl
                            ? 'إدخال بيانات كشف حساب البنك وفترة المطابقة واستيراد سطور العمليات عبر ملف CSV'
                            : 'Enter bank statement details, date range, and optionally import statement CSV rows'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm space-y-6">
                    <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                        {isRtl ? 'معلومات كشف الحساب البنكي' : 'Statement Details'}
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Bank Account */}
                        <div className="sm:col-span-2">
                            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 block">
                                {isRtl ? 'الحساب البنكي في دليل الحسابات *' : 'GL Bank Account *'}
                            </label>
                            <select
                                value={data.bank_account_id}
                                onChange={(e) => {
                                    setData('bank_account_id', e.target.value);
                                    const acc = bankAccounts.find(a => a.id === e.target.value);
                                    if (acc && (!data.opening_balance || data.opening_balance === '0')) {
                                        setData('opening_balance', acc.current_balance);
                                    }
                                }}
                                required
                                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                            >
                                <option value="">{isRtl ? '-- اختر الحساب البنكي --' : '-- Select Bank Account --'}</option>
                                {bankAccounts.map((acc) => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.code} - {isRtl && acc.name_ar ? acc.name_ar : acc.name} (الرصيد الدفتري الحالي: {Number(acc.current_balance).toLocaleString()} SAR)
                                    </option>
                                ))}
                            </select>
                            {errors.bank_account_id && <p className="text-xs text-red-600 mt-1">{errors.bank_account_id}</p>}
                        </div>

                        {/* Statement Number */}
                        <div>
                            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 block">
                                {isRtl ? 'رقم أو كود كشف الحساب *' : 'Statement Reference # *'}
                            </label>
                            <Input
                                value={data.statement_number}
                                onChange={(e) => setData('statement_number', e.target.value)}
                                required
                                placeholder="STMT-202609-01"
                            />
                            {errors.statement_number && <p className="text-xs text-red-600 mt-1">{errors.statement_number}</p>}
                        </div>

                        {/* Statement Date */}
                        <div>
                            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 block">
                                {isRtl ? 'تاريخ الكشف *' : 'Statement Issue Date *'}
                            </label>
                            <Input
                                type="date"
                                value={data.statement_date}
                                onChange={(e) => setData('statement_date', e.target.value)}
                                required
                            />
                            {errors.statement_date && <p className="text-xs text-red-600 mt-1">{errors.statement_date}</p>}
                        </div>

                        {/* Start Date */}
                        <div>
                            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 block">
                                {isRtl ? 'بداية الفترة *' : 'Period Start Date *'}
                            </label>
                            <Input
                                type="date"
                                value={data.start_date}
                                onChange={(e) => setData('start_date', e.target.value)}
                                required
                            />
                            {errors.start_date && <p className="text-xs text-red-600 mt-1">{errors.start_date}</p>}
                        </div>

                        {/* End Date */}
                        <div>
                            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 block">
                                {isRtl ? 'نهاية الفترة *' : 'Period End Date *'}
                            </label>
                            <Input
                                type="date"
                                value={data.end_date}
                                onChange={(e) => setData('end_date', e.target.value)}
                                required
                            />
                            {errors.end_date && <p className="text-xs text-red-600 mt-1">{errors.end_date}</p>}
                        </div>

                        {/* Opening Balance */}
                        <div>
                            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 block">
                                {isRtl ? 'رصيد أول المدة البنكي (SAR) *' : 'Opening Bank Balance (SAR) *'}
                            </label>
                            <Input
                                type="number"
                                step="any"
                                value={data.opening_balance}
                                onChange={(e) => setData('opening_balance', e.target.value)}
                                required
                                className="font-mono font-bold"
                            />
                            {errors.opening_balance && <p className="text-xs text-red-600 mt-1">{errors.opening_balance}</p>}
                        </div>

                        {/* Closing Balance */}
                        <div>
                            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 block">
                                {isRtl ? 'رصيد إقفال كشف الحساب البنكي (SAR) *' : 'Statement Ending Balance (SAR) *'}
                            </label>
                            <Input
                                type="number"
                                step="any"
                                value={data.closing_balance}
                                onChange={(e) => setData('closing_balance', e.target.value)}
                                required
                                className="font-mono font-bold"
                            />
                            {errors.closing_balance && <p className="text-xs text-red-600 mt-1">{errors.closing_balance}</p>}
                        </div>
                    </div>

                    {/* CSV File Upload Box */}
                    <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                        <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 block">
                            {isRtl ? 'استيراد كشف البنك عبر ملف CSV (اختياري)' : 'Import Bank Statement CSV (Optional)'}
                        </label>
                        <div className="border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl p-6 text-center hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                            <Upload className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
                            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                {data.csv_file ? data.csv_file.name : (isRtl ? 'اختر ملف CSV يحتوي على حركات البنك' : 'Choose or drag a bank CSV file here')}
                            </p>
                            <p className="text-xs text-neutral-500 mb-4">
                                {isRtl
                                    ? 'يدعم الأعمدة: Date, Description, Reference, Amount (أو Deposit & Withdrawal)'
                                    : 'Accepts columns: Date, Description, Reference, Amount (or Deposit & Withdrawal)'}
                            </p>
                            <input
                                type="file"
                                accept=".csv,.txt"
                                id="csv_input"
                                onChange={(e) => setData('csv_file', e.target.files ? e.target.files[0] : null)}
                                className="hidden"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => document.getElementById('csv_input')?.click()}
                            >
                                {isRtl ? 'استعراض الملف...' : 'Browse File...'}
                            </Button>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 block">
                            {isRtl ? 'ملاحظات' : 'Notes'}
                        </label>
                        <textarea
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            rows={2}
                            className="w-full rounded-lg border border-neutral-200 bg-white p-2.5 text-sm text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                            placeholder={isRtl ? 'أي ملاحظات خاصة بالتسوية...' : 'Any reconciliation notes...'}
                        />
                    </div>
                </div>

                {/* Submit */}
                <div className="flex items-center justify-end gap-3">
                    <Button asChild variant="outline">
                        <Link href="/accounting/bank-reconciliation">{isRtl ? 'إلغاء' : 'Cancel'}</Link>
                    </Button>
                    <Button
                        type="submit"
                        disabled={processing}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-36 shadow-sm"
                    >
                        {processing
                            ? (isRtl ? 'جاري الإنشاء...' : 'Creating...')
                            : (isRtl ? 'إنشاء وفتح ورشة المطابقة' : 'Create & Open Workbench')}
                    </Button>
                </div>
            </form>
        </div>
    );
}
