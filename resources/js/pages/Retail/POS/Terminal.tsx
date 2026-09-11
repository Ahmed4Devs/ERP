import { useState, useRef, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    Store,
    Barcode,
    Search,
    ShoppingCart,
    Trash2,
    Plus,
    Minus,
    CreditCard,
    Banknote,
    Printer,
    CheckCircle2,
    Clock,
    User,
    ArrowLeft,
    QrCode,
    Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface ProductItem {
    id: string;
    sku: string;
    barcode?: string;
    name: string;
    name_ar?: string;
    list_price: number;
    tax_rate: number;
    quantity_available: number;
    category_name?: string;
}

interface Customer {
    id: string;
    name: string;
    name_ar?: string;
    tax_id?: string;
    phone?: string;
}

interface PosSession {
    id: string;
    session_number: string;
    status: 'open' | 'closed';
    opened_at: string;
    user?: {
        name: string;
    };
}

interface PosTerminal {
    id: string;
    name: string;
    code: string;
    branch?: { name: string };
    warehouse?: { name: string };
    cash_account?: { name: string; code: string };
}

interface CartItem {
    product: ProductItem;
    quantity: number;
    unit_price: number;
    tax_amount: number;
    line_total: number;
}

interface Props {
    terminal: PosTerminal;
    activeSession: PosSession | null;
    products: ProductItem[];
    customers: Customer[];
    recentOrders?: any[];
}

export default function PosTerminalScreen({
    terminal,
    activeSession,
    products,
    customers,
}: Props) {
    const { t, isRtl } = useTranslation();
    const barcodeInputRef = useRef<HTMLInputElement>(null);

    // Session State
    const [openShiftModal, setOpenShiftModal] = useState(!activeSession);
    const [openingCash, setOpeningCash] = useState('1000.00');

    // Cart & Catalog State
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

    // Payment Modal State
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
    const [cashTendered, setCashTendered] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Thermal Receipt Modal State
    const [receiptModalOpen, setReceiptModalOpen] = useState(false);
    const [completedOrder, setCompletedOrder] = useState<any>(null);

    // Auto-focus barcode scanner input
    useEffect(() => {
        barcodeInputRef.current?.focus();
    }, [activeSession, paymentModalOpen, receiptModalOpen]);

    // Categories
    const categories = ['all', ...Array.from(new Set(products.map(p => p.category_name || 'General')))];

    // Filtered Products
    const filteredProducts = products.filter(p => {
        const matchesCategory = selectedCategory === 'all' || (p.category_name || 'General') === selectedCategory;
        const matchesSearch =
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.name_ar && p.name_ar.includes(searchQuery)) ||
            p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.barcode && p.barcode.includes(searchQuery));
        return matchesCategory && matchesSearch;
    });

    // Add product to cart
    const addToCart = (product: ProductItem) => {
        setCart(prev => {
            const existingIndex = prev.findIndex(item => item.product.id === product.id);
            if (existingIndex > -1) {
                const updated = [...prev];
                const item = updated[existingIndex];
                const newQty = item.quantity + 1;
                const subtotal = newQty * item.unit_price;
                const tax = subtotal * product.tax_rate;
                updated[existingIndex] = {
                    ...item,
                    quantity: newQty,
                    tax_amount: tax,
                    line_total: subtotal + tax,
                };
                return updated;
            } else {
                const subtotal = product.list_price;
                const tax = subtotal * product.tax_rate;
                return [
                    ...prev,
                    {
                        product,
                        quantity: 1,
                        unit_price: product.list_price,
                        tax_amount: tax,
                        line_total: subtotal + tax,
                    },
                ];
            }
        });
    };

    // Modify quantity
    const updateQuantity = (index: number, delta: number) => {
        setCart(prev => {
            const updated = [...prev];
            const item = updated[index];
            const newQty = item.quantity + delta;
            if (newQty <= 0) {
                return updated.filter((_, i) => i !== index);
            }
            const subtotal = newQty * item.unit_price;
            const tax = subtotal * item.product.tax_rate;
            updated[index] = {
                ...item,
                quantity: newQty,
                tax_amount: tax,
                line_total: subtotal + tax,
            };
            return updated;
        });
    };

    // Remove from cart
    const removeFromCart = (index: number) => {
        setCart(prev => prev.filter((_, i) => i !== index));
    };

    // Clear cart
    const clearCart = () => setCart([]);

    // Totals calculations
    const cartSubtotal = cart.reduce((acc, item) => acc + item.quantity * item.unit_price, 0);
    const cartTax = cart.reduce((acc, item) => acc + item.tax_amount, 0);
    const cartTotal = cartSubtotal + cartTax;

    // Handle Barcode Scanner Enter
    const handleBarcodeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const code = searchQuery.trim();
        if (!code) return;

        const found = products.find(p => p.barcode === code || p.sku.toLowerCase() === code.toLowerCase());
        if (found) {
            addToCart(found);
            setSearchQuery('');
        }
    };

    // Open Shift Submission
    const handleOpenShift = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/retail/sessions', {
            terminal_id: terminal.id,
            opening_cash: openingCash,
        }, {
            onSuccess: () => setOpenShiftModal(false),
        });
    };

    // Launch Payment Modal
    const handleInitiatePayment = (method: 'cash' | 'card') => {
        setPaymentMethod(method);
        setCashTendered(cartTotal.toFixed(2));
        setPaymentModalOpen(true);
    };

    // Change Due calculation
    const tenderedVal = parseFloat(cashTendered || '0');
    const changeDue = paymentMethod === 'cash' ? Math.max(0, tenderedVal - cartTotal) : 0;

    // Complete Sale API Submission
    const handleCompleteSale = async () => {
        if (!activeSession) return;
        setIsSubmitting(true);

        try {
            const res = await fetch('/retail/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({
                    session_id: activeSession.id,
                    customer_id: selectedCustomerId || null,
                    payment_method: paymentMethod,
                    cash_tendered: paymentMethod === 'cash' ? tenderedVal : cartTotal,
                    items: cart.map(item => ({
                        product_id: item.product.id,
                        quantity: item.quantity,
                        unit_price: item.unit_price,
                        description: item.product.name_ar || item.product.name,
                    })),
                }),
            });

            const data = await res.json();
            if (data.success && data.order) {
                setCompletedOrder(data.order);
                setPaymentModalOpen(false);
                setReceiptModalOpen(true);
                clearCart();
            } else {
                alert(data.message || 'Error completing sale.');
            }
        } catch (err: any) {
            alert(err.message || 'Network error.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-neutral-900 text-neutral-100 antialiased font-sans select-none">
            <Head title={`POS - ${terminal.name}`} />

            {/* Top Bar */}
            <header className="h-14 border-b border-neutral-800 bg-neutral-950 px-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-neutral-100">
                        <Link href="/retail/terminals">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-600 rounded text-white">
                            <Store className="h-4 w-4" />
                        </div>
                        <div>
                            <span className="font-bold text-sm leading-tight text-white">{terminal.name}</span>
                            <span className="text-[11px] font-mono text-neutral-400 ms-2">({terminal.code})</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-neutral-300">
                    <div className="hidden sm:flex items-center gap-1.5 bg-neutral-900 px-2.5 py-1 rounded border border-neutral-800">
                        <Clock className="h-3.5 w-3.5 text-indigo-400" />
                        <span>{isRtl ? 'الوردية:' : 'Session:'}</span>
                        <span className="font-mono font-medium text-white">
                            {activeSession ? `#${activeSession.session_number}` : (isRtl ? 'مغلقة' : 'Closed')}
                        </span>
                    </div>

                    <div className="hidden md:flex items-center gap-1.5 bg-neutral-900 px-2.5 py-1 rounded border border-neutral-800">
                        <User className="h-3.5 w-3.5 text-emerald-400" />
                        <span>{activeSession?.user?.name || (isRtl ? 'كاشير' : 'Cashier')}</span>
                    </div>

                    {activeSession ? (
                        <Button
                            variant="destructive"
                            size="sm"
                            className="h-8 text-xs bg-rose-600/20 text-rose-300 hover:bg-rose-600/30 border border-rose-500/30"
                            asChild
                        >
                            <Link href={`/retail/sessions/${activeSession.id}`}>
                                {isRtl ? 'إقفال الوردية' : 'Close Shift'}
                            </Link>
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                            onClick={() => setOpenShiftModal(true)}
                        >
                            {isRtl ? 'فتح وردية جديدة' : 'Open Shift'}
                        </Button>
                    )}
                </div>
            </header>

            {/* Main Terminal Layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Side: Product Search, Categories & Catalog */}
                <div className="flex-1 flex flex-col border-e border-neutral-800 bg-neutral-900 overflow-hidden">
                    {/* Search & Barcode Bar */}
                    <div className="p-3 border-b border-neutral-800 bg-neutral-950 flex gap-2">
                        <form onSubmit={handleBarcodeSubmit} className="flex-1 relative">
                            <Barcode className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-400" />
                            <input
                                ref={barcodeInputRef}
                                type="text"
                                placeholder={isRtl ? 'مسح الباركود أو البحث بالاسم / الرمز (اضغط Enter)...' : 'Scan barcode or search product (Press Enter)...'}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg ps-10 pe-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                            />
                        </form>
                    </div>

                    {/* Category Filter Tabs */}
                    <div className="flex gap-1 p-2 border-b border-neutral-800 bg-neutral-950 overflow-x-auto no-scrollbar">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                                    selectedCategory === cat
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                                }`}
                            >
                                {cat === 'all' ? (isRtl ? 'جميع الأصناف' : 'All Products') : cat}
                            </button>
                        ))}
                    </div>

                    {/* Products Grid */}
                    <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 content-start">
                        {filteredProducts.map((product) => {
                            const inCart = cart.find(c => c.product.id === product.id);
                            const hasStock = product.quantity_available > 0;

                            return (
                                <button
                                    key={product.id}
                                    onClick={() => hasStock && addToCart(product)}
                                    disabled={!hasStock}
                                    className={`relative p-3.5 rounded-xl border text-start flex flex-col justify-between h-32 transition-all ${
                                        !hasStock
                                            ? 'bg-neutral-900/40 border-neutral-800 opacity-40 cursor-not-allowed'
                                            : inCart
                                            ? 'bg-indigo-950/40 border-indigo-500 shadow-md scale-[1.01]'
                                            : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/60'
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <span className="font-mono text-[10px] text-neutral-400 tracking-wider">
                                                {product.sku}
                                            </span>
                                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                                hasStock ? 'bg-neutral-800 text-neutral-300' : 'bg-rose-950/80 text-rose-400'
                                            }`}>
                                                {hasStock ? `${product.quantity_available} avail` : 'Out of stock'}
                                            </span>
                                        </div>
                                        <h4 className="font-semibold text-xs text-neutral-100 line-clamp-2 mt-1.5 leading-snug">
                                            {isRtl && product.name_ar ? product.name_ar : product.name}
                                        </h4>
                                    </div>

                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-800">
                                        <span className="text-sm font-bold font-mono text-emerald-400">
                                            {product.list_price.toFixed(2)} <span className="text-[10px] font-normal text-neutral-400">SAR</span>
                                        </span>
                                        {inCart && (
                                            <span className="h-5 min-w-5 px-1 bg-indigo-600 text-white rounded-full text-xs font-bold flex items-center justify-center font-mono">
                                                {inCart.quantity}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Right Side: Live Cart & Touch Checkout */}
                <div className="w-96 md:w-[420px] flex flex-col bg-neutral-950 border-s border-neutral-800">
                    {/* Customer Selection */}
                    <div className="p-3 border-b border-neutral-800 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-1">
                            <User className="h-4 w-4 text-neutral-400" />
                            <select
                                className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-2 py-1 text-xs text-white focus:outline-none"
                                value={selectedCustomerId}
                                onChange={(e) => setSelectedCustomerId(e.target.value)}
                            >
                                <option value="">{isRtl ? 'عميل نقدي عام (Walk-in Customer)' : 'Walk-in Retail Customer'}</option>
                                {customers.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {isRtl && c.name_ar ? c.name_ar : c.name} {c.tax_id ? `(${c.tax_id})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {cart.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearCart}
                                className="h-7 text-xs text-neutral-400 hover:text-rose-400"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        )}
                    </div>

                    {/* Cart Items List */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-neutral-500 py-12">
                                <ShoppingCart className="h-10 w-10 text-neutral-700 mb-2" />
                                <p className="text-xs font-medium">{isRtl ? 'سلة المشتريات فارغة' : 'Cart is currently empty'}</p>
                                <p className="text-[11px] text-neutral-600 mt-1">{isRtl ? 'امسح الباركود أو اختر المنتجات' : 'Scan items or select from catalog'}</p>
                            </div>
                        ) : (
                            cart.map((item, idx) => (
                                <div
                                    key={item.product.id}
                                    className="p-2.5 rounded-lg border border-neutral-800 bg-neutral-900/60 flex items-center justify-between gap-3"
                                >
                                    <div className="flex-1 min-w-0">
                                        <h5 className="text-xs font-medium text-neutral-200 truncate">
                                            {isRtl && item.product.name_ar ? item.product.name_ar : item.product.name}
                                        </h5>
                                        <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-neutral-400">
                                            <span>{item.unit_price.toFixed(2)} SAR</span>
                                            <span>×</span>
                                            <span>{item.quantity}</span>
                                            <span className="text-emerald-400 font-bold ms-auto">
                                                {item.line_total.toFixed(2)} SAR
                                            </span>
                                        </div>
                                    </div>

                                    {/* Qty Stepper */}
                                    <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-md border border-neutral-800">
                                        <button
                                            onClick={() => updateQuantity(idx, -1)}
                                            className="h-6 w-6 rounded flex items-center justify-center hover:bg-neutral-800 text-neutral-300"
                                        >
                                            <Minus className="h-3 w-3" />
                                        </button>
                                        <span className="w-6 text-center font-mono font-bold text-xs text-white">
                                            {item.quantity}
                                        </span>
                                        <button
                                            onClick={() => updateQuantity(idx, 1)}
                                            className="h-6 w-6 rounded flex items-center justify-center hover:bg-neutral-800 text-neutral-300"
                                        >
                                            <Plus className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Financial Summary */}
                    <div className="p-4 border-t border-neutral-800 bg-neutral-950 space-y-2">
                        <div className="flex items-center justify-between text-xs text-neutral-400">
                            <span>{isRtl ? 'المجموع الخاضع للضريبة:' : 'Subtotal:'}</span>
                            <span className="font-mono">{cartSubtotal.toFixed(2)} SAR</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-neutral-400">
                            <span>{isRtl ? 'ضريبة القيمة المضافة (10%):' : 'VAT (10% Test Rate):'}</span>
                            <span className="font-mono">{cartTax.toFixed(2)} SAR</span>
                        </div>
                        <div className="flex items-center justify-between text-base font-bold text-white pt-2 border-t border-neutral-800">
                            <span>{isRtl ? 'المجموع الإجمالي:' : 'Total Due:'}</span>
                            <span className="font-mono text-xl text-emerald-400">{cartTotal.toFixed(2)} SAR</span>
                        </div>

                        {/* Payment Action Buttons */}
                        <div className="grid grid-cols-2 gap-2 pt-3">
                            <Button
                                disabled={cart.length === 0 || !activeSession}
                                onClick={() => handleInitiatePayment('cash')}
                                className="h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-2 text-sm shadow-md"
                            >
                                <Banknote className="h-5 w-5" />
                                <div className="text-start">
                                    <div>{isRtl ? 'دفع نقدي' : 'Cash Pay'}</div>
                                    <div className="text-[10px] font-normal opacity-80">{isRtl ? 'حساب الصندوق' : 'Cash Drawer'}</div>
                                </div>
                            </Button>

                            <Button
                                disabled={cart.length === 0 || !activeSession}
                                onClick={() => handleInitiatePayment('card')}
                                className="h-14 bg-indigo-600 hover:bg-indigo-500 text-white font-bold gap-2 text-sm shadow-md"
                            >
                                <CreditCard className="h-5 w-5" />
                                <div className="text-start">
                                    <div>{isRtl ? 'دفع بالبطاقة' : 'Card / Mada'}</div>
                                    <div className="text-[10px] font-normal opacity-80">{isRtl ? 'نقاط البيع مدى' : 'Terminal POS'}</div>
                                </div>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment & Cash Tender Modal */}
            {paymentModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl">
                        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                {paymentMethod === 'cash' ? <Banknote className="text-emerald-400" /> : <CreditCard className="text-indigo-400" />}
                                {paymentMethod === 'cash' ? (isRtl ? 'تسوية الدفع النقدي' : 'Cash Settlement') : (isRtl ? 'تسوية البطاقة / مدى' : 'Card / Mada Settlement')}
                            </h3>
                            <span className="text-xs font-mono bg-neutral-800 px-2 py-1 rounded text-neutral-300">
                                {cart.length} items
                            </span>
                        </div>

                        <div className="py-4 space-y-4">
                            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex justify-between items-center">
                                <span className="text-xs text-neutral-400">{isRtl ? 'المبلغ المطلوب سداده' : 'Total Amount Due'}</span>
                                <span className="text-2xl font-bold font-mono text-emerald-400">
                                    {cartTotal.toFixed(2)} SAR
                                </span>
                            </div>

                            {paymentMethod === 'cash' && (
                                <>
                                    <div>
                                        <label className="text-xs font-medium text-neutral-400">
                                            {isRtl ? 'المبلغ المستلم من العميل' : 'Cash Tendered'}
                                        </label>
                                        <Input
                                            type="number"
                                            step="any"
                                            value={cashTendered}
                                            onChange={(e) => setCashTendered(e.target.value)}
                                            className="mt-1 font-mono text-lg bg-neutral-950 text-white border-neutral-700"
                                        />
                                    </div>

                                    {/* Quick Amount Pills */}
                                    <div className="grid grid-cols-4 gap-2">
                                        {[cartTotal, 50, 100, 500].map((amt, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => setCashTendered(amt.toFixed(2))}
                                                className="py-1.5 text-xs font-mono rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700"
                                            >
                                                {amt === cartTotal ? (isRtl ? 'المضبوط' : 'Exact') : `+${amt}`}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex justify-between items-center">
                                        <span className="text-xs text-neutral-400">{isRtl ? 'المتبقي للعميل (الفكة)' : 'Change Due'}</span>
                                        <span className="text-xl font-bold font-mono text-amber-400">
                                            {changeDue.toFixed(2)} SAR
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-neutral-800">
                            <Button
                                variant="outline"
                                onClick={() => setPaymentModalOpen(false)}
                                className="flex-1 border-neutral-700 text-neutral-300"
                            >
                                {isRtl ? 'إلغاء' : 'Cancel'}
                            </Button>
                            <Button
                                disabled={isSubmitting || (paymentMethod === 'cash' && tenderedVal < cartTotal)}
                                onClick={handleCompleteSale}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                            >
                                {isSubmitting ? (isRtl ? 'جارٍ الترحيل...' : 'Processing...') : (isRtl ? 'تأكيد العملية وطباعة' : 'Confirm & Print')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Thermal Receipt & ZATCA QR Modal */}
            {receiptModalOpen && completedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
                    <div className="w-full max-w-sm rounded-2xl bg-white text-neutral-900 p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
                        {/* Receipt Header */}
                        <div className="text-center pb-3 border-b border-dashed border-neutral-300">
                            <h2 className="font-bold text-lg leading-tight">شركة الأمل للتجارة العامة</h2>
                            <p className="text-xs text-neutral-600">Al-Amal Commercial Trading LLC</p>
                            <p className="text-[11px] font-mono text-neutral-500 mt-1">الرقم الضريبي: 300123456700003</p>
                            <p className="text-[11px] font-mono text-neutral-500">فاتورة ضريبية مبسطة (POS Receipt)</p>
                        </div>

                        {/* Metadata */}
                        <div className="py-2 text-[11px] space-y-1 font-mono border-b border-dashed border-neutral-300 text-neutral-600">
                            <div className="flex justify-between">
                                <span>Receipt #:</span>
                                <span className="font-bold text-neutral-900">{completedOrder.receipt_number}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Date:</span>
                                <span>{new Date().toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Terminal:</span>
                                <span>{terminal.code}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Payment:</span>
                                <span className="uppercase">{completedOrder.payment_method}</span>
                            </div>
                        </div>

                        {/* Order Lines */}
                        <div className="py-2 space-y-1.5 border-b border-dashed border-neutral-300 text-xs">
                            {completedOrder.lines?.map((line: any) => (
                                <div key={line.id} className="flex justify-between items-center">
                                    <div className="flex-1 pe-2">
                                        <p className="font-medium text-neutral-900 leading-tight">{line.description}</p>
                                        <p className="text-[10px] font-mono text-neutral-500">
                                            {Number(line.quantity)} × {Number(line.unit_price).toFixed(2)}
                                        </p>
                                    </div>
                                    <span className="font-mono font-bold text-neutral-900">
                                        {Number(line.line_total).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Totals */}
                        <div className="py-2 space-y-1 text-xs font-mono border-b border-dashed border-neutral-300">
                            <div className="flex justify-between text-neutral-600">
                                <span>Subtotal (Excl. VAT):</span>
                                <span>{Number(completedOrder.subtotal).toFixed(2)} SAR</span>
                            </div>
                            <div className="flex justify-between text-neutral-600">
                                <span>VAT (10%):</span>
                                <span>{Number(completedOrder.tax_amount).toFixed(2)} SAR</span>
                            </div>
                            <div className="flex justify-between font-bold text-sm text-neutral-900 pt-1">
                                <span>Total (Incl. VAT):</span>
                                <span>{Number(completedOrder.total_amount).toFixed(2)} SAR</span>
                            </div>
                        </div>

                        {/* ZATCA Phase 1 & 2 Base64 QR Code */}
                        <div className="py-4 flex flex-col items-center justify-center text-center">
                            <div className="p-2 border border-neutral-300 rounded-lg bg-neutral-50 shadow-inner flex flex-col items-center">
                                <QrCode className="h-28 w-28 text-neutral-900" />
                                <span className="text-[9px] font-mono text-neutral-500 mt-1 max-w-[200px] truncate">
                                    ZATCA TLV: {completedOrder.qr_payload?.substring(0, 24)}...
                                </span>
                            </div>
                            <p className="text-[10px] text-neutral-500 mt-2 font-medium">
                                متوافق مع متطلبات الفوترة الإلكترونية (مرحلة الربط والتكامل)
                            </p>
                        </div>

                        {/* Modal Actions */}
                        <div className="mt-auto pt-3 border-t border-neutral-200 flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => window.print()}
                                className="flex-1 gap-1 text-xs border-neutral-300 text-neutral-700"
                            >
                                <Printer className="h-3.5 w-3.5" />
                                <span>{isRtl ? 'طباعة' : 'Print'}</span>
                            </Button>
                            <Button
                                onClick={() => {
                                    setReceiptModalOpen(false);
                                    setCompletedOrder(null);
                                }}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                            >
                                {isRtl ? 'عملية جديدة' : 'New Sale'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Open Shift Modal */}
            {openShiftModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                    <div className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl text-center">
                        <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                            <Store className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-bold text-white">
                            {isRtl ? 'افتتاح وردية بيع جديدة' : 'Open POS Shift'}
                        </h3>
                        <p className="text-xs text-neutral-400 mt-1">
                            {isRtl
                                ? 'يرجى تأكيد العهدة النقدية الافتتاحية في الصندوق لبدء البيع'
                                : 'Confirm opening cash float in the drawer to begin transactions'}
                        </p>

                        <form onSubmit={handleOpenShift} className="mt-5 space-y-4">
                            <div className="text-start">
                                <label className="text-xs font-medium text-neutral-400">
                                    {isRtl ? 'العهدة النقدية الافتتاحية (ر.س)' : 'Opening Cash Float (SAR)'}
                                </label>
                                <Input
                                    required
                                    type="number"
                                    step="any"
                                    value={openingCash}
                                    onChange={(e) => setOpeningCash(e.target.value)}
                                    className="mt-1 font-mono text-center text-lg bg-neutral-950 text-white border-neutral-700"
                                />
                            </div>

                            <div className="pt-2">
                                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11">
                                    {isRtl ? 'فتح الوردية وبدء العمل' : 'Open Shift & Begin Sales'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
