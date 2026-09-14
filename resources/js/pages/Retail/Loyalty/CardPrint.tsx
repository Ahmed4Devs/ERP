import { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Award, Printer, Sparkles, CheckCircle2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    account: {
        id: string;
        card_number: string;
        points_balance: number;
        joined_at: string;
        party: {
            name: string;
            name_ar?: string;
            phone?: string;
        };
        current_tier?: {
            name: string;
            name_ar?: string;
            color_hex: string;
            earn_multiplier: string;
        };
    };
    company: {
        name: string;
        name_ar?: string;
        tax_number?: string;
    };
    qrSvg: string;
}

export default function LoyaltyCardPrint({ account, company, qrSvg }: Props) {
    const tierColor = account.current_tier?.color_hex || '#4f46e5';

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-4 md:p-8 flex flex-col items-center justify-center print:bg-white print:p-0">
            <Head title={`بطاقة عضوية ولاء - ${account.card_number}`} />

            {/* Print action toolbar (hidden on print) */}
            <div className="mb-6 flex gap-3 print:hidden">
                <Button
                    onClick={() => window.print()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg"
                >
                    <Printer className="w-4 h-4 ml-2" />
                    طباعة بطاقة العضوية
                </Button>
                <Button variant="outline" onClick={() => window.close()}>
                    إغلاق النافذة
                </Button>
            </div>

            {/* A4 Container */}
            <div className="w-full max-w-2xl bg-white text-slate-900 rounded-3xl shadow-2xl p-8 md:p-12 border space-y-8 print:shadow-none print:border-none print:p-6">
                {/* Header */}
                <div className="flex justify-between items-center border-b pb-6">
                    <div className="space-y-1">
                        <h2 className="text-xl font-black tracking-tight text-slate-900">
                            {company.name_ar || company.name}
                        </h2>
                        <p className="text-xs text-slate-500">
                            بطاقة عضوية برنامج مكافآت العملاء المعتمدة (Loyalty Membership Card)
                        </p>
                    </div>
                    <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-700">
                        <Award className="w-8 h-8" />
                    </div>
                </div>

                {/* Card Visual Front */}
                <div
                    className="w-full max-w-md mx-auto aspect-[1.586/1] rounded-2xl p-6 text-white shadow-2xl flex flex-col justify-between relative overflow-hidden border border-white/20 print:shadow-none"
                    style={{
                        background: `linear-gradient(135deg, ${tierColor} 0%, #0f172a 100%)`,
                    }}
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] tracking-widest font-mono uppercase opacity-75">
                                OFFICIAL REWARDS PASS
                            </p>
                            <h3 className="font-bold text-lg mt-0.5">
                                {company.name_ar || company.name}
                            </h3>
                        </div>
                        <div className="flex items-center gap-1 bg-white/20 backdrop-blur px-2.5 py-0.5 rounded-full text-xs font-bold">
                            <Sparkles className="w-3 h-3" />
                            {account.current_tier?.name_ar || 'العضوية القياسية'}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="font-mono text-xl tracking-[0.25em] font-bold">
                            {account.card_number}
                        </div>

                        <div className="flex justify-between items-end text-xs">
                            <div>
                                <p className="text-[9px] opacity-70">اسم حامل البطاقة</p>
                                <p className="font-bold text-sm">
                                    {account.party.name_ar || account.party.name}
                                </p>
                            </div>
                            <div className="text-left">
                                <p className="text-[9px] opacity-70">تاريخ الانضمام</p>
                                <p className="font-mono">
                                    {new Date(account.joined_at).toLocaleDateString('ar-SA')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* QR Code and Instructions */}
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-2 text-right">
                        <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            رمز الاستجابة السريعة لمسح الكاشير (POS QR Code)
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed max-w-sm">
                            قم بإبراز هذا الرمز عند نقطة البيع أو الكاشير لاكتساب النقاط الفورية على الفاتورة، أو استبدال رصيدك بخصم مباشر.
                        </p>
                        <div className="font-mono text-xs text-slate-500 font-semibold pt-1">
                            رقم العضوية المعتمد: {account.card_number}
                        </div>
                    </div>

                    <div
                        className="p-3 bg-white rounded-xl shadow-sm border border-slate-200"
                        dangerouslySetInnerHTML={{ __html: qrSvg }}
                    />
                </div>

                {/* Program Terms & Conditions */}
                <div className="border-t pt-4 space-y-2 text-[11px] text-slate-500 text-right">
                    <div className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-indigo-600" />
                        <span>شروط وأحكام برنامج الولاء:</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-slate-600">
                        <li>تعتبر هذه البطاقة شخصية وغير قابلة للتحويل أو التنازل للغير.</li>
                        <li>تكتسب النقاط عند إتمام عمليات الشراء المعتمدة بنقاط البيع والفواتير الإلكترونية.</li>
                        <li>تخضع النقاط لسياسة الاستبدال المحددة لدى إدارة المنشأة وفق الشرائح المعلنة.</li>
                        <li>يحق للمنشأة تعديل قواعد ومضاعفات النقاط وفق سياسة برنامج الولاء المعتمدة.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
