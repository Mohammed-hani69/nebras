
import React, { useState, useMemo } from 'react';
import type { Store, BillingSettings, PaymentMethod } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface BillingPaymentsProps {
  store: Store;
  updateBillingSettings: (settings: BillingSettings) => void;
}

const paymentMethodLabels: Record<PaymentMethod, string> = {
    cash: 'نقدي',
    card: 'بطاقة',
    bank_transfer: 'تحويل بنكي'
};

const BillingPayments: React.FC<BillingPaymentsProps> = ({ store, updateBillingSettings }) => {
    const [activeTab, setActiveTab] = useState('invoices');
    const [settings, setSettings] = useState<BillingSettings>(store.billingSettings);
    const [isPrinting, setIsPrinting] = useState(false);
    const [invoiceSearchTerm, setInvoiceSearchTerm] = useState('');

    const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: name === 'taxRate' ? parseFloat(value) : value }));
    };

    const handleSettingsSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateBillingSettings(settings);
        alert('تم حفظ الإعدادات بنجاح!');
    };
    
    const handlePrintInvoice = async (invoiceId: string) => {
        setIsPrinting(true);
        const invoiceElement = document.getElementById(`invoice-${invoiceId}`);
        if (invoiceElement) {
            try {
                const canvas = await html2canvas(invoiceElement, { scale: 2 });
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`invoice-${invoiceId}.pdf`);
            } catch (error) {
                console.error("Error generating PDF:", error);
                alert("حدث خطأ أثناء إنشاء الفاتورة. يرجى المحاولة مرة أخرى.");
            }
        }
        setIsPrinting(false);
    };

    const dailyJournalData = useMemo(() => {
        const cashTransactions = [
            ...store.sales.filter(s => s.paymentMethod === 'cash').map(s => ({ date: s.date, description: `بيع فاتورة #${s.invoiceId}`, amount: s.amountPaid || (s.quantity * s.unitPrice), type: 'in' as const })),
            ...store.services.filter(s => s.paymentMethod === 'cash').map(s => ({ date: s.date, description: `خدمة #${s.orderId}`, amount: s.revenue, type: 'in' as const })),
            ...store.customers.flatMap(c => c.transactions.map(t => ({ date: t.date, description: `دفعة من ${c.name}: ${t.description}`, amount: t.amount, type: t.type === 'payment' ? 'in' : 'out' as const }))),
            ...store.expenses.filter(e => e.paymentMethod === 'cash').map(e => ({ date: e.date, description: `مصروف: ${e.description}`, amount: e.amount, type: 'out' as const })),
            ...store.purchaseOrders.flatMap(po => po.payments.filter(p => p.paymentMethod === 'cash').map(p => ({ date: p.date, description: `دفعة للمورد #${po.supplierId}`, amount: p.amount, type: 'out' as const }))),
        ];

        const sorted = cashTransactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const totalIn = sorted.filter(t=>t.type === 'in').reduce((sum, t) => sum + t.amount, 0);
        const totalOut = sorted.filter(t=>t.type === 'out').reduce((sum, t) => sum + t.amount, 0);
        
        return { transactions: sorted, totalIn, totalOut, net: totalIn - totalOut };
    }, [store]);
    
    const filteredInvoices = useMemo(() => {
        const sortedInvoices = [...store.invoices].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        if (!invoiceSearchTerm.trim()) {
            return sortedInvoices;
        }
        return sortedInvoices.filter(inv =>
            inv.id.toLowerCase().includes(invoiceSearchTerm.toLowerCase())
        );
    }, [store.invoices, invoiceSearchTerm]);

    return (
        <div className="space-y-6">
             {isPrinting && (
                <div className="fixed inset-0 bg-white bg-opacity-80 flex justify-center items-center z-50">
                    <p className="text-2xl font-bold animate-pulse">جاري تحضير الفاتورة للطباعة...</p>
                </div>
            )}
            <div id="invoice-print-area" className="fixed top-[-9999px] left-[-9999px]">{/* Area for rendering invoices before printing */}
                {store.invoices.map(invoice => (
                    <div key={invoice.id} id={`invoice-${invoice.id}`} className="p-10 bg-white text-black w-[800px] text-base" dir="rtl" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                       <div className="border-2 border-gray-300 rounded-lg p-6">
                         {/* Header */}
                        <div className="bg-indigo-600 text-white p-6 rounded-t-lg flex justify-between items-center">
                            <div>
                                <h1 className="text-3xl font-bold">{store.billingSettings.storeName}</h1>
                                <p className="text-sm">{store.billingSettings.address}</p>
                                <p className="text-sm">هاتف: {store.billingSettings.phone}</p>
                            </div>
                            <div className="text-left">
                                <h2 className="text-2xl font-bold">فاتورة ضريبية</h2>
                                <p>رقم: {invoice.id}</p>
                                <p>التاريخ: {new Date(invoice.date).toLocaleDateString('ar-EG')}</p>
                            </div>
                        </div>

                        {/* Bill To */}
                        <div className="my-6 px-6">
                            <h3 className="font-bold text-gray-800">فاتورة إلى:</h3>
                            <p className="text-gray-600">{invoice.customerName}</p>
                        </div>
                        
                        {/* Items Table */}
                        <div className="px-6">
                            <table className="w-full text-right mb-6">
                                <thead className="bg-indigo-600 text-white">
                                    <tr>
                                        <th className="p-3">الوصف</th>
                                        <th className="p-3">الكمية</th>
                                        <th className="p-3">سعر الوحدة</th>
                                        <th className="p-3">الإجمالي</th>
                                    </tr>
                                </thead>
                                <tbody className="border">
                                    {invoice.items.map((item, i) => 
                                        <tr key={i} className="border-b">
                                            <td className="p-3">{item.description}</td>
                                            <td className="p-3">{item.quantity}</td>
                                            <td className="p-3">{item.unitPrice.toLocaleString()} ج.م</td>
                                            <td className="p-3 font-semibold">{item.total.toLocaleString()} ج.م</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals Section */}
                        <div className="flex justify-end px-6">
                            <div className="w-1/2 text-left space-y-2">
                                <div className="flex justify-between"><span className="text-gray-600">المجموع الفرعي:</span> <span>{invoice.subtotal.toLocaleString()} ج.م</span></div>
                                <div className="flex justify-between"><span className="text-gray-600">ضريبة القيمة المضافة ({invoice.taxRate}%):</span> <span>{invoice.taxAmount.toLocaleString()} ج.م</span></div>
                                <div className="flex justify-between text-xl font-bold border-t-2 border-indigo-600 pt-2 mt-2">
                                    <span>الإجمالي:</span> 
                                    <span className="text-indigo-600">{invoice.total.toLocaleString()} ج.م</span>
                                </div>
                                {/* Payment Details on Invoice */}
                                <div className="flex justify-between text-sm pt-2 border-t mt-2 text-green-700">
                                    <span>المدفوع:</span> 
                                    <span>{invoice.amountPaid !== undefined ? invoice.amountPaid.toLocaleString() : invoice.total.toLocaleString()} ج.م</span>
                                </div>
                                {invoice.remainingBalance > 0 && (
                                    <div className="flex justify-between text-sm text-red-600 font-bold">
                                        <span>المتبقي (آجل):</span> 
                                        <span>{invoice.remainingBalance.toLocaleString()} ج.م</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="text-center mt-10 pt-4 border-t text-sm text-gray-500">
                            <p>الرقم الضريبي: {store.billingSettings.taxNumber}</p>
                            <p className="font-semibold mt-2">شكراً لتعاملكم معنا!</p>
                        </div>
                       </div>
                    </div>
                ))}
            </div>

            <h1 className="text-3xl font-bold text-gray-800">الفواتير والدفع</h1>
            <div className="flex border-b">
                <button onClick={() => setActiveTab('invoices')} className={`px-4 py-2 ${activeTab === 'invoices' ? 'border-b-2 border-indigo-600 font-bold text-indigo-600' : 'text-gray-500'}`}>سجل الفواتير</button>
                <button onClick={() => setActiveTab('journal')} className={`px-4 py-2 ${activeTab === 'journal' ? 'border-b-2 border-indigo-600 font-bold text-indigo-600' : 'text-gray-500'}`}>دفتر اليومية</button>
                <button onClick={() => setActiveTab('settings')} className={`px-4 py-2 ${activeTab === 'settings' ? 'border-b-2 border-indigo-600 font-bold text-indigo-600' : 'text-gray-500'}`}>الإعدادات</button>
            </div>
            
            {activeTab === 'invoices' && (
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-bold mb-4">الفواتير الضريبية المصدرة</h2>
                     <div className="mb-4">
                        <input
                            type="text"
                            placeholder="ابحث برقم الفاتورة..."
                            value={invoiceSearchTerm}
                            onChange={e => setInvoiceSearchTerm(e.target.value)}
                            className="w-full max-w-sm p-2 border border-gray-300 rounded-lg"
                        />
                    </div>
                    <table className="w-full text-right">
                        <thead><tr className="border-b"><th className="p-2">#</th><th className="p-2">التاريخ</th><th className="p-2">العميل</th><th className="p-2">الإجمالي</th><th className="p-2">المتبقي</th><th className="p-2">إجراء</th></tr></thead>
                        <tbody>
                            {filteredInvoices.map(inv => (
                                <tr key={inv.id} className="border-b hover:bg-gray-50">
                                    <td className="p-2">{inv.id}</td>
                                    <td className="p-2">{new Date(inv.date).toLocaleDateString()}</td>
                                    <td className="p-2">{inv.customerName}</td>
                                    <td className="p-2 font-bold">{inv.total.toLocaleString()} ج.م</td>
                                    <td className={`p-2 ${inv.remainingBalance > 0 ? 'text-red-600 font-bold' : 'text-gray-400'}`}>{inv.remainingBalance > 0 ? inv.remainingBalance.toLocaleString() + ' ج.م' : '-'}</td>
                                    <td className="p-2"><button onClick={() => handlePrintInvoice(inv.id)} className="bg-blue-500 text-white px-3 py-1 text-sm rounded">طباعة</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {filteredInvoices.length === 0 && (
                        <p className="text-center p-6 text-gray-500">
                            {invoiceSearchTerm ? 'لا توجد فواتير تطابق بحثك.' : 'لا توجد فواتير ضريبية بعد.'}
                        </p>
                    )}
                </div>
            )}
             {activeTab === 'journal' && (
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-bold mb-4">دفتر اليومية (الحركة النقدية)</h2>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="p-4 bg-green-100 rounded-lg text-center"><p className="font-bold">إجمالي المقبوضات</p><p className="text-2xl font-bold text-green-700">{dailyJournalData.totalIn.toLocaleString()} ج.م</p></div>
                        <div className="p-4 bg-red-100 rounded-lg text-center"><p className="font-bold">إجمالي المدفوعات</p><p className="text-2xl font-bold text-red-700">{dailyJournalData.totalOut.toLocaleString()} ج.م</p></div>
                        <div className="p-4 bg-blue-100 rounded-lg text-center"><p className="font-bold">صافي الحركة</p><p className="text-2xl font-bold text-blue-700">{dailyJournalData.net.toLocaleString()} ج.م</p></div>
                    </div>
                    <table className="w-full text-right text-sm">
                        <thead><tr className="border-b"><th className="p-2">التاريخ</th><th className="p-2">الوصف</th><th className="p-2">المبلغ</th></tr></thead>
                        <tbody>
                            {dailyJournalData.transactions.map((t, i) => (
                                <tr key={i} className={`border-b ${t.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                                    <td className="p-2">{new Date(t.date).toLocaleString()}</td>
                                    <td className="p-2">{t.description}</td>
                                    <td className="p-2 font-bold">{t.type === 'in' ? '+' : '-'}{t.amount.toLocaleString()} ج.م</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {activeTab === 'settings' && (
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-bold mb-4">إعدادات الفوترة</h2>
                    <form onSubmit={handleSettingsSubmit} className="space-y-4 max-w-2xl">
                        <input type="text" name="storeName" value={settings.storeName} onChange={handleSettingsChange} placeholder="اسم المتجر (للفاتورة)" className="w-full p-2 border rounded" required />
                        <input type="text" name="taxNumber" value={settings.taxNumber} onChange={handleSettingsChange} placeholder="الرقم الضريبي" className="w-full p-2 border rounded" required />
                        <input type="number" name="taxRate" value={settings.taxRate} onChange={handleSettingsChange} placeholder="نسبة الضريبة (%)" className="w-full p-2 border rounded" required />
                        <input type="text" name="address" value={settings.address} onChange={handleSettingsChange} placeholder="عنوان المتجر" className="w-full p-2 border rounded" required />
                        <input type="text" name="phone" value={settings.phone} onChange={handleSettingsChange} placeholder="هاتف المتجر" className="w-full p-2 border rounded" required />
                        <button type="submit" className="bg-green-500 text-white px-6 py-2 rounded">حفظ الإعدادات</button>
                    </form>
                    <div className="mt-8 pt-6 border-t">
                        <h3 className="font-bold text-lg">الربط مع بوابات الدفع</h3>
                        <p className="text-gray-500">قريبًا... سيتم إضافة إمكانية الربط المباشر مع بوابات الدفع الإلكترونية.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BillingPayments;
