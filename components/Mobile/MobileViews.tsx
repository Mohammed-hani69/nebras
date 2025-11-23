
import React, { useState, useMemo, useEffect } from 'react';
import type { Store, Product, Sale, AISettings, ModuleDefinition, Customer, PaymentMethod, SaleReturn, Invoice } from '../../types';
import { 
    BanknotesIcon, ArrowTrendingUpIcon, ShoppingCartIcon, PlusIcon, LogoutIcon,
    UsersIcon, CheckCircleIcon
} from '../icons/Icons';
import { getAiInsight } from '../../services/geminiService';
import InvoiceViewer from '../InvoiceViewer';

export const MobileDashboard = ({ store, aiSettings }: { store: Store, aiSettings: AISettings }) => {
    const [aiQuery, setAiQuery] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    
    const totalSales = store.sales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
    const totalExpenses = store.expenses.reduce((acc, e) => acc + e.amount, 0);
    const netProfit = totalSales - totalExpenses;

    return (
        <div className="p-4 space-y-4 animate-fade-in-up pb-24">
            <div className="bg-indigo-600 text-white rounded-2xl p-6 shadow-lg">
                <p className="text-indigo-100 text-sm mb-1">صافي الربح</p>
                <h2 className="text-4xl font-bold">{netProfit.toLocaleString()} <span className="text-lg font-normal">ج.م</span></h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                    <div className="text-green-600 mb-2 flex justify-center"><BanknotesIcon /></div>
                    <p className="text-gray-500 text-xs">المبيعات</p>
                    <p className="text-lg font-bold text-gray-800">{totalSales.toLocaleString()}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                    <div className="text-red-500 mb-2 flex justify-center"><ArrowTrendingUpIcon /></div>
                    <p className="text-gray-500 text-xs">المصروفات</p>
                    <p className="text-lg font-bold text-gray-800">{totalExpenses.toLocaleString()}</p>
                </div>
            </div>
             <div className="bg-white p-4 rounded-xl shadow-sm border border-purple-100">
                <h3 className="font-bold text-purple-800 mb-2 text-sm">المساعد الذكي السريع</h3>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="اسأل عن مبيعاتك..."
                        value={aiQuery}
                        onChange={e => setAiQuery(e.target.value)}
                        className="flex-1 bg-gray-50 border rounded-lg px-3 py-2 text-sm"
                    />
                    <button 
                        onClick={async () => { const res = await getAiInsight(aiQuery, store, aiSettings); setAiResponse(res); }}
                        className="bg-purple-600 text-white p-2 rounded-lg"
                    >
                        <ArrowTrendingUpIcon />
                    </button>
                </div>
                {aiResponse && <p className="mt-3 text-xs text-gray-700 bg-purple-50 p-2 rounded leading-relaxed">{aiResponse}</p>}
            </div>
        </div>
    );
};

