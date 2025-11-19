import React, { useState, useMemo, useEffect } from 'react';
import type { Customer, Sale, Product, CustomerTransaction } from '../types';

interface CustomerManagementProps {
    customers: Customer[];
    sales: Sale[];
    products: Product[];
    addCustomer: (customer: Omit<Customer, 'id'|'joinDate'|'loyaltyPoints'|'transactions'>) => Customer;
    updateCustomer: (customer: Customer) => void;
    deleteCustomer: (customerId: string) => void;
    addCustomerTransaction: (customerId: string, transaction: Omit<CustomerTransaction, 'id'|'date'>) => void;
    logActivity: (action: string) => void;
}

const CustomerManagement: React.FC<CustomerManagementProps> = ({ customers, sales, products, addCustomer, updateCustomer, deleteCustomer, addCustomerTransaction, logActivity }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [isDetailVisible, setIsDetailVisible] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

    const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '' });

    const filteredCustomers = useMemo(() => {
        return customers.filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone.includes(searchTerm)
        );
    }, [customers, searchTerm]);

    // This effect ensures that the data in the modal is always fresh.
    // When a transaction is added, `customers` prop changes, and this finds the
    // updated customer and sets it as the selected one, triggering a re-render of the modal.
    useEffect(() => {
        if (selectedCustomer) {
            const updatedCustomer = customers.find(c => c.id === selectedCustomer.id);
            if (updatedCustomer) {
                setSelectedCustomer(updatedCustomer);
            } else {
                // Customer might have been deleted, so close the modal.
                setSelectedCustomer(null);
                setIsDetailVisible(false);
            }
        }
    }, [customers, selectedCustomer]);


    const handleOpenForm = (customer: Customer | null = null) => {
        setEditingCustomer(customer);
        setFormData(customer ? { name: customer.name, phone: customer.phone, email: customer.email || '', address: customer.address || '' } : { name: '', phone: '', email: '', address: '' });
        setIsFormVisible(true);
    };

    const handleCloseForm = () => {
        setIsFormVisible(false);
        setEditingCustomer(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCustomer) {
            updateCustomer({ ...editingCustomer, ...formData });
        } else {
            addCustomer(formData);
        }
        handleCloseForm();
    };

    const handleViewDetails = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsDetailVisible(true);
    };

    const CustomerDetailModal = () => {
        if (!selectedCustomer) return null;

        const customerSales = sales.filter(s => s.customerId === selectedCustomer.id);
        const debt = selectedCustomer.transactions.reduce((acc, t) => acc + (t.type === 'debt' ? t.amount : -t.amount), 0);
        
        const [transactionType, setTransactionType] = useState<'payment' | 'debt'>('payment');
        const [transactionAmount, setTransactionAmount] = useState(0);
        const [transactionDesc, setTransactionDesc] = useState('');

        const handleAddTransaction = () => {
            if (transactionAmount <= 0 || !transactionDesc) {
                alert('الرجاء إدخال مبلغ ووصف صحيحين للمعاملة.');
                return;
            }
            addCustomerTransaction(selectedCustomer.id, { type: transactionType, amount: transactionAmount, description: transactionDesc });
            setTransactionAmount(0);
            setTransactionDesc('');
        };

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                    <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
                        <h2 className="text-2xl font-bold text-gray-800">{selectedCustomer.name}</h2>
                        <button onClick={() => setIsDetailVisible(false)} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
                    </div>
                    <div className="p-6 space-y-6">
                        {/* Customer Info & Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <div className="md:col-span-2 p-4 bg-gray-50 rounded-lg">
                                <p><strong>الهاتف:</strong> {selectedCustomer.phone}</p>
                                <p><strong>البريد الإلكتروني:</strong> {selectedCustomer.email || 'لا يوجد'}</p>
                                <p><strong>نقاط الولاء:</strong> <span className="font-bold text-indigo-600">{selectedCustomer.loyaltyPoints}</span></p>
                            </div>
                            <div className="flex flex-col gap-2">
                                <a href={`sms:${selectedCustomer.phone}`} className="text-center bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition">إرسال رسالة ترويجية</a>
                                <a href={`mailto:${selectedCustomer.email}`} className="text-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">إرسال بريد إلكتروني</a>
                            </div>
                        </div>

                        {/* Financials: Debt & Transactions */}
                        <div className="bg-white p-4 rounded-xl shadow-lg border">
                            <h3 className="text-xl font-bold mb-2">المديونيات والمدفوعات</h3>
                            <p className="mb-4 text-lg">الرصيد الحالي: <span className={`font-bold ${debt > 0 ? 'text-red-600' : 'text-green-600'}`}>{debt.toLocaleString()} ج.م</span> {debt > 0 ? '(مديونية)' : ''}</p>
                             <div className="flex flex-wrap items-end gap-2 mb-4 p-2 bg-gray-50 rounded-md">
                                <div>
                                    <label className="text-xs font-medium text-gray-600">نوع المعاملة</label>
                                    <select value={transactionType} onChange={e => setTransactionType(e.target.value as 'payment'|'debt')} className="w-full p-2 border rounded">
                                        <option value="payment">تسجيل دفعة</option>
                                        <option value="debt">تسجيل دين</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-600">المبلغ</label>
                                    <input type="number" value={transactionAmount} onChange={e => setTransactionAmount(parseFloat(e.target.value) || 0)} placeholder="المبلغ" className="w-full p-2 border rounded" />
                                </div>
                                <div className="flex-grow">
                                     <label className="text-xs font-medium text-gray-600">الوصف</label>
                                    <input type="text" value={transactionDesc} onChange={e => setTransactionDesc(e.target.value)} placeholder="الوصف" className="w-full p-2 border rounded" />
                                </div>
                                <button onClick={handleAddTransaction} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">إضافة</button>
                            </div>
                            <table className="w-full text-right text-sm">
                                <thead><tr className="border-b"><th className="p-2">التاريخ</th><th className="p-2">النوع</th><th className="p-2">الوصف</th><th className="p-2">المبلغ</th></tr></thead>
                                <tbody>
                                    {[...selectedCustomer.transactions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => (
                                        <tr key={t.id} className="border-b">
                                            <td className="p-2">{new Date(t.date).toLocaleDateString()}</td>
                                            <td className={`p-2 font-semibold ${t.type === 'debt' ? 'text-red-500' : 'text-green-500'}`}>{t.type === 'debt' ? 'دين' : 'دفعة'}</td>
                                            <td className="p-2">{t.description}</td>
                                            <td className="p-2">{t.amount.toLocaleString()} ج.م</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Purchase History */}
                        <div className="bg-white p-4 rounded-xl shadow-lg border">
                            <h3 className="text-xl font-bold mb-2">سجل المشتريات</h3>
                            <table className="w-full text-right text-sm">
                                <thead><tr className="border-b"><th className="p-2">الفاتورة</th><th className="p-2">التاريخ</th><th className="p-2">المنتج</th><th className="p-2">الكمية</th><th className="p-2">الإجمالي</th></tr></thead>
                                <tbody>
                                    {[...customerSales].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(sale => {
                                        const product = products.find(p => p.id === sale.productId);
                                        return (
                                            <tr key={sale.invoiceId} className="border-b">
                                                <td className="p-2">{sale.invoiceId}</td>
                                                <td className="p-2">{new Date(sale.date).toLocaleDateString()}</td>
                                                <td className="p-2">{product?.name || 'منتج محذوف'}</td>
                                                <td className="p-2">{sale.quantity}</td>
                                                <td className="p-2">{(sale.quantity * sale.unitPrice).toLocaleString()} ج.م</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                             {customerSales.length === 0 && <p className="text-center p-4 text-gray-500">لا يوجد سجل مشتريات لهذا العميل.</p>}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">إدارة العملاء</h1>
                <button onClick={() => handleOpenForm()} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">إضافة عميل جديد</button>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-lg">
                <input type="text" placeholder="ابحث بالاسم أو رقم الهاتف..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-2 border rounded" />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
                <table className="w-full text-right">
                    <thead className="border-b-2">
                        <tr><th className="p-3">الاسم</th><th className="p-3">الهاتف</th><th className="p-3">نقاط الولاء</th><th className="p-3">المديونية</th><th className="p-3">إجراءات</th></tr>
                    </thead>
                    <tbody>
                        {filteredCustomers.map(customer => {
                            const debt = customer.transactions.reduce((acc, t) => acc + (t.type === 'debt' ? t.amount : -t.amount), 0);
                            return (
                                <tr key={customer.id} className="border-b hover:bg-gray-50">
                                    <td className="p-3 font-medium">{customer.name}</td>
                                    <td className="p-3">{customer.phone}</td>
                                    <td className="p-3 font-bold text-indigo-600">{customer.loyaltyPoints}</td>
                                    <td className={`p-3 font-bold ${debt > 0 ? 'text-red-600' : 'text-green-600'}`}>{debt > 0 ? debt.toLocaleString() + ' ج.م' : 'لا يوجد'}</td>
                                    <td className="p-3 flex gap-2">
                                        <button onClick={() => handleViewDetails(customer)} className="text-blue-600 hover:underline">عرض</button>
                                        <button onClick={() => handleOpenForm(customer)} className="text-green-600 hover:underline">تعديل</button>
                                        <button onClick={() => window.confirm('هل أنت متأكد؟') && deleteCustomer(customer.id)} className="text-red-600 hover:underline">حذف</button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {isFormVisible && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
                        <h2 className="text-xl font-bold mb-4">{editingCustomer ? 'تعديل عميل' : 'إضافة عميل جديد'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الكامل</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="الاسم الكامل" className="w-full p-2 border rounded" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
                                <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="رقم الهاتف" className="w-full p-2 border rounded" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني (اختياري)</label>
                                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="البريد الإلكتروني (اختياري)" className="w-full p-2 border rounded" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">العنوان (اختياري)</label>
                                <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="العنوان (اختياري)" className="w-full p-2 border rounded" />
                            </div>
                            <div className="flex gap-4">
                                <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">حفظ</button>
                                <button type="button" onClick={handleCloseForm} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">إلغاء</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {isDetailVisible && <CustomerDetailModal />}
        </div>
    );
};

export default CustomerManagement;