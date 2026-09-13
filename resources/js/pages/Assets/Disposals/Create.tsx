import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Archive, TrendingUp, TrendingDown, DollarSign, Calculator, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface Account {
    id: string;
    code: string;
    name: string;
    name_ar?: string;
}

interface FixedAsset {
    id: string;
    name: string;
    asset_tag: string;
    serial_number?: string;
    acquisition_cost: string;
    accumulated_depreciation: string;
    net_book_value: string;
    branch_id?: string;
}

interface Branch {
    id: string;
    name: string;
}

interface Props {
    assets: FixedAsset[];
    bankAccounts: Account[];
    branches: Branch[];
}

export default function DisposalsCreate({ assets, bankAccounts }: Props) {
    const { isRtl } = useTranslation();

    const [selectedAssetId, setSelectedAssetId] = useState(assets[0]?.id || '');
    const [proceeds, setProceeds] = useState<number>(0);

    const asset = assets.find((a) => a.id === selectedAssetId);
    const cost = asset ? parseFloat(asset.acquisition_cost) : 0;
    const accumDep = asset ? parseFloat(asset.accumulated_depreciation) : 0;
    const nbv = asset ? parseFloat(asset.net_book_value) : 0;

    const diff = proceeds - nbv;
    const isGain = diff > 0.0001;
    const isLoss = diff < -0.0001;
    const gainLossAmount = Math.abs(diff);

    const { data, setData, post, processing, errors } = useForm({
        fixed_asset_id: selectedAssetId,
        disposal_date: new Date().toISOString().split('T')[0],
        disposal_type: 'sale',
        proceeds: proceeds,
        bank_account_id: bankAccounts[0]?.id || '',
        buyer_name: '',
        reason: 'استبعاد أصل بالبيع / التخريد',
        notes: '',
    });

    const handleAssetChange = (assetId: string) => {
        setSelectedAssetId(assetId);
        setData('fixed_asset_id', assetId);
    };

    const handleProceedsChange = (val: number) => {
        setProceeds(val);
        setData('proceeds', val);
    };

    const handleTypeChange = (type: string) => {
        setData('disposal_type', type);
        if (type === 'scrap' || type === 'donation') {
            handleProceedsChange(0);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/assets/disposals');
    };

    return (
        <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto w-full">
            <Head title={isRtl ? 'تسجيل استبعاد أو تخريد أصل ثابت' : 'Record Fixed Asset Disposal'} />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2.5">
                        <Archive className="h-6 w-6 text-indigo-600" />
                        {isRtl ? 'تسجيل استبعاد أو تخريد أصل ثابت' : 'Record Fixed Asset Disposal'}
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {isRtl
                            ? 'حساب القيمة الدفترية للأصل وإثبات أرباح أو خسائر الاستبعاد محاسبياً وعكس مجمع الإهلاك'
                            : 'Calculate net book value, determine capital gain/loss and clear asset ledger accounts'}
                    </p>
                </div>
                <Button asChild variant="outline" size="sm">
                    <Link href="/assets/disposals" className="gap-2">
                        {isRtl ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                        {isRtl ? 'رجوع للقائمة' : 'Back to list'}
                    </Link>
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {/* Asset Selection & Financial Live Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left: Input Form */}
                    <div className="md:col-span-2 bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 border-b pb-3 dark:border-neutral-800">
                            {isRtl ? 'بيانات الأصل وعملية الاستبعاد' : 'Asset & Disposal Details'}
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    {isRtl ? 'الأصل الثابت المراد استبعاده *' : 'Fixed Asset *'}
                                </label>
                                <select
                                    value={data.fixed_asset_id}
                                    onChange={(e) => handleAssetChange(e.target.value)}
                                    className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                >
                                    <option value="">{isRtl ? '-- اختر الأصل --' : '-- Select Asset --'}</option>
                                    {assets.map((a) => (
                                        <option key={a.id} value={a.id}>
                                            {a.name} ({a.asset_tag}) - NBV: {parseFloat(a.net_book_value).toLocaleString()} SAR
                                        </option>
                                    ))}
                                </select>
                                {errors.fixed_asset_id && <p className="text-rose-500 text-xs mt-1">{errors.fixed_asset_id}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        {isRtl ? 'تاريخ الاستبعاد *' : 'Disposal Date *'}
                                    </label>
                                    <Input
                                        type="date"
                                        value={data.disposal_date}
                                        onChange={(e) => setData('disposal_date', e.target.value)}
                                        required
                                    />
                                    {errors.disposal_date && <p className="text-rose-500 text-xs mt-1">{errors.disposal_date}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        {isRtl ? 'نوع الاستبعاد *' : 'Disposal Type *'}
                                    </label>
                                    <select
                                        value={data.disposal_type}
                                        onChange={(e) => handleTypeChange(e.target.value)}
                                        className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        required
                                    >
                                        <option value="sale">{isRtl ? 'بيع أصل (مع حصيلة بيع)' : 'Sale'}</option>
                                        <option value="scrap">{isRtl ? 'تخريد وشطب نهائي' : 'Scrap / Write-off'}</option>
                                        <option value="donation">{isRtl ? 'منحة / هبة' : 'Donation'}</option>
                                        <option value="stolen">{isRtl ? 'فقد / تلف' : 'Loss / Damage'}</option>
                                    </select>
                                </div>
                            </div>

                            {data.disposal_type === 'sale' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                            {isRtl ? 'سعر البيع / الحصيلة النقدية (SAR) *' : 'Sale Proceeds (SAR) *'}
                                        </label>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="any"
                                            value={data.proceeds}
                                            onChange={(e) => handleProceedsChange(parseFloat(e.target.value) || 0)}
                                            className="font-mono"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                            {isRtl ? 'حساب الإيداع / البنك *' : 'Deposit Bank Account *'}
                                        </label>
                                        <select
                                            value={data.bank_account_id}
                                            onChange={(e) => setData('bank_account_id', e.target.value)}
                                            className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            required
                                        >
                                            {bankAccounts.map((b) => (
                                                <option key={b.id} value={b.id}>
                                                    {b.code} - {isRtl && b.name_ar ? b.name_ar : b.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                            {isRtl ? 'اسم المشتري / الجهة المشترية' : 'Buyer Name'}
                                        </label>
                                        <Input
                                            type="text"
                                            placeholder={isRtl ? 'اسم العميل أو الجهة التي تم البيع لها...' : 'Buyer entity or customer...'}
                                            value={data.buyer_name}
                                            onChange={(e) => setData('buyer_name', e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    {isRtl ? 'سبب الاستبعاد أو التخريد' : 'Reason for Disposal'}
                                </label>
                                <Input
                                    type="text"
                                    placeholder={isRtl ? 'مثال: انتهاء العمر الإنتاجي، تقادم تقني، بيع لغرض الإحلال والتجديد' : 'e.g. End of useful life, technological obsolescence'}
                                    value={data.reason}
                                    onChange={(e) => setData('reason', e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    {isRtl ? 'ملاحظات إضافية' : 'Notes'}
                                </label>
                                <Input
                                    type="text"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right: Live Calculation Card */}
                    <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between space-y-4">
                        <div>
                            <div className="flex items-center gap-2 border-b pb-3 dark:border-neutral-800">
                                <Calculator className="h-5 w-5 text-indigo-600" />
                                <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                                    {isRtl ? 'الحسبة المحاسبية الفورية' : 'Live GL Calculation'}
                                </h3>
                            </div>

                            <div className="mt-4 space-y-3 text-xs">
                                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                                    <span>{isRtl ? 'التكلفة التاريخية للأصل:' : 'Acquisition Cost:'}</span>
                                    <span className="font-mono font-semibold">{cost.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR</span>
                                </div>
                                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                                    <span>{isRtl ? 'مجمع الإهلاك حتى التاريخ:' : 'Acc. Depreciation:'}</span>
                                    <span className="font-mono font-semibold text-rose-600">({accumDep.toLocaleString(undefined, { minimumFractionDigits: 2 })}) SAR</span>
                                </div>
                                <div className="flex justify-between text-neutral-900 dark:text-neutral-100 font-bold border-t pt-2 dark:border-neutral-700">
                                    <span>{isRtl ? 'صافي القيمة الدفترية (NBV):' : 'Net Book Value:'}</span>
                                    <span className="font-mono text-sm">{nbv.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR</span>
                                </div>

                                <div className="flex justify-between text-neutral-600 dark:text-neutral-400 border-t pt-2 dark:border-neutral-700">
                                    <span>{isRtl ? 'حصيلة البيع المحصلة:' : 'Proceeds Received:'}</span>
                                    <span className="font-mono font-bold text-blue-600">{proceeds.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR</span>
                                </div>

                                {/* Capital Gain or Loss Result */}
                                <div className="mt-4 p-3 rounded-lg border text-center space-y-1 bg-neutral-50 dark:bg-neutral-800/50 dark:border-neutral-700">
                                    <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider block">
                                        {isRtl ? 'الأثر المالي الصافي' : 'Net Capital Impact'}
                                    </span>

                                    {isGain && (
                                        <div className="text-emerald-600 font-bold text-base flex items-center justify-center gap-1.5 font-mono">
                                            <TrendingUp className="h-5 w-5" />
                                            <span>+{gainLossAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR</span>
                                            <span className="text-xs font-normal">({isRtl ? 'ربح رأسمالي - دائن 4300' : 'Capital Gain - CR 4300'})</span>
                                        </div>
                                    )}

                                    {isLoss && (
                                        <div className="text-rose-600 font-bold text-base flex items-center justify-center gap-1.5 font-mono">
                                            <TrendingDown className="h-5 w-5" />
                                            <span>-{gainLossAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR</span>
                                            <span className="text-xs font-normal">({isRtl ? 'خسارة استبعاد - مدين 5300' : 'Disposal Loss - DR 5300'})</span>
                                        </div>
                                    )}

                                    {!isGain && !isLoss && (
                                        <div className="text-neutral-600 font-bold text-sm font-mono">
                                            0.00 SAR ({isRtl ? 'لا يوجد ربح أو خسارة' : 'Break-even'})
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t dark:border-neutral-800 flex items-center justify-end gap-2">
                            <Button asChild variant="outline">
                                <Link href="/assets/disposals">{isRtl ? 'إلغاء' : 'Cancel'}</Link>
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing || !data.fixed_asset_id}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[130px]"
                            >
                                {processing ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'حفظ المسودة' : 'Save Draft')}
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
