
import React, { useState, useEffect, useMemo } from 'react';
import type { Product, Sale, Customer, PaymentMethod, SaleReturn, ReturnReason, Invoice, Store } from '../types';
import InvoiceViewer from './InvoiceViewer';
import { CloudArrowUpIcon, CheckCircleIcon } from './icons/Icons';

interface POSProps {
  store: Store;
  products: (Product & { quantityAvailable: number })[];
  addSale: (sale: Omit<Sale, 'invoiceId'>) => void;
  sales: Sale[];
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'joinDate' | 'loyaltyPoints' | 'transactions'>) => Customer;
  createTaxInvoice: (sourceId: string, sourceType: 'sale') => void;
  updateInvoiceStatus: (id: string, status: 'pending' | 'reported' | 'accepted' | 'rejected') => void;
  saleReturns: SaleReturn[];
  addSaleReturn: (saleReturn: Omit<SaleReturn, 'id' | 'date' | 'status'>) => void;
  logActivity: (action: string) => void;
  taxRate: number;
  invoices: Invoice[];
}

const POS: React.FC<POSProps> = ({ store, products, addSale, sales, customers, addCustomer, createTaxInvoice, updateInvoiceStatus, saleReturns, addSaleReturn, logActivity, taxRate, invoices }) => {
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [productName, setProductName] = useState('');
  const [maxQuantity, setMaxQuantity] = useState(0);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [installmentConfig, setInstallmentConfig] = useState({
      downPayment: 0,
      numberOfInstallments: 3,
      interestRate: 10,
  });
  
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  const [filterType, setFilterType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [returnModalData, setReturnModalData] = useState<Sale | null>(null);
  const [returnQuantity, setReturnQuantity] = useState(1);
  const [returnReason, setReturnReason] = useState<ReturnReason>('customer_dissatisfaction');

  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  
  const subtotal = quantity * unitPrice;
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
    if (productId) {
      const selectedProduct = products.find(p => p.id === productId);
      if (selectedProduct) {
        setUnitPrice(selectedProduct.sellPrice);
        setProductName(selectedProduct.name);
        setMaxQuantity(selectedProduct.quantityAvailable);
        if (quantity > selectedProduct.quantityAvailable) {
          setQuantity(selectedProduct.quantityAvailable);
        }
      }
    } else {
      setUnitPrice(0);
      setProductName('');
      setMaxQuantity(0);
    }
  }, [productId, products, quantity]);

  useEffect(() => {
      if (paymentMethod !== 'installment' && productId && unitPrice > 0) {
          setAmountPaid(totalWithTax);
      } else {
          setAmountPaid(0);
      }
  }, [quantity, unitPrice, productId, taxRate, paymentMethod, totalWithTax]);

  
  useEffect(() => {
    if(returnModalData) {
        const returnedQtyForThisSale = saleReturns
            .filter(r => r.originalSaleInvoiceId === returnModalData.invoiceId)
            .reduce((sum, r) => sum + r.quantity, 0);
        const maxReturn = returnModalData.quantity - returnedQtyForThisSale;
        setReturnQuantity(maxReturn > 0 ? 1 : 0);
    }
  }, [returnModalData, saleReturns]);


  const handleAddNewCustomer = () => {
    if (!newCustomerName.trim() || !newCustomerPhone.trim()) {
        alert('الرجاء إدخال اسم ورقم هاتف العميل.');
        return;
    }
    const newCustomer = addCustomer({ name: newCustomerName, phone: newCustomerPhone });
    setCustomerId(newCustomer.id);
    setNewCustomerName('');
    setNewCustomerPhone('');
    setShowNewCustomerForm(false);
  };
  
  const handleReturnSubmit = () => {
    if (!returnModalData || returnQuantity <= 0) return;
    
    addSaleReturn({
        originalSaleInvoiceId: returnModalData.invoiceId,
        productId: returnModalData.productId,
        customerId: returnModalData.customerId,
        quantity: returnQuantity,
        amountReturned: returnQuantity * returnModalData.unitPrice,
        reason: returnReason,
    });
    setReturnModalData(null);
    alert("تم تسجيل المرتجع بنجاح وتم إعادة الكمية للمخزون.");
  };
  
  const handleSendToZatca = async (invoiceId: string) => {
      if (window.confirm('هل أنت متأكد من إرسال الفاتورة لهيئة الزكاة والضريبة والجمارك؟ لا يمكن التراجع عن هذا الإجراء.')) {
          setSendingId(invoiceId);
          // Simulate API call delay
          setTimeout(() => {
              updateInvoiceStatus(invoiceId, 'accepted');
              setSendingId(null);
              alert('تم إرسال الفاتورة واعتمادها من الهيئة بنجاح (محاكاة).');
          }, 2000);
      }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || quantity <= 0 || unitPrice <= 0) {
      alert('الرجاء اختيار منتج وتحديد كمية وسعر صحيحين.');
      return;
    }
    if (quantity > maxQuantity) {
      alert(`الكمية المطلوبة غير متوفرة. الكمية المتاحة: ${maxQuantity}`);
      return;
    }
    if (paymentMethod === 'installment' && !customerId) {
        alert('يجب اختيار عميل مسجل لتفعيل خيار التقسيط.');
        return;
    }

    const salePayload: Omit<Sale, 'invoiceId'> = {
      date: new Date().toISOString(),
      productId,
      quantity,
      unitPrice,
      customerId,
      paymentMethod,
      subtotal,
      taxRate,
      taxAmount,
      totalAmount: totalWithTax,
      amountPaid: paymentMethod === 'installment' ? installmentConfig.downPayment : amountPaid,
      remainingBalance,
      isFullyPaid: remainingBalance <= 0.01
    };

    if (paymentMethod === 'installment') {
        salePayload.installmentDetails = installmentConfig;
    }

    addSale(salePayload);

    setProductId('');
    setQuantity(1);
    setUnitPrice(0);
    setProductName('');
    setCustomerId(null);
    setPaymentMethod('cash');
    setAmountPaid(0);
    setInstallmentConfig({ downPayment: 0, numberOfInstallments: 3, interestRate: 10 });

    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };


  const filteredSales = useMemo(() => {
    let filtered = sales || [];

    filtered = [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (filterType === 'today') {
        const todayStr = new Date().toISOString().split('T')[0];
        filtered = filtered.filter(s => s.date.startsWith(todayStr));
    } else if (filterType === 'last7') {
         const sevenDaysAgo = new Date();
         sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
         filtered = filtered.filter(s => new Date(s.date) >= sevenDaysAgo);
    } else if (filterType === 'custom' && startDate && endDate) {
         const start = new Date(startDate);
         const end = new Date(endDate);
         end.setHours(23, 59, 59);
         filtered = filtered.filter(s => new Date(s.date) >= start && new Date(s.date) <= end);
    }

    return filtered;
  }, [sales, filterType, startDate, endDate]);

  const getProductNameById = (id: string) => products.find(p => p.id === id)?.name || 'منتج محذوف';
  const getCustomerNameById = (id: string | null) => id ? customers.find(c => c.id === id)?.name : 'عميل عام';
  
  return (
    <div className="space-y-8">
       <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">نقطة البيع (POS)</h1>
          <p className="mt-1 text-gray-600">قم بإضافة فواتير المبيعات اليومية وتصفح السجل من هنا.</p>
        </div>
      </div>
      <div id="pos-form" className="bg-white p-8 rounded-xl shadow-lg max-w-4xl mx-auto">
        {showSuccessMessage && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 border border-green-200 rounded-lg text-center font-bold animate-fade-in-up">
                ✓ تمت عملية البيع بنجاح وتم تحديث المخزون والفواتير!
            </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium mb-1">المنتج</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50"
              required
            >
              <option value="">اختر منتجًا...</option>
              {products.filter(p => p.quantityAvailable > 0).map(p => (
                <option key={p.id} value={p.id}>
                  {p.id} - {p.name} (المتاح: {p.quantityAvailable})
                </option>
              ))}
            </select>
          </div>
          {productName && <p className="text-gray-600">المنتج المحدد: <span className="font-bold text-indigo-700">{productName}</span></p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">الكمية</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                min="1"
                max={maxQuantity > 0 ? maxQuantity : undefined}
                className="w-full p-2 border border-gray-300 rounded-lg"
                required
                disabled={!productId}
              />
            </div>
            <div>
              <label className="block font-medium mb-1">سعر الوحدة</label>
              <input
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                className="w-full p-2 border border-gray-300 rounded-lg"
                required
                disabled={!productId}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block font-medium mb-1">طريقة الدفع</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50">
                    <option value="cash">نقدي</option>
                    <option value="card">بطاقة</option>
                    <option value="bank_transfer">تحويل بنكي</option>
                    <option value="installment">تقسيط</option>
                </select>
            </div>
           </div>

          <div className="pt-2 border-t">
            <h3 className="text-lg font-semibold text-gray-700 mt-2 mb-2">العميل</h3>
            {!showNewCustomerForm ? (
                <div className="flex items-center gap-4">
                    <select
                        value={customerId || ''}
                        onChange={(e) => setCustomerId(e.target.value || null)}
                        className="flex-grow p-2 border border-gray-300 rounded-lg bg-gray-50"
                    >
                        <option value="">عميل عام (بدون تسجيل)</option>
                        {customers.map(c => (
                            <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                        ))}
                    </select>
                    <button type="button" onClick={() => setShowNewCustomerForm(true)} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition text-sm">إضافة عميل جديد</button>
                </div>
            ) : (
                <div className="p-4 bg-gray-50 rounded-lg border">
                    <h4 className="font-semibold mb-2">تسجيل عميل جديد</h4>
                    <div className="flex items-center gap-2">
                        <input type="text" value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} placeholder="اسم العميل" className="w-full p-2 border rounded" />
                        <input type="text" value={newCustomerPhone} onChange={e => setNewCustomerPhone(e.target.value)} placeholder="رقم الهاتف" className="w-full p-2 border rounded" />
                        <button type="button" onClick={handleAddNewCustomer} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">حفظ</button>
                        <button type="button" onClick={() => setShowNewCustomerForm(false)} className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500">إلغاء</button>
                    </div>
                </div>
            )}
          </div>

           {/* Calculations Display */}
           <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                 <div className="flex justify-between text-gray-600 text-sm">
                     <span>المجموع الفرعي:</span>
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
           </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white p-4 rounded-xl hover:bg-indigo-700 transition font-bold text-lg shadow-lg transform hover:scale-[1.01]"
          >
            إتمام عملية البيع
          </button>
        </form>
      </div>

      <div id="pos-sales-log" className="bg-white p-6 rounded-xl shadow-lg mt-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">سجل المبيعات اليومية</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="border-b-2 border-gray-200 bg-gray-50">
              <tr>
                <th className="p-3 text-sm font-semibold tracking-wide text-right">الفاتورة</th>
                <th className="p-3 text-sm font-semibold tracking-wide text-right">التاريخ</th>
                <th className="p-3 text-sm font-semibold tracking-wide text-right">المنتج</th>
                <th className="p-3 text-sm font-semibold tracking-wide text-right">العميل</th>
                <th className="p-3 text-sm font-semibold tracking-wide text-right">الإجمالي</th>
                <th className="p-3 text-sm font-semibold tracking-wide text-right">طريقة الدفع</th>
                <th className="p-3 text-sm font-semibold tracking-wide text-right">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map(sale => {
                 const invoice = invoices.find(inv => inv.id === sale.invoiceId);
                 const isSent = invoice?.zatcaStatus === 'accepted';
                 
                 return (
                  <tr key={sale.invoiceId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 font-mono text-sm">{sale.invoiceId}</td>
                    <td className="p-3 text-sm">{new Date(sale.date).toLocaleDateString('ar-EG')}</td>
                    <td className="p-3 font-medium text-gray-700 text-sm">{getProductNameById(sale.productId)}</td>
                    <td className="p-3 text-sm">{getCustomerNameById(sale.customerId)}</td>
                    <td className="p-3 font-bold text-sm">{sale.totalAmount.toLocaleString()} ج.م</td>
                    <td className="p-3 text-sm">{sale.paymentMethod === 'installment' ? 'تقسيط' : 'نقدي/أخرى'}</td>
                    <td className="p-3 flex gap-2 flex-wrap">
                         <button 
                             onClick={() => {setReturnModalData(sale);}}
                             className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                         >
                             إرجاع
                         </button>
                         {invoice ? (
                             <div className="flex gap-1">
                                 <button 
                                    onClick={() => setSelectedInvoice(invoice)}
                                    className={`text-xs px-2 py-1 rounded transition bg-blue-100 text-blue-700 hover:bg-blue-200`}
                                 >
                                     عرض / طباعة
                                 </button>
                                 {!isSent ? (
                                     <button 
                                         onClick={() => handleSendToZatca(invoice.id)}
                                         disabled={sendingId === invoice.id}
                                         className={`text-xs px-2 py-1 rounded transition flex items-center gap-1 text-white ${sendingId === invoice.id ? 'bg-purple-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'}`}
                                         title="إرسال الفاتورة الإلكترونية لهيئة الزكاة"
                                     >
                                         {sendingId === invoice.id ? 'جاري الإرسال...' : <><CloudArrowUpIcon /> إرسال (Fatoora)</>}
                                     </button>
                                 ) : (
                                     <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 border border-green-200 flex items-center gap-1 font-bold">
                                         <CheckCircleIcon /> معتمدة
                                     </span>
                                 )}
                             </div>
                         ) : (
                            <button 
                                onClick={() => createTaxInvoice(sale.invoiceId, 'sale')}
                                className={`text-xs px-2 py-1 rounded transition bg-green-100 text-green-700 hover:bg-green-200`}
                            >
                                توليد فاتورة إلكترونية
                            </button>
                         )}
                    </td>
                  </tr>
                 );
              })}
              {filteredSales.length === 0 && (
                  <tr><td colSpan={7} className="text-center p-6 text-gray-500">لا توجد مبيعات مسجلة.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {returnModalData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                  <h3 className="text-xl font-bold mb-4">إرجاع منتج</h3>
                  <p className="mb-2"><strong>المنتج:</strong> {getProductNameById(returnModalData.productId)}</p>
                  <p className="mb-4"><strong>الكمية المباعة:</strong> {returnModalData.quantity}</p>
                  
                  <div className="mb-4">
                      <label className="block text-sm font-bold mb-1">الكمية المرتجعة</label>
                      <input type="number" value={returnQuantity} onChange={e => setReturnQuantity(parseInt(e.target.value))} min="1" max={returnModalData.quantity} className="w-full p-2 border rounded" />
                  </div>
                  <div className="mb-4">
                       <label className="block text-sm font-bold mb-1">سبب الإرجاع</label>
                       <select value={returnReason} onChange={e => setReturnReason(e.target.value as ReturnReason)} className="w-full p-2 border rounded">
                           <option value="defective">منتج تالف</option>
                           <option value="wrong_item">منتج خاطئ</option>
                           <option value="customer_dissatisfaction">عدم رضا العميل</option>
                           <option value="other">أخرى</option>
                       </select>
                  </div>
                  <div className="flex gap-3">
                      <button onClick={handleReturnSubmit} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex-1">تأكيد الإرجاع</button>
                      <button onClick={() => setReturnModalData(null)} className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 flex-1">إلغاء</button>
                  </div>
              </div>
          </div>
      )}

      {selectedInvoice && (
          <InvoiceViewer 
              document={selectedInvoice} 
              type="invoice" 
              store={store} 
              onClose={() => setSelectedInvoice(null)} 
          />
      )}
    </div>
  );
};

export default POS;
