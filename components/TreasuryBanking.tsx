
import React, { useState, useMemo } from 'react';
import type { Store, Treasury, BankAccount, FinancialTransaction, TransactionType, TransactionStatus } from '../types';
import { BuildingLibraryIcon, BanknotesIcon, ArrowPathRoundedSquareIcon, CheckCircleIcon } from './icons/Icons';

interface TreasuryBankingProps {
    store: Store;
    addTreasury: (t: Omit<Treasury, 'id' | 'balance'> & { initialBalance: number }) => void;
    addBankAccount: (b: Omit<BankAccount, 'id' | 'balance'> & { initialBalance: number }) => void;
    addFinancialTransaction: (tx: Omit<FinancialTransaction, 'id' | 'status'>) => void;
    updateTransactionStatus: (txId: string, status: TransactionStatus) => void;
}

const TreasuryBanking: React.FC<TreasuryBankingProps> = ({ store, addTreasury, addBankAccount, addFinancialTransaction, updateTransactionStatus }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'accounts' | 'transfers' | 'reconciliation'>('overview');
    const [showTreasuryForm, setShowTreasuryForm] = useState(false);
    const [showBankForm, setShowBankForm] = useState(false);
    const [showTransferForm, setShowTransferForm] = useState(false);

    // Forms State
    const [treasuryForm, setTreasuryForm] = useState({ name: '', initialBalance: 0, description: '' });
    const [bankForm, setBankForm] = useState({ bankName: '', accountNumber: '', initialBalance: 0, currency: 'SAR' });
    const [transferForm, setTransferForm] = useState({
        type: 'transfer' as TransactionType,
        sourceType: 'treasury' as 'treasury' | 'bank',
        sourceId: '',
        destinationType: 'bank' as 'treasury' | 'bank',
        destinationId: '',
        amount: 0,
        description: '',
        date: new Date().toISOString().split('T')[0]
    });

    // Data
    const { treasuries, bankAccounts, financialTransactions } = store;

    const totalCash = (treasuries || []).reduce((sum, t) => sum + t.balance, 0);
    const totalBank = (bankAccounts || []).reduce((sum, b) => sum + b.balance, 0);

    const handleTreasurySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addTreasury(treasuryForm);
        setShowTreasuryForm(false);
        setTreasuryForm({ name: '', initialBalance: 0, description: '' });
    };

    const handleBankSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addBankAccount(bankForm);
        setShowBankForm(false);
        setBankForm({ bankName: '', accountNumber: '', initialBalance: 0, currency: 'SAR' });
    };

    const handleTransferSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Validate balances
        let sourceBalance = 0;
        if (transferForm.sourceType === 'treasury') {
            const t = treasuries.find(x => x.id === transferForm.sourceId);
            sourceBalance = t ? t.balance : 0;
        } else {
            const b = bankAccounts.find(x => x.id === transferForm.sourceId);
            sourceBalance = b ? b.balance : 0;
        }

        if (sourceBalance < transferForm.amount) {
            alert('عفواً، الرصيد غير كافي لإتمام العملية.');
            return;
        }

        addFinancialTransaction({
            date: new Date(transferForm.date).toISOString(),
            type: transferForm.type,
            amount: transferForm.amount,
            sourceId: transferForm.sourceId,
            sourceType: transferForm.sourceType,
            destinationId: transferForm.destinationId,
            destinationType: transferForm.destinationType,
            description: transferForm.description || `تحويل من ${transferForm.sourceType === 'treasury' ? 'خزينة' : 'بنك'} إلى ${transferForm.destinationType === 'treasury' ? 'خزينة' : 'بنك'}`,
        });
        setShowTransferForm(false);
        setTransferForm({ ...transferForm, amount: 0, description: '' });
    };

    const getSourceName = (tx: FinancialTransaction) => {
        if (tx.sourceType === 'treasury') return treasuries.find(t => t.id === tx.sourceId)?.name;
        if (tx.sourceType === 'bank') return bankAccounts.find(b => b.id === tx.sourceId)?.bankName;
        return 'غير محدد';
    };

    const getDestName = (tx: FinancialTransaction) => {
        if (tx.destinationType === 'treasury') return treasuries.find(t => t.id === tx.destinationId)?.name;
        if (tx.destinationType === 'bank') return bankAccounts.find(b => b.id === tx.destinationId)?.bankName;
        return 'غير محدد';
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                        <BuildingLibraryIcon />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800">الخزينة والبنوك</h1>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b overflow-x-auto bg-white rounded-t-xl shadow-sm">
                <button onClick={() => setActiveTab('overview')} className={`px-6 py-3 font-medium transition-colors ${activeTab === 'overview' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'}`}>نظرة عامة</button>
                <button onClick={() => setActiveTab('accounts')} className={`px-6 py-3 font-medium transition-colors ${activeTab === 'accounts' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'}`}>الحسابات والخزائن</button>
                <button onClick={() => setActiveTab('transfers')} className={`px-6 py-3 font-medium transition-colors ${activeTab === 'transfers' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'}`}>التحويلات</button>
                <button onClick={() => setActiveTab('reconciliation')} className={`px-6 py-3 font-medium transition-colors ${activeTab === 'reconciliation' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'}`}>تسوية البنك</button>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-b-xl shadow-lg p-6 min-h-[400px]">
                
                {activeTab === 'overview' && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gradient-to-br from-green-500 to-teal-600 text-white p-6 rounded-2xl shadow-lg">
                                <h3 className="text-lg font-medium opacity-90 mb-2">إجمالي السيولة</h3>
                                <p className="text-4xl font-bold">{(totalCash + totalBank).toLocaleString()} <span className="text-sm font-normal">ج.م</span></p>
                            </div>
                            <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm flex items-center justify-between">
                                <div>
                                    <h3 className="text-gray-500 font-medium mb-1">رصيد الخزائن (Cash)</h3>
                                    <p className="text-2xl font-bold text-gray-800">{totalCash.toLocaleString()} ج.م</p>
                                </div>
                                <div className="p-3 bg-green-100 text-green-600 rounded-full"><BanknotesIcon /></div>
                            </div>
                            <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm flex items-center justify-between">
                                <div>
                                    <h3 className="text-gray-500 font-medium mb-1">رصيد البنوك</h3>
                                    <p className="text-2xl font-bold text-gray-800">{totalBank.toLocaleString()} ج.م</p>
                                </div>
                                <div className="p-3 bg-blue-100 text-blue-600 rounded-full"><BuildingLibraryIcon /></div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-gray-800 mb-4">آخر الحركات المالية</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-right text-sm">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="p-3">التاريخ</th>
                                            <th className="p-3">النوع</th>
                                            <th className="p-3">من</th>
                                            <th className="p-3">إلى</th>
                                            <th className="p-3">المبلغ</th>
                                            <th className="p-3">الوصف</th>
                                            <th className="p-3">الحالة</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(financialTransactions || []).slice(0, 5).map(tx => (
                                            <tr key={tx.id} className="border-b hover:bg-gray-50">
                                                <td className="p-3">{new Date(tx.date).toLocaleDateString('ar-EG')}</td>
                                                <td className="p-3">{tx.type === 'transfer' ? 'تحويل' : tx.type}</td>
                                                <td className="p-3 font-medium text-gray-700">{getSourceName(tx)}</td>
                                                <td className="p-3 font-medium text-gray-700">{getDestName(tx)}</td>
                                                <td className="p-3 font-bold">{tx.amount.toLocaleString()}</td>
                                                <td className="p-3 text-gray-500">{tx.description}</td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${tx.status === 'cleared' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                        {tx.status === 'cleared' ? 'مكتمل' : 'معلق'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {(!financialTransactions || financialTransactions.length === 0) && (
                                            <tr><td colSpan={7} className="text-center p-6 text-gray-500">لا توجد حركات مالية حديثة.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'accounts' && (
                    <div className="space-y-8">
                        {/* Treasuries */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2"><BanknotesIcon /> الخزائن النقدية</h3>
                                <button onClick={() => setShowTreasuryForm(true)} className="text-sm bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700">+ إضافة خزينة</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {(treasuries || []).map(t => (
                                    <div key={t.id} className="p-4 border rounded-xl shadow-sm hover:shadow-md transition bg-white">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-gray-800">{t.name}</h4>
                                            <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">Cash</span>
                                        </div>
                                        <p className="text-2xl font-bold text-green-600 mt-2">{t.balance.toLocaleString()} ج.م</p>
                                        <p className="text-sm text-gray-500 mt-1">{t.description || 'لا يوجد وصف'}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Bank Accounts */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2"><BuildingLibraryIcon /> الحسابات البنكية</h3>
                                <button onClick={() => setShowBankForm(true)} className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700">+ إضافة حساب بنكي</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {(bankAccounts || []).map(b => (
                                    <div key={b.id} className="p-4 border rounded-xl shadow-sm hover:shadow-md transition bg-blue-50 border-blue-100">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-blue-900">{b.bankName}</h4>
                                            <span className="text-xs bg-white px-2 py-1 rounded text-blue-600 border border-blue-200">{b.currency}</span>
                                        </div>
                                        <p className="text-sm text-blue-700 font-mono mt-1">{b.accountNumber}</p>
                                        <p className="text-2xl font-bold text-blue-800 mt-2">{b.balance.toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'transfers' && (
                    <div className="space-y-4">
                        <div className="flex justify-end">
                            <button onClick={() => setShowTransferForm(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 flex items-center gap-2">
                                <ArrowPathRoundedSquareIcon />
                                <span>تحويل جديد</span>
                            </button>
                        </div>
                        <div className="overflow-x-auto border rounded-xl">
                            <table className="w-full text-right text-sm">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="p-3">التاريخ</th>
                                        <th className="p-3">من (المصدر)</th>
                                        <th className="p-3">إلى (المستلم)</th>
                                        <th className="p-3">المبلغ</th>
                                        <th className="p-3">ملاحظات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(financialTransactions || []).filter(t => t.type === 'transfer').map(tx => (
                                        <tr key={tx.id} className="border-b hover:bg-gray-50">
                                            <td className="p-3">{new Date(tx.date).toLocaleDateString('ar-EG')}</td>
                                            <td className="p-3 font-medium text-gray-700">{getSourceName(tx)}</td>
                                            <td className="p-3 font-medium text-gray-700">{getDestName(tx)}</td>
                                            <td className="p-3 font-bold text-indigo-600">{tx.amount.toLocaleString()} ج.م</td>
                                            <td className="p-3 text-gray-500">{tx.description}</td>
                                        </tr>
                                    ))}
                                    {(financialTransactions || []).filter(t => t.type === 'transfer').length === 0 && (
                                        <tr><td colSpan={5} className="text-center p-8 text-gray-500">لا توجد تحويلات مسجلة.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'reconciliation' && (
                    <div className="space-y-4">
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                            <strong>تسوية البنك:</strong> قم بمطابقة الحركات المسجلة في النظام مع كشف الحساب البنكي الفعلي. قم بتغيير الحالة إلى "تمت التسوية" عند التأكد.
                        </div>
                        <div className="overflow-x-auto border rounded-xl">
                            <table className="w-full text-right text-sm">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="p-3">التاريخ</th>
                                        <th className="p-3">الحركة</th>
                                        <th className="p-3">المبلغ</th>
                                        <th className="p-3">الحساب المتأثر</th>
                                        <th className="p-3">الحالة الحالية</th>
                                        <th className="p-3">إجراء التسوية</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(financialTransactions || []).map(tx => {
                                        // Show only transactions affecting banks for reconciliation usually, but showing all for simplicity
                                        const isCleared = tx.status === 'cleared';
                                        return (
                                            <tr key={tx.id} className={`border-b hover:bg-gray-50 ${isCleared ? 'opacity-60' : ''}`}>
                                                <td className="p-3">{new Date(tx.date).toLocaleDateString('ar-EG')}</td>
                                                <td className="p-3">{tx.description}</td>
                                                <td className="p-3 font-bold">{tx.amount.toLocaleString()}</td>
                                                <td className="p-3 text-gray-600">
                                                    {tx.sourceType === 'bank' ? getSourceName(tx) : 
                                                     tx.destinationType === 'bank' ? getDestName(tx) : '-'}
                                                </td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${isCleared ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                                                        {isCleared ? 'تمت التسوية' : 'معلق'}
                                                    </span>
                                                </td>
                                                <td className="p-3">
                                                    {!isCleared && (
                                                        <button 
                                                            onClick={() => updateTransactionStatus(tx.id, 'cleared')}
                                                            className="flex items-center gap-1 text-green-600 hover:bg-green-50 px-2 py-1 rounded transition"
                                                        >
                                                            <CheckCircleIcon /> تسوية
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showTreasuryForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <form onSubmit={handleTreasurySubmit} className="bg-white p-6 rounded-xl w-full max-w-md space-y-4 shadow-xl">
                        <h3 className="text-xl font-bold text-gray-800">إضافة خزينة جديدة</h3>
                        <input type="text" required placeholder="اسم الخزينة (مثلاً: الرئيسية)" value={treasuryForm.name} onChange={e => setTreasuryForm({...treasuryForm, name: e.target.value})} className="w-full p-2 border rounded" />
                        <input type="number" required placeholder="الرصيد الافتتاحي" value={treasuryForm.initialBalance} onChange={e => setTreasuryForm({...treasuryForm, initialBalance: parseFloat(e.target.value)})} className="w-full p-2 border rounded" />
                        <input type="text" placeholder="وصف (اختياري)" value={treasuryForm.description} onChange={e => setTreasuryForm({...treasuryForm, description: e.target.value})} className="w-full p-2 border rounded" />
                        <div className="flex gap-2">
                            <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">حفظ</button>
                            <button type="button" onClick={() => setShowTreasuryForm(false)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded hover:bg-gray-200">إلغاء</button>
                        </div>
                    </form>
                </div>
            )}

            {showBankForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <form onSubmit={handleBankSubmit} className="bg-white p-6 rounded-xl w-full max-w-md space-y-4 shadow-xl">
                        <h3 className="text-xl font-bold text-gray-800">إضافة حساب بنكي</h3>
                        <input type="text" required placeholder="اسم البنك" value={bankForm.bankName} onChange={e => setBankForm({...bankForm, bankName: e.target.value})} className="w-full p-2 border rounded" />
                        <input type="text" required placeholder="رقم الحساب / الآيبان" value={bankForm.accountNumber} onChange={e => setBankForm({...bankForm, accountNumber: e.target.value})} className="w-full p-2 border rounded" />
                        <input type="number" required placeholder="الرصيد الافتتاحي" value={bankForm.initialBalance} onChange={e => setBankForm({...bankForm, initialBalance: parseFloat(e.target.value)})} className="w-full p-2 border rounded" />
                        <div className="flex gap-2">
                            <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">حفظ</button>
                            <button type="button" onClick={() => setShowBankForm(false)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded hover:bg-gray-200">إلغاء</button>
                        </div>
                    </form>
                </div>
            )}

            {showTransferForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <form onSubmit={handleTransferSubmit} className="bg-white p-6 rounded-xl w-full max-w-lg space-y-4 shadow-xl">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">تحويل أموال</h3>
                        
                        {/* Source */}
                        <div className="bg-red-50 p-3 rounded border border-red-100">
                            <label className="block text-xs font-bold text-red-800 mb-2">من (المصدر)</label>
                            <div className="flex gap-2 mb-2">
                                <label className="flex items-center gap-1 cursor-pointer"><input type="radio" checked={transferForm.sourceType === 'treasury'} onChange={() => setTransferForm({...transferForm, sourceType: 'treasury', sourceId: ''})} /> خزينة</label>
                                <label className="flex items-center gap-1 cursor-pointer"><input type="radio" checked={transferForm.sourceType === 'bank'} onChange={() => setTransferForm({...transferForm, sourceType: 'bank', sourceId: ''})} /> بنك</label>
                            </div>
                            <select required value={transferForm.sourceId} onChange={e => setTransferForm({...transferForm, sourceId: e.target.value})} className="w-full p-2 border rounded bg-white">
                                <option value="">اختر الحساب...</option>
                                {transferForm.sourceType === 'treasury' 
                                    ? (treasuries || []).map(t => <option key={t.id} value={t.id}>{t.name} (رصيد: {t.balance})</option>)
                                    : (bankAccounts || []).map(b => <option key={b.id} value={b.id}>{b.bankName} (رصيد: {b.balance})</option>)
                                }
                            </select>
                        </div>

                        {/* Destination */}
                        <div className="bg-green-50 p-3 rounded border border-green-100">
                            <label className="block text-xs font-bold text-green-800 mb-2">إلى (المستلم)</label>
                            <div className="flex gap-2 mb-2">
                                <label className="flex items-center gap-1 cursor-pointer"><input type="radio" checked={transferForm.destinationType === 'treasury'} onChange={() => setTransferForm({...transferForm, destinationType: 'treasury', destinationId: ''})} /> خزينة</label>
                                <label className="flex items-center gap-1 cursor-pointer"><input type="radio" checked={transferForm.destinationType === 'bank'} onChange={() => setTransferForm({...transferForm, destinationType: 'bank', destinationId: ''})} /> بنك</label>
                            </div>
                            <select required value={transferForm.destinationId} onChange={e => setTransferForm({...transferForm, destinationId: e.target.value})} className="w-full p-2 border rounded bg-white">
                                <option value="">اختر الحساب...</option>
                                {transferForm.destinationType === 'treasury' 
                                    ? (treasuries || []).map(t => <option key={t.id} value={t.id}>{t.name}</option>)
                                    : (bankAccounts || []).map(b => <option key={b.id} value={b.id}>{b.bankName}</option>)
                                }
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-1">المبلغ</label>
                            <input type="number" required min="1" value={transferForm.amount} onChange={e => setTransferForm({...transferForm, amount: parseFloat(e.target.value)})} className="w-full p-2 border rounded" />
                        </div>
                         <div>
                            <label className="block text-sm font-bold mb-1">التاريخ</label>
                            <input type="date" required value={transferForm.date} onChange={e => setTransferForm({...transferForm, date: e.target.value})} className="w-full p-2 border rounded" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">وصف / ملاحظات</label>
                            <input type="text" value={transferForm.description} onChange={e => setTransferForm({...transferForm, description: e.target.value})} className="w-full p-2 border rounded" placeholder="مثال: إيداع مبيعات اليوم" />
                        </div>

                        <div className="flex gap-3 mt-4">
                            <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 font-bold">تأكيد التحويل</button>
                            <button type="button" onClick={() => setShowTransferForm(false)} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300">إلغاء</button>
                        </div>
                    </form>
                </div>
            )}

        </div>
    );
};

export default TreasuryBanking;
