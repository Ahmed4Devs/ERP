import { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Printer, X, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface Company {
    name: string;
    name_ar?: string;
    tax_number?: string;
    address?: string;
}

interface FixedAssetDisposal {
    id: string;
    disposal_number: string;
    disposal_date: string;
    disposal_type: 'sale' | 'scrap' | 'donation' | 'stolen';
    acquisition_cost: string;
    accumulated_depreciation: string;
    net_book_value: string;
    proceeds: string;
    gain_loss_amount: string;
    gain_loss_type: 'gain' | 'loss' | 'none';
    buyer_name?: string;
    reason?: string;
    notes?: string;
    asset?: {
        name: string;
        name_ar?: string;
        asset_tag: string;
        serial_number?: string;
        category?: {
            name: string;
        };
    };
    branch?: {
        name: string;
    };
}

interface Props {
    disposal: FixedAssetDisposal;
    company: Company;
    qrCodeDataUri: string;
    amountInWords: {
        proceeds_ar: string;
        proceeds_en: string;
        nbv_ar: string;
        nbv_en: string;
    };
}

export default function DisposalsPrint({
    disposal,
    company,
    qrCodeDataUri,
    amountInWords,
}: Props) {
    const { isRtl } = useTranslation();

    useEffect(() => {
        const timer = setTimeout(() => {
            window.print();
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 py-8 px-4 sm:px-6 print:p-0 print:bg-white text-neutral-900">
            <Head title={`${disposal.disposal_number} - ${isRtl ? 'محضر استبعاد أصل رسمي' : 'Asset Disposal Certificate'}`} />

            {/* Print Controls */}
            <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
                <div className="flex items-center gap-2">
                    <Button onClick={() => window.print()} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                        <Printer className="h-4 w-4" />
                        {isRtl ? 'طباعة محضر الاستبعاد' : 'Print Certificate'}
                    </Button>
                    <Button variant="outline" onClick={() => window.close()}>
                        <X className="h-4 w-4" />
                        {isRtl ? 'إغلاق' : 'Close'}
                    </Button>
                </div>
                <div className="text-xs text-neutral-500">
                    {isRtl ? 'محضر رسمي لاستبعاد وتخريد الأصول معتمد من الإدارة المالية' : 'Official Fixed Asset Disposal Certificate'}
                </div>
            </div>

            {/* A4 Sheet */}
            <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-lg shadow-sm border border-neutral-200 print:border-none print:shadow-none print:p-0 print:m-0 print:w-full">
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-neutral-900 pb-6 mb-6">
                    <div className="space-y-1 text-start">
                        <h1 className="text-xl sm:text-2xl font-black text-neutral-900">
                            {company.name_ar || company.name}
                        </h1>
                        <p className="text-sm font-semibold text-neutral-600">
                            {company.name}
                        </p>
                        <p className="text-xs text-neutral-500">
                            {company.address}
                        </p>
                        <div className="text-xs font-mono font-medium pt-1">
                            {isRtl ? 'الرقم الضريبي:' : 'VAT No:'} <span className="font-bold">{company.tax_number || '300000000000003'}</span>
                        </div>
                    </div>

                    <div className="text-center flex flex-col items-center">
                        <div className="inline-block border-2 border-indigo-600 text-indigo-700 px-4 py-1 font-black text-base sm:text-lg uppercase tracking-wider rounded">
                            {isRtl ? 'محضر استبعاد وتخريد أصل ثابت' : 'ASSET DISPOSAL CERTIFICATE'}
                        </div>
                        <div className="text-xs font-mono text-neutral-500 mt-1">
                            {disposal.disposal_number}
                        </div>
                    </div>

                    <div className="flex flex-col items-end">
                        {qrCodeDataUri && (
                            <img
                                src={qrCodeDataUri}
                                alt="Disposal QR"
                                className="w-24 h-24 sm:w-28 sm:h-28 border border-neutral-300 p-1 rounded"
                            />
                        )}
                        <span className="text-[10px] text-neutral-400 mt-1 font-mono">
                            Enterprise Asset Spec
                        </span>
                    </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-6 bg-neutral-50 p-4 rounded border border-neutral-200 text-xs mb-6">
                    <div className="space-y-1.5 text-start">
                        <div className="font-bold text-neutral-700 uppercase tracking-wider border-b border-neutral-200 pb-1 mb-1">
                            {isRtl ? 'بيانات ومواصفات الأصل المستبعد' : 'Asset Specifications'}
                        </div>
                        <div>{isRtl ? 'اسم الأصل:' : 'Asset Name:'} <span className="font-bold text-sm text-neutral-900">{disposal.asset?.name}</span></div>
                        <div>{isRtl ? 'الرقم التعريفي (Tag):' : 'Asset Tag:'} <span className="font-mono font-semibold">{disposal.asset?.asset_tag}</span></div>
                        {disposal.asset?.serial_number && (
                            <div>{isRtl ? 'الرقم التسلسلي (SN):' : 'Serial No:'} <span className="font-mono">{disposal.asset.serial_number}</span></div>
                        )}
                        <div>{isRtl ? 'تصنيف الأصل:' : 'Category:'} <span>{disposal.asset?.category?.name || '—'}</span></div>
                        <div>{isRtl ? 'الفرع / الموقع:' : 'Branch:'} <span>{disposal.branch?.name || (isRtl ? 'المركز الرئيسي' : 'HQ')}</span></div>
                    </div>

                    <div className="space-y-1.5 text-start">
                        <div className="font-bold text-neutral-700 uppercase tracking-wider border-b border-neutral-200 pb-1 mb-1">
                            {isRtl ? 'تفاصيل قرار الاستبعاد' : 'Disposal Resolution'}
                        </div>
                        <div>{isRtl ? 'رقم المحضر:' : 'Record #:'} <span className="font-mono font-bold">{disposal.disposal_number}</span></div>
                        <div>{isRtl ? 'تاريخ الاستبعاد:' : 'Date:'} <span className="font-mono">{disposal.disposal_date}</span></div>
                        <div>{isRtl ? 'طريقة الاستبعاد:' : 'Method:'} <span className="font-semibold uppercase">{disposal.disposal_type === 'sale' ? (isRtl ? 'بيع أصل' : 'Sale') : (isRtl ? 'تخريد وشطب نهائي' : 'Scrap')}</span></div>
                        {disposal.buyer_name && (
                            <div>{isRtl ? 'الجهة المشترية:' : 'Buyer:'} <span>{disposal.buyer_name}</span></div>
                        )}
                        <div>{isRtl ? 'السبب المعتمد:' : 'Reason:'} <span>{disposal.reason || (isRtl ? 'انتهاء العمر الإنتاجي' : 'End of life')}</span></div>
                    </div>
                </div>

                {/* Ledger Value Comparison Table */}
                <table className="w-full text-xs text-start mb-6 border border-neutral-300">
                    <thead className="bg-neutral-100 border-b border-neutral-300 font-bold text-neutral-700">
                        <tr>
                            <th className="py-2.5 px-3 text-start border-e border-neutral-300">{isRtl ? 'التكلفة التاريخية (SAR)' : 'Historical Cost'}</th>
                            <th className="py-2.5 px-3 text-start border-e border-neutral-300">{isRtl ? 'مجمع الإهلاك حتى تاريخه (SAR)' : 'Acc. Depreciation'}</th>
                            <th className="py-2.5 px-3 text-start border-e border-neutral-300">{isRtl ? 'القيمة الدفترية الصافية (NBV)' : 'Net Book Value'}</th>
                            <th className="py-2.5 px-3 text-start border-e border-neutral-300">{isRtl ? 'قيمة البيع / التخريد المحصلة' : 'Proceeds'}</th>
                            <th className="py-2.5 px-3 text-start">{isRtl ? 'الأرباح / الخسائر الرأسمالية' : 'Capital Gain / Loss'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="font-mono">
                            <td className="py-3 px-3 border-e border-neutral-200">
                                {parseFloat(disposal.acquisition_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-3 border-e border-neutral-200 text-rose-600">
                                ({parseFloat(disposal.accumulated_depreciation).toLocaleString(undefined, { minimumFractionDigits: 2 })})
                            </td>
                            <td className="py-3 px-3 border-e border-neutral-200 font-bold">
                                {parseFloat(disposal.net_book_value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-3 border-e border-neutral-200 text-blue-600 font-bold">
                                {parseFloat(disposal.proceeds).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-3 font-bold text-sm">
                                {disposal.gain_loss_type === 'gain' && (
                                    <span className="text-emerald-700">+{parseFloat(disposal.gain_loss_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} ({isRtl ? 'ربح' : 'Gain'})</span>
                                )}
                                {disposal.gain_loss_type === 'loss' && (
                                    <span className="text-rose-700">-{parseFloat(disposal.gain_loss_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} ({isRtl ? 'خسارة' : 'Loss'})</span>
                                )}
                                {disposal.gain_loss_type === 'none' && (
                                    <span className="text-neutral-500">0.00</span>
                                )}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* Amount in Words (Tafqeet) */}
                <div className="border border-neutral-200 p-3 rounded text-xs space-y-1 mb-8">
                    <div className="font-bold text-neutral-700">{isRtl ? 'القيمة الدفترية بالحروف (تفقيط):' : 'Net Book Value in Words:'}</div>
                    <div className="text-neutral-800 font-medium">{amountInWords.nbv_ar}</div>
                    <div className="text-neutral-500 italic font-sans">{amountInWords.nbv_en}</div>
                </div>

                {/* Signatures Committee */}
                <div className="grid grid-cols-3 gap-6 pt-6 border-t-2 border-neutral-200 text-center text-xs">
                    <div>
                        <div className="text-neutral-500 mb-10">{isRtl ? 'مسؤول الفحص والمعاينة الفنية' : 'Technical Inspector'}</div>
                        <div className="border-t border-neutral-400 pt-1 font-medium">{isRtl ? 'التوقيع / التاريخ' : 'Signature / Date'}</div>
                    </div>
                    <div>
                        <div className="text-neutral-500 mb-10">{isRtl ? 'المراقب المالي / المحاسب' : 'Financial Controller'}</div>
                        <div className="border-t border-neutral-400 pt-1 font-medium">{isRtl ? 'التوقيع / الختم' : 'Signature / Stamp'}</div>
                    </div>
                    <div>
                        <div className="text-neutral-500 mb-10">{isRtl ? 'اعتماد المدير العام / المفوض' : 'Managing Director / CEO'}</div>
                        <div className="border-t border-neutral-400 pt-1 font-medium">{isRtl ? 'الاعتماد النهائي' : 'Approval'}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
