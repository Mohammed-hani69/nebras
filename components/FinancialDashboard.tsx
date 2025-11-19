
import React, { useMemo } from 'react';
import type { Store } from '../types';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, Legend, LineChart, Line, ComposedChart
} from 'recharts';
import { BanknotesIcon, ChartBarIcon, PresentationChartLineIcon, ArrowTrendingUpIcon, SparklesIcon, ExclamationTriangleIcon, BrainIcon } from './icons/Icons';

interface FinancialDashboardProps {
  store: Store;
}

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const FinancialDashboard: React.FC<FinancialDashboardProps> = ({ store }) => {

  const financialData = useMemo(() => {
    const { products, sales, services, expenses, purchaseOrders, payrolls, customers } = store;

    // --- 1. Totals Calculation ---
    const totalSalesRevenue = sales.reduce((acc, sale) => acc + (sale.totalAmount || (sale.quantity * sale.unitPrice)), 0);
    const totalServiceRevenue = services.reduce((acc, service) => acc + (service.totalAmount || service.revenue), 0);
    const totalRevenue = totalSalesRevenue + totalServiceRevenue;

    // Costs
    const costOfGoodsSold = sales.reduce((acc, sale) => {
      const product = products.find(p => p.id === sale.productId);
      return acc + (sale.quantity * (product?.costPrice || 0));
    }, 0);
    const partsCost = services.reduce((acc, service) => acc + service.partsCost, 0);
    const operatingExpenses = expenses.reduce((acc, expense) => acc + expense.amount, 0);
    const salariesPaid = (payrolls || []).filter(p => p.status === 'paid').reduce((acc, p) => acc + p.netSalary, 0);
    
    const totalExpenses = costOfGoodsSold + partsCost + operatingExpenses + salariesPaid;
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // --- 2. Top Products (Best Selling Items) ---
    const productPerformance = products.map(product => {
        const productSales = sales.filter(s => s.productId === product.id);
        const revenue = productSales.reduce((sum, s) => sum + (s.quantity * s.unitPrice), 0);
        const quantity = productSales.reduce((sum, s) => sum + s.quantity, 0);
        return { name: product.name, revenue, quantity };
    });
    const topProducts = productPerformance
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
        .filter(p => p.revenue > 0);

    // --- 3. Top Customers ---
    const customerSpending = customers.map(customer => {
        const salesTotal = sales.filter(s => s.customerId === customer.id).reduce((sum, s) => sum + (s.totalAmount || 0), 0);
        const servicesTotal = services.filter(s => s.customerId === customer.id).reduce((sum, s) => sum + (s.totalAmount || 0), 0);
        return { name: customer.name, totalSpent: salesTotal + servicesTotal };
    });
    const topCustomers = customerSpending
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 5)
        .filter(c => c.totalSpent > 0);

    // --- 4. Cashflow & Forecasting Logic ---
    const monthlyMap: { [key: string]: { monthStr: string; monthIndex: number; year: number; cashIn: number; cashOut: number } } = {};
    
    // Helper to sort months correctly
    const getMonthKey = (dateStr: string) => {
        const d = new Date(dateStr);
        return `${d.getFullYear()}-${d.getMonth()}`; // 2024-0, 2024-1
    };

    // Inflows
    [...sales, ...services].forEach(item => {
        const d = new Date(item.date);
        const key = getMonthKey(item.date);
        if (!monthlyMap[key]) monthlyMap[key] = { monthStr: d.toLocaleString('ar-EG', { month: 'short' }), monthIndex: d.getMonth(), year: d.getFullYear(), cashIn: 0, cashOut: 0 };
        monthlyMap[key].cashIn += item.amountPaid || 0;
    });
    
    // Outflows
    [...expenses].forEach(e => {
        const d = new Date(e.date);
        const key = getMonthKey(e.date);
        if (!monthlyMap[key]) monthlyMap[key] = { monthStr: d.toLocaleString('ar-EG', { month: 'short' }), monthIndex: d.getMonth(), year: d.getFullYear(), cashIn: 0, cashOut: 0 };
        monthlyMap[key].cashOut += e.amount;
    });
    purchaseOrders.flatMap(po => po.payments).forEach(p => {
         const d = new Date(p.date);
         const key = getMonthKey(p.date);
         if (!monthlyMap[key]) monthlyMap[key] = { monthStr: d.toLocaleString('ar-EG', { month: 'short' }), monthIndex: d.getMonth(), year: d.getFullYear(), cashIn: 0, cashOut: 0 };
         monthlyMap[key].cashOut += p.amount;
    });
    
    // Convert to array and sort
    let cashflowData = Object.values(monthlyMap).sort((a, b) => (a.year - b.year) || (a.monthIndex - b.monthIndex));
    
    // --- AI Forecasting ---
    // Calculate average growth rate for last 3 months to predict next month
    let forecastData = [];
    if (cashflowData.length >= 2) {
        const lastMonth = cashflowData[cashflowData.length - 1];
        const prevMonth = cashflowData[cashflowData.length - 2];
        
        // Simple linear projection
        const revenueGrowth = lastMonth.cashIn > 0 ? (lastMonth.cashIn - prevMonth.cashIn) / prevMonth.cashIn : 0;
        const expenseGrowth = lastMonth.cashOut > 0 ? (lastMonth.cashOut - prevMonth.cashOut) / prevMonth.cashOut : 0;
        
        // Cap growth at sensible limits for prediction (e.g., +/- 30%)
        const safeRevGrowth = Math.max(-0.3, Math.min(0.3, revenueGrowth));
        const safeExpGrowth = Math.max(-0.3, Math.min(0.3, expenseGrowth));

        const nextMonthIn = lastMonth.cashIn * (1 + safeRevGrowth);
        const nextMonthOut = lastMonth.cashOut * (1 + safeExpGrowth);
        
        const nextDate = new Date();
        nextDate.setMonth(nextDate.getMonth() + 1);
        
        forecastData = [
            ...cashflowData.map(d => ({ ...d, type: 'actual', predictedIn: null, predictedOut: null })),
            {
                monthStr: nextDate.toLocaleString('ar-EG', { month: 'short' }) + ' (توقع)',
                year: nextDate.getFullYear(),
                monthIndex: nextDate.getMonth(),
                cashIn: null,
                cashOut: null,
                predictedIn: nextMonthIn,
                predictedOut: nextMonthOut,
                type: 'forecast'
            }
        ];
    } else {
        forecastData = cashflowData.map(d => ({ ...d, type: 'actual', predictedIn: null, predictedOut: null }));
    }

    // --- 5. Expense Breakdown & Smart Classification ---
    const expenseBreakdown = [
        { name: 'تكلفة البضاعة', value: costOfGoodsSold },
        { name: 'قطع الغيار', value: partsCost },
        { name: 'رواتب', value: salariesPaid },
        { name: 'مصاريف تشغيلية', value: operatingExpenses },
    ].filter(e => e.value > 0);

    // Smart Expense Analysis
    const expenseAnomalies: string[] = [];
    const averageOperatingExpense = operatingExpenses / (cashflowData.length || 1);
    // Check specifically if current month expenses are spiking
    if (cashflowData.length > 0) {
        const currentMonthExp = cashflowData[cashflowData.length - 1].cashOut;
        const prevMonthExp = cashflowData.length > 1 ? cashflowData[cashflowData.length - 2].cashOut : currentMonthExp;
        
        if (currentMonthExp > prevMonthExp * 1.2) {
            expenseAnomalies.push(`المصروفات هذا الشهر أعلى بنسبة ${Math.round(((currentMonthExp/prevMonthExp)-1)*100)}% من الشهر السابق.`);
        }
    }
    
    // Identify biggest drain
    const sortedExpenses = expenseBreakdown.sort((a,b) => b.value - a.value);
    const biggestDrain = sortedExpenses.length > 0 ? sortedExpenses[0].name : 'لا يوجد';

    return { 
        totalRevenue, 
        totalExpenses, 
        netProfit, 
        profitMargin,
        topProducts, 
        topCustomers, 
        cashflowData: forecastData,
        expenseBreakdown,
        expenseAnomalies,
        biggestDrain
    };
  }, [store]);

  const StatCard = ({ title, value, subValue, icon, colorClass }: any) => (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between transition-transform hover:scale-[1.02]">
          <div>
              <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
              <h3 className="text-3xl font-bold text-gray-800">{value}</h3>
              {subValue && <p className={`text-sm mt-2 font-semibold ${colorClass}`}>{subValue}</p>}
          </div>
          <div className={`p-3 rounded-xl bg-opacity-10 ${colorClass.replace('text-', 'bg-').replace('600', '100')} ${colorClass}`}>
              {icon}
          </div>
      </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">التحليلات المالية</h1>
            <p className="text-gray-500 mt-1">نظرة شاملة على الأداء المالي والتدفقات النقدية</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border text-sm text-gray-600">
              العملة: <strong>جنية مصري (EGP)</strong>
          </div>
      </div>

      {/* --- Financial Intelligence Section --- */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          
          <div className="relative z-10 mb-6 flex items-center gap-3 border-b border-indigo-700 pb-4">
              <BrainIcon />
              <h2 className="text-2xl font-bold text-indigo-100">الذكاء المالي</h2>
              <span className="bg-indigo-600 text-xs px-2 py-1 rounded text-white">AI Powered</span>
          </div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* 1. Expense Warnings & Insights */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/10">
                  <h3 className="text-indigo-200 font-bold mb-3 flex items-center gap-2">
                      <ExclamationTriangleIcon />
                      تحليل المصاريف والمخاطر
                  </h3>
                  {financialData.expenseAnomalies.length > 0 ? (
                      <ul className="space-y-2">
                          {financialData.expenseAnomalies.map((warn, idx) => (
                              <li key={idx} className="text-sm bg-red-500/20 p-2 rounded text-red-100 border-r-2 border-red-500 animate-pulse">
                                  ⚠️ {warn}
                              </li>
                          ))}
                      </ul>
                  ) : (
                      <p className="text-sm text-green-300 bg-green-500/20 p-2 rounded border-r-2 border-green-500">
                          ✅ نمط المصروفات طبيعي ومستقر.
                      </p>
                  )}
                   <div className="mt-4 pt-3 border-t border-white/10">
                      <p className="text-xs text-indigo-300">أكبر استنزاف للميزانية:</p>
                      <p className="text-lg font-bold text-white">{financialData.biggestDrain}</p>
                  </div>
              </div>

              {/* 2. Smart Forecast */}
              <div className="lg:col-span-2 bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/10 flex flex-col">
                   <h3 className="text-indigo-200 font-bold mb-3 flex items-center gap-2">
                      <SparklesIcon />
                      تنبؤ التدفقات المالية (الشهر القادم)
                  </h3>
                  <div className="flex-1 min-h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={financialData.cashflowData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                            <XAxis dataKey="monthStr" stroke="#94a3b8" tick={{fill: '#cbd5e1'}} />
                            <YAxis stroke="#94a3b8" tick={{fill: '#cbd5e1'}} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', color: '#fff', borderRadius: '8px' }}
                                labelStyle={{ color: '#94a3b8' }}
                                formatter={(value: any) => typeof value === 'number' ? value.toLocaleString() : value}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="cashIn" name="إيراد فعلي" stroke="#34d399" strokeWidth={3} dot={{r: 4}} />
                            <Line type="monotone" dataKey="cashOut" name="مصروف فعلي" stroke="#f87171" strokeWidth={3} dot={{r: 4}} />
                            
                            {/* Forecast Lines (Dashed) */}
                            <Line type="monotone" dataKey="predictedIn" name="توقع الإيراد" stroke="#34d399" strokeWidth={3} strokeDasharray="5 5" dot={{r: 4, fill: '#fff'}} connectNulls />
                            <Line type="monotone" dataKey="predictedOut" name="توقع المصروف" stroke="#f87171" strokeWidth={3} strokeDasharray="5 5" dot={{r: 4, fill: '#fff'}} connectNulls />
                        </ComposedChart>
                    </ResponsiveContainer>
                  </div>
              </div>

          </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            title="إجمالي المبيعات والإيرادات" 
            value={financialData.totalRevenue.toLocaleString()} 
            subValue="الدخل الكلي"
            icon={<BanknotesIcon />} 
            colorClass="text-indigo-600"
        />
        <StatCard 
            title="إجمالي التكاليف والمصروفات" 
            value={financialData.totalExpenses.toLocaleString()} 
            subValue="شامل البضاعة والتشغيل"
            icon={<ChartBarIcon />} 
            colorClass="text-red-600"
        />
        <StatCard 
            title="صافي الربح" 
            value={financialData.netProfit.toLocaleString()} 
            subValue={`هامش ربح: ${financialData.profitMargin.toFixed(1)}%`}
            icon={<ArrowTrendingUpIcon />} 
            colorClass={financialData.netProfit >= 0 ? "text-emerald-600" : "text-red-600"}
        />
        <StatCard 
            title="أعلى عميل إنفاقاً" 
            value={financialData.topCustomers[0]?.totalSpent.toLocaleString() || '0'} 
            subValue={financialData.topCustomers[0]?.name || '-'}
            icon={<PresentationChartLineIcon />} 
            colorClass="text-amber-600"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Expense Breakdown Pie Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <h3 className="font-bold text-xl mb-2 text-gray-800">تصنيف المصروفات (تلقائي)</h3>
              <p className="text-sm text-gray-500 mb-6">توزيع التكاليف حسب الفئات</p>
              <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={financialData.expenseBreakdown}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {financialData.expenseBreakdown.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => value.toLocaleString() + ' ج.م'} />
                        <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{fontSize: '12px', paddingTop: '20px'}}/>
                    </PieChart>
                  </ResponsiveContainer>
              </div>
              <div className="mt-4 text-center">
                  <p className="text-sm text-gray-400">إجمالي المصروفات</p>
                  <p className="text-xl font-bold text-gray-800">{financialData.totalExpenses.toLocaleString()}</p>
              </div>
          </div>

          {/* Top Products */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <h3 className="font-bold text-lg mb-4 text-gray-800">أفضل 5 أصناف مبيعاً (بالإيرادات)</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={financialData.topProducts} layout="vertical" margin={{ left: 20, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11}} />
                        <Tooltip 
                            cursor={{fill: '#f3f4f6'}}
                            formatter={(value: number) => value.toLocaleString() + ' ج.م'} 
                        />
                        <Bar dataKey="revenue" name="الإيرادات" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
              </div>
          </div>

      </div>
    </div>
  );
};

export default FinancialDashboard;
