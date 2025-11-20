import React, { useState } from 'react';
import type { Expense, PaymentMethod } from '../types';


interface ExpensesProps {
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  logActivity: (action: string) => void;
}

const Expenses: React.FC<ExpensesProps> = ({ expenses, addExpense, logActivity }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || amount <= 0) {
      alert('الرجاء إدخال وصف ومبلغ صحيحين.');
      return;
    }
    addExpense({
      date: new Date().toISOString(),
      description,
      amount,
      paymentMethod,
    });
    // Reset form
    setDescription('');
    setAmount(0);
    setPaymentMethod('cash');
  };
  
  const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const totalExpenses = expenses.reduce((acc, expense) => acc + expense.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <h1 className="text-3xl font-bold text-gray-800">المصروفات</h1>
      </div>
      <div id="expenses-form" className="bg-white p-8 rounded-xl shadow-lg max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">تسجيل مصروف جديد</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium mb-1">الوصف</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
              placeholder="مثال: إيجار المحل، فاتورة كهرباء"
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label className="block font-medium mb-1">المبلغ</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
            <div>
                <label className="block font-medium mb-1">طريقة الدفع</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50">
                    <option value="cash">نقدي</option>
                    <option value="card">بطاقة</option>
                    <option value="bank_transfer">تحويل بنكي</option>
                </select>
            </div>
          </div>
          <button type="submit" className="w-full bg-orange-500 text-white p-3 rounded-lg hover:bg-orange-600 transition font-bold text-lg">
            تسجيل المصروف
          </button>
        </form>
      </div>

      <div id="expenses-log" className="bg-white p-6 rounded-xl shadow-lg mt-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">سجل المصروفات</h2>
        <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="border-b-2 border-gray-200 bg-gray-50">
                <tr>
                  <th className="p-3 text-sm font-semibold tracking-wide text-right">التاريخ</th>
                  <th className="p-3 text-sm font-semibold tracking-wide text-right">الوصف</th>
                  <th className="p-3 text-sm font-semibold tracking-wide text-right">المبلغ</th>
                </tr>
              </thead>
              <tbody>
                {sortedExpenses.map(expense => (
                  <tr key={expense.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 text-sm">{new Date(expense.date).toLocaleDateString('ar-EG')}</td>
                    <td className="p-3 font-medium text-gray-700 text-sm">{expense.description}</td>
                    <td className="p-3 font-bold text-sm">{expense.amount.toLocaleString()} ج.م</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {expenses.length === 0 && <p className="text-center p-6 text-gray-500">لا توجد مصروفات مسجلة.</p>}
        </div>
        <div className="mt-6 pt-4 border-t-2 border-gray-200 text-left">
            <p className="text-xl font-bold text-gray-800">
                إجمالي المصروفات: <span className="text-red-600">{totalExpenses.toLocaleString()} ج.م</span>
            </p>
        </div>
    </div>
    </div>
  );
};

export default Expenses;