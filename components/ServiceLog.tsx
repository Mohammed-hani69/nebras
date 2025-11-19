

import React, { useState, useEffect, useMemo } from 'react';
// FIX: Add Invoice to type imports
import type { Service, PaymentMethod, Customer, Invoice } from '../types';

interface ServiceLogProps {
  services: Service[];
// FIX: Update addService prop to remove non-existent 'taxInfo' from Omit.
  addService: (service: Omit<Service, 'orderId'>) => void;
  createTaxInvoice: (sourceId: string, sourceType: 'service') => void;
  logActivity: (action: string) => void;
  customers: Customer[];
  taxRate: number;
  // FIX: Add invoices prop to check for existing tax invoices.
  invoices: Invoice[];
}

const ServiceLog: React.FC<ServiceLogProps> = ({ services, addService, createTaxInvoice, logActivity, customers, taxRate, invoices }) => {
  const [description, setDescription] = useState('');
  const [revenue, setRevenue] = useState(0); // Acts as subtotal
  const [partsCost, setPartsCost] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [customerId, setCustomerId] = useState<string>('');
  
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [installmentConfig, setInstallmentConfig] = useState({
    downPayment: 0,
    numberOfInstallments: 3,
    interestRate: 10,
  });


  // Calculations
  const subtotal = revenue;
  const taxAmount = subtotal * (taxRate / 100);
  const totalWithTax = subtotal + taxAmount;

  const { remainingBalance, installmentAmount, totalRepayment } = useMemo(() => {
    if (paymentMethod === 'installment') {
        const financedAmount = totalWithTax - installmentConfig.downPayment;
        const totalRepayment = financedAmount * (1 + (installmentConfig.interestRate / 100));
        const installmentAmount = installmentConfig.numberOfInstallments > 0 ? totalRepayment / installmentConfig.numberOfInstallments : 0;
        return { remainingBalance: financedAmount, installmentAmount, totalRepayment };
    }
    const remBal = Math.max(0, totalWithTax - amountPaid);
    return { remainingBalance: remBal, installmentAmount: 0, totalRepayment: 0 };
  }, [paymentMethod, totalWithTax, amountPaid, installmentConfig]);

  useEffect(() => {
      if (paymentMethod !== 'installment') {
        setAmountPaid(totalWithTax);
      } else {
        setAmountPaid(0); // Down payment will be handled separately
      }
  }, [revenue, taxRate, paymentMethod, totalWithTax]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || revenue <= 0) {
      alert('الرجاء إدخال وصف للخدمة وإيراد صحيح.');
      return;
    }
    if (paymentMethod === 'installment' && !customerId) {
        alert('يجب اختيار عميل مسجل لتفعيل خيار التقسيط.');
        return;
    }

    const servicePayload: Omit<Service, 'orderId'> = {
        date: new Date().toISOString(),
        description,
        revenue,
        partsCost,
        paymentMethod,
        customerId: customerId || null,
        taxRate,
        taxAmount,
        totalAmount: totalWithTax,
        amountPaid: paymentMethod === 'installment' ? installmentConfig.downPayment : amountPaid,
        remainingBalance,
        isFullyPaid: remainingBalance <= 0.01,
    };
    
    if (paymentMethod === 'installment') {
        servicePayload.installmentDetails = installmentConfig;
    }

    addService(servicePayload);
    
    // Reset form
    setDescription('');
    setRevenue(0);
    setPartsCost(0);
    setPaymentMethod('cash');
    setCustomerId('');
    setAmountPaid(0);
    setInstallmentConfig({ downPayment: 0, numberOfInstallments: 3, interestRate: 10 });
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
                    <option value="installment">تقسيط</option>
                </select>
            </div>

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
                 
                {paymentMethod === 'installment' ? (
                    <div className="pt-2 border-t border-gray-300 space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                            <div><label className="text-xs">الدفعة المقدمة</label><input type="number" value={installmentConfig.downPayment} onChange={e => setInstallmentConfig({...installmentConfig, downPayment: parseFloat(e.target.value) || 0})} className="w-full p-1 border rounded"/></div>
                            <div><label className="text-xs">عدد الأقساط</label><input type="number" value={installmentConfig.numberOfInstallments} onChange={e => setInstallmentConfig({...installmentConfig, numberOfInstallments: parseInt(e.target.value) || 1})} className="w-full p-1 border rounded" min="1"/></div>
                            <div><label className="text-xs">الفائدة (%)</label><input type="number" value={installmentConfig.interestRate} onChange={e => setInstallmentConfig({...installmentConfig, interestRate: parseFloat(e.target.value) || 0})} className="w-full p-1 border rounded"/></div>
                        </div>
                        <div className="bg-white p-2 rounded border border-indigo-200 text-center">
                            <p className="text-sm">قيمة القسط: <span className="font-bold text-indigo-700">{installmentAmount.toLocaleString('ar-EG', {minimumFractionDigits: 2, maximumFractionDigits: 2})} ج.م / شهرياً</span></p>
                        </div>
                    </div>
                 ) : (
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">المبلغ المدفوع</label>
                            <input type="number" value={amountPaid} onChange={e => setAmountPaid(parseFloat(e.target.value) || 0)} className="w-full p-2 border border-blue-300 rounded-lg"/>
                        </div>
                        <div className="bg-white p-2 rounded border border-gray-300 flex flex-col justify-center items-center">
                            <span className="text-xs text-gray-500">المتبقي (دين)</span>
                            <span className={`font-bold ${remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>{remainingBalance.toLocaleString()} ج.م</span>
                        </div>
                    </div>
                 )}
                 {!customerId && (paymentMethod === 'installment' || remainingBalance > 0) && (
                     <p className="text-xs text-red-500 text-center">تنبيه: يجب اختيار عميل لتسجيل الدين أو التقسيط.</p>
                 )}
            </div>
          
          <button type="submit" disabled={!customerId && (remainingBalance > 0 || paymentMethod === 'installment')} className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition font-bold text-lg disabled:bg-gray-400 disabled:cursor-not-allowed">
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
                const displayTotal = service.totalAmount !== undefined ? service.totalAmount : service.revenue;
                const displayPaid = service.amountPaid !== undefined ? service.amountPaid : displayTotal;
                const displayDebt = service.remainingBalance !== undefined ? service.remainingBalance : 0;
// FIX: Check for an existing tax invoice in the `invoices` array instead of the non-existent `taxInfo` property.
                const taxInvoice = invoices.find(inv => inv.sourceType === 'service' && inv.sourceId === service.orderId);

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
                            disabled={!!taxInvoice}
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md hover:bg-blue-200 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
                        >
                            {taxInvoice ? `ضريبية ${taxInvoice.id}` : 'فاتورة ضريبية'}
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
