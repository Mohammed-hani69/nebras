import React, { useMemo, useState } from 'react';
import type { Product, Sale, Service, Expense, AISettings } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import Card from './Card';
import { getAiGeneralReportAnalysis } from '../services/geminiService';
import { BrainIcon, PaperAirplaneIcon } from './icons/Icons';

interface GeneralReportsProps {
  products: Product[];
  sales: Sale[];
  services: Service[];
  expenses: Expense[];
  aiSettings: AISettings;
}

const COLORS = ['#4f46e5', '#10b981'];

const GeneralReports: React.FC<GeneralReportsProps> = ({ products, sales, services, expenses, aiSettings }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);

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
    };
  }, [sales, services, expenses, startDate, endDate]);

  const reportKpis = useMemo(() => {
    const productSalesRevenue = filteredData.sales.reduce((acc, sale) => acc + (sale.quantity * sale.unitPrice), 0);
    const serviceRevenue = filteredData.services.reduce((acc, service) => acc + service.revenue, 0);
    const totalRevenue = productSalesRevenue + serviceRevenue;

    const totalExpenses = filteredData.expenses.reduce((acc, expense) => acc + expense.amount, 0);

    const cogs = filteredData.sales.reduce((acc, sale) => {
      const product = products.find(p => p.id === sale.productId);
      return acc + (sale.quantity * (product?.costPrice || 0));
    }, 0);
    const partsCost = filteredData.services.reduce((acc, service) => acc + service.partsCost, 0);
    
    const netProfit = totalRevenue - cogs - partsCost - totalExpenses;

    return { productSalesRevenue, serviceRevenue, totalExpenses, netProfit, totalRevenue };
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


  const topSellingProducts = useMemo(() => {
    const productSales: { [key: string]: { name: string; revenue: number } } = {};
    filteredData.sales.forEach(sale => {
      const product = products.find(p => p.id === sale.productId);
      if (product) {
        if (!productSales[product.id]) {
          productSales[product.id] = { name: product.name, revenue: 0 };
        }
        productSales[product.id].revenue += sale.quantity * sale.unitPrice;
      }
    });
    return Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredData, products]);

  const revenueComparisonData = useMemo(() => ([
      { name: 'إيرادات المنتجات', value: reportKpis.productSalesRevenue },
      { name: 'إيرادات الصيانة', value: reportKpis.serviceRevenue },
  ]), [reportKpis]);

  const handleAiAnalysis = async () => {
    setIsLoadingAi(true);
    setAiAnalysis('');
    try {
        const summary = {
            kpis: reportKpis,
            topProducts: topSellingProducts,
            dateRange: { start: startDate || 'بداية السجل', end: endDate || 'اليوم' }
        };
        const response = await getAiGeneralReportAnalysis(summary, aiSettings);
        setAiAnalysis(response);
    } catch (error) {
        setAiAnalysis('عذرًا، حدث خطأ أثناء الاتصال بالمساعد الذكي.');
    } finally {
        setIsLoadingAi(false);
    }
  };


  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">التقارير العامة</h1>

      <div id="general-reports-filter" className="bg-white p-4 rounded-xl shadow-lg">
          <div className="flex items-center gap-4 flex-wrap">
              <label className="font-medium">فلترة حسب التاريخ:</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border rounded-lg" />
              <span className="text-gray-500">إلى</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border rounded-lg" min={startDate} disabled={!startDate} />
              <button onClick={() => { setStartDate(''); setEndDate(''); }} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition">مسح الفلتر</button>
          </div>
      </div>
      
       <div className="text-center text-gray-600 font-semibold">
          عرض البيانات: {dateRangeText}
      </div>

       <div id="general-reports-kpis" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card title="إجمالي مبيعات المنتجات" value={`${reportKpis.productSalesRevenue.toLocaleString()} ج.م`} />
        <Card title="إجمالي إيراد الصيانة" value={`${reportKpis.serviceRevenue.toLocaleString()} ج.م`} />
        <Card title="إجمالي المصروفات" value={`${reportKpis.totalExpenses.toLocaleString()} ج.م`} />
        <Card title="صافي الربح" value={`${reportKpis.netProfit.toLocaleString()} ج.م`} isHighlight />
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="font-bold text-xl mb-4 text-gray-700">أفضل 5 منتجات مبيعًا</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topSellingProducts} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: number) => `${value.toLocaleString()} ج.م`} />
              <Legend />
              <Bar dataKey="revenue" name="الإيرادات" fill="#4f46e5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="font-bold text-xl mb-4 text-gray-700">مقارنة الإيرادات</h3>
           <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={revenueComparisonData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                 {revenueComparisonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
              </Pie>
              <Tooltip formatter={(value: number) => `${value.toLocaleString()} ج.م`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {aiSettings.enableReportAnalysis && (
        <div id="general-reports-ai" className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="flex items-center font-bold text-xl mb-4 text-gray-700">
              <BrainIcon />
              <span className="mr-2">تحليل بالذكاء الاصطناعي</span>
            </h3>
            <p className="text-gray-600 mb-4">احصل على رؤى وتحليلات عميقة للبيانات المعروضة حاليًا بناءً على الفلاتر التي اخترتها.</p>
            <button
                onClick={handleAiAnalysis}
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition font-bold"
                disabled={isLoadingAi}
              >
                {isLoadingAi ? 'جاري التحليل...' : 'تحليل البيانات الحالية'}
            </button>
            {isLoadingAi && <p className="mt-4 text-gray-600 animate-pulse">يفكر المساعد الذكي في بياناتك...</p>}
            {aiAnalysis && (
              <div className="mt-4 p-4 bg-gray-50 border-r-4 border-indigo-500 rounded-lg">
                <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: aiAnalysis.replace(/\n/g, '<br />') }} />
              </div>
            )}
        </div>
      )}

    </div>
  );
};

export default GeneralReports;