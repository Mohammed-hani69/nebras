
import React, { useState, useMemo } from 'react';
import type { Store, Quotation, QuotationStatus, Product, Invoice, PurchaseOrder } from '../types';
import InvoiceViewer from './InvoiceViewer';
import { DocumentDownloadIcon } from './icons/Icons';

interface InvoicingModuleProps {
  store: Store;
  addQuotation: (quotation: Omit<Quotation, 'id' | 'date' | 'status'>) => void;
  updateQuotationStatus: (id: string, status: QuotationStatus) => void;
  convertQuotationToInvoice: (id: string) => void;
}

const InvoicingModule: React.FC<InvoicingModuleProps> = ({ store, addQuotation, updateQuotationStatus, convertQuotationToInvoice }) => {
    const [activeTab, setActiveTab] = useState('quotations');
    const [showQuoteForm, setShowQuoteForm] = useState(false);
    const [viewingDocument, setViewingDocument] = useState<{ type: 'invoice' | 'quotation' | 'purchase_order', data: Invoice | Quotation | PurchaseOrder } | null>(null);
    
    // Search and Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState('');

    const initialItem = { productId: '', quantity: 1, unitPrice: 0 };
    const [quoteFormData, setQuoteFormData] = useState<{ customerId: string | null; validUntil: string; items: { productId: string; quantity: number; unitPrice: number }[] }>({
        customerId: null,
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Valid for 7 days
        items: [initialItem]
    });

    const getProductName = (id: string) => store.products.find(p => p.id === id)?.name || 'غير معروف';
    const getCustomerName = (id: string | null) => id ? store.customers.find(c => c.id === id)?.name : 'عميل عام';
    const getSupplierName = (id: string) => store.suppliers.find(s => s.id === id)?.name || 'غير معروف';

    const handleItemChange = (index: number, field: string, value: string | number) => {
        const newItems = [...quoteFormData.items];
        const product = store.products.find(p => p.id === (field === 'productId' ? value : newItems[index].productId));
        (newItems[index] as any)[field] = value;
        if (field === 'productId' && product) {
            newItems[index].unitPrice = product.sellPrice;
        }
        setQuoteFormData(prev => ({ ...prev, items: newItems }));
    };
    const addItem = () => setQuoteFormData(prev => ({ ...prev, items: [...prev.items, initialItem] }));
    const removeItem = (index: number) => setQuoteFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));

    const handleQuoteSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const subtotal = quoteFormData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const taxAmount = subtotal * (store.billingSettings.taxRate / 100);
        const total = subtotal + taxAmount;
        
        addQuotation({ ...quoteFormData, subtotal, taxAmount, total });
        setShowQuoteForm(false);
        setQuoteFormData({ customerId: null, validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], items: [initialItem] });
    };

    // Filtering Logic
    const filterDocuments = (docs: any[]) => {
        return docs.filter(doc => {
            const matchSearch = 
                (doc.id && doc.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (doc.customerName && doc.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (doc.customerId && getCustomerName(doc.customerId)?.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const matchDate = filterDate ? doc.date.startsWith(filterDate) : true;
            return matchSearch && matchDate;
        });
    };

    const statusStyles: Record<QuotationStatus, string> = {
        pending: 'bg-yellow-100 text-yellow-700',
        approved: 'bg-green-100 text-green-700',
        rejected: 'bg-red-100 text-red-700',
        invoiced: 'bg-blue-100 text-blue-700',
    };
    const statusLabels: Record<QuotationStatus, string> = {
        pending: 'قيد الانتظار',
        approved: 'مقبول',
        rejected: 'مرفوض',
        invoiced: 'تمت الفوترة',
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-800">إدارة الفواتير</h1>
                {activeTab === 'quotations' && (
                     <button onClick={() => setShowQuoteForm(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition flex items-center gap-2">
                        <span>+</span> إنشاء عرض سعر
                    </button>
                )}
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-grow w-full md:w-auto">
                    <input 
                        type="text" 
                        placeholder="بحث برقم الفاتورة أو اسم العميل..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <div className="w-full md:w-auto">
                    <input 
                        type="date" 
                        value={filterDate} 
                        onChange={e => setFilterDate(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                 <button onClick={() => {setSearchTerm(''); setFilterDate('');}} className="text-gray-500 text-sm hover:text-indigo-600">مسح الفلاتر</button>
            </div>

            <div className="flex border-b overflow-x-auto bg-white rounded-t-xl shadow-sm">
                <button onClick={() => setActiveTab('quotations')} className={`px-6 py-3 whitespace-nowrap font-medium transition-colors ${activeTab === 'quotations' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'}`}>عروض الأسعار</button>
                <button onClick={() => setActiveTab('salesInvoices')} className={`px-6 py-3 whitespace-nowrap font-medium transition-colors ${activeTab === 'salesInvoices' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'}`}>فواتير المبيعات</button>
                <button onClick={() => setActiveTab('purchaseInvoices')} className={`px-6 py-3 whitespace-nowrap font-medium transition-colors ${activeTab === 'purchaseInvoices' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'}`}>فواتير المشتريات</button>
                <button onClick={() => setActiveTab('returns')} className={`px-6 py-3 whitespace-nowrap font-medium transition-colors ${activeTab === 'returns' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'}`}>المردودات</button>
            </div>

            <div className="bg-white rounded-b-xl shadow-lg overflow-hidden min-h-[400px]">
                {activeTab === 'quotations' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-gray-50 text-gray-700 border-b"><tr><th className="p-4">#</th><th className="p-4">العميل</th><th className="p-4">التاريخ</th><th className="p-4">الإجمالي</th><th className="p-4">الحالة</th><th className="p-4">الإجراءات</th></tr></thead>
                            <tbody>
                                {filterDocuments(store.quotations || []).map(q => <tr key={q.id} className="border-b hover:bg-gray-50 transition-colors">
                                    <td className="p-4 font-mono text-gray-500">{q.id}</td><td className="p-4 font-medium">{getCustomerName(q.customerId)}</td>
                                    <td className="p-4 text-gray-500">{new Date(q.date).toLocaleDateString('ar-EG')}</td>
                                    <td className="p-4 font-bold">{q.total.toLocaleString()} ج.م</td>
                                    <td className="p-4"><span className={`px-3 py-1 text-xs font-bold rounded-full ${statusStyles[q.status]}`}>{statusLabels[q.status]}</span></td>
                                    <td className="p-4 flex gap-2 items-center">
                                        <button onClick={() => setViewingDocument({ type: 'quotation', data: q })} className="text-gray-600 hover:text-indigo-600 p-2 rounded-full hover:bg-gray-100" title="طباعة"><DocumentDownloadIcon /></button>
                                        {q.status === 'pending' && <>
                                        <button onClick={() => updateQuotationStatus(q.id, 'approved')} className="text-green-600 text-xs border border-green-200 px-3 py-1 rounded-md hover:bg-green-50 transition">قبول</button>
                                        <button onClick={() => updateQuotationStatus(q.id, 'rejected')} className="text-red-600 text-xs border border-red-200 px-3 py-1 rounded-md hover:bg-red-50 transition">رفض</button>
                                        </>}
                                        {q.status === 'approved' && <button onClick={() => convertQuotationToInvoice(q.id)} className="text-blue-600 text-xs border border-blue-200 px-3 py-1 rounded-md hover:bg-blue-50 transition">تحويل لفاتورة</button>}
                                    </td>
                                </tr>)}
                                {filterDocuments(store.quotations || []).length === 0 && <tr><td colSpan={6} className="text-center p-8 text-gray-500">لا توجد عروض أسعار تطابق البحث.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'salesInvoices' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-gray-50 text-gray-700 border-b"><tr><th className="p-4">#</th><th className="p-4">العميل</th><th className="p-4">التاريخ</th><th className="p-4">الإجمالي</th><th className="p-4">المدفوع</th><th className="p-4">المتبقي</th><th className="p-4">الإجراءات</th></tr></thead>
                            <tbody>
                                {filterDocuments(store.invoices || []).map(inv => <tr key={inv.id} className="border-b hover:bg-gray-50 transition-colors">
                                    <td className="p-4 font-mono text-gray-500">{inv.id}</td>
                                    <td className="p-4 font-medium">{inv.customerName}</td>
                                    <td className="p-4 text-gray-500">{new Date(inv.date).toLocaleDateString('ar-EG')}</td>
                                    <td className="p-4 font-bold">{inv.total.toLocaleString()} ج.م</td>
                                    <td className="p-4 text-green-600 font-medium">{inv.amountPaid.toLocaleString()} ج.م</td>
                                    <td className={`p-4 font-bold ${inv.remainingBalance > 0 ? 'text-red-600' : 'text-gray-400'}`}>{inv.remainingBalance > 0 ? inv.remainingBalance.toLocaleString() + ' ج.م' : '-'}</td>
                                    <td className="p-4">
                                        <button onClick={() => setViewingDocument({ type: 'invoice', data: inv })} className="flex items-center gap-1 text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition font-medium">
                                            <DocumentDownloadIcon /> <span className="text-xs">عرض / طباعة</span>
                                        </button>
                                    </td>
                                </tr>)}
                                {filterDocuments(store.invoices || []).length === 0 && <tr><td colSpan={7} className="text-center p-8 text-gray-500">لا توجد فواتير تطابق البحث.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'purchaseInvoices' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-gray-50 text-gray-700 border-b"><tr><th className="p-4">#</th><th className="p-4">المورد</th><th className="p-4">التاريخ</th><th className="p-4">الإجمالي</th><th className="p-4">المدفوع</th><th className="p-4">الحالة</th><th className="p-4">الإجراءات</th></tr></thead>
                            <tbody>
                                {filterDocuments(store.purchaseOrders || []).map(po => {
                                    const total = po.items.reduce((sum, i) => sum + i.quantity * i.costPrice, 0);
                                    const paid = po.payments.reduce((sum, p) => sum + p.amount, 0);
                                    return (<tr key={po.id} className="border-b hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-mono text-gray-500">{po.id}</td>
                                        <td className="p-4 font-medium">{getSupplierName(po.supplierId)}</td>
                                        <td className="p-4 text-gray-500">{new Date(po.date).toLocaleDateString('ar-EG')}</td>
                                        <td className="p-4 font-bold">{total.toLocaleString()} ج.م</td>
                                        <td className="p-4 text-gray-600">{paid.toLocaleString()} ج.م</td>
                                        <td className="p-4"><span className={`px-3 py-1 text-xs font-bold rounded-full ${po.status === 'received' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{po.status === 'received' ? 'تم الاستلام' : 'قيد الانتظار'}</span></td>
                                        <td className="p-4">
                                            <button onClick={() => setViewingDocument({ type: 'purchase_order', data: po })} className="flex items-center gap-1 text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition font-medium">
                                                <DocumentDownloadIcon /> <span className="text-xs">عرض / طباعة</span>
                                            </button>
                                        </td>
                                    </tr>);
                                })}
                                {filterDocuments(store.purchaseOrders || []).length === 0 && <tr><td colSpan={7} className="text-center p-8 text-gray-500">لا توجد أوامر شراء تطابق البحث.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}
                
                {activeTab === 'returns' && (
                    <div className="p-6 grid gap-8">
                        <div>
                            <h3 className="font-bold text-lg mb-4 text-gray-700 border-b pb-2 flex items-center gap-2"><span className="w-2 h-6 bg-red-500 rounded-full"></span>مرتجعات المبيعات</h3>
                            <table className="w-full text-right text-sm border rounded-lg overflow-hidden">
                                <thead className="bg-gray-50 border-b"><tr><th className="p-3">فاتورة #</th><th className="p-3">العميل</th><th className="p-3">المنتج</th><th className="p-3">المبلغ المسترد</th><th className="p-3">السبب</th></tr></thead>
                                <tbody>
                                    {store.saleReturns.map(r => <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50">
                                        <td className="p-3 font-mono">{r.originalSaleInvoiceId}</td><td className="p-3">{getCustomerName(r.customerId)}</td><td className="p-3">{getProductName(r.productId)}</td><td className="p-3 font-bold text-red-600">{r.amountReturned.toLocaleString()} ج.م</td><td className="p-3 text-gray-500">{r.reason}</td>
                                    </tr>)}
                                    {store.saleReturns.length === 0 && <tr><td colSpan={5} className="text-center p-4 text-gray-500">لا توجد مرتجعات مبيعات.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                        
                        <div>
                            <h3 className="font-bold text-lg mb-4 text-gray-700 border-b pb-2 flex items-center gap-2"><span className="w-2 h-6 bg-green-500 rounded-full"></span>مرتجعات المشتريات</h3>
                            <table className="w-full text-right text-sm border rounded-lg overflow-hidden">
                                <thead className="bg-gray-50 border-b"><tr><th className="p-3">المورد</th><th className="p-3">المنتج</th><th className="p-3">المبلغ المسترد</th><th className="p-3">السبب</th></tr></thead>
                                <tbody>
                                    {store.purchaseReturns.map(r => <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50">
                                        <td className="p-3">{getSupplierName(r.supplierId)}</td><td className="p-3">{getProductName(r.productId)}</td><td className="p-3 font-bold text-green-600">{r.amountRefunded.toLocaleString()} ج.م</td><td className="p-3 text-gray-500">{r.reason}</td>
                                    </tr>)}
                                    {store.purchaseReturns.length === 0 && <tr><td colSpan={4} className="text-center p-4 text-gray-500">لا توجد مرتجعات مشتريات.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>


            {showQuoteForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
                    <form onSubmit={handleQuoteSubmit} className="bg-white p-0 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                        <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
                             <h3 className="font-bold text-2xl text-indigo-800">إنشاء عرض سعر جديد</h3>
                             <button type="button" onClick={() => setShowQuoteForm(false)} className="text-gray-400 hover:text-red-500 transition text-2xl">&times;</button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">العميل</label>
                                    <select value={quoteFormData.customerId || ''} onChange={e => setQuoteFormData(f => ({ ...f, customerId: e.target.value }))} className="w-full p-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500"><option value="">اختر عميل...</option>{store.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">صالح حتى</label>
                                    <input type="date" value={quoteFormData.validUntil} onChange={e => setQuoteFormData(f => ({...f, validUntil: e.target.value}))} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="font-bold text-gray-800">بنود العرض</label>
                                    <button type="button" onClick={addItem} className="text-indigo-600 text-sm font-bold hover:bg-indigo-50 px-3 py-1 rounded-lg transition">+ إضافة بند</button>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
                                    {quoteFormData.items.map((item, index) => (
                                        <div key={index} className="flex flex-col md:flex-row gap-3 items-end bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                                            <div className="flex-grow w-full">
                                                <label className="text-xs font-bold text-gray-500 mb-1 block">المنتج</label>
                                                <select value={item.productId} onChange={e => handleItemChange(index, 'productId', e.target.value)} className="w-full p-2 border rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"><option value="">اختر منتج...</option>{store.products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                                            </div>
                                            <div className="w-full md:w-24">
                                                <label className="text-xs font-bold text-gray-500 mb-1 block">الكمية</label>
                                                <input type="number" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', parseInt(e.target.value))} min="1" className="w-full p-2 border rounded-lg text-center" />
                                            </div>
                                            <div className="w-full md:w-32">
                                                <label className="text-xs font-bold text-gray-500 mb-1 block">السعر</label>
                                                <input type="number" value={item.unitPrice} onChange={e => handleItemChange(index, 'unitPrice', parseFloat(e.target.value))} className="w-full p-2 border rounded-lg" />
                                            </div>
                                            <div className="w-full md:w-32 bg-gray-50 p-2 rounded-lg text-center border">
                                                 <label className="text-xs text-gray-400 block">الإجمالي</label>
                                                 <span className="font-bold text-gray-700">{(item.quantity * item.unitPrice).toLocaleString()}</span>
                                            </div>
                                            <button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition" title="حذف البند">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="flex justify-end text-xl font-bold text-gray-800 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                الإجمالي المتوقع: {((quoteFormData.items.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0)) * (1 + store.billingSettings.taxRate/100)).toLocaleString()} ج.م
                            </div>
                        </div>
                        
                        <div className="p-6 border-t bg-gray-50 flex gap-4">
                            <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 font-bold shadow-lg transition transform hover:scale-[1.02]">حفظ العرض</button>
                            <button type="button" onClick={() => setShowQuoteForm(false)} className="flex-1 bg-white text-gray-700 border border-gray-300 py-3 rounded-xl hover:bg-gray-50 font-bold transition">إلغاء</button>
                        </div>
                    </form>
                </div>
            )}

            {viewingDocument && (
                <InvoiceViewer 
                    document={viewingDocument.data} 
                    type={viewingDocument.type} 
                    store={store} 
                    onClose={() => setViewingDocument(null)} 
                />
            )}
        </div>
    );
};

export default InvoicingModule;
