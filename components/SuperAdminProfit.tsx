

import React from 'react';
import type { Store, PurchaseOrder } from '../types';
import Card from './Card';

interface SuperAdminProfitProps {
  stores: Store[];
}

const SuperAdminProfit: React.FC<SuperAdminProfitProps> = ({ stores }) => {
    // Calculate total potential monthly revenue from active subscriptions
    const totalMonthlyRevenue = stores
        .filter(store => new Date(store.subscriptionEndDate) > new Date())
        .reduce((acc, store) => acc + store.subscriptionMonthlyPrice, 0);

    const totalStores = stores.length;
    const activeSubscriptions = stores.filter(store => new Date(store.subscriptionEndDate) > new Date()).length;
    const expiredSubscriptions = totalStores - activeSubscriptions;

    // Function to calculate net profit for a single store
    const calculateStoreNetProfit = (store: Store): number => {
        const { products, sales, services, expenses, purchaseOrders } = store;

        const grossSales = sales.reduce((acc, sale) => acc + (sale.quantity * sale.unitPrice), 0);
        const serviceRevenue = services.reduce((acc, service) => acc + service.revenue, 0);
        const totalRevenue = grossSales + serviceRevenue;

        const costOfGoodsSold = sales.reduce((acc, sale) => {
            const product = products.find(p => p.id === sale.productId);
            return acc + (sale.quantity * (product?.costPrice || 0));
        }, 0);
        const partsCost = services.reduce((acc, service) => acc + service.partsCost, 0);
        
        const totalOperatingExpenses = expenses.reduce((acc, expense) => acc + expense.amount, 0);
        const totalSupplierPayments = purchaseOrders.flatMap(po => po.payments).reduce((acc, p) => acc + p.amount, 0);
        
        const netProfit = totalRevenue - costOfGoodsSold - partsCost - totalOperatingExpenses - totalSupplierPayments;

        return netProfit;
    };


    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">الأرباح من الاشتراكات</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card title="إجمالي الدخل الشهري المتوقع" value={`${totalMonthlyRevenue.toLocaleString()} ج.م`} isHighlight />
                <Card title="إجمالي المتاجر" value={totalStores.toString()} />
                <Card title="الاشتراكات النشطة" value={activeSubscriptions.toString()} />
                <Card title="الاشتراكات المنتهية" value={expiredSubscriptions.toString()} />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="font-bold text-xl mb-4 text-gray-700">تفاصيل اشتراكات وأرباح المتاجر</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="border-b-2 border-gray-200 bg-gray-50">
                            <tr>
                                <th className="p-3">اسم المتجر</th>
                                <th className="p-3">حالة الاشتراك</th>
                                <th className="p-3">هل تم الدفع هذا الشهر؟</th>
                                <th className="p-3">إجمالي الاشتراكات</th>
                                <th className="p-3">صافي ربح المتجر</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stores.map((store) => {
                                const isSubscriptionActive = new Date(store.subscriptionEndDate) > new Date();
                                const currentMonth = new Date().getMonth();
                                const currentYear = new Date().getFullYear();

                                const hasPaidThisMonth = store.paymentHistory?.some(p => {
                                    const paymentDate = new Date(p.date);
                                    return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
                                }) || false;
                                
                                const totalPaid = store.paymentHistory?.reduce((sum, p) => sum + p.amount, 0) || 0;
                                const monthsSubscribed = store.paymentHistory?.length || 0;
                                
                                const netProfit = calculateStoreNetProfit(store);


                                return (
                                    <tr key={store.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="p-3 font-medium">{store.name}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${isSubscriptionActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {isSubscriptionActive ? 'نشط' : 'منتهي'}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${hasPaidThisMonth ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {hasPaidThisMonth ? 'نعم' : 'لا'}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <div className="text-sm">
                                                <p>إجمالي المدفوعات: <span className="font-bold">{totalPaid.toLocaleString()} ج.م</span></p>
                                                <p className="text-gray-600">لـ <span className="font-semibold">{monthsSubscribed}</span> أشهر</p>
                                            </div>
                                        </td>
                                        <td className={`p-3 font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {netProfit.toLocaleString()} ج.م
                                        </td>
                                    </tr>
                                );
                            })}
                             {stores.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center p-6 text-gray-500">
                                        لا توجد متاجر لعرض تفاصيل اشتراكاتها.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminProfit;