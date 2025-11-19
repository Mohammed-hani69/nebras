
import React, { useState, useMemo } from 'react';
import type { InstallmentPlan, InstallmentPayment, Store } from '../types';

interface InstallmentsProps {
    store: Store;
    addInstallmentPayment: (planId: string, paymentId: string, amount: number) => void;
}

const Installments: React.FC<InstallmentsProps> = ({ store, addInstallmentPayment }) => {
    const { installmentPlans, customers, sales, services } = store;
    // Use selectedPlanId to derive data from props, ensuring responsiveness to store updates
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

    const plansWithDetails = useMemo(() => {
        return installmentPlans.map(plan => {
            const customer = customers.find(c => c.id === plan.customerId);
            const totalPaid = plan.payments.reduce((sum, p) => sum + p.paidAmount, 0);
            const remaining = plan.totalRepaymentAmount - totalPaid;
            // Sort payments
            const duePayments = plan.payments.filter(p => p.status !== 'paid');
            const nextPayment = duePayments.length > 0 
                ? duePayments.sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0] 
                : null;
            const overduePayments = plan.payments.filter(p => p.status === 'overdue').length;

            return {
                ...plan,
                customerName: customer?.name || 'غير معروف',
                totalPaid,
                remaining,
                nextPayment,
                overduePayments
            };
        });
    }, [installmentPlans, customers]);

    const selectedPlanData = useMemo(() => {
        if (!selectedPlanId) return null;
        return plansWithDetails.find(p => p.id === selectedPlanId) || null;
    }, [plansWithDetails, selectedPlanId]);

    const handleRecordPayment = (planId: string, paymentId: string, amountDue: number) => {
        const amountStr = prompt(`أدخل المبلغ المدفوع للقسط (المستحق: ${amountDue.toLocaleString()} ج.م):`, amountDue.toString());
        if (amountStr === null) return; // Cancelled

        const amount = parseFloat(amountStr);
        if (!isNaN(amount) && amount > 0) {
            addInstallmentPayment(planId, paymentId, amount);
            // Alert removed to make it snappier, UI updates automatically via props
        } else {
            alert('الرجاء إدخال مبلغ صحيح.');
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">التقسيط والتمويل</h1>
            <p className="text-gray-600">متابعة خطط التقسيط للعملاء وتسجيل الدفعات المستلمة.</p>

            <div className="bg-white p-6 rounded-xl shadow-lg">
                <table className="w-full text-right">
                    <thead className="border-b-2 bg-gray-50">
                        <tr>
                            <th className="p-3">العميل</th>
                            <th className="p-3">المبلغ المتبقي</th>
                            <th className="p-3">القسط التالي</th>
                            <th className="p-3">أقساط متأخرة</th>
                            <th className="p-3">إجراء</th>
                        </tr>
                    </thead>
                    <tbody>
                        {plansWithDetails.map(plan => (
                            <tr key={plan.id} className={`border-b hover:bg-gray-50 ${plan.overduePayments > 0 ? 'bg-red-50' : ''}`}>
                                <td className="p-3 font-medium">{plan.customerName}</td>
                                <td className="p-3 font-bold text-red-600">{plan.remaining.toLocaleString()} ج.م</td>
                                <td className="p-3">
                                    {plan.nextPayment ? 
                                        `${plan.nextPayment.amountDue.toLocaleString()} ج.م في ${new Date(plan.nextPayment.dueDate).toLocaleDateString('ar-EG')}`
                                        : <span className="text-green-600 font-bold">✔ مكتملة</span>
                                    }
                                </td>
                                <td className="p-3 font-bold text-red-700">{plan.overduePayments > 0 ? `${plan.overduePayments} أقساط` : '-'}</td>
                                <td className="p-3">
                                    <button onClick={() => setSelectedPlanId(plan.id)} className="text-blue-600 hover:underline font-medium">عرض التفاصيل</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {plansWithDetails.length === 0 && (
                    <p className="text-center p-6 text-gray-500">لا توجد خطط تقسيط حاليًا.</p>
                )}
            </div>
            
            {selectedPlanData && (() => {
                let sourceInfo = 'غير متوفر';
                if (selectedPlanData.sourceType === 'sale') {
                    const sale = sales.find(s => s.invoiceId === selectedPlanData.sourceId);
                    const product = store.products.find(p => p.id === sale?.productId);
                    if (sale && product) {
                        sourceInfo = `فاتورة بيع #${sale.invoiceId} (${product.name})`;
                    }
                } else {
                    const service = services.find(s => s.orderId === selectedPlanData.sourceId);
                    if (service) {
                        sourceInfo = `خدمة صيانة #${service.orderId} (${service.description})`;
                    }
                }

                return (
                     <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                                <h3 className="text-xl font-bold text-gray-800">تفاصيل خطة التقسيط - {selectedPlanData.customerName}</h3>
                                <button onClick={() => setSelectedPlanId(null)} className="text-gray-400 hover:text-red-600 text-3xl leading-none">&times;</button>
                            </div>
                            <div className="p-6 overflow-y-auto space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                    <div className="p-3 bg-gray-100 rounded-lg"><p className="text-xs text-gray-500 mb-1">المبلغ الممول</p><p className="font-bold text-lg">{selectedPlanData.totalFinancedAmount.toLocaleString()} ج.م</p></div>
                                    <div className="p-3 bg-gray-100 rounded-lg"><p className="text-xs text-gray-500 mb-1">إجمالي السداد</p><p className="font-bold text-lg">{selectedPlanData.totalRepaymentAmount.toLocaleString()} ج.م</p></div>
                                    <div className="p-3 bg-green-100 rounded-lg border border-green-200"><p className="text-xs text-green-600 mb-1">المدفوع</p><p className="font-bold text-lg text-green-700">{selectedPlanData.totalPaid.toLocaleString()} ج.م</p></div>
                                    <div className="p-3 bg-red-100 rounded-lg border border-red-200"><p className="text-xs text-red-600 mb-1">المتبقي</p><p className="font-bold text-lg text-red-700">{selectedPlanData.remaining.toLocaleString()} ج.م</p></div>
                                </div>
                                
                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                    <p className="text-sm text-blue-800"><strong>المرجع:</strong> {sourceInfo}</p>
                                </div>
                                
                                <div>
                                    <h4 className="font-bold text-lg mb-3 border-b pb-2">جدول الأقساط</h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-right text-sm">
                                            <thead className="bg-gray-50 text-gray-700"><tr><th className="p-3">#</th><th className="p-3">تاريخ الاستحقاق</th><th className="p-3">المبلغ المستحق</th><th className="p-3">الحالة</th><th className="p-3">المبلغ المدفوع</th><th className="p-3">تاريخ الدفع</th><th className="p-3">إجراء</th></tr></thead>
                                            <tbody>
                                                {selectedPlanData.payments.map((p, index) => (
                                                    <tr key={p.id} className="border-b hover:bg-gray-50 transition-colors">
                                                        <td className="p-3 font-bold">{index + 1}</td>
                                                        <td className="p-3">{new Date(p.dueDate).toLocaleDateString('ar-EG')}</td>
                                                        <td className="p-3 font-semibold">{p.amountDue.toLocaleString()} ج.م</td>
                                                        <td className="p-3">
                                                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${p.status === 'paid' ? 'bg-green-100 text-green-700' : p.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                                {p.status === 'paid' ? 'مدفوع' : p.status === 'overdue' ? 'متأخر' : 'مستحق'}
                                                            </span>
                                                        </td>
                                                        <td className="p-3">{p.paidAmount > 0 ? p.paidAmount.toLocaleString() + ' ج.م' : '-'}</td>
                                                        <td className="p-3 text-gray-500">{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('ar-EG') : '-'}</td>
                                                        <td className="p-3">
                                                            {p.status !== 'paid' && (
                                                                <button 
                                                                    onClick={() => handleRecordPayment(selectedPlanData.id, p.id, p.amountDue)} 
                                                                    className="bg-indigo-600 text-white px-3 py-1.5 rounded-md text-xs hover:bg-indigo-700 transition shadow-sm"
                                                                >
                                                                    تسجيل دفعة
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default Installments;
