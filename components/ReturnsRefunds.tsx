

import React, { useState, useMemo, useEffect } from 'react';
import type { Store, PurchaseReturn, ReturnReason, ReturnStatus } from '../types';
import { ArrowPathRoundedSquareIcon } from './icons/Icons';

interface ReturnsRefundsProps {
  store: Store;
  addPurchaseReturn: (pr: Omit<PurchaseReturn, 'id' | 'date' | 'status'>) => void;
  logActivity: (action: string) => void;
  updateSaleReturnStatus: (id: string, status: ReturnStatus) => void;
  updatePurchaseReturnStatus: (id: string, status: ReturnStatus) => void;
}

const returnReasonLabels: Record<ReturnReason, string> = {
    defective: 'منتج تالف',
    wrong_item: 'منتج خاطئ',
    customer_dissatisfaction: 'عدم رضا العميل',
    other: 'أخرى'
};

const statusLabels: Record<ReturnStatus, string> = {
    pending: 'قيد الانتظار',
    received: 'تم الاستلام',
    processed: 'تمت المعالجة',
    refunded: 'تم الاسترداد',
    rejected: 'مرفوض'
};

const ReturnsRefunds: React.FC<ReturnsRefundsProps> = ({ store, addPurchaseReturn, logActivity, updateSaleReturnStatus, updatePurchaseReturnStatus }) => {
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

    useEffect(() => {
        if (prFormData.productId) {
            const product = store.products.find(p => p.id === prFormData.productId);
            if (product) {
                const calculatedAmount = product.costPrice * prFormData.quantity;
                setPrFormData(prev => ({
                    ...prev,
                    amountRefunded: calculatedAmount
                }));
            }
        }
    }, [prFormData.productId, prFormData.quantity, store.products]);

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

    const reasonStats = useMemo(() => {
        const stats: Record<string, number> = {};
        store.saleReturns.forEach(ret => {
            stats[ret.reason] = (stats[ret.reason] || 0) + 1;
        });
        return Object.entries(stats).map(([reason, count]) => ({ reason: returnReasonLabels[reason as ReturnReason], count }));
    }, [store.saleReturns]);

    const getStatusBadge = (status: ReturnStatus) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            received: 'bg-blue-100 text-blue-800',
            processed: 'bg-purple-100 text-purple-800',
            refunded: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
        };
        return <span className={`px-2 py-1 rounded text-xs font-semibold ${colors[status || 'pending']}`}>{statusLabels[status || 'pending']}</span>;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-3">
                <ArrowPathRoundedSquareIcon />
                <h1 className="text-3xl font-bold text-gray-800">إدارة المرتجعات</h1>
            </div>

            <div className="flex border-b overflow-x-auto">
                <button onClick={() => setActiveTab('salesReturns')} className={`px-4 py-2 whitespace-nowrap ${activeTab === 'salesReturns' ? 'border-b-2 border-indigo-600 font-bold text-indigo-600' : 'text-gray-500'}`}>مرتجعات المبيعات</button>
                <button onClick={() => setActiveTab('purchaseReturns')} className={`px-4 py-2 whitespace-nowrap ${activeTab === 'purchaseReturns' ? 'border-b-2 border-indigo-600 font-bold text-indigo-600' : 'text-gray-500'}`}>مرتجعات المشتريات</button>
                <button onClick={() => setActiveTab('reports')} className={`px-4 py-2 whitespace-nowrap ${activeTab === 'reports' ? 'border-b-2 border-indigo-600 font-bold text-indigo-600' : 'text-gray-500'}`}>تحليل المرتجعات</button>
            </div>

            {activeTab === 'salesReturns' && (
                <div className="bg-white p-6 rounded-xl shadow-lg">
                     <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">سجل مرتجعات المبيعات</h2>
                     <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-gray-50"><tr className="border-b"><th className="p-3">#</th><th className="p-3">التاريخ</th><th className="p-3">المنتج</th><th className="p-3">العميل</th><th className="p-3">الكمية</th><th className="p-3">المبلغ</th><th className="p-3">السبب</th><th className="p-3">الحالة</th><th className="p-3">تحديث الحالة</th></tr></thead>
                            <tbody>
                                {store.saleReturns.map(ret => (
                                    <tr key={ret.id} className="border-b hover:bg-gray-50 transition-colors">
                                        <td className="p-3 font-mono text-gray-500">{ret.originalSaleInvoiceId}</td>
                                        <td className="p-3">{new Date(ret.date).toLocaleDateString('ar-EG')}</td>
                                        <td className="p-3 font-medium">{getProductName(ret.productId)}</td>
                                        <td className="p-3">{getCustomerName(ret.customerId)}</td>
                                        <td className="p-3 font-bold">{ret.quantity}</td>
                                        <td className="p-3 text-red-600 font-semibold">{ret.amountReturned.toLocaleString()} ج.م</td>
                                        <td className="p-3"><span className="bg-gray-100 px-2 py-1 rounded text-xs">{returnReasonLabels[ret.reason]}</span></td>
                                        <td className="p-3">{getStatusBadge(ret.status)}</td>
                                        <td className="p-3">
                                            <select 
                                                value={ret.status || 'pending'} 
                                                onChange={(e) => updateSaleReturnStatus(ret.id, e.target.value as ReturnStatus)}
                                                className="p-1 border rounded text-xs bg-white focus:ring-1 focus:ring-indigo-500"
                                            >
                                                {Object.entries(statusLabels).map(([key, label]) => (
                                                    <option key={key} value={key}>{label}</option>
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                                {store.saleReturns.length === 0 && <tr><td colSpan={9} className="text-center p-8 text-gray-500">لا توجد مرتجعات مبيعات مسجلة.</td></tr>}
                            </tbody>
                        </table>
                     </div>
                </div>
            )}
             {activeTab === 'purchaseReturns' && (
                <div className="space-y-4">
                     <div className="flex justify-end">
                        <button onClick={() => setShowPRForm(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"><span>+</span> إنشاء مرتجع شراء</button>
                     </div>
                     <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">سجل مرتجعات المشتريات</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-sm">
                            <thead className="bg-gray-50"><tr className="border-b"><th className="p-3">التاريخ</th><th className="p-3">المورد</th><th className="p-3">المنتج</th><th className="p-3">الكمية</th><th className="p-3">المبلغ</th><th className="p-3">السبب</th><th className="p-3">الحالة</th><th className="p-3">تحديث الحالة</th></tr></thead>
                                <tbody>
                                    {store.purchaseReturns.map(ret => (
                                        <tr key={ret.id} className="border-b hover:bg-gray-50 transition-colors">
                                            <td className="p-3">{new Date(ret.date).toLocaleDateString('ar-EG')}</td>
                                            <td className="p-3 font-medium">{getSupplierName(ret.supplierId)}</td>
                                            <td className="p-3">{getProductName(ret.productId)}</td>
                                            <td className="p-3 font-bold">{ret.quantity}</td>
                                            <td className="p-3 text-green-600 font-semibold">{ret.amountRefunded.toLocaleString()} ج.م</td>
                                            <td className="p-3"><span className="bg-gray-100 px-2 py-1 rounded text-xs">{returnReasonLabels[ret.reason]}</span></td>
                                            <td className="p-3">{getStatusBadge(ret.status)}</td>
                                            <td className="p-3">
                                                <select 
                                                    value={ret.status || 'pending'} 
                                                    onChange={(e) => updatePurchaseReturnStatus(ret.id, e.target.value as ReturnStatus)}
                                                    className="p-1 border rounded text-xs bg-white focus:ring-1 focus:ring-indigo-500"
                                                >
                                                    {Object.entries(statusLabels).map(([key, label]) => (
                                                        <option key={key} value={key}>{label}</option>
                                                    ))}
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                    {store.purchaseReturns.length === 0 && <tr><td colSpan={8} className="text-center p-8 text-gray-500">لا توجد مرتجعات مشتريات مسجلة.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
             {activeTab === 'reports' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-bold mb-4 text-gray-700">أسباب المرتجعات الشائعة</h2>
                        <div className="space-y-3">
                            {reasonStats.map(stat => (
                                <div key={stat.reason} className="flex items-center justify-between p-2 border-b last:border-0">
                                    <span className="font-medium text-gray-600">{stat.reason}</span>
                                    <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-bold">{stat.count}</span>
                                </div>
                            ))}
                            {reasonStats.length === 0 && <p className="text-gray-500 text-center">لا توجد بيانات كافية.</p>}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-bold mb-4 text-gray-700">أكثر المنتجات المرتجعة</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-sm">
                            <thead className="bg-gray-50"><tr className="border-b"><th className="p-2">المنتج</th><th className="p-2">عدد المرات</th><th className="p-2">الكمية</th></tr></thead>
                            <tbody>
                                    {productReturnStats.slice(0, 5).map(stat => (
                                        <tr key={stat.name} className="border-b hover:bg-gray-50">
                                            <td className="p-2 font-medium">{stat.name}</td>
                                            <td className="p-2">{stat.count}</td>
                                            <td className="p-2 font-bold text-red-500">{stat.totalQuantity}</td>
                                        </tr>
                                    ))}
                                    {productReturnStats.length === 0 && <tr><td colSpan={3} className="text-center p-4 text-gray-500">لا توجد بيانات.</td></tr>}
                            </tbody>
                            </table>
                        </div>
                    </div>
                     
                     <div className="bg-white p-6 rounded-xl shadow-lg lg:col-span-2">
                        <h2 className="text-xl font-bold mb-4 text-gray-700">أكثر العملاء إرجاعاً</h2>
                         <div className="overflow-x-auto">
                            <table className="w-full text-right text-sm">
                            <thead className="bg-gray-50"><tr className="border-b"><th className="p-2">العميل</th><th className="p-2">عدد المرات</th><th className="p-2">القيمة الإجمالية</th></tr></thead>
                            <tbody>
                                    {customerReturnStats.slice(0, 5).map(stat => (
                                        <tr key={stat.name} className="border-b hover:bg-gray-50">
                                            <td className="p-2 font-medium">{stat.name}</td>
                                            <td className="p-2">{stat.count}</td>
                                            <td className="p-2 font-bold text-indigo-600">{stat.totalValue.toLocaleString()} ج.م</td>
                                        </tr>
                                    ))}
                                     {customerReturnStats.length === 0 && <tr><td colSpan={3} className="text-center p-4 text-gray-500">لا توجد بيانات.</td></tr>}
                            </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
            
            {showPRForm && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 backdrop-blur-sm p-4">
                    <form onSubmit={handlePRSubmit} className="bg-white p-6 rounded-xl w-full max-w-lg space-y-4 shadow-2xl">
                        <div className="flex justify-between items-center border-b pb-3">
                            <h3 className="font-bold text-xl text-gray-800">مرتجع شراء جديد</h3>
                            <button type="button" onClick={() => setShowPRForm(false)} className="text-gray-400 hover:text-red-500 text-2xl">&times;</button>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">المورد</label>
                            <select value={prFormData.supplierId} onChange={e => setPrFormData(f => ({...f, supplierId: e.target.value, productId: '', amountRefunded: 0}))} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" required><option value="">اختر المورد...</option>{store.suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">المنتج</label>
                            <select value={prFormData.productId} onChange={e => setPrFormData(f => ({...f, productId: e.target.value}))} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" required disabled={!prFormData.supplierId}><option value="">اختر المنتج...</option>{store.products.filter(p => p.supplierId === prFormData.supplierId).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">الكمية</label>
                                <input type="number" value={prFormData.quantity} onChange={e => setPrFormData(f => ({...f, quantity: parseInt(e.target.value) || 0}))} min="1" placeholder="الكمية" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ المسترد</label>
                                <input type="number" value={prFormData.amountRefunded} onChange={e => setPrFormData(f => ({...f, amountRefunded: parseFloat(e.target.value) || 0}))} placeholder="المبلغ المسترد" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                                <p className="text-[10px] text-gray-400 mt-1">يتم احتسابه تلقائيًا (التكلفة × الكمية)</p>
                            </div>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">السبب</label>
                            <select value={prFormData.reason} onChange={e => setPrFormData(f => ({...f, reason: e.target.value as ReturnReason}))} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"><option value="defective">تالف</option><option value="wrong_item">خاطئ</option><option value="other">أخرى</option></select>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition font-bold">حفظ</button>
                            <button type="button" onClick={() => setShowPRForm(false)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition font-bold">إلغاء</button>
                        </div>
                    </form>
                 </div>
            )}
        </div>
    );
};

export default ReturnsRefunds;