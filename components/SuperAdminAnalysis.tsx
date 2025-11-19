
import React, { useMemo } from 'react';
import type { Store } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import Card from './Card';

interface SuperAdminAnalysisProps {
  stores: Store[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1943'];

const SuperAdminAnalysis: React.FC<SuperAdminAnalysisProps> = ({ stores }) => {
  const storeTypeData = useMemo(() => {
    const typeCounts = stores.reduce((acc, store) => {
      const type = store.storeType || 'غير محدد';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(typeCounts).map(([name, value]) => ({ name, value }));
  }, [stores]);
  
  const topProfitStores = useMemo(() => {
     return stores.map(store => {
            const { products, sales, services, expenses } = store;
            const grossSales = sales.reduce((acc, sale) => acc + (sale.quantity * sale.unitPrice), 0);
            const serviceRevenue = services.reduce((acc, service) => acc + service.revenue, 0);
            const totalRevenue = grossSales + serviceRevenue;
            const costOfGoodsSold = sales.reduce((acc, sale) => {
                const product = products.find(p => p.id === sale.productId);
                return acc + (sale.quantity * (product?.costPrice || 0));
            }, 0);
            const partsCost = services.reduce((acc, service) => acc + service.partsCost, 0);
            const totalExpenses = expenses.reduce((acc, expense) => acc + expense.amount, 0);
            const netProfit = totalRevenue - costOfGoodsSold - partsCost - totalExpenses;
            return {
                name: store.name,
                netProfit,
            };
        })
        .sort((a, b) => b.netProfit - a.netProfit)
        .slice(0, 5);
  }, [stores]);
  
  const topSubscriptionStores = useMemo(() => {
     return stores.map(store => {
         const totalPaid = store.paymentHistory?.reduce((sum, p) => sum + p.amount, 0) || 0;
         return {
             name: store.name,
             totalSubscription: totalPaid
         };
     })
     .sort((a, b) => b.totalSubscription - a.totalSubscription)
     .slice(0, 5);
  }, [stores]);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">تحليل البيانات</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="font-bold text-xl mb-4 text-gray-700">توزيع المتاجر حسب النوع</h3>
            {storeTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                    <Pie
                        data={storeTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={110}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                        {storeTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value} متجر`} />
                    <Legend />
                    </PieChart>
                </ResponsiveContainer>
            ) : (
                <p className="text-center text-gray-500 py-10">لا توجد بيانات كافية لعرض الرسم البياني.</p>
            )}
        </div>
         <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="font-bold text-xl mb-4 text-gray-700">أكثر 5 متاجر تحقيقًا للأرباح</h3>
            {topProfitStores.length > 0 ? (
                 <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topProfitStores} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(value: number) => `${value.toLocaleString()} ج.م`} />
                        <Legend />
                        <Bar dataKey="netProfit" name="صافي الربح" fill="#10b981" />
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <p className="text-center text-gray-500 py-10">لا توجد بيانات أرباح لعرضها.</p>
            )}
        </div>
      </div>
       <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="font-bold text-xl mb-4 text-gray-700">أكثر 5 متاجر تحقيقًا لإيراد الاشتراكات</h3>
            {topSubscriptionStores.length > 0 ? (
                 <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="border-b-2 border-gray-200 bg-gray-50">
                            <tr>
                                <th className="p-3">#</th>
                                <th className="p-3">اسم المتجر</th>
                                <th className="p-3">إجمالي إيراد الاشتراكات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topSubscriptionStores.map((store, index) => (
                                <tr key={store.name} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="p-3 font-bold">{index + 1}</td>
                                    <td className="p-3 font-medium">{store.name}</td>
                                    <td className="p-3 font-bold text-indigo-600">{store.totalSubscription.toLocaleString()} ج.م</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-center text-gray-500 py-10">لا توجد بيانات اشتراكات لعرضها.</p>
            )}
        </div>
    </div>
  );
};

export default SuperAdminAnalysis;
