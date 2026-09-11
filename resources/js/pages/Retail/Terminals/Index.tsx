import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Store, Plus, Search, CheckCircle2, XCircle, ArrowRight, Warehouse, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface Branch {
    id: string;
    name: string;
    code: string;
}

interface WarehouseModel {
    id: string;
    name: string;
    code: string;
}

interface Account {
    id: string;
    name: string;
    code: string;
}

interface PosSession {
    id: string;
    session_number: string;
    status: 'open' | 'closed';
    opened_at: string;
}

interface PosTerminal {
    id: string;
    name: string;
    code: string;
    status: 'active' | 'inactive';
    branch: Branch;
    warehouse: WarehouseModel;
    cash_account: Account;
    sessions?: PosSession[];
}

interface PaginatedData<T> {
    data: T[];
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
}

interface Props {
    terminals: PaginatedData<PosTerminal>;
    branches: Branch[];
    warehouses: WarehouseModel[];
    cashAccounts: Account[];
    filters: {
        search?: string;
    };
}

export default function PosTerminalsIndex({ terminals, branches, warehouses, cashAccounts, filters }: Props) {
    const { t, isRtl } = useTranslation();
    const [search, setSearch] = useState(filters.search || '');
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const [form, setForm] = useState({
        name: '',
        code: '',
        branch_id: branches[0]?.id || '',
        warehouse_id: warehouses[0]?.id || '',
        cash_account_id: cashAccounts[0]?.id || '',
        status: 'active',
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/retail/terminals', { search }, { preserveState: true, replace: true });
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/retail/terminals', form, {
            onSuccess: () => {
                setIsCreateOpen(false);
                setForm({
                    name: '',
                    code: '',
                    branch_id: branches[0]?.id || '',
                    warehouse_id: warehouses[0]?.id || '',
                    cash_account_id: cashAccounts[0]?.id || '',
                    status: 'active',
                });
            },
        });
    };

    const activeCount = terminals.data.filter(t => t.status === 'active').length;
    const openShiftsCount = terminals.data.filter(t => t.sessions && t.sessions[0]?.status === 'open').length;

    return (
        <div className="flex flex-col gap-6 p-6">
            <Head title={isRtl ? 'نقاط البيع والكاشير' : 'POS Terminals'} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <Store className="h-7 w-7 text-indigo-600" />
                        {isRtl ? 'نقاط البيع والتجزئة (POS)' : 'Retail Point of Sale (POS)'}
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {isRtl
                            ? 'إدارة محطات نقاط البيع، الربط مع المستودعات وصناديق النقدية، وإطلاق شاشة الكاشير'
                            : 'Manage retail terminals, link branch warehouses and cash registers, launch checkout'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={() => setIsCreateOpen(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Plus className="h-4 w-4" />
                        <span>{isRtl ? 'إضافة نقطة بيع جديدة' : 'New POS Terminal'}</span>
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-neutral-500">{isRtl ? 'إجمالي المحطات المسجلة' : 'Total Registered Terminals'}</p>
                        <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1 font-mono">
                            {terminals.total}
                        </h3>
                    </div>
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-lg">
                        <Store className="h-5 w-5" />
                    </div>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-neutral-500">{isRtl ? 'المحطات النشطة' : 'Active Stations'}</p>
                        <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                            {activeCount}
                        </h3>
                    </div>
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-lg">
                        <CheckCircle2 className="h-5 w-5" />
                    </div>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-neutral-500">{isRtl ? 'ورديات بيع مفتوحة حالياً' : 'Currently Open Shifts'}</p>
                        <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 font-mono">
                            {openShiftsCount}
                        </h3>
                    </div>
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/50 text-amber-600 rounded-lg">
                        <Landmark className="h-5 w-5" />
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                <form onSubmit={handleSearch} className="flex gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <Input
                            placeholder={isRtl ? 'بحث باسم المحطة أو الرمز...' : 'Search by terminal name or code...'}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="ps-9"
                        />
                    </div>
                    <Button type="submit" variant="secondary">
                        {isRtl ? 'تصفية' : 'Search'}
                    </Button>
                </form>
            </div>

            {/* Terminals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {terminals.data.length === 0 ? (
                    <div className="col-span-full py-16 text-center text-neutral-500 border border-dashed rounded-xl bg-neutral-50/50 dark:bg-neutral-900/50">
                        <Store className="mx-auto h-12 w-12 text-neutral-400" />
                        <p className="mt-3 font-medium">{isRtl ? 'لا توجد محطات بيع مطابقة' : 'No POS terminals found'}</p>
                    </div>
                ) : (
                    terminals.data.map((terminal) => {
                        const hasOpenSession = terminal.sessions && terminal.sessions[0]?.status === 'open';

                        return (
                            <div
                                key={terminal.id}
                                className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-4"
                            >
                                <div>
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono text-xs px-2.5 py-1 rounded bg-neutral-100 dark:bg-neutral-800 font-semibold text-neutral-700 dark:text-neutral-300">
                                            {terminal.code}
                                        </span>
                                        <span
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                hasOpenSession
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40'
                                                    : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800'
                                            }`}
                                        >
                                            <span className={`h-1.5 w-1.5 rounded-full ${hasOpenSession ? 'bg-emerald-600 animate-pulse' : 'bg-neutral-400'}`} />
                                            {hasOpenSession ? (isRtl ? 'وردية مفتوحة' : 'Shift Active') : (isRtl ? 'مغلق' : 'Shift Closed')}
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mt-3">
                                        {terminal.name}
                                    </h3>

                                    <div className="mt-4 space-y-2 text-xs text-neutral-500">
                                        <div className="flex items-center justify-between">
                                            <span>{isRtl ? 'الفرع:' : 'Branch:'}</span>
                                            <span className="font-medium text-neutral-700 dark:text-neutral-300">{terminal.branch?.name}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span>{isRtl ? 'المستودع المصدر:' : 'Source Warehouse:'}</span>
                                            <span className="font-medium text-neutral-700 dark:text-neutral-300">{terminal.warehouse?.name}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span>{isRtl ? 'حساب الصندوق:' : 'Cash Account:'}</span>
                                            <span className="font-mono font-medium text-neutral-700 dark:text-neutral-300">{terminal.cash_account?.code} - {terminal.cash_account?.name}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
                                    <Button asChild className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                                        <Link href={`/retail/pos/${terminal.id}`}>
                                            <span>{isRtl ? 'فتح شاشة الكاشير والمبيعات' : 'Launch POS Checkout'}</span>
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Create Modal */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-neutral-900 p-6 shadow-xl border border-neutral-200 dark:border-neutral-800">
                        <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                            {isRtl ? 'إضافة نقطة بيع جديدة' : 'Add New POS Terminal'}
                        </h2>
                        <form onSubmit={handleCreate} className="mt-4 space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                                    {isRtl ? 'اسم نقطة البيع' : 'Terminal Name'}
                                </label>
                                <Input
                                    required
                                    placeholder="e.g. Riyadh Main Showroom POS 01"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                                    {isRtl ? 'رمز نقطة البيع (Code)' : 'Terminal Code'}
                                </label>
                                <Input
                                    required
                                    placeholder="e.g. POS-RUH-01"
                                    value={form.code}
                                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                                    className="mt-1 font-mono uppercase"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                                        {isRtl ? 'الفرع' : 'Branch'}
                                    </label>
                                    <select
                                        className="mt-1 w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                                        value={form.branch_id}
                                        onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
                                    >
                                        {branches.map((b) => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                                        {isRtl ? 'المستودع المصدر' : 'Warehouse'}
                                    </label>
                                    <select
                                        className="mt-1 w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                                        value={form.warehouse_id}
                                        onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })}
                                    >
                                        {warehouses.map((w) => (
                                            <option key={w.id} value={w.id}>{w.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                                    {isRtl ? 'حساب الصندوق / البنك الافتراضي' : 'Default Cash / Bank Account'}
                                </label>
                                <select
                                    className="mt-1 w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm font-mono"
                                    value={form.cash_account_id}
                                    onChange={(e) => setForm({ ...form, cash_account_id: e.target.value })}
                                >
                                    {cashAccounts.map((a) => (
                                        <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                                    {isRtl ? 'إلغاء' : 'Cancel'}
                                </Button>
                                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                    {isRtl ? 'حفظ وتفعيل' : 'Save & Activate'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
