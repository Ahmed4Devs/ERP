import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Plus, Search, Trash2, Building, UserCheck, ShieldCheck, CreditCard, Globe, Copy, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { useTranslation } from '@/lib/i18n';

interface CustomerProfile {
    id: string;
    credit_limit: string;
    payment_terms_days: number;
    currency: string;
    is_active: boolean;
    portal_token?: string;
}

interface Party {
    id: string;
    name: string;
    name_ar?: string;
    type: string;
    tax_id?: string;
    email?: string;
    phone?: string;
    status: string;
    customer_profiles?: CustomerProfile[];
}

interface PaginatedData<T> {
    data: T[];
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
}

interface Props {
    parties: PaginatedData<Party>;
    filters: {
        search?: string;
    };
}

export default function CustomersIndex({ parties, filters }: Props) {
    const { t, isRtl } = useTranslation();
    const [search, setSearch] = useState(filters.search || '');
    const [isOpen, setIsOpen] = useState(false);
    const [copiedToken, setCopiedToken] = useState<string | null>(null);

    const [form, setForm] = useState({
        name: '',
        name_ar: '',
        type: 'customer',
        tax_id: '',
        email: '',
        phone: '',
        credit_limit: '0',
        payment_terms_days: '30',
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/customers', { search }, { preserveState: true, replace: true });
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/customers', form, {
            onSuccess: () => {
                setIsOpen(false);
                setForm({
                    name: '',
                    name_ar: '',
                    type: 'customer',
                    tax_id: '',
                    email: '',
                    phone: '',
                    credit_limit: '0',
                    payment_terms_days: '30',
                });
            },
        });
    };

    const handleDelete = (id: string) => {
        if (confirm(t('customers.deleteConfirm'))) {
            router.delete(`/customers/${id}`, { preserveScroll: true });
        }
    };

    return (
        <div className="flex flex-col gap-6 p-6">
            <Head title={t('customers.title')} />

            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                        {t('customers.title')}
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {t('customers.subtitle')}
                    </p>
                </div>

                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800">
                            <Plus className="h-4 w-4" />
                            <span>{t('customers.newCustomer')}</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                        <form onSubmit={handleCreate}>
                            <DialogHeader>
                                <DialogTitle>{t('customers.createCustomerModalTitle')}</DialogTitle>
                                <DialogDescription>
                                    {t('customers.subtitle')}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="name">{t('customers.name')} *</Label>
                                        <Input
                                            id="name"
                                            required
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            placeholder="e.g. Al-Safwa Trading"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="name_ar">{t('customers.nameAr')}</Label>
                                        <Input
                                            id="name_ar"
                                            value={form.name_ar}
                                            onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
                                            placeholder="مثال: شركة الصفوة للتجارة"
                                            dir="rtl"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="type">{t('customers.type')}</Label>
                                        <select
                                            id="type"
                                            value={form.type}
                                            onChange={(e) => setForm({ ...form, type: e.target.value })}
                                            className="h-9 w-full rounded-md border border-neutral-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors dark:border-neutral-800"
                                        >
                                            <option value="customer">{t('customers.customer')}</option>
                                            <option value="vendor">{t('customers.vendor')}</option>
                                            <option value="both">{t('customers.both')}</option>
                                            <option value="partner">{t('customers.partner')}</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="tax_id">{t('customers.taxId')}</Label>
                                        <Input
                                            id="tax_id"
                                            value={form.tax_id}
                                            onChange={(e) => setForm({ ...form, tax_id: e.target.value })}
                                            placeholder="e.g. 300123456700003"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="email">{t('customers.email')}</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={form.email}
                                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                                            placeholder="billing@example.com"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="phone">{t('customers.phone')}</Label>
                                        <Input
                                            id="phone"
                                            value={form.phone}
                                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                            placeholder="+966 50 000 0000"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="credit_limit">{t('customers.creditLimit')}</Label>
                                        <Input
                                            id="credit_limit"
                                            type="number"
                                            step="0.01"
                                            value={form.credit_limit}
                                            onChange={(e) => setForm({ ...form, credit_limit: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="payment_terms_days">{t('customers.paymentTerms')}</Label>
                                        <Input
                                            id="payment_terms_days"
                                            type="number"
                                            value={form.payment_terms_days}
                                            onChange={(e) => setForm({ ...form, payment_terms_days: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                                    {t('customers.cancel')}
                                </Button>
                                <Button type="submit">
                                    {t('customers.save')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Metric cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="rounded-lg bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                        <Building className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs text-neutral-500 font-medium">{t('customers.title')}</p>
                        <p className="text-xl font-bold text-neutral-900 dark:text-white">{parties.total}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="rounded-lg bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                        <UserCheck className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs text-neutral-500 font-medium">{t('customers.active')}</p>
                        <p className="text-xl font-bold text-neutral-900 dark:text-white">{parties.total}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="rounded-lg bg-purple-50 p-3 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
                        <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs text-neutral-500 font-medium">{t('app.currentScope')}</p>
                        <p className="text-sm font-bold text-neutral-900 dark:text-white">Tenant & Company Scoped</p>
                    </div>
                </div>
            </div>

            {/* Search filter */}
            <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
                <div className="relative flex-1">
                    <Search className={`absolute top-2.5 h-4 w-4 text-neutral-400 ${isRtl ? 'right-3' : 'left-3'}`} />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('customers.searchPlaceholder')}
                        className={isRtl ? 'pr-9' : 'pl-9'}
                    />
                </div>
                <Button type="submit" variant="secondary">
                    {t('common.view')}
                </Button>
            </form>

            {/* Data table */}
            <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden dark:border-neutral-800 dark:bg-neutral-900">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left rtl:text-right">
                        <thead className="bg-neutral-50 text-xs uppercase text-neutral-500 border-b border-neutral-200 dark:bg-neutral-950 dark:border-neutral-800">
                            <tr>
                                <th className="px-6 py-3 font-semibold">{t('customers.name')}</th>
                                <th className="px-6 py-3 font-semibold">{t('customers.type')}</th>
                                <th className="px-6 py-3 font-semibold">{t('customers.taxId')}</th>
                                <th className="px-6 py-3 font-semibold">{t('customers.email')}</th>
                                <th className="px-6 py-3 font-semibold">{t('customers.phone')}</th>
                                <th className="px-6 py-3 font-semibold">{t('customers.creditLimit')}</th>
                                <th className="px-6 py-3 font-semibold text-end">{t('customers.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {parties.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-10 text-center text-neutral-500">
                                        {t('customers.noCustomersFound')}
                                    </td>
                                </tr>
                            ) : (
                                parties.data.map((party) => {
                                    const profile = party.customer_profiles?.[0];
                                    return (
                                        <tr key={party.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-neutral-900 dark:text-neutral-100">
                                                <div>{party.name}</div>
                                                {party.name_ar && (
                                                    <div className="text-xs text-neutral-500 font-normal mt-0.5">{party.name_ar}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
                                                    {t(`customers.${party.type}`, party.type)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                                                {party.tax_id || '—'}
                                            </td>
                                            <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400">
                                                {party.email || '—'}
                                            </td>
                                            <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400 font-mono text-xs">
                                                {party.phone || '—'}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-neutral-900 dark:text-neutral-100">
                                                {profile ? (
                                                    <span>{Number(profile.credit_limit).toLocaleString()} {profile.currency}</span>
                                                ) : (
                                                    <span className="text-neutral-400">—</span>
                                                )}
                                            </td>
                                             <td className="px-6 py-4 text-end">
                                                 <div className="flex items-center justify-end gap-1">
                                                     {profile?.portal_token && (
                                                         <>
                                                             <Button
                                                                 variant="ghost"
                                                                 size="icon"
                                                                 onClick={() => {
                                                                     const url = `${window.location.origin}/portal/${profile.portal_token}`;
                                                                     navigator.clipboard.writeText(url);
                                                                     setCopiedToken(profile.portal_token || null);
                                                                     setTimeout(() => setCopiedToken(null), 2000);
                                                                 }}
                                                                 className="h-8 w-8 text-neutral-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                                                                 title={copiedToken === profile.portal_token ? 'تم نسخ الرابط!' : 'نسخ رابط بوابة العميل'}
                                                             >
                                                                 {copiedToken === profile.portal_token ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                                                             </Button>
                                                             <Button
                                                                 asChild
                                                                 variant="ghost"
                                                                 size="icon"
                                                                 className="h-8 w-8 text-neutral-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                                                                 title="فتح بوابة العميل"
                                                             >
                                                                 <a href={`/portal/${profile.portal_token}`} target="_blank" rel="noreferrer">
                                                                     <Globe className="h-4 w-4" />
                                                                 </a>
                                                             </Button>
                                                         </>
                                                     )}
                                                     <Button
                                                         variant="ghost"
                                                         size="icon"
                                                         onClick={() => handleDelete(party.id)}
                                                         className="h-8 w-8 text-neutral-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                                                         title={t('common.delete')}
                                                     >
                                                         <Trash2 className="h-4 w-4" />
                                                     </Button>
                                                 </div>
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
