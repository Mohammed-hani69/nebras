import React, { useMemo, useState } from 'react';
import type { Product, Sale, Service, Expense, PurchaseOrder } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from './Card';


interface FinancialReportsProps {
  products: Product[];
  sales: Sale[];
  services: Service[];
  expenses: Expense[];
  purchaseOrders: PurchaseOrder[];
}

const FinancialReports: React.FC<FinancialReportsProps> = ({ products, sales, services, expenses, purchaseOrders }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredData = useMemo(() => {
    const start = startDate ? new Date(startDate) : null;
    if (start) start.setHours(0, 0, 0, 0);

    const end = endDate ? new Date(endDate) : null;
    if (end) end.setHours(23, 59, 59, 999);

    const filterByDate = (item: { date: string }) => {
      if (!start && !end) return true;
      const itemDate = new Date(item.date);
      if (start && end) return itemDate >= start && itemDate <= end;
      if (start) return itemDate >= start;
      if (end) return itemDate <= end;
      return true;
    };

    return {
      sales: sales.filter(filterByDate),
      services: services.filter(filterByDate),
      expenses: expenses.filter(filterByDate),
      purchaseOrders: purchaseOrders.map(po => ({
          ...po,
          payments: po.payments.filter(filterByDate)
      })),
    };
  }, [sales, services, expenses, purchaseOrders, startDate, endDate]);

  const financialSummary = useMemo(() => {
    const totalSalesRevenue = filteredData.sales.reduce((acc, sale) => acc + (sale.quantity * sale.unitPrice), 0);
    const totalServiceRevenue = filteredData.services.reduce((acc, service) => acc + service.revenue, 0);
    const totalRevenue = totalSalesRevenue + totalServiceRevenue;

    const cogs = filteredData.sales.reduce((acc, sale) => {
      const product = products.find(p => p.id === sale.productId);
      return acc + (sale.quantity * (product?.costPrice || 0));
    }, 0);
    const totalPartsCost = filteredData.services.reduce((acc, service) => acc + service.partsCost, 0);
    const costOfRevenue = cogs + totalPartsCost;

    const grossProfit = totalRevenue - costOfRevenue;

    const totalOperatingExpenses = filteredData.expenses.reduce((acc, expense) => acc + expense.amount, 0);
    const totalSupplierPayments = filteredData.purchaseOrders.flatMap(po => po.payments).reduce((acc, p) => acc + p.amount, 0);
    
    const netProfit = grossProfit - totalOperatingExpenses - totalSupplierPayments;

    return { totalRevenue, costOfRevenue, grossProfit, totalOperatingExpenses, totalSupplierPayments, netProfit };
  }, [filteredData, products]);
  
  const chartData = useMemo(() => {
    const dataByMonth: { [key: string]: { month: string; income: number; costOfRevenue: number; expenses: number } } = {};
    
    const allTransactions = [
        ...filteredData.sales,
        ...filteredData.services,
        ...filteredData.expenses,
        ...filteredData.purchaseOrders.flatMap(po => po.payments.map(p => ({...p, type: 'supplier_payment'})))
    ];

    allTransactions.forEach((item: any) => {
      const date = new Date(item.date);
      const month = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      if (!dataByMonth[month]) {
        dataByMonth[month] = { month, income: 0, costOfRevenue: 0, expenses: 0 };
      }
      
      if ('productId' in item) { // Sale
        dataByMonth[month].income += item.quantity * item.unitPrice;
        const product = products.find(p => p.id === item.productId);
        dataByMonth[month].costOfRevenue += item.quantity * (product?.costPrice || 0);
      } else if ('revenue' in item) { // Service
        dataByMonth[month].income += item.revenue;
        dataByMonth[month].costOfRevenue += item.partsCost;
      } else if (item.type === 'supplier_payment'){ // Supplier Payment
        dataByMonth[month].expenses += item.amount;
      } else { // Expense
        dataByMonth[month].expenses += item.amount;
      }
    });

    return Object.values(dataByMonth).sort((a,b) => new Date(a.month).getTime() - new Date(b.month).getTime());

  }, [filteredData, products]);

  const dateRangeText = useMemo(() => {
    if (startDate && endDate) {
        return `من ${new Date(startDate).toLocaleDateString('ar-EG')} إلى ${new Date(endDate).toLocaleDateString('ar-EG')}`;
    }
    if (startDate) {
        return `من ${new Date(startDate).toLocaleDateString('ar-EG')} فصاعدًا`;
    }
    if (endDate) {
        return `حتى ${new Date(endDate).toLocaleDateString('ar-EG')}`;
    }
    return 'لكل الأوقات';
  }, [startDate, endDate]);


  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <h1 className="text-3xl font-bold text-gray-800">التقارير المالية</h1>
      </div>
      
      <div id="reports-filter" className="bg-white p-4 rounded-xl shadow-lg">
          <div className="flex items-center gap-4 flex-wrap">
              <label className="font-medium">فلترة حسب التاريخ:</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border rounded-lg" />
              <span className="text-gray-500">إلى</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border rounded-lg" min={startDate} />
              <button onClick={() => { setStartDate(''); setEndDate(''); }} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition">مسح الفلتر</button>
          </div>
      </div>

      <div className="text-center text-gray-600 font-semibold">
          عرض البيانات: {dateRangeText}
      </div>

      <div id="reports-summary" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <Card title="إجمالي الإيرادات" value={`${financialSummary.totalRevenue.toLocaleString()} ج.م`} />
        <Card title="تكلفة الإيرادات" value={`${financialSummary.costOfRevenue.toLocaleString()} ج.م`} />
        <Card title="إجمالي الربح" value={`${financialSummary.grossProfit.toLocaleString()} ج.م`} />
        <Card title="مدفوعات الموردين" value={`${financialSummary.totalSupplierPayments.toLocaleString()} ج.م`} />
        <Card title="المصروفات التشغيلية" value={`${financialSummary.totalOperatingExpenses.toLocaleString()} ج.م`} />
        <Card title="صافي الربح" value={`${financialSummary.netProfit.toLocaleString()} ج.م`} isHighlight />
      </div>

      <div id="reports-chart" className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="font-bold text-xl mb-4 text-gray-700">الأداء المالي الشهري</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => `${value.toLocaleString()} ج.م`} />
              <Legend />
              <Bar dataKey="income" name="الإيرادات" fill="#10b981" />
              <Bar dataKey="costOfRevenue" name="تكلفة الإيرادات" fill="#f59e0b" />
              <Bar dataKey="expenses" name="إجمالي المصروفات" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>

    </div>
  );
};

export default FinancialReports;