export const MobilePOS = ({ store, handlers, customers, sales, taxRate, saleReturns, invoices }: { store: Store, handlers: any, customers: Customer[], sales: Sale[], taxRate: number, saleReturns: SaleReturn[], invoices: Invoice[] }) => {
    const [cart, setCart] = useState<{product: Product, qty: number}[]>([]);
    const [activeTab, setActiveTab] = useState<'sell' | 'cart' | 'history'>('sell');
    const [searchTerm, setSearchTerm] = useState('');
    
    const [customerId, setCustomerId] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
    const [amountPaid, setAmountPaid] = useState<number>(0);
    const [installmentConfig, setInstallmentConfig] = useState({ downPayment: 0, numberOfInstallments: 3, interestRate: 10 });
    
    const [showNewCustomer, setShowNewCustomer] = useState(false);
    const [newCustomerData, setNewCustomerData] = useState({ name: '', phone: '' });
    const [returnModalData, setReturnModalData] = useState<Sale | null>(null);
    const [returnQuantity, setReturnQuantity] = useState(1);
    const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(i => i.product.id === product.id);
            if (existing) return prev.map(i => i.product.id === product.id ? {...i, qty: i.qty + 1} : i);
            return [...prev, { product, qty: 1 }];
        });
    };

    const subtotal = cart.reduce((sum, item) => sum + (item.product.sellPrice * item.qty), 0);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    useEffect(() => {
        if (paymentMethod !== 'installment') setAmountPaid(total);
        else setAmountPaid(0);
    }, [total, paymentMethod]);

    const handleCheckout = () => {
        if (cart.length === 0) return;
        
        // Use consolidated handler
        handlers.handleAddTransaction({
            items: cart.map(c => ({ productId: c.product.id, quantity: c.qty, unitPrice: c.product.sellPrice, productName: c.product.name })),
            customerId,
            paymentMethod,
            amountPaid: paymentMethod === 'installment' ? installmentConfig.downPayment : amountPaid,
            remainingBalance: paymentMethod === 'installment' ? (total - installmentConfig.downPayment) : (total - amountPaid),
            isFullyPaid: paymentMethod !== 'installment' && amountPaid >= total,
            installmentDetails: paymentMethod === 'installment' ? installmentConfig : undefined,
            totalAmount: total
        });

        setCart([]);
        setCustomerId(null);
        setPaymentMethod('cash');
        setActiveTab('history');
        alert('تمت العملية بنجاح!');
    };

     const handleAddCustomer = () => {
        const newC = handlers.addCustomer(newCustomerData);
        setCustomerId(newC.id);
        setShowNewCustomer(false);
    }

    const filteredProducts = store.products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="h-full flex flex-col pb-20 bg-gray-50 relative">
            <div className="flex bg-white border-b sticky top-0 z-20">
                <button onClick={() => setActiveTab('sell')} className={`flex-1 py-3 text-sm font-bold border-b-2 ${activeTab === 'sell' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}>المنتجات</button>
                <button onClick={() => setActiveTab('cart')} className={`flex-1 py-3 text-sm font-bold border-b-2 relative ${activeTab === 'cart' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}>
                    السلة
                    {cart.length > 0 && <span className="absolute top-2 left-1/4 bg-red-500 text-white text-[10px] px-1.5 rounded-full">{cart.length}</span>}
                </button>
                <button onClick={() => setActiveTab('history')} className={`flex-1 py-3 text-sm font-bold border-b-2 ${activeTab === 'history' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}>السجل</button>
            </div>

            {activeTab === 'sell' && (
                <>
                    <div className="p-3 bg-white shadow-sm">
                        <input type="text" placeholder="بحث..." className="w-full bg-gray-100 border-none rounded-xl px-4 py-3 text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="flex-1 p-3 overflow-y-auto">
                        <div className="grid grid-cols-2 gap-3">
                            {filteredProducts.map(p => (
                                <div key={p.id} onClick={() => addToCart(p)} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 active:scale-95 transition-transform">
                                    <div className="h-24 bg-gray-100 rounded-lg mb-2 flex items-center justify-center text-2xl">📱</div>
                                    <h4 className="font-bold text-gray-800 text-sm truncate">{p.name}</h4>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="text-indigo-600 font-bold">{p.sellPrice.toLocaleString()}</span>
                                        <span className="text-xs text-gray-400">{p.initialQuantity}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'cart' && (
                <div className="flex-1 p-4 overflow-y-auto flex flex-col">
                    {cart.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400"><ShoppingCartIcon /><p className="mt-2">السلة فارغة</p></div>
                    ) : (
                        <>
                            <div className="space-y-3 mb-6">
                                {cart.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
                                        <div><p className="font-bold text-sm">{item.product.name}</p><p className="text-xs text-gray-500">{item.qty} x {item.product.sellPrice}</p></div>
                                        <div className="flex items-center gap-3"><span className="font-bold">{(item.qty * item.product.sellPrice).toLocaleString()}</span><button onClick={() => setCart(prev => prev.filter((_, i) => i !== idx))} className="text-red-500 text-xs">حذف</button></div>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">العميل</label>
                                    <div className="flex gap-2">
                                        <select className="flex-1 p-2 bg-gray-50 rounded border text-sm" value={customerId || ''} onChange={e => setCustomerId(e.target.value || null)}>
                                            <option value="">عميل عام</option>
                                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                        <button onClick={() => setShowNewCustomer(true)} className="bg-blue-100 text-blue-600 p-2 rounded"><PlusIcon /></button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">طريقة الدفع</label>
                                    <div className="flex gap-2">
                                        {['cash', 'card', 'installment'].map(m => (
                                            <button key={m} onClick={() => setPaymentMethod(m as PaymentMethod)} className={`flex-1 py-2 rounded text-xs font-bold border ${paymentMethod === m ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600'}`}>
                                                {m === 'cash' ? 'نقدي' : m === 'card' ? 'شبكة' : 'تقسيط'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {paymentMethod === 'installment' && (
                                    <div className="bg-yellow-50 p-3 rounded border border-yellow-100 space-y-2">
                                        <div className="flex gap-2">
                                            <div className="flex-1"><label className="text-[10px]">المقدم</label><input type="number" value={installmentConfig.downPayment} onChange={e=>setInstallmentConfig({...installmentConfig, downPayment: Number(e.target.value)})} className="w-full p-1 text-sm rounded border"/></div>
                                            <div className="flex-1"><label className="text-[10px]">الأقساط</label><input type="number" value={installmentConfig.numberOfInstallments} onChange={e=>setInstallmentConfig({...installmentConfig, numberOfInstallments: Number(e.target.value)})} className="w-full p-1 text-sm rounded border"/></div>
                                        </div>
                                    </div>
                                )}
                                <div className="border-t pt-3 space-y-1 text-sm">
                                    <div className="flex justify-between"><span>المجموع</span><span>{subtotal.toLocaleString()}</span></div>
                                    <div className="flex justify-between"><span>الضريبة ({taxRate}%)</span><span>{taxAmount.toLocaleString()}</span></div>
                                    <div className="flex justify-between text-lg font-bold text-indigo-700"><span>الإجمالي</span><span>{total.toLocaleString()}</span></div>
                                </div>
                                <button onClick={handleCheckout} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold shadow-lg">إتمام عملية البيع</button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {activeTab === 'history' && (
                <div className="flex-1 p-4 overflow-y-auto">
                    {/* Simple grouped view by Invoice ID */}
                    {[...invoices].reverse().map(inv => (
                         <div key={inv.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-3">
                            <div className="flex justify-between mb-2">
                                <span className="font-bold text-gray-800 text-xs">{inv.id}</span>
                                <span className="text-[10px] text-gray-400">{new Date(inv.date).toLocaleDateString('ar-EG')}</span>
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                                {inv.items.length} أصناف - {inv.customerName}
                            </div>
                            <div className="flex justify-between items-center border-t pt-2">
                                <p className="font-bold text-indigo-600">{inv.total.toLocaleString()} ج.م</p>
                                <button onClick={() => setViewingInvoice(inv)} className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded">عرض</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {viewingInvoice && <InvoiceViewer document={viewingInvoice} type="invoice" store={store} onClose={() => setViewingInvoice(null)} />}
            
             {showNewCustomer && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-5 w-full max-w-sm">
                        <h3 className="font-bold text-lg mb-4">عميل جديد</h3>
                        <input type="text" placeholder="الاسم" value={newCustomerData.name} onChange={e=>setNewCustomerData({...newCustomerData, name: e.target.value})} className="w-full p-2 border rounded mb-3"/>
                        <input type="text" placeholder="الهاتف" value={newCustomerData.phone} onChange={e=>setNewCustomerData({...newCustomerData, phone: e.target.value})} className="w-full p-2 border rounded mb-4"/>
                        <div className="flex gap-2">
                            <button onClick={handleAddCustomer} className="flex-1 bg-indigo-600 text-white py-2 rounded">حفظ</button>
                            <button onClick={() => setShowNewCustomer(false)} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded">إلغاء</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export const MobileInventory = ({ store, handlers }: { store: Store, handlers: any }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [newProd, setNewProd] = useState({ name: '', sellPrice: 0, costPrice: 0, initialQuantity: 0, category: 'موبايل', supplierId: '' });
    
    return (
        <div className="p-4 pb-24">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">المخزون</h2>
                <button onClick={() => setIsFormOpen(true)} className="bg-indigo-100 text-indigo-600 p-2 rounded-lg"><PlusIcon /></button>
            </div>
            <div className="space-y-3">
                {store.products.map(p => (
                    <div key={p.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                        <div><h4 className="font-bold text-gray-800">{p.name}</h4><p className="text-xs text-gray-500 mt-1">الكمية: {p.initialQuantity}</p></div>
                        <div className="text-right"><p className="text-indigo-600 font-bold">{p.sellPrice}</p><span className="text-[10px] bg-gray-100 px-2 py-1 rounded text-gray-500">{p.category}</span></div>
                    </div>
                ))}
            </div>
            {isFormOpen && (
                <div className="fixed inset-0 bg-white z-50 p-5 overflow-y-auto">
                    <h3 className="text-xl font-bold mb-6">إضافة منتج</h3>
                    <form onSubmit={(e) => { e.preventDefault(); handlers.addProduct(newProd); setIsFormOpen(false); }} className="space-y-4">
                        <input type="text" placeholder="اسم المنتج" className="w-full p-3 bg-gray-50 rounded-xl" value={newProd.name} onChange={e=>setNewProd({...newProd, name: e.target.value})} required/>
                        <div className="flex gap-3">
                            <input type="number" placeholder="بيع" className="w-full p-3 bg-gray-50 rounded-xl" value={newProd.sellPrice} onChange={e=>setNewProd({...newProd, sellPrice: parseFloat(e.target.value)})} required/>
                            <input type="number" placeholder="تكلفة" className="w-full p-3 bg-gray-50 rounded-xl" value={newProd.costPrice} onChange={e=>setNewProd({...newProd, costPrice: parseFloat(e.target.value)})} required/>
                        </div>
                        <input type="number" placeholder="الكمية" className="w-full p-3 bg-gray-50 rounded-xl" value={newProd.initialQuantity} onChange={e=>setNewProd({...newProd, initialQuantity: parseFloat(e.target.value)})} required/>
                        <select className="w-full p-3 bg-gray-50 rounded-xl" value={newProd.supplierId} onChange={e=>setNewProd({...newProd, supplierId: e.target.value})} required><option value="">المورد</option>{store.suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                        <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl">حفظ</button>
                        <button type="button" onClick={()=>setIsFormOpen(false)} className="w-full bg-gray-200 text-gray-800 py-3 rounded-xl">إلغاء</button>
                    </form>
                </div>
            )}
        </div>
    );
};

export const MobileGenericList = ({ title, data, type, handlers }: { title: string, data: any[], type: 'employee' | 'customer', handlers: any }) => (
    <div className="p-4 pb-24">
        <h2 className="text-xl font-bold text-gray-800 mb-4">{title}</h2>
        <div className="space-y-3">
            {data.map((item: any) => (
                <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between"><h4 className="font-bold text-gray-800">{item.name || item.fullName}</h4>{type === 'customer' && <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">{item.loyaltyPoints} pts</span>}</div>
                    <p className="text-sm text-gray-500 mt-1">{item.phone}</p>
                </div>
            ))}
        </div>
    </div>
);

export const MobileNotifications = ({ store, handlers }: { store: Store, handlers: any }) => (
    <div className="p-4 pb-24">
        <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold text-gray-800">الإشعارات</h2><button onClick={handlers.markAllAsRead} className="text-xs text-indigo-600">تحديد الكل كمقروء</button></div>
        <div className="space-y-3">
            {store.notifications.map(n => (
                <div key={n.id} className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 ${!n.read ? 'border-r-4 border-r-indigo-500' : ''}`}>
                    <div className="flex justify-between items-start"><h4 className={`font-bold text-sm ${!n.read ? 'text-gray-900' : 'text-gray-500'}`}>{n.title}</h4><span className="text-[10px] text-gray-400">{new Date(n.timestamp).toLocaleDateString('ar-EG')}</span></div>
                    <p className="text-xs text-gray-600 mt-1">{n.message}</p>
                </div>
            ))}
        </div>
    </div>
);

export const MobileMenu = ({ modules, activeView, setActiveView, onLogout, user }: { modules: ModuleDefinition[], activeView: string, setActiveView: (v:string)=>void, onLogout: ()=>void, user: any }) => {
    const menuItems = modules.filter(m => !['dashboard', 'pos', 'inventory', 'customer-management'].includes(m.id));
    return (
        <div className="p-4 pb-24 animate-fade-in-up">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg border border-indigo-200">{user.username.charAt(0).toUpperCase()}</div>
                <div><h3 className="font-bold text-gray-800">{user.fullName}</h3><p className="text-xs text-gray-500">{user.role || 'User'}</p></div>
            </div>
            <h3 className="font-bold text-gray-500 text-sm mb-3 uppercase tracking-wider">التطبيقات</h3>
            <div className="grid grid-cols-3 gap-3 mb-6">
                {menuItems.map(m => (
                    <button key={m.id} onClick={() => setActiveView(m.id)} className={`bg-white p-3 rounded-xl border border-gray-200 flex flex-col items-center justify-center h-24 active:bg-gray-50 transition ${activeView === m.id ? 'ring-2 ring-indigo-500' : ''}`}>
                        <span className="text-2xl mb-2 text-indigo-500">⚡</span>
                        <span className="text-[10px] font-bold text-center leading-tight text-gray-700 line-clamp-2">{m.label}</span>
                    </button>
                ))}
            </div>
            <button onClick={onLogout} className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2 border border-red-100 active:bg-red-100"><LogoutIcon /> تسجيل الخروج</button>
        </div>
    );
};
