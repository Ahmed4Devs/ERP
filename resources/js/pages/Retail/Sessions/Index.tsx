import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Receipt, Search, Eye, CheckCircle2, Clock, Landmark, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface PosTerminal {
    id: string;
    name: string;
    code: string;
}

interface PosSession {
    id: string;
    session_number: string;
    terminal: PosTerminal;
    user: { name: string };
    opening_cash: string;
    closing_cash?: string;
    expected_cash: string;
    cash_difference: string;
    status: 'open' | 'closed';
    opened_at: string;
    closed_at?: string;
}

interface PaginatedData<T> {
    data: T[];
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
}

interface Props {
    sessions: PaginatedData<PosSession>;
    terminals: PosTerminal[];
    filters: {
        status?: string;
        terminal_id?: string;
    };
}

export default function PosSessionsIndex({ sessions, terminals, filters }: Props) {
    const { t, isRtl } = useTranslation();
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [selectedTerminal, setSelectedTerminal] = useState(filters.terminal_id || '');

    const handleFilter = (status: string, terminalId: string) => {
        setSelectedStatus(status);
        setSelectedTerminal(terminalId);
        router.get(
            '/retail/sessions',
            { status: status || undefined, terminal_id: terminalId || undefined },
            { preserveState: true, replace: true }
        );
    };

    return (
        <div className="flex flex-col gap-6 p-6">
            <Head title={isRtl ? 'ورديات وجلسات الكاشير' : 'POS Shifts & Sessions'} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <Receipt className="h-7 w-7 text-indigo-600" />
                        {isRtl ? 'ورديات وجلسات نقاط البيع' : 'POS Shifts & Cash Sessions'}
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {isRtl
                            ? 'متابعة سجل ورديات الكاشير، عهدة الصندوق، ومطابقة النقدية الفعلية مع المتوقعة'
                            : 'Audit cash drawer shifts, opening floats, closing counts, and reconciliations'}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-500">{isRtl ? 'الحالة:' : 'Status:'}</span>
                    {['', 'open', 'closed'].map((s) => (
                        <button
                            key={s}
                            onClick={() => handleFilter(s, selectedTerminal)}
                            className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                                selectedStatus === s
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
                            }`}
                        >
                            {s === '' ? (isRtl ? 'الكل' : 'All') : s === 'open' ? (isRtl ? 'مفتوحة' : 'Open') : (isRtl ? 'مغلقة ومرحلة' : 'Closed')}
                        </button>
                    ))}
                </div>

                <div className="ms-auto flex items-center gap-2">
                    <span className="text-xs text-neutral-500">{isRtl ? 'المحطة:' : 'Terminal:'}</span>
                    <select
                        className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-xs"
                        value={selectedTerminal}
                        onChange={(e) => handleFilter(selectedStatus, e.target.value)}
                    >
                        <option value="">{isRtl ? 'جميع المحطات' : 'All Terminals'}</option>
                        {terminals.map((term) => (
                            <option key={term.id} value={term.id}>
                                {term.name} ({term.code})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Sessions Table */}
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-start">
                        <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-xs font-semibold uppercase text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
                            <tr>
                                <th className="px-6 py-3.5 text-start">{isRtl ? 'رقم الوردية' : 'Session #'}</th>
                                <th className="px-6 py-3.5 text-start">{isRtl ? 'المحطة' : 'Terminal'}</th>
                                <th className="px-6 py-3.5 text-start">{isRtl ? 'الكاشير' : 'Cashier'}</th>
                                <th className="px-6 py-3.5 text-start">{isRtl ? 'تاريخ الفتح' : 'Opened At'}</th>
                                <th className="px-6 py-3.5 text-end font-mono">{isRtl ? 'العهدة الافتتاحية' : 'Opening Float'}</th>
                                <th className="px-6 py-3.5 text-end font-mono">{isRtl ? 'النقدية المتوقعة' : 'Expected Cash'}</th>
                                <th className="px-6 py-3.5 text-end font-mono">{isRtl ? 'النقدية الفعلية' : 'Closing Cash'}</th>
                                <th className="px-6 py-3.5 text-center">{isRtl ? 'الحالة' : 'Status'}</th>
                                <th className="px-6 py-3.5 text-end">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {sessions.data.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-12 text-center text-neutral-500">
                                        <Receipt className="mx-auto h-8 w-8 text-neutral-400 mb-2" />
                                        {isRtl ? 'لا توجد ورديات مطابقة' : 'No POS sessions found'}
                                    </td>
                                </tr>
                            ) : (
                                sessions.data.map((session) => {
                                    const isOpen = session.status === 'open';

                                    return (
                                        <tr key={session.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="px-6 py-4 font-mono font-medium text-neutral-900 dark:text-neutral-100">
                                                {session.session_number}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-neutral-900 dark:text-neutral-100">
                                                    {session.terminal?.name}
                                                </div>
                                                <div className="text-xs text-neutral-500 font-mono">
                                                    {session.terminal?.code}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-neutral-700 dark:text-neutral-300">
                                                {session.user?.name}
                                            </td>
                                            <td className="px-6 py-4 text-xs font-mono text-neutral-600 dark:text-neutral-400">
                                                {new Date(session.opened_at).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-end font-mono text-neutral-700 dark:text-neutral-300">
                                                {Number(session.opening_cash).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                            </td>
                                            <td className="px-6 py-4 text-end font-mono text-neutral-700 dark:text-neutral-300">
                                                {Number(session.expected_cash).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                            </td>
                                            <td className="px-6 py-4 text-end font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                                {session.closing_cash ? `${Number(session.closing_cash).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR` : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        isOpen
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : 'bg-neutral-100 text-neutral-700'
                                                    }`}
                                                >
                                                    <span className={`h-1.5 w-1.5 rounded-full ${isOpen ? 'bg-emerald-600 animate-pulse' : 'bg-neutral-400'}`} />
                                                    {isOpen ? (isRtl ? 'مفتوحة' : 'Open') : (isRtl ? 'مغلقة' : 'Closed')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-end">
                                                <Button asChild variant="ghost" size="sm" className="gap-1 text-neutral-600 hover:text-neutral-900">
                                                    <Link href={`/retail/sessions/${session.id}`}>
                                                        <Eye className="h-4 w-4" />
                                                        <span>{isRtl ? 'التفاصيل والإقفال' : 'View & Audit'}</span>
                                                    </Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
