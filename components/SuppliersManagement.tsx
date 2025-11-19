
import React, { useState, useMemo } from 'react';
import type { Supplier, PurchaseOrder, Product, Sale, PaymentMethod } from '../types';

interface SuppliersManagementProps {
    suppliers: Supplier[];
    products: Product[];
    sales: Sale[];
    purchaseOrders: PurchaseOrder[];
    addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
    updateSupplier: (supplier: Supplier) => void;
    addPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'payments' | 'status'>) => void;
    addPurchaseOrderPayment: (purchaseOrderId: string, payment: { amount: number, date: string, paymentMethod: PaymentMethod }) => void;
    updatePurchaseOrderStatus: (purchaseOrderId: string, status: 'pending' | 'received') => void;
    logActivity: (action: string) => void;
}

const SuppliersManagement: React.FC<SuppliersManagementProps> = ({ suppliers, products, sales, purchaseOrders, addSupplier, updateSupplier, addPurchaseOrder, addPurchaseOrderPayment, updatePurchaseOrderStatus, logActivity }) => {
    const [activeTab, setActiveTab] = useState('suppliers');
    const [showSupplierForm, setShowSupplierForm] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [supplierFormData, setSupplierFormData] = useState({ name: '', contactPerson: '', phone: '', email: '', address: '' });
    
    const [showPOForm, setShowPOForm] = useState(false);
    const [poFormData, setPoFormData] = useState<{ supplierId: string, items: { productId: string, quantity: number, costPrice: number }[] }>({ supplierId: '', items: [{ productId: '', quantity: 1, costPrice: 0 }] });

    const [paymentModalData, setPaymentModalData] = useState<{ poId: string, total: number, paid: number } | null>(null);
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');

    const [selectedReportSupplier, setSelectedReportSupplier] = useState<string>('');

    // Handlers for Suppliers
    const handleOpenSupplierForm = (supplier: Supplier | null = null) => {
        setEditingSupplier(supplier);
        setSupplierFormData(supplier || { name: '', contactPerson: '', phone: '', email: '', address: '' });
        setShowSupplierForm(true);
    };
    const handleSupplierSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingSupplier) {
            updateSupplier({ ...editingSupplier, ...supplierFormData });
        } else {
            addSupplier(supplierFormData);
        }
        setShowSupplierForm(false);
    };

    // Handlers for Purchase Orders
    const handleOpenPOForm = () => setShowPOForm(true);
    const handlePOItemChange = (index: number, field: string, value: string | number) => {
        const newItems = [...poFormData.items];
        const product = products.find(p => p.id === (field === 'productId' ? value : newItems[index].productId));
        newItems[index] = { ...newItems[index], [field]: value };
        if (field === 'productId' && product) {
            newItems[index].costPrice = product.costPrice;
        }
        setPoFormData({ ...poFormData, items: newItems });
    };
    const addPOItem = () => setPoFormData(prev => ({ ...prev, items: [...prev.items, { productId: '', quantity: 1, costPrice: 0 }] }));
    const handlePOSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (poFormData.supplierId && poFormData.items.every(i => i.productId && i.quantity > 0)) {
            addPurchaseOrder({ date: new Date().toISOString(), ...poFormData });
            setPoFormData({ supplierId: '', items: [{ productId: '', quantity: 1, costPrice: 0 }] });
            setShowPOForm(false);
        } else {
            alert('الرجاء تعبئة جميع حقول أمر الشراء بشكل صحيح.');
        }
    };
    const handleReceivePO = (poId: string) => {
        if (window.confirm('هل أنت متأكد من استلام هذا الطلب؟ سيتم تحديث كميات المخزون.')) {
            updatePurchaseOrderStatus(poId, 'received');
        }
    };
    
    // Handlers for Payments
    const handleAddPayment = () => {
        if (paymentModalData && paymentAmount > 0) {
            addPurchaseOrderPayment(paymentModalData.poId, { amount: paymentAmount, date: new Date().toISOString(), paymentMethod });
            setPaymentModalData(null);
            setPaymentAmount(0);
            setPaymentMethod('cash');
        }
    };
    
    // Data for Supplier Profit Report
    const supplierProfitData = useMemo(() => {
        if (!selectedReportSupplier) return null;
        const supplierProducts = products.filter(p => p.supplierId === selectedReportSupplier);
        const supplierProductIds = new Set(supplierProducts.map(p => p.id));
        const relevantSales = sales.filter(s => supplierProductIds.has(s.productId));
        
        let totalRevenue = 0;
        let totalCost = 0;

        relevantSales.forEach(sale => {
            const product = supplierProducts.find(p => p.id === sale.productId);
            if(product) {
                totalRevenue += sale.quantity * sale.unitPrice;
                totalCost += sale.quantity * product.costPrice;
            }
        });
        
        return { totalRevenue, totalCost, netProfit: totalRevenue - totalCost };
    }, [selectedReportSupplier, products, sales]);


    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">إدارة الموردين والمشتريات</h1>
            
            <div className="flex border-b">
                <button onClick={() => setActiveTab('suppliers')} className={`px-4 py-2 ${activeTab === 'suppliers' ? 'border-b-2 border-indigo-600 font-bold text-indigo-600' : 'text-gray-500'}`}>الموردين</button>
                <button onClick={() => setActiveTab('purchase-orders')} className={`px-4 py-2 ${activeTab === 'purchase-orders' ? 'border-b-2 border-indigo-600 font-bold text-indigo-600' : 'text-gray-500'}`}>أوامر الشراء</button>
                <button onClick={() => setActiveTab('reports')} className={`px-4 py-2 ${activeTab === 'reports' ? 'border-b-2 border-indigo-600 font-bold text-indigo-600' : 'text-gray-500'}`}>تقارير الأرباح</button>
            </div>

            {activeTab === 'suppliers' && (
                <div className="space-y-4">
                    <button onClick={() => handleOpenSupplierForm()} className="bg-indigo-600 text-white px-4 py-2 rounded-lg">إضافة مورد</button>
                    <div className="bg-white p-4 rounded-xl shadow-lg">
                        <table className="w-full text-right">
                            <thead><tr className="border-b"><th className="p-2">الاسم</th><th className="p-2">الهاتف</th><th className="p-2">الرصيد</th><th className="p-2">إجراءات</th></tr></thead>
                            <tbody>
                                {suppliers.map(s => {
                                     const supplierPOs = purchaseOrders.filter(po => po.supplierId === s.id);
                                     const totalDebt = supplierPOs.reduce((sum, po) => sum + po.items.reduce((itemSum, item) => itemSum + item.quantity * item.costPrice, 0), 0);
                                     const totalPaid = supplierPOs.reduce((sum, po) => sum + po.payments.reduce((paySum, p) => paySum + p.amount, 0), 0);
                                     const balance = totalDebt - totalPaid;
                                    return (
                                        <tr key={s.id} className="border-b hover:bg-gray-50">
                                            <td className="p-2 font-medium">{s.name}</td>
                                            <td className="p-2">{s.phone}</td>
                                            <td className={`p-2 font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>{balance.toLocaleString()} ج.م</td>
                                            <td className="p-2"><button onClick={() => handleOpenSupplierForm(s)} className="text-blue-600">تعديل</button></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'purchase-orders' && (
                <div className="space-y-4">
                     <button onClick={handleOpenPOForm} className="bg-indigo-600 text-white px-4 py-2 rounded-lg">إنشاء أمر شراء</button>
                    <div className="bg-white p-4 rounded-xl shadow-lg">
                        <table className="w-full text-right">
                            <thead><tr className="border-b"><th className="p-2">#</th><th className="p-2">المورد</th><th className="p-2">الإجمالي</th><th className="p-2">المدفوع</th><th className="p-2">الحالة</th><th className="p-2">إجراءات</th></tr></thead>
                            <tbody>
                                {purchaseOrders.map(po => {
                                    const total = po.items.reduce((sum, i) => sum + i.quantity * i.costPrice, 0);
                                    const paid = po.payments.reduce((sum, p) => sum + p.amount, 0);
                                    return (
                                    <tr key={po.id} className="border-b hover:bg-gray-50">
                                        <td className="p-2">{po.id}</td>
                                        <td className="p-2">{suppliers.find(s=>s.id === po.supplierId)?.name}</td>
                                        <td className="p-2">{total.toLocaleString()} ج.م</td>
                                        <td className="p-2">{paid.toLocaleString()} ج.م</td>
                                        <td className="p-2"><span className={`px-2 py-1 text-xs rounded-full ${po.status === 'received' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{po.status === 'received' ? 'تم الاستلام' : 'قيد الانتظار'}</span></td>
                                        <td className="p-2 flex gap-2 text-sm">
                                            {po.status === 'pending' && <button onClick={() => handleReceivePO(po.id)} className="text-green-600">استلام</button>}
                                            <button onClick={() => setPaymentModalData({ poId: po.id, total, paid })} className="text-blue-600">إضافة دفعة</button>
                                        </td>
                                    </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

             {activeTab === 'reports' && (
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-bold mb-4">تقرير أرباح الموردين</h2>
                    <select value={selectedReportSupplier} onChange={e => setSelectedReportSupplier(e.target.value)} className="p-2 border rounded w-full max-w-sm">
                        <option value="">اختر موردًا لعرض التقرير...</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    {supplierProfitData && (
                        <div className="mt-6 grid grid-cols-3 gap-4">
                            <div className="p-4 bg-gray-50 rounded-lg text-center"><p className="text-sm text-gray-500">إجمالي الإيرادات</p><p className="text-2xl font-bold">{supplierProfitData.totalRevenue.toLocaleString()} ج.م</p></div>
                            <div className="p-4 bg-gray-50 rounded-lg text-center"><p className="text-sm text-gray-500">إجمالي التكلفة</p><p className="text-2xl font-bold">{supplierProfitData.totalCost.toLocaleString()} ج.م</p></div>
                            <div className="p-4 bg-indigo-50 rounded-lg text-center"><p className="text-sm text-indigo-500">صافي الربح</p><p className="text-2xl font-bold text-indigo-700">{supplierProfitData.netProfit.toLocaleString()} ج.م</p></div>
                        </div>
                    )}
                </div>
            )}

            {/* Modals */}
            {showSupplierForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <form onSubmit={handleSupplierSubmit} className="bg-white p-6 rounded-lg w-full max-w-lg space-y-3">
                        <h3 className="font-bold text-lg">{editingSupplier ? 'تعديل مورد' : 'إضافة مورد'}</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">اسم الشركة</label>
                            <input type="text" value={supplierFormData.name} onChange={e => setSupplierFormData({...supplierFormData, name: e.target.value})} placeholder="اسم الشركة" className="w-full p-2 border rounded" required />
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">اسم جهة الاتصال</label>
                            <input type="text" value={supplierFormData.contactPerson} onChange={e => setSupplierFormData({...supplierFormData, contactPerson: e.target.value})} placeholder="اسم جهة الاتصال" className="w-full p-2 border rounded" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
                            <input type="text" value={supplierFormData.phone} onChange={e => setSupplierFormData({...supplierFormData, phone: e.target.value})} placeholder="رقم الهاتف" className="w-full p-2 border rounded" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                            <input type="email" value={supplierFormData.email} onChange={e => setSupplierFormData({...supplierFormData, email: e.target.value})} placeholder="البريد الإلكتروني" className="w-full p-2 border rounded" />
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
                            <input type="text" value={supplierFormData.address} onChange={e => setSupplierFormData({...supplierFormData, address: e.target.value})} placeholder="العنوان" className="w-full p-2 border rounded" />
                        </div>
                        <div className="flex gap-2"><button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">حفظ</button><button type="button" onClick={() => setShowSupplierForm(false)} className="bg-gray-400 text-white px-4 py-2 rounded">إلغاء</button></div>
                    </form>
                </div>
            )}
             {showPOForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <form onSubmit={handlePOSubmit} className="bg-white p-6 rounded-lg w-full max-w-2xl space-y-3 max-h-[90vh] overflow-y-auto">
                        <h3 className="font-bold text-lg">إنشاء أمر شراء جديد</h3>
                        <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">المورد</label>
                            <select value={poFormData.supplierId} onChange={e => setPoFormData({...poFormData, supplierId: e.target.value})} className="w-full p-2 border rounded" required><option value="">اختر المورد...</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                        </div>
                        <div className="flex gap-2 items-center border-b pb-2">
                             <label className="w-full text-sm font-medium text-gray-700">المنتج</label>
                             <label className="w-24 text-sm font-medium text-gray-700">الكمية</label>
                             <label className="w-28 text-sm font-medium text-gray-700">التكلفة</label>
                        </div>
                        {poFormData.items.map((item, index) => (
                            <div key={index} className="flex gap-2 items-center border-b pb-2">
                                <select value={item.productId} onChange={e => handlePOItemChange(index, 'productId', e.target.value)} className="w-full p-2 border rounded"><option value="">اختر المنتج...</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                                <input type="number" value={item.quantity} onChange={e => handlePOItemChange(index, 'quantity', parseInt(e.target.value))} placeholder="الكمية" className="w-24 p-2 border rounded" />
                                <input type="number" value={item.costPrice} onChange={e => handlePOItemChange(index, 'costPrice', parseFloat(e.target.value))} placeholder="التكلفة" className="w-28 p-2 border rounded" />
                            </div>
                        ))}
                        <button type="button" onClick={addPOItem} className="text-sm text-indigo-600">+ إضافة منتج آخر</button>
                        <div className="flex gap-2 pt-4"><button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">إنشاء</button><button type="button" onClick={() => setShowPOForm(false)} className="bg-gray-400 text-white px-4 py-2 rounded">إلغاء</button></div>
                    </form>
                </div>
            )}
            {paymentModalData && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-sm space-y-3">
                        <h3 className="font-bold text-lg">إضافة دفعة لـ {paymentModalData.poId}</h3>
                        <p>الإجمالي: {paymentModalData.total.toLocaleString()} / المدفوع: {paymentModalData.paid.toLocaleString()}</p>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">مبلغ الدفعة</label>
                            <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(parseFloat(e.target.value))} placeholder="مبلغ الدفعة" className="w-full p-2 border rounded" />
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">طريقة الدفع</label>
                            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)} className="w-full p-2 border rounded bg-gray-50">
                                <option value="cash">نقدي</option>
                                <option value="card">بطاقة</option>
                                <option value="bank_transfer">تحويل بنكي</option>
                            </select>
                        </div>
                        <div className="flex gap-2"><button onClick={handleAddPayment} className="bg-green-500 text-white px-4 py-2 rounded">حفظ</button><button onClick={() => setPaymentModalData(null)} className="bg-gray-400 text-white px-4 py-2 rounded">إلغاء</button></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuppliersManagement;
