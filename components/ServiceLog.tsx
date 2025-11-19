
import React, { useState, useEffect } from 'react';
import type { Service, PaymentMethod, Customer } from '../types';

interface ServiceLogProps {
  services: Service[];
  addService: (service: Omit<Service, 'orderId' | 'taxInfo'>) => void;
  createTaxInvoice: (sourceId: string, sourceType: 'service') => void;
  logActivity: (action: string) => void;
  customers: Customer[];
  taxRate: number;
}

const ServiceLog: React.FC<ServiceLogProps> = ({ services, addService, createTaxInvoice, logActivity, customers, taxRate }) => {
  const [description, setDescription] = useState('');
  const [revenue, setRevenue] = useState(0); // Acts as subtotal
  const [partsCost, setPartsCost] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [customerId, setCustomerId] = useState<string>('');
  
  const [amountPaid, setAmountPaid] = useState<number>(0);

  // Calculations
  const subtotal = revenue;
  const taxAmount = subtotal * (taxRate / 100);
  const totalWithTax = subtotal + taxAmount;
  const remainingBalance = Math.max(0, totalWithTax - amountPaid);

  // Reset amount paid to total when revenue changes (default to full payment)
  useEffect(() => {
      setAmountPaid(totalWithTax);
  }, [revenue, taxRate]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || revenue <= 0) {
      alert('الرجاء إدخال وصف للخدمة وإيراد صحيح.');
      return;
    }
    
    addService({
      date: new Date().toISOString(),
      description,
      revenue,
      partsCost,
      paymentMethod,
      customerId: customerId || null,
      // Tax and Debt logic
      taxRate: taxRate,
      taxAmount: taxAmount,
      totalAmount: totalWithTax,
      amountPaid: amountPaid,
      remainingBalance: remainingBalance,
      isFullyPaid: remainingBalance <= 0.01
    });
    
    // Reset form
    setDescription('');
    setRevenue(0);
    setPartsCost(0);
    setPaymentMethod('cash');
    setCustomerId('');
    setAmountPaid(0);
  };

  const sortedServices = [...services].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const getCustomerName = (id: string | null | undefined) => {
      if (!id) return 'عميل عام';
      const c = customers.find(cust => cust.id === id);
      return c ? c.name : 'غير معروف';
  };


  return (
    <div className="space-y-6">
       <div className="flex justify-between items-start">
        <h1 className="text-3xl font-bold text-gray-800">سجل الصيانة</h1>
      </div>
      <div id="services-form" className="bg-white p-8 rounded-xl shadow-lg max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">تسجيل خدمة جديدة</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium mb-1">وصف المشكلة/الخدمة</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
          
          <div>
            <label className="block font-medium mb-1">العميل (اختياري)</label>
            <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50"
            >
                <option value="">عميل عام</option>
                {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">تكلفة الخدمة (إيراد)</label>
              <input
                type="number"
                value={revenue}
                onChange={(e) => setRevenue(parseFloat(e.target.value) || 0)}
                className="w-full p-2 border border-gray-300 rounded-lg"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block font-medium mb-1">تكلفة قطع الغيار</label>
              <input
                type="number"
                value={partsCost}
                onChange={(e) => setPartsCost(parseFloat(e.target.value) || 0)}
                className="w-full p-2 border border-gray-300 rounded-lg"
                min="0"
              />
            </div>
          </div>
           <div>
                <label className="block font-medium mb-1">طريقة الدفع</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50">
                    <option value="cash">نقدي</option>
                    <option value="card">بطاقة</option>
                    <option value="bank_transfer">تحويل بنكي</option>
                </select>
            </div>

             {/* Financial Breakdown Section */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                 <div className="flex justify-between text-gray-600 text-sm">
                     <span>تكلفة الخدمة (قبل الضريبة):</span>
                     <span>{subtotal.toLocaleString()} ج.م</span>
                 </div>
                 <div className="flex justify-between text-gray-600 text-sm">
                     <span>الضريبة ({taxRate}%):</span>
                     <span>{taxAmount.toLocaleString()} ج.م</span>
                 </div>
                 <div className="flex justify-between font-bold text-lg text-gray-800 border-t pt-2 border-gray-300">
                     <span>الإجمالي النهائي:</span>
                     <span>{totalWithTax.toLocaleString()} ج.م</span>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4 pt-2">
                     <div>
                         <label className="block text-xs font-medium text-gray-700 mb-1">المبلغ المدفوع</label>
                         <input 
                            type="number" 
                            value={amountPaid} 
                            onChange={e => setAmountPaid(parseFloat(e.target.value) || 0)} 
                            className="w-full p-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                         />
                     </div>
                     <div className="bg-white p-2 rounded border border-gray-300 flex flex-col justify-center items-center">
                         <span className="text-xs text-gray-500">المتبقي (دين)</span>
                         <span className={`font-bold ${remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                             {remainingBalance.toLocaleString()} ج.م
                         </span>
                     </div>
                 </div>
                 {!customerId && remainingBalance > 0 && (
                     <p className="text-xs text-red-500 text-center">تنبيه: يجب اختيار عميل لتسجيل الدين.</p>
                 )}
            </div>
          
          <button type="submit" disabled={!customerId && remainingBalance > 0} className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition font-bold text-lg disabled:bg-gray-400 disabled:cursor-not-allowed">
            تسجيل الخدمة
          </button>
        </form>
      </div>

      <div id="services-log" className="bg-white p-6 rounded-xl shadow-lg mt-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">سجل الخدمات</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="border-b-2 border-gray-200 bg-gray-50">
              <tr>
                <th className="p-3 text-sm font-semibold tracking-wide text-right">رقم الطلب</th>
                <th className="p-3 text-sm font-semibold tracking-wide text-right">التاريخ</th>
                <th className="p-3 text-sm font-semibold tracking-wide text-right">العميل</th>
                <th className="p-3 text-sm font-semibold tracking-wide text-right">الوصف</th>
                <th className="p-3 text-sm font-semibold tracking-wide text-right">الإجمالي</th>
                <th className="p-3 text-sm font-semibold tracking-wide text-right">المدفوع</th>
                <th className="p-3 text-sm font-semibold tracking-wide text-right">المتبقي</th>
                <th className="p-3 text-sm font-semibold tracking-wide text-right">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {sortedServices.map(service => {
                // Use stored values if available (new records), fallback to old logic
                const displayTotal = service.totalAmount !== undefined ? service.totalAmount : service.revenue;
                const displayPaid = service.amountPaid !== undefined ? service.amountPaid : displayTotal;
                const displayDebt = service.remainingBalance !== undefined ? service.remainingBalance : 0;

                return (
                  <tr key={service.orderId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 font-mono text-sm">{service.orderId}</td>
                    <td className="p-3 text-sm">{new Date(service.date).toLocaleDateString('ar-EG')}</td>
                    <td className="p-3 text-sm">{getCustomerName(service.customerId)}</td>
                    <td className="p-3 font-medium text-gray-700 text-sm">{service.description}</td>
                    <td className="p-3 font-bold text-sm">{displayTotal.toLocaleString()} ج.م</td>
                    <td className="p-3 text-green-600 text-sm">{displayPaid.toLocaleString()} ج.م</td>
                    <td className={`p-3 font-bold text-sm ${displayDebt > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                        {displayDebt > 0 ? displayDebt.toLocaleString() + ' ج.م' : '-'}
                    </td>
                     <td className="p-3">
                        <button 
                            onClick={() => createTaxInvoice(service.orderId, 'service')}
                            disabled={!!service.taxInfo}
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md hover:bg-blue-200 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
                        >
                            {service.taxInfo ? `ضريبية ${service.taxInfo.invoiceNumber}` : 'فاتورة ضريبية'}
                        </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {services.length === 0 && <p className="text-center p-6 text-gray-500">لا توجد خدمات صيانة مسجلة بعد.</p>}
        </div>
      </div>
    </div>
  );
};

export default ServiceLog;
