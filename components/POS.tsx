
import React, { useState, useEffect, useMemo } from 'react';
import type { Product, Sale, Customer, PaymentMethod, SaleReturn, ReturnReason } from '../types';

interface POSProps {
  products: (Product & { quantityAvailable: number })[];
  addSale: (sale: Omit<Sale, 'invoiceId' | 'taxInfo'>) => void;
  sales: Sale[];
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'joinDate' | 'loyaltyPoints' | 'transactions'>) => Customer;
  createTaxInvoice: (sourceId: string, sourceType: 'sale') => void;
  saleReturns: SaleReturn[];
  addSaleReturn: (saleReturn: Omit<SaleReturn, 'id' | 'date'>) => void;
  logActivity: (action: string) => void;
  taxRate: number; // Received from App
}

const POS: React.FC<POSProps> = ({ products, addSale, sales, customers, addCustomer, createTaxInvoice, saleReturns, addSaleReturn, logActivity, taxRate }) => {
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [productName, setProductName] = useState('');
  const [maxQuantity, setMaxQuantity] = useState(0);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  
  // Tax and Payment State
  const [amountPaid, setAmountPaid] = useState<number>(0);
  
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
  
  // Calculations
  const subtotal = quantity * unitPrice;
  const taxAmount = subtotal * (taxRate / 100);
  const totalWithTax = subtotal + taxAmount;
  const remainingBalance = Math.max(0, totalWithTax - amountPaid);

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

  // Reset amount paid when total changes to avoid confusion, or set default full payment
  useEffect(() => {
      if (productId && unitPrice > 0) {
          // By default, set amount paid to full total
          // We use a timeout to let the subtotal calculation update first in the render cycle
          // Ideally we'd derive it, but we need it editable.
          const calculatedSub = quantity * unitPrice;
          const calculatedTax = calculatedSub * (taxRate / 100);
          setAmountPaid(calculatedSub + calculatedTax);
      } else {
          setAmountPaid(0);
      }
  }, [quantity, unitPrice, productId, taxRate]);

  
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

    if (amountPaid < 0) {
        alert('المبلغ المدفوع لا يمكن أن يكون سالباً.');
        return;
    }

    addSale({
      date: new Date().toISOString(),
      productId,
      quantity,
      unitPrice,
      customerId,
      paymentMethod,
      // Tax & Payment Details
      subtotal: subtotal,
      taxRate: taxRate,
      taxAmount: taxAmount,
      totalAmount: totalWithTax,
      amountPaid: amountPaid,
      remainingBalance: remainingBalance,
      isFullyPaid: remainingBalance <= 0.01 // Tolerance for float errors
    });

    // Reset form
    setProductId('');
    setQuantity(1);
    setUnitPrice(0);
    setProductName('');
    setCustomerId(null);
    setPaymentMethod('cash');
    setAmountPaid(0);

    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };


  const filteredSales = useMemo(() => {
    let filtered = sales;

    switch (filterType) {
        case 'today': {
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            filtered = sales.filter(sale => new Date(sale.date) >= startOfToday);
            break;
        }
        case 'last7': {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(new Date().getDate() - 7);
            sevenDaysAgo.setHours(0, 0, 0, 0);
            filtered = sales.filter(sale => new Date(sale.date) >= sevenDaysAgo);
            break;
        }
        case 'custom': {
             const start = startDate ? new Date(startDate) : null;
            if (start) start.setHours(0, 0, 0, 0);
            const end = endDate ? new Date(endDate) : null;
            if (end) end.setHours(23, 59, 59, 999);
            if(start && end) filtered = sales.filter(s => new Date(s.date) >= start && new Date(s.date) <= end);
            else if(start) filtered = sales.filter(s => new Date(s.date) >= start);
            else if(end) filtered = sales.filter(s => new Date(s.date) <= end);
            break;
        }
        default: break;
    }

    return [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
            <div className="mb-4 p-3 bg-green-100 text-green-700 border border-green-200 rounded-lg text-center">
                تمت عملية البيع بنجاح!
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
                        <button type="button" onClick={handleAddNewCustomer} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition">حفظ</button>
                        <button type="button" onClick={() => setShowNewCustomerForm(false)} className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition">إلغاء</button>
                    </div>
                </div>
            )}
          </div>

          {/* Financial Breakdown Section */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
             <div className="flex justify-between text-gray-600">
                 <span>المجموع الفرعي:</span>
                 <span>{subtotal.toLocaleString()} ج.م</span>
             </div>
             <div className="flex justify-between text-gray-600">
                 <span>الضريبة ({taxRate}%):</span>
                 <span>{taxAmount.toLocaleString()} ج.م</span>
             </div>
             <div className="flex justify-between font-bold text-xl text-gray-800 border-t pt-2 border-gray-300">
                 <span>الإجمالي النهائي:</span>
                 <span>{totalWithTax.toLocaleString()} ج.م</span>
             </div>
             
             <div className="grid grid-cols-2 gap-4 pt-2">
                 <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ المدفوع</label>
                     <input 
                        type="number" 
                        value={amountPaid} 
                        onChange={e => setAmountPaid(parseFloat(e.target.value) || 0)} 
                        className="w-full p-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                     />
                 </div>
                 <div className="bg-white p-2 rounded border border-gray-300 flex flex-col justify-center items-center">
                     <span className="text-xs text-gray-500">المتبقي (دين)</span>
                     <span className={`font-bold text-lg ${remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                         {remainingBalance.toLocaleString()} ج.م
                     </span>
                 </div>
             </div>
             {customerId === null && remainingBalance > 0 && (
                 <p className="text-xs text-red-500 text-center">تنبيه: لا يمكن تسجيل دين لعميل عام. يرجى اختيار عميل مسجل.</p>
             )}
          </div>
          
          <button type="submit" disabled={!productId || (customerId === null && remainingBalance > 0)} className="w-full bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 transition font-bold text-lg disabled:bg-gray-400 disabled:cursor-not-allowed">
            إتمام البيع
          </button>
        </form>
      </div>

      <div id="pos-log" className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">سجل المبيعات</h2>
        <div className="flex flex-wrap items-center gap-4 mb-4 pb-4 border-b">
            <label className="font-medium text-gray-700">فلترة السجل:</label>
            <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="p-2 border border-gray-300 rounded-lg bg-gray-50"
            >
                <option value="all">عرض الكل</option>
                <option value="today">اليوم</option>
                <option value="last7">آخر 7 أيام</option>
                <option value="custom">نطاق مخصص</option>
            </select>
            {filterType === 'custom' && (
                <div className="flex items-center gap-2">
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border border-gray-300 rounded-lg" />
                    <span>إلى</span>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border border-gray-300 rounded-lg" min={startDate} />
                </div>
            )}
        </div>
        
        <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="border-b-2 border-gray-200 bg-gray-50">
                <tr>
                  <th className="p-3">رقم الفاتورة</th>
                  <th className="p-3">التاريخ</th>
                  <th className="p-3">المنتج</th>
                  <th className="p-3">العميل</th>
                  <th className="p-3">الإجمالي (شامل الضريبة)</th>
                  <th className="p-3">المدفوع</th>
                  <th className="p-3">المتبقي</th>
                  <th className="p-3">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map(sale => {
                   // Use stored totals if available (new data), otherwise calculate on fly (fallback)
                   const displayTotal = sale.totalAmount || (sale.quantity * sale.unitPrice); 
                   const displayPaid = sale.amountPaid !== undefined ? sale.amountPaid : displayTotal;
                   const displayDebt = sale.remainingBalance !== undefined ? sale.remainingBalance : 0;
                   
                   const returnedQuantity = saleReturns.filter(r => r.originalSaleInvoiceId === sale.invoiceId).reduce((sum, r) => sum + r.quantity, 0);
                   const isFullyReturned = returnedQuantity >= sale.quantity;

                  return (
                  <tr key={sale.invoiceId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 font-mono">{sale.invoiceId}</td>
                    <td className="p-3">{new Date(sale.date).toLocaleString('ar-EG')}</td>
                    <td className="p-3 font-medium text-gray-700">{getProductNameById(sale.productId)}</td>
                    <td className="p-3">{getCustomerNameById(sale.customerId)}</td>
                    <td className="p-3 font-bold">{displayTotal.toLocaleString()} ج.م</td>
                    <td className="p-3 text-green-600">{displayPaid.toLocaleString()} ج.م</td>
                    <td className={`p-3 font-bold ${displayDebt > 0 ? 'text-red-600' : 'text-gray-400'}`}>{displayDebt > 0 ? displayDebt.toLocaleString() + ' ج.م' : '-'}</td>
                    <td className="p-3">
                        <div className="flex gap-2">
                            <button 
                                onClick={() => createTaxInvoice(sale.invoiceId, 'sale')}
                                disabled={!!sale.taxInfo}
                                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md hover:bg-blue-200 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
                            >
                                {sale.taxInfo ? `ضريبية ${sale.taxInfo.invoiceNumber}` : 'فاتورة ضريبية'}
                            </button>
                            <button 
                                onClick={() => setReturnModalData(sale)}
                                disabled={isFullyReturned}
                                className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-md hover:bg-orange-200 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
                            >
                                {isFullyReturned ? 'تم الإرجاع' : 'إرجاع'}
                            </button>
                        </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredSales.length === 0 && <p className="text-center p-6 text-gray-500">لا توجد مبيعات تطابق هذا الفلتر.</p>}
        </div>
      </div>
       {returnModalData && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-white p-6 rounded-lg w-full max-w-lg space-y-4">
                    <h3 className="font-bold text-lg">إرجاع من الفاتورة: {returnModalData.invoiceId}</h3>
                    <p>المنتج: {getProductNameById(returnModalData.productId)}</p>
                    <div>
                        <label>الكمية المرتجعة:</label>
                        <input 
                            type="number"
                            value={returnQuantity}
                            onChange={e => setReturnQuantity(parseInt(e.target.value, 10))}
                            min="1"
                            max={returnModalData.quantity - saleReturns.filter(r => r.originalSaleInvoiceId === returnModalData.invoiceId).reduce((s, r) => s + r.quantity, 0)}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div>
                        <label>سبب الإرجاع:</label>
                        <select value={returnReason} onChange={e => setReturnReason(e.target.value as ReturnReason)} className="w-full p-2 border rounded">
                            <option value="customer_dissatisfaction">عدم رضا العميل</option>
                            <option value="defective">منتج تالف</option>
                            <option value="wrong_item">منتج خاطئ</option>
                            <option value="other">سبب آخر</option>
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleReturnSubmit} className="bg-green-500 text-white px-4 py-2 rounded">تأكيد الإرجاع</button>
                        <button onClick={() => setReturnModalData(null)} className="bg-gray-400 text-white px-4 py-2 rounded">إلغاء</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default POS;
