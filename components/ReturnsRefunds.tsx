import React, { useState, useMemo } from 'react';
import type { Store, PurchaseReturn, ReturnReason } from '../types';

interface ReturnsRefundsProps {
  store: Store;
  addPurchaseReturn: (pr: Omit<PurchaseReturn, 'id' | 'date'>) => void;
  logActivity: (action: string) => void;
}

const returnReasonLabels: Record<ReturnReason, string> = {
    defective: 'منتج تالف',
    wrong_item: 'منتج خاطئ',
    customer_dissatisfaction: 'عدم رضا العميل',
    other: 'أخرى'
};

const ReturnsRefunds: React.FC<ReturnsRefundsProps> = ({ store, addPurchaseReturn, logActivity }) => {
    const [activeTab, setActiveTab] = useState('salesReturns');
    const [showPRForm, setShowPRForm] = useState(false);
    const [prFormData, setPrFormData] = useState({
        supplierId: '',
        productId: '',
        quantity: 1,
        amountRefunded: 0,
        reason: 'defective' as ReturnReason,
        notes: ''
    });

    const getProductName = (id: string) => store.products.find(p => p.id === id)?.name || 'غير معروف';
    const getCustomerName = (id: string | null) => id ? store.customers.find(c => c.id === id)?.name : 'عميل عام';
    const getSupplierName = (id: string) => store.suppliers.find(s => s.id === id)?.name || 'غير معروف';

    const handlePRSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(prFormData.supplierId && prFormData.productId && prFormData.quantity > 0) {
            addPurchaseReturn(prFormData);
            setShowPRForm(false);
            setPrFormData({ supplierId: '', productId: '', quantity: 1, amountRefunded: 0, reason: 'defective', notes: ''});
        } else {
            alert('الرجاء تعبئة الحقول المطلوبة.');
        }
    };
    
    const productReturnStats = useMemo(() => {
        const stats: Record<string, { name: string; count: number; totalQuantity: number }> = {};
        store.saleReturns.forEach(ret => {
            if(!stats[ret.productId]) {
                stats[ret.productId] = { name: getProductName(ret.productId), count: 0, totalQuantity: 0 };
            }
            stats[ret.productId].count += 1;
            stats[ret.productId].totalQuantity += ret.quantity;
        });
        return Object.values(stats).sort((a,b) => b.count - a.count);
    }, [store.saleReturns, store.products]);
    
    const customerReturnStats = useMemo(() => {
        const stats: Record<string, { name: string; count: number; totalValue: number }> = {};
        store.saleReturns.forEach(ret => {
            const custId = ret.customerId || 'general';
            if(!stats[custId]) {
                stats[custId] = { name: getCustomerName(ret.customerId), count: 0, totalValue: 0 };
            }
            stats[custId].count += 1;
            stats[custId].totalValue += ret.amountReturned;
        });
        return Object.values(stats).sort((a,b) => b.count - a.count);
    }, [store.saleReturns, store.customers]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">إدارة المرتجعات</h1>

            <div className="flex border-b">
                <button onClick={() => setActiveTab('salesReturns')} className={`px-4 py-2 ${activeTab === 'salesReturns' ? 'border-b-2 border-indigo-600 font-bold text-indigo-600' : 'text-gray-500'}`}>مرتجعات المبيعات</button>
                <button onClick={() => setActiveTab('purchaseReturns')} className={`px-4 py-2 ${activeTab === 'purchaseReturns' ? 'border-b-2 border-indigo-600 font-bold text-indigo-600' : 'text-gray-500'}`}>مرتجعات المشتريات</button>
                <button onClick={() => setActiveTab('reports')} className={`px-4 py-2 ${activeTab === 'reports' ? 'border-b-2 border-indigo-600 font-bold text-indigo-600' : 'text-gray-500'}`}>تقارير</button>
            </div>

            {activeTab === 'salesReturns' && (
                <div className="bg-white p-6 rounded-xl shadow-lg">
                     <h2 className="text-xl font-bold mb-4">سجل مرتجعات المبيعات</h2>
                     <table className="w-full text-right">
                        <thead><tr className="border-b"><th className="p-2">#</th><th className="p-2">التاريخ</th><th className="p-2">المنتج</th><th className="p-2">العميل</th><th className="p-2">الكمية</th><th className="p-2">المبلغ</th><th className="p-2">السبب</th></tr></thead>
                        <tbody>
                            {store.saleReturns.map(ret => (
                                <tr key={ret.id} className="border-b hover:bg-gray-50">
                                    <td className="p-2">{ret.originalSaleInvoiceId}</td>
                                    <td className="p-2">{new Date(ret.date).toLocaleDateString()}</td>
                                    <td className="p-2">{getProductName(ret.productId)}</td>
                                    <td className="p-2">{getCustomerName(ret.customerId)}</td>
                                    <td className="p-2">{ret.quantity}</td>
                                    <td className="p-2">{ret.amountReturned.toLocaleString()} ج.م</td>
                                    <td className="p-2">{returnReasonLabels[ret.reason]}</td>
                                </tr>
                            ))}
                        </tbody>
                     </table>
                </div>
            )}
             {activeTab === 'purchaseReturns' && (
                <div className="space-y-4">
                     <button onClick={() => setShowPRForm(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg">إنشاء مرتجع شراء</button>
                     <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-bold mb-4">سجل مرتجعات المشتريات</h2>
                        <table className="w-full text-right">
                           <thead><tr className="border-b"><th className="p-2">التاريخ</th><th className="p-2">المورد</th><th className="p-2">المنتج</th><th className="p-2">الكمية</th><th className="p-2">المبلغ</th><th className="p-2">السبب</th></tr></thead>
                            <tbody>
                                {store.purchaseReturns.map(ret => (
                                    <tr key={ret.id} className="border-b hover:bg-gray-50">
                                        <td className="p-2">{new Date(ret.date).toLocaleDateString()}</td>
                                        <td className="p-2">{getSupplierName(ret.supplierId)}</td>
                                        <td className="p-2">{getProductName(ret.productId)}</td>
                                        <td className="p-2">{ret.quantity}</td>
                                        <td className="p-2">{ret.amountRefunded.toLocaleString()} ج.م</td>
                                        <td className="p-2">{returnReasonLabels[ret.reason]}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
             {activeTab === 'reports' && (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-bold mb-4">تقرير المرتجعات حسب المنتج</h2>
                        <table className="w-full text-right">
                           <thead><tr className="border-b"><th className="p-2">المنتج</th><th className="p-2">عدد مرات الإرجاع</th><th className="p-2">إجمالي الكمية المرتجعة</th></tr></thead>
                           <tbody>
                                {productReturnStats.map(stat => (
                                    <tr key={stat.name} className="border-b hover:bg-gray-50">
                                        <td className="p-2 font-medium">{stat.name}</td>
                                        <td className="p-2">{stat.count}</td>
                                        <td className="p-2">{stat.totalQuantity}</td>
                                    </tr>
                                ))}
                           </tbody>
                        </table>
                    </div>
                     <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-bold mb-4">تقرير المرتجعات حسب العميل</h2>
                         <table className="w-full text-right">
                           <thead><tr className="border-b"><th className="p-2">العميل</th><th className="p-2">عدد مرات الإرجاع</th><th className="p-2">إجمالي قيمة المرتجعات</th></tr></thead>
                           <tbody>
                                {customerReturnStats.map(stat => (
                                    <tr key={stat.name} className="border-b hover:bg-gray-50">
                                        <td className="p-2 font-medium">{stat.name}</td>
                                        <td className="p-2">{stat.count}</td>
                                        <td className="p-2">{stat.totalValue.toLocaleString()} ج.م</td>
                                    </tr>
                                ))}
                           </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {showPRForm && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <form onSubmit={handlePRSubmit} className="bg-white p-6 rounded-lg w-full max-w-lg space-y-3">
                        <h3 className="font-bold text-lg">مرتجع شراء جديد</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">المورد</label>
                            <select value={prFormData.supplierId} onChange={e => setPrFormData(f => ({...f, supplierId: e.target.value, productId: ''}))} className="w-full p-2 border rounded" required><option value="">اختر المورد...</option>{store.suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">المنتج</label>
                            <select value={prFormData.productId} onChange={e => setPrFormData(f => ({...f, productId: e.target.value}))} className="w-full p-2 border rounded" required disabled={!prFormData.supplierId}><option value="">اختر المنتج...</option>{store.products.filter(p => p.supplierId === prFormData.supplierId).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">الكمية</label>
                            <input type="number" value={prFormData.quantity} onChange={e => setPrFormData(f => ({...f, quantity: parseInt(e.target.value)}))} min="1" placeholder="الكمية" className="w-full p-2 border rounded" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ المسترد</label>
                            <input type="number" value={prFormData.amountRefunded} onChange={e => setPrFormData(f => ({...f, amountRefunded: parseFloat(e.target.value)}))} placeholder="المبلغ المسترد" className="w-full p-2 border rounded" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">السبب</label>
                            <select value={prFormData.reason} onChange={e => setPrFormData(f => ({...f, reason: e.target.value as ReturnReason}))} className="w-full p-2 border rounded"><option value="defective">تالف</option><option value="wrong_item">خاطئ</option><option value="other">أخرى</option></select>
                        </div>
                        <div className="flex gap-2"><button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">حفظ</button><button type="button" onClick={() => setShowPRForm(false)} className="bg-gray-400 text-white px-4 py-2 rounded">إلغاء</button></div>
                    </form>
                 </div>
            )}
        </div>
    );
};

export default ReturnsRefunds;