
import React, { useMemo, useState } from 'react';
import type { Product, Sale, Service, Expense, PurchaseOrder, AISettings, Store } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import Card from './Card';
import { getAiInsight } from '../services/geminiService';
import { PaperAirplaneIcon, BrainIcon, SparklesIcon } from './icons/Icons';


interface DashboardProps {
  store: Store; // We need the full store object for context
  products: (Product & { quantitySold: number; quantityAvailable: number; })[];
  sales: Sale[];
  services: Service[];
  expenses: Expense[];
  purchaseOrders: PurchaseOrder[];
  aiSettings: AISettings;
}

const Dashboard: React.FC<DashboardProps> = ({ store, products, sales, services, expenses, purchaseOrders, aiSettings }) => {
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Get the latest proactive suggestion
  const latestAiMessage = useMemo(() => {
      if (store.aiMessages && store.aiMessages.length > 0) {
          // Sort by timestamp descending to get the newest
          return [...store.aiMessages].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      }
      return null;
  }, [store.aiMessages]);

  const kpis = useMemo(() => {
    const grossSales = sales.reduce((acc, sale) => acc + (sale.quantity * sale.unitPrice), 0);
    const serviceRevenue = services.reduce((acc, service) => acc + service.revenue, 0);
    const totalRevenue = grossSales + serviceRevenue;

    const costOfGoodsSold = sales.reduce((acc, sale) => {
      const product = products.find(p => p.id === sale.productId);
      return acc + (sale.quantity * (product?.costPrice || 0));
    }, 0);

    const partsCost = services.reduce((acc, service) => acc + service.partsCost, 0);
    const costOfRevenue = costOfGoodsSold + partsCost;
    
    const grossProfit = totalRevenue - costOfRevenue;

    const operatingExpenses = expenses.reduce((acc, expense) => acc + expense.amount, 0);
    const supplierPayments = purchaseOrders.flatMap(po => po.payments).reduce((acc, p) => acc + p.amount, 0);
    
    const netProfit = grossProfit - operatingExpenses - supplierPayments;

    return { totalRevenue, grossProfit, supplierPayments, operatingExpenses, netProfit };
  }, [sales, services, expenses, products, purchaseOrders]);

  const topSellingProducts = useMemo(() => {
    const productSales: { [key: string]: { name: string; total: number } } = {};
    sales.forEach(sale => {
      const product = products.find(p => p.id === sale.productId);
      if (product) {
        if (!productSales[product.id]) {
          productSales[product.id] = { name: product.name, total: 0 };
        }
        productSales[product.id].total += sale.quantity * sale.unitPrice;
      }
    });
    return Object.values(productSales)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [sales, products]);

  const monthlyData = useMemo(() => {
    const dataByMonth: { [key: string]: { month: string; sales: number; services: number } } = {};
    [...sales, ...services].forEach(item => {
      const date = new Date(item.date);
      const month = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      if (!dataByMonth[month]) {
        dataByMonth[month] = { month, sales: 0, services: 0 };
      }
      if ('productId' in item) { // It's a Sale
        dataByMonth[month].sales += item.quantity * item.unitPrice;
      } else { // It's a Service
        dataByMonth[month].services += item.revenue;
      }
    });
    return Object.values(dataByMonth).sort((a,b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  }, [sales, services]);
  
  const handleAiQuery = async () => {
    if (!aiQuery.trim()) return;
    setIsLoading(true);
    setAiResponse('');
    try {
      // Pass the full store object to access instructions and latest data
      const response = await getAiInsight(aiQuery, store, aiSettings);
      setAiResponse(response);
    } catch (error) {
      console.error("Error fetching AI insight:", error);
      setAiResponse('عذرًا، حدث خطأ أثناء الاتصال بالمساعد الذكي.');
    } finally {
      setIsLoading(false);
      setAiQuery('');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <h1 className="text-3xl font-bold text-gray-800">لوحة التحكم</h1>
      </div>
      
      <div id="dashboard-kpis" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card title="إجمالي الإيرادات" value={`${kpis.totalRevenue.toLocaleString()} ج.م`} />
        <Card title="إجمالي الربح" value={`${kpis.grossProfit.toLocaleString()} ج.م`} />
        <Card title="مدفوعات الموردين" value={`${kpis.supplierPayments.toLocaleString()} ج.م`} />
        <Card title="المصروفات التشغيلية" value={`${kpis.operatingExpenses.toLocaleString()} ج.م`} />
        <Card title="صافي الربح" value={`${kpis.netProfit.toLocaleString()} ج.م`} isHighlight />
      </div>
      
      {aiSettings.enableDashboardInsights && (
        <div id="dashboard-ai-assistant" className="bg-gradient-to-br from-white to-indigo-50 p-6 rounded-xl shadow-lg border border-indigo-100">
            <div className="flex items-center mb-4">
                <BrainIcon />
                <h3 className="font-bold text-xl text-gray-800 mr-2">مركز الذكاء الاصطناعي</h3>
                <span className="mr-auto bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full flex items-center">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full ml-1 animate-pulse"></div>
                    متصل بالبيانات الحية
                </span>
            </div>

            {/* Proactive Insights Section */}
            {latestAiMessage && (
                <div className="mb-6 p-4 bg-white rounded-lg border border-indigo-200 shadow-sm">
                     <div className="flex items-center text-indigo-600 mb-2">
                        <SparklesIcon />
                        <span className="font-bold mr-2">رؤية استباقية جديدة:</span>
                     </div>
                     <p className="text-gray-700 leading-relaxed">
                         {latestAiMessage.content}
                     </p>
                </div>
            )}

            <div className="relative">
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAiQuery()}
                placeholder="اسأل عن بياناتك... مثال: ما هي المنتجات التي يجب أن أطلبها قريبًا؟"
                className="w-full p-4 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm"
                disabled={isLoading}
              />
              <button
                onClick={handleAiQuery}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-400 transition"
                disabled={isLoading}
              >
                <PaperAirplaneIcon />
              </button>
            </div>
            {isLoading && <p className="mt-4 text-gray-600 animate-pulse flex items-center"><span className="ml-2 text-2xl">🤖</span> جاري تحليل بيانات المتجر...</p>}
            {aiResponse && (
              <div className="mt-4 p-4 bg-white border border-gray-200 rounded-xl shadow-sm animate-fade-in">
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{aiResponse}</p>
              </div>
            )}
        </div>
      )}

      <div id="dashboard-charts" className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="font-bold text-xl mb-4 text-gray-700">أفضل 5 منتجات مبيعًا</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topSellingProducts} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: number) => `${value.toLocaleString()} ج.م`} />
              <Legend />
              <Bar dataKey="total" name="المبيعات" fill="#4f46e5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="font-bold text-xl mb-4 text-gray-700">الأداء الشهري</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => `${value.toLocaleString()} ج.م`} />
              <Legend />
              <Line type="monotone" dataKey="sales" name="مبيعات المنتجات" stroke="#4f46e5" strokeWidth={2} />
              <Line type="monotone" dataKey="services" name="إيرادات الخدمات" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
    </div>
  );
};

export default Dashboard;
