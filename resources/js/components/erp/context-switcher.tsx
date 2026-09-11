import { usePage, router } from '@inertiajs/react';
import { Building2, ChevronDown, Check } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface Company {
    id: string;
    name: string;
    currency: string;
}

interface Branch {
    id: string;
    name: string;
    code: string;
}

interface Tenant {
    id: string;
    name: string;
    slug: string;
}

export function ContextSwitcher() {
    const { t } = useTranslation();
    const { auth } = usePage<{
        auth: {
            tenant?: Tenant;
            company?: Company;
            branch?: Branch;
            companies: Company[];
            branches: Branch[];
            tenants: Tenant[];
        };
    }>().props;

    const currentTenant = auth.tenant;
    const currentCompany = auth.company;
    const currentBranch = auth.branch;
    const companies = auth.companies || [];
    const branches = auth.branches || [];

    const handleSwitchCompany = (companyId: string) => {
        router.post('/switch-context/company', { company_id: companyId }, {
            preserveScroll: true,
        });
    };

    const handleSwitchBranch = (branchId: string) => {
        router.post('/switch-context/branch', { branch_id: branchId }, {
            preserveScroll: true,
        });
    };

    if (!currentTenant) {
        return null;
    }

    return (
        <div className="flex items-center gap-2">
            {/* Active Company & Branch Switcher Dropdown */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 gap-2 px-3 border-neutral-200 dark:border-neutral-800 max-w-[180px] sm:max-w-[240px] text-left rtl:text-right">
                        <Building2 className="h-4 w-4 text-neutral-500 shrink-0" />
                        <div className="flex flex-col items-start min-w-0 text-xs leading-tight truncate">
                            <span className="font-semibold truncate max-w-full">{currentCompany?.name || t('app.noActiveCompany')}</span>
                            {currentBranch && (
                                <span className="text-[10px] text-neutral-500 truncate max-w-full">{currentBranch.name}</span>
                            )}
                        </div>
                        <ChevronDown className="h-3 w-3 opacity-50 ml-auto shrink-0" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel className="text-xs text-neutral-500">
                        {t('app.switchCompany')} ({currentTenant.name})
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {companies.map((comp) => (
                        <DropdownMenuItem
                            key={comp.id}
                            onClick={() => handleSwitchCompany(comp.id)}
                            className="flex items-center justify-between cursor-pointer py-2"
                        >
                            <div className="flex flex-col">
                                <span className="font-medium text-sm">{comp.name}</span>
                                <span className="text-xs text-neutral-400">{comp.currency}</span>
                            </div>
                            {comp.id === currentCompany?.id && <Check className="h-4 w-4 text-emerald-600" />}
                        </DropdownMenuItem>
                    ))}

                    {branches.length > 1 && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-xs text-neutral-500">
                                {t('app.switchBranch')}
                            </DropdownMenuLabel>
                            {branches.map((b) => (
                                <DropdownMenuItem
                                    key={b.id}
                                    onClick={() => handleSwitchBranch(b.id)}
                                    className="flex items-center justify-between cursor-pointer py-1.5"
                                >
                                    <span className="text-sm">{b.name}</span>
                                    {b.id === currentBranch?.id && <Check className="h-4 w-4 text-emerald-600" />}
                                </DropdownMenuItem>
                            ))}
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
