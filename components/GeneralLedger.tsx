
import React, { useState, useMemo } from 'react';
import type { Store, Account, JournalEntry, CostCenter, AISettings, JournalLine, Budget } from '../types';
import { BookOpenIcon, ChartBarIcon, DocumentChartBarIcon, BrainIcon, SparklesIcon, CalendarDaysIcon, ExclamationTriangleIcon } from './icons/Icons';
import { analyzeFinancialStatements } from '../services/geminiService';
import ProgressBar from './ProgressBar';

interface GeneralLedgerProps {
    store: Store;
    addJournalEntry: (entry: Omit<JournalEntry, 'id'>) => void;
    addAccount: (account: Omit<Account, 'id'>) => void;
    updateAccount: (account: Account) => void;
    addCostCenter: (cc: Omit<CostCenter, 'id'>) => void;
    addBudget: (budget: Omit<Budget, 'id'>) => void;
    aiSettings: AISettings;
}

const ACCOUNT_TYPES = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'];

const GeneralLedger: React.FC<GeneralLedgerProps> = ({ store, addJournalEntry, addAccount, updateAccount, addCostCenter, addBudget, aiSettings }) => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'coa' | 'journal' | 'cost-centers' | 'budget' | 'reports' | 'ai'>('dashboard');
    
    // COA State
    const [showAccountForm, setShowAccountForm] = useState(false);
    const [accountForm, setAccountForm] = useState<Omit<Account, 'id'>>({ code: '', name: '', type: 'Asset', description: '' });
    
    // Cost Center State
    const [showCostCenterForm, setShowCostCenterForm] = useState(false);
    const [costCenterForm, setCostCenterForm] = useState<Omit<CostCenter, 'id'>>({ code: '', name: '', description: '' });

    // Budget State
    const [showBudgetForm, setShowBudgetForm] = useState(false);
    const [budgetForm, setBudgetForm] = useState<Omit<Budget, 'id'>>({ accountId: '', year: new Date().getFullYear(), monthlyAmount: 0 });
    const [selectedBudgetYear, setSelectedBudgetYear] = useState(new Date().getFullYear());

    // Journal Entry State
    const [showEntryForm, setShowEntryForm] = useState(false);
    const [entryForm, setEntryForm] = useState<{ date: string, description: string, lines: { accountId: string, debit: number, credit: number, costCenterId?: string }[] }>({
        date: new Date().toISOString().split('T')[0],
        description: '',
        lines: [{ accountId: '', debit: 0, credit: 0, costCenterId: '' }, { accountId: '', debit: 0, credit: 0, costCenterId: '' }]
    });

    // Reports State
    const [reportType, setReportType] = useState<'trial_balance' | 'income_statement' | 'balance_sheet' | 'cost_center_report'>('trial_balance');
    const [reportDateFrom, setReportDateFrom] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
    const [reportDateTo, setReportDateTo] = useState(new Date().toISOString().split('T')[0]);
    const [selectedCostCenterId, setSelectedCostCenterId] = useState('');


    // AI State
    const [aiAnalysis, setAiAnalysis] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // --- Calculations & Filtering ---
    const filteredEntries = useMemo(() => {
        return store.journalEntries.filter(e => {
             const d = new Date(e.date);
             return d >= new Date(reportDateFrom) && d <= new Date(reportDateTo);
        });
    }, [store.journalEntries, reportDateFrom, reportDateTo]);

    const accountBalances = useMemo(() => {
        const balances: Record<string, number> = {};
        store.accounts.forEach(acc => balances[acc.id] = 0);

        filteredEntries.forEach(entry => {
            entry.lines.forEach(line => {
                const acc = store.accounts.find(a => a.id === line.accountId);
                if (acc) {
                    // Standard accounting: Assets/Expenses -> Dr + / Cr -
                    // Liab/Equity/Revenue -> Cr + / Dr -
                    if (acc.type === 'Asset' || acc.type === 'Expense') {
                        balances[acc.id] += (line.debit - line.credit);
                    } else {
                        balances[acc.id] += (line.credit - line.debit);
                    }
                }
            });
        });
        return balances;
    }, [filteredEntries, store.accounts]);

    const trialBalance = useMemo(() => {
        return store.accounts.map(acc => ({
            accountId: acc.id,
            accountName: acc.name,
            accountCode: acc.code,
            accountType: acc.type,
            balance: accountBalances[acc.id] || 0,
            rawDebit: filteredEntries.reduce((sum, e) => sum + e.lines.filter(l => l.accountId === acc.id).reduce((s, l) => s + l.debit, 0), 0),
            rawCredit: filteredEntries.reduce((sum, e) => sum + e.lines.filter(l => l.accountId === acc.id).reduce((s, l) => s + l.credit, 0), 0),
        })).filter(a => a.rawDebit !== 0 || a.rawCredit !== 0 || a.balance !== 0);
    }, [accountBalances, store.accounts, filteredEntries]);

    const financialStatements = useMemo(() => {
        // Income Statement
        const revenueAccounts = trialBalance.filter(a => a.accountType === 'Revenue');
        const expenseAccounts = trialBalance.filter(a => a.accountType === 'Expense');
        
        const totalRevenue = revenueAccounts.reduce((sum, a) => sum + a.balance, 0);
        const totalExpenses = expenseAccounts.reduce((sum, a) => sum + a.balance, 0);
        const netIncome = totalRevenue - totalExpenses;

        // Balance Sheet
        const assetAccounts = trialBalance.filter(a => a.accountType === 'Asset');
        const liabilityAccounts = trialBalance.filter(a => a.accountType === 'Liability');
        const equityAccounts = trialBalance.filter(a => a.accountType === 'Equity');

        const totalAssets = assetAccounts.reduce((sum, a) => sum + a.balance, 0);
        const totalLiabilities = liabilityAccounts.reduce((sum, a) => sum + a.balance, 0);
        const totalEquity = equityAccounts.reduce((sum, a) => sum + a.balance, 0);
        
        // Equity including Net Income (Retained Earnings)
        const totalEquityWithIncome = totalEquity + netIncome;

        return {
            revenueAccounts, expenseAccounts, totalRevenue, totalExpenses, netIncome,
            assetAccounts, liabilityAccounts, equityAccounts, totalAssets, totalLiabilities, totalEquityWithIncome
        };
    }, [trialBalance]);
    
    const costCenterReport = useMemo(() => {
        if (!selectedCostCenterId) return [];
        
        const linesByAccount: Record<string, { name: string, type: string, total: number }> = {};
        
        filteredEntries.forEach(entry => {
            entry.lines.filter(l => l.costCenterId === selectedCostCenterId).forEach(line => {
                 const acc = store.accounts.find(a => a.id === line.accountId);
                 if (acc) {
                     if (!linesByAccount[acc.id]) linesByAccount[acc.id] = { name: acc.name, type: acc.type, total: 0 };
                     if (acc.type === 'Asset' || acc.type === 'Expense') {
                         linesByAccount[acc.id].total += (line.debit - line.credit);
                     } else {
                         linesByAccount[acc.id].total += (line.credit - line.debit);
                     }
                 }
            });
        });
        
        return Object.values(linesByAccount);
    }, [filteredEntries, selectedCostCenterId, store.accounts]);
    
    const budgetReport = useMemo(() => {
        const yearBudgets = store.budgets.filter(b => b.year === selectedBudgetYear);
        
        return yearBudgets.map(budget => {
            const account = store.accounts.find(a => a.id === budget.accountId);
            // Calculate actuals for the selected year
            // Note: In a real app, this should filter journal entries by year
            // Here we reuse accountBalances which is filtered by reportDateFrom/To.
            // We should ideally calculate actuals specifically for the budget year.
            
            const yearlyActual = store.journalEntries
                .filter(e => new Date(e.date).getFullYear() === selectedBudgetYear)
                .reduce((sum, e) => {
                    const lines = e.lines.filter(l => l.accountId === budget.accountId);
                    if (account?.type === 'Expense' || account?.type === 'Asset') {
                        return sum + lines.reduce((s, l) => s + l.debit - l.credit, 0);
                    } else {
                        return sum + lines.reduce((s, l) => s + l.credit - l.debit, 0);
                    }
                }, 0);

            const yearlyBudget = budget.monthlyAmount * 12;
            const variance = yearlyActual - yearlyBudget;
            const percentUsed = yearlyBudget > 0 ? (yearlyActual / yearlyBudget) * 100 : 0;
            
            return {
                accountName: account?.name || 'غير معروف',
                yearlyBudget,
                yearlyActual,
                variance,
                percentUsed,
                isOverBudget: yearlyActual > yearlyBudget
            };
        });

    }, [store.budgets, store.journalEntries, selectedBudgetYear, store.accounts]);


    // --- Handlers ---
    const handleAccountSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addAccount(accountForm);
        setShowAccountForm(false);
        setAccountForm({ code: '', name: '', type: 'Asset', description: '' });
    };
    
    const handleCostCenterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addCostCenter(costCenterForm);
        setShowCostCenterForm(false);
        setCostCenterForm({ code: '', name: '', description: '' });
    }
    
    const handleBudgetSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (budgetForm.accountId && budgetForm.monthlyAmount > 0) {
            addBudget(budgetForm);
            setShowBudgetForm(false);
            setBudgetForm({ accountId: '', year: new Date().getFullYear(), monthlyAmount: 0 });
        }
    }

    const handleEntryLineChange = (index: number, field: string, value: any) => {
        const newLines = [...entryForm.lines];
        (newLines[index] as any)[field] = value;
        setEntryForm({ ...entryForm, lines: newLines });
    };

    const addLine = () => setEntryForm(prev => ({ ...prev, lines: [...prev.lines, { accountId: '', debit: 0, credit: 0, costCenterId: '' }] }));
    const removeLine = (index: number) => setEntryForm(prev => ({ ...prev, lines: prev.lines.filter((_, i) => i !== index) }));

    const handleEntrySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const totalDebit = entryForm.lines.reduce((s, l) => s + (parseFloat(l.debit as any) || 0), 0);
        const totalCredit = entryForm.lines.reduce((s, l) => s + (parseFloat(l.credit as any) || 0), 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            alert(`القيد غير متوازن! المدين: ${totalDebit} | الدائن: ${totalCredit}`);
            return;
        }
        if (entryForm.lines.some(l => !l.accountId)) {
            alert('يجب اختيار حساب لكل سطر.');
            return;
        }

        addJournalEntry({
            date: new Date(entryForm.date).toISOString(),
            description: entryForm.description,
            lines: entryForm.lines.map(l => ({ ...l, debit: parseFloat(l.debit as any), credit: parseFloat(l.credit as any) })),
            isAutoGenerated: false
        });
        setShowEntryForm(false);
        setEntryForm({ date: new Date().toISOString().split('T')[0], description: '', lines: [{ accountId: '', debit: 0, credit: 0, costCenterId: '' }, { accountId: '', debit: 0, credit: 0, costCenterId: '' }] });
    };

    const handleAiAnalysis = async () => {
        setIsAnalyzing(true);
        try {
            const analysis = await analyzeFinancialStatements(trialBalance, aiSettings);
            setAiAnalysis(analysis);
        } catch (e) {
            setAiAnalysis("حدث خطأ.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><BookOpenIcon /></div>
                    <h1 className="text-3xl font-bold text-gray-800">دفتر الأستاذ العام (GL)</h1>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b overflow-x-auto bg-white rounded-t-xl shadow-sm">
                {['dashboard', 'coa', 'journal', 'cost-centers', 'budget', 'reports', 'ai'].map(tab => (
                    <button 
                        key={tab} 
                        onClick={() => setActiveTab(tab as any)} 
                        className={`px-6 py-3 font-medium capitalize transition-colors ${activeTab === tab ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        {tab === 'dashboard' ? 'نظرة عامة' : tab === 'coa' ? 'شجرة الحسابات' : tab === 'journal' ? 'سجل القيود' : tab === 'cost-centers' ? 'مراكز التكلفة' : tab === 'budget' ? 'الموازنة' : tab === 'reports' ? 'التقارير المالية' : 'تحليل ذكي'}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-b-xl shadow-lg p-6 min-h-[400px]">
                
                {activeTab === 'dashboard' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                            <h3 className="text-green-800 font-bold">الأصول (Assets)</h3>
                            <p className="text-3xl font-bold text-green-600 mt-2">{financialStatements.totalAssets.toLocaleString()} ج.م</p>
                        </div>
                        <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                            <h3 className="text-red-800 font-bold">الالتزامات (Liabilities)</h3>
                            <p className="text-3xl font-bold text-red-600 mt-2">{financialStatements.totalLiabilities.toLocaleString()} ج.م</p>
                        </div>
                        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                            <h3 className="text-blue-800 font-bold">حقوق الملكية (Equity)</h3>
                            <p className="text-3xl font-bold text-blue-600 mt-2">{financialStatements.totalEquityWithIncome.toLocaleString()} ج.م</p>
                        </div>
                        <div className="bg-purple-50 p-6 rounded-xl border border-purple-100 col-span-full">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-purple-800 font-bold">صافي الدخل (Net Income)</h3>
                                    <p className="text-sm text-purple-600">الإيرادات ({financialStatements.totalRevenue.toLocaleString()}) - المصروفات ({financialStatements.totalExpenses.toLocaleString()})</p>
                                </div>
                                <p className="text-4xl font-bold text-purple-700">{financialStatements.netIncome.toLocaleString()} ج.م</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'coa' && (
                    <div className="space-y-4">
                        <div className="flex justify-end">
                            <button onClick={() => setShowAccountForm(true)} className="bg-indigo-600 text-white px-4 py-2 rounded">+ حساب جديد</button>
                        </div>
                        <div className="overflow-x-auto border rounded-xl">
                            <table className="w-full text-right text-sm">
                                <thead className="bg-gray-50 border-b"><tr><th className="p-3">الكود</th><th className="p-3">اسم الحساب</th><th className="p-3">النوع</th><th className="p-3">الرصيد الحالي</th></tr></thead>
                                <tbody>
                                    {store.accounts.sort((a,b) => a.code.localeCompare(b.code)).map(acc => (
                                        <tr key={acc.id} className="border-b hover:bg-gray-50">
                                            <td className="p-3 font-mono">{acc.code}</td>
                                            <td className="p-3 font-medium">{acc.name}</td>
                                            <td className="p-3"><span className={`px-2 py-1 rounded text-xs ${acc.type === 'Asset' ? 'bg-green-100 text-green-800' : acc.type === 'Expense' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>{acc.type}</span></td>
                                            <td className="p-3 font-bold">{accountBalances[acc.id]?.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                
                {activeTab === 'cost-centers' && (
                    <div className="space-y-4">
                         <div className="flex justify-end">
                            <button onClick={() => setShowCostCenterForm(true)} className="bg-indigo-600 text-white px-4 py-2 rounded">+ مركز تكلفة جديد</button>
                        </div>
                        <div className="overflow-x-auto border rounded-xl">
                            <table className="w-full text-right text-sm">
                                <thead className="bg-gray-50 border-b"><tr><th className="p-3">الكود</th><th className="p-3">الاسم</th><th className="p-3">الوصف</th><th className="p-3">إجراءات</th></tr></thead>
                                <tbody>
                                    {store.costCenters.map(cc => (
                                        <tr key={cc.id} className="border-b hover:bg-gray-50">
                                            <td className="p-3 font-mono">{cc.code}</td>
                                            <td className="p-3 font-medium">{cc.name}</td>
                                            <td className="p-3 text-gray-500">{cc.description || '-'}</td>
                                            <td className="p-3 text-blue-600 cursor-pointer hover:underline">تعديل</td>
                                        </tr>
                                    ))}
                                    {store.costCenters.length === 0 && <tr><td colSpan={4} className="text-center p-4 text-gray-500">لا توجد مراكز تكلفة معرفة.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'journal' && (
                    <div className="space-y-4">
                         <div className="flex justify-between items-center">
                             <h3 className="text-lg font-bold text-gray-700">سجل القيود / Audit Trail</h3>
                            <button onClick={() => setShowEntryForm(true)} className="bg-indigo-600 text-white px-4 py-2 rounded">+ قيد يدوي</button>
                        </div>
                        <div className="space-y-4">
                            {store.journalEntries.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(entry => (
                                <div key={entry.id} className="border rounded-xl p-4 bg-white hover:shadow-md transition">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-bold text-gray-800">{entry.description}</h4>
                                            <p className="text-xs text-gray-500">{new Date(entry.date).toLocaleDateString()} <span className="mx-1">|</span> #{entry.id} {entry.isAutoGenerated && <span className="bg-gray-100 px-1 rounded">تلقائي (System)</span>}</p>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 rounded p-2 text-sm">
                                        {entry.lines.map((line, idx) => {
                                            const acc = store.accounts.find(a => a.id === line.accountId);
                                            const cc = store.costCenters.find(c => c.id === line.costCenterId);
                                            return (
                                                <div key={idx} className="flex justify-between py-1 border-b last:border-0 border-gray-200">
                                                    <div className="w-1/2">
                                                        <span className="text-gray-700 block">{acc?.code} - {acc?.name}</span>
                                                        {cc && <span className="text-xs bg-indigo-100 text-indigo-700 px-1 rounded">{cc.name}</span>}
                                                    </div>
                                                    <span className="text-gray-600 w-1/4 text-center">{line.debit > 0 ? line.debit.toLocaleString() : '-'}</span>
                                                    <span className="text-gray-600 w-1/4 text-left">{line.credit > 0 ? line.credit.toLocaleString() : '-'}</span>
                                                </div>
                                            );
                                        })}
                                        <div className="flex justify-between pt-2 font-bold text-gray-800">
                                            <span className="w-1/2">الإجمالي</span>
                                            <span className="w-1/4 text-center">{entry.lines.reduce((s,l)=>s+l.debit,0).toLocaleString()}</span>
                                            <span className="w-1/4 text-left">{entry.lines.reduce((s,l)=>s+l.credit,0).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {activeTab === 'budget' && (
                     <div className="space-y-6">
                         <div className="flex justify-between items-center">
                             <div className="flex gap-4 items-center">
                                 <h3 className="text-lg font-bold text-gray-700">الموازنة التقديرية</h3>
                                 <select value={selectedBudgetYear} onChange={e => setSelectedBudgetYear(parseInt(e.target.value))} className="p-2 border rounded">
                                     {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                                 </select>
                             </div>
                             <button onClick={() => setShowBudgetForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded">+ إعداد ميزانية</button>
                         </div>
                         
                         <div className="grid gap-4">
                             {budgetReport.map((item, idx) => (
                                 <div key={idx} className="bg-white border rounded-lg p-4 shadow-sm">
                                     <div className="flex justify-between items-start mb-2">
                                         <h4 className="font-bold text-gray-800">{item.accountName}</h4>
                                         {item.isOverBudget && <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded"><ExclamationTriangleIcon /> تجاوز الميزانية</span>}
                                     </div>
                                     
                                     <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                                         <div>
                                             <p className="text-gray-500">المخطط (سنوي)</p>
                                             <p className="font-bold">{item.yearlyBudget.toLocaleString()} ج.م</p>
                                         </div>
                                          <div>
                                             <p className="text-gray-500">الفعلي (سنوي)</p>
                                             <p className={`font-bold ${item.isOverBudget ? 'text-red-600' : 'text-green-600'}`}>{item.yearlyActual.toLocaleString()} ج.م</p>
                                         </div>
                                          <div>
                                             <p className="text-gray-500">الانحراف (Variance)</p>
                                             <p className="font-bold text-gray-800">{item.variance.toLocaleString()} ج.م</p>
                                         </div>
                                     </div>
                                     
                                     <div className="relative pt-1">
                                         <div className="flex mb-2 items-center justify-between">
                                             <div className="text-right">
                                                 <span className="text-xs font-semibold inline-block text-indigo-600">نسبة الصرف</span>
                                             </div>
                                             <div className="text-left">
                                                 <span className="text-xs font-semibold inline-block text-indigo-600">{item.percentUsed.toFixed(1)}%</span>
                                             </div>
                                         </div>
                                         <ProgressBar progress={item.percentUsed} colorClass={item.isOverBudget ? 'bg-red-500' : 'bg-indigo-600'} />
                                     </div>
                                 </div>
                             ))}
                             {budgetReport.length === 0 && <p className="text-center p-6 text-gray-500">لا توجد ميزانيات مرصودة لهذه السنة.</p>}
                         </div>
                     </div>
                )}

                {activeTab === 'reports' && (
                    <div className="space-y-6">
                        <div className="bg-gray-50 p-4 rounded-lg border flex flex-wrap gap-4 items-center justify-between">
                            <div className="flex gap-2 overflow-x-auto">
                                <button onClick={() => setReportType('trial_balance')} className={`px-3 py-1 rounded text-sm ${reportType === 'trial_balance' ? 'bg-indigo-600 text-white' : 'bg-white border'}`}>ميزان المراجعة</button>
                                <button onClick={() => setReportType('income_statement')} className={`px-3 py-1 rounded text-sm ${reportType === 'income_statement' ? 'bg-indigo-600 text-white' : 'bg-white border'}`}>قائمة الدخل</button>
                                <button onClick={() => setReportType('balance_sheet')} className={`px-3 py-1 rounded text-sm ${reportType === 'balance_sheet' ? 'bg-indigo-600 text-white' : 'bg-white border'}`}>الميزانية العمومية</button>
                                <button onClick={() => setReportType('cost_center_report')} className={`px-3 py-1 rounded text-sm ${reportType === 'cost_center_report' ? 'bg-indigo-600 text-white' : 'bg-white border'}`}>تقرير مراكز التكلفة</button>
                            </div>
                            <div className="flex gap-2 items-center">
                                <span className="text-sm text-gray-600"><CalendarDaysIcon /></span>
                                <input type="date" value={reportDateFrom} onChange={e => setReportDateFrom(e.target.value)} className="p-1 border rounded text-sm" />
                                <span>-</span>
                                <input type="date" value={reportDateTo} onChange={e => setReportDateTo(e.target.value)} className="p-1 border rounded text-sm" />
                            </div>
                        </div>

                        {/* Report Content */}
                        <div className="border rounded-xl p-6 bg-white shadow-sm">
                            
                            {reportType === 'trial_balance' && (
                                <>
                                    <h3 className="text-xl font-bold text-center mb-4">ميزان المراجعة</h3>
                                    <table className="w-full text-right text-sm">
                                        <thead className="bg-gray-100 border-b">
                                            <tr>
                                                <th className="p-2">اسم الحساب</th>
                                                <th className="p-2">مدين (حركات)</th>
                                                <th className="p-2">دائن (حركات)</th>
                                                <th className="p-2">الرصيد النهائي</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {trialBalance.map(acc => (
                                                <tr key={acc.accountId} className="border-b">
                                                    <td className="p-2">{acc.accountCode} - {acc.accountName}</td>
                                                    <td className="p-2">{acc.rawDebit.toLocaleString()}</td>
                                                    <td className="p-2">{acc.rawCredit.toLocaleString()}</td>
                                                    <td className="p-2 font-bold" dir="ltr">{acc.balance.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                            <tr className="bg-gray-200 font-bold">
                                                <td className="p-2">الإجمالي</td>
                                                <td className="p-2">{trialBalance.reduce((s,a)=>s+a.rawDebit,0).toLocaleString()}</td>
                                                <td className="p-2">{trialBalance.reduce((s,a)=>s+a.rawCredit,0).toLocaleString()}</td>
                                                <td className="p-2 text-center">-</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </>
                            )}

                            {reportType === 'income_statement' && (
                                <>
                                    <h3 className="text-xl font-bold text-center mb-2">قائمة الدخل</h3>
                                    <p className="text-center text-sm text-gray-500 mb-6">عن الفترة من {reportDateFrom} إلى {reportDateTo}</p>
                                    
                                    <div className="space-y-4 max-w-2xl mx-auto">
                                        <div>
                                            <h4 className="font-bold text-green-700 border-b mb-2">الإيرادات</h4>
                                            {financialStatements.revenueAccounts.map(acc => (
                                                <div key={acc.accountId} className="flex justify-between text-sm py-1">
                                                    <span>{acc.accountName}</span>
                                                    <span>{acc.balance.toLocaleString()}</span>
                                                </div>
                                            ))}
                                            <div className="flex justify-between font-bold bg-green-50 p-2 rounded mt-1">
                                                <span>إجمالي الإيرادات</span>
                                                <span>{financialStatements.totalRevenue.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <h4 className="font-bold text-red-700 border-b mb-2">المصروفات</h4>
                                            {financialStatements.expenseAccounts.map(acc => (
                                                <div key={acc.accountId} className="flex justify-between text-sm py-1">
                                                    <span>{acc.accountName}</span>
                                                    <span>{acc.balance.toLocaleString()}</span>
                                                </div>
                                            ))}
                                            <div className="flex justify-between font-bold bg-red-50 p-2 rounded mt-1">
                                                <span>إجمالي المصروفات</span>
                                                <span>{financialStatements.totalExpenses.toLocaleString()}</span>
                                            </div>
                                        </div>

                                        <div className="flex justify-between font-bold text-xl bg-gray-100 p-4 rounded border-t-2 border-gray-400">
                                            <span>صافي الربح / الخسارة</span>
                                            <span className={financialStatements.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                {financialStatements.netIncome.toLocaleString()} ج.م
                                            </span>
                                        </div>
                                    </div>
                                </>
                            )}
                            
                            {reportType === 'balance_sheet' && (
                                <>
                                    <h3 className="text-xl font-bold text-center mb-2">الميزانية العمومية</h3>
                                    <p className="text-center text-sm text-gray-500 mb-6">في {reportDateTo}</p>
                                    
                                    <div className="grid grid-cols-2 gap-8">
                                        <div>
                                            <h4 className="font-bold text-lg text-indigo-800 bg-indigo-50 p-2 rounded mb-3">الأصول (Assets)</h4>
                                            {financialStatements.assetAccounts.map(acc => (
                                                <div key={acc.accountId} className="flex justify-between text-sm py-1 border-b border-dashed">
                                                    <span>{acc.accountName}</span>
                                                    <span>{acc.balance.toLocaleString()}</span>
                                                </div>
                                            ))}
                                            <div className="flex justify-between font-bold text-lg mt-4 pt-2 border-t border-indigo-200">
                                                <span>إجمالي الأصول</span>
                                                <span>{financialStatements.totalAssets.toLocaleString()}</span>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="font-bold text-lg text-gray-800 bg-gray-100 p-2 rounded mb-3">الخصوم وحقوق الملكية</h4>
                                            
                                            <h5 className="font-bold text-sm text-gray-600 mt-2">الخصوم (Liabilities)</h5>
                                            {financialStatements.liabilityAccounts.map(acc => (
                                                <div key={acc.accountId} className="flex justify-between text-sm py-1 border-b border-dashed">
                                                    <span>{acc.accountName}</span>
                                                    <span>{acc.balance.toLocaleString()}</span>
                                                </div>
                                            ))}
                                            
                                            <h5 className="font-bold text-sm text-gray-600 mt-4">حقوق الملكية (Equity)</h5>
                                            {financialStatements.equityAccounts.map(acc => (
                                                <div key={acc.accountId} className="flex justify-between text-sm py-1 border-b border-dashed">
                                                    <span>{acc.accountName}</span>
                                                    <span>{acc.balance.toLocaleString()}</span>
                                                </div>
                                            ))}
                                            <div className="flex justify-between text-sm py-1 border-b border-dashed font-semibold text-purple-700">
                                                <span>صافي ربح الفترة (مرحل)</span>
                                                <span>{financialStatements.netIncome.toLocaleString()}</span>
                                            </div>

                                            <div className="flex justify-between font-bold text-lg mt-4 pt-2 border-t border-gray-300">
                                                <span>إجمالي الخصوم وحقوق الملكية</span>
                                                <span>{(financialStatements.totalLiabilities + financialStatements.totalEquityWithIncome).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {reportType === 'cost_center_report' && (
                                <div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium mb-1">اختر مركز التكلفة</label>
                                        <select value={selectedCostCenterId} onChange={e => setSelectedCostCenterId(e.target.value)} className="p-2 border rounded w-full max-w-xs">
                                            <option value="">-- اختر --</option>
                                            {store.costCenters.map(cc => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
                                        </select>
                                    </div>
                                    
                                    {selectedCostCenterId && (
                                        <table className="w-full text-right text-sm border">
                                            <thead className="bg-gray-50"><tr><th className="p-2">الحساب</th><th className="p-2">النوع</th><th className="p-2">المبلغ</th></tr></thead>
                                            <tbody>
                                                {costCenterReport.map((line, idx) => (
                                                    <tr key={idx} className="border-b">
                                                        <td className="p-2">{line.name}</td>
                                                        <td className="p-2">{line.type}</td>
                                                        <td className={`p-2 font-bold ${line.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>{line.total.toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                                {costCenterReport.length === 0 && <tr><td colSpan={3} className="p-4 text-center text-gray-500">لا توجد حركات مسجلة على هذا المركز في الفترة المحددة.</td></tr>}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            )}

                        </div>
                    </div>
                )}

                {activeTab === 'ai' && (
                    <div className="space-y-6">
                         <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-8 text-white text-center">
                            <BrainIcon />
                            <h2 className="text-2xl font-bold mt-4">المحلل المالي الذكي</h2>
                            <p className="mt-2 opacity-90">اضغط الزر أدناه للسماح للذكاء الاصطناعي بتحليل ميزان المراجعة الخاص بك واكتشاف فرص التحسين.</p>
                            <button 
                                onClick={handleAiAnalysis}
                                disabled={isAnalyzing}
                                className="mt-6 bg-white text-indigo-600 px-8 py-3 rounded-full font-bold shadow-lg hover:bg-gray-100 transition disabled:opacity-50 flex items-center gap-2 mx-auto"
                            >
                                {isAnalyzing ? 'جاري التحليل...' : <><SparklesIcon /> تحليل القوائم المالية</>}
                            </button>
                         </div>
                         {aiAnalysis && (
                             <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 prose max-w-none">
                                 <div dangerouslySetInnerHTML={{ __html: aiAnalysis.replace(/\n/g, '<br />') }} />
                             </div>
                         )}
                    </div>
                )}

            </div>

            {/* Modals */}
            {showAccountForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <form onSubmit={handleAccountSubmit} className="bg-white p-6 rounded-xl w-full max-w-md space-y-4">
                        <h3 className="font-bold text-lg">إضافة حساب جديد</h3>
                        <input type="text" placeholder="كود الحساب (مثلاً 101)" value={accountForm.code} onChange={e => setAccountForm({...accountForm, code: e.target.value})} className="w-full p-2 border rounded" required />
                        <input type="text" placeholder="اسم الحساب" value={accountForm.name} onChange={e => setAccountForm({...accountForm, name: e.target.value})} className="w-full p-2 border rounded" required />
                        <select value={accountForm.type} onChange={e => setAccountForm({...accountForm, type: e.target.value as any})} className="w-full p-2 border rounded">
                            {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <div className="flex gap-2"><button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded">حفظ</button><button onClick={()=>setShowAccountForm(false)} className="bg-gray-300 px-4 py-2 rounded">إلغاء</button></div>
                    </form>
                </div>
            )}
            
            {showCostCenterForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <form onSubmit={handleCostCenterSubmit} className="bg-white p-6 rounded-xl w-full max-w-md space-y-4">
                        <h3 className="font-bold text-lg">إضافة مركز تكلفة</h3>
                        <input type="text" placeholder="الكود (مثلاً CC-01)" value={costCenterForm.code} onChange={e => setCostCenterForm({...costCenterForm, code: e.target.value})} className="w-full p-2 border rounded" required />
                        <input type="text" placeholder="الاسم (مثلاً: فرع الرياض)" value={costCenterForm.name} onChange={e => setCostCenterForm({...costCenterForm, name: e.target.value})} className="w-full p-2 border rounded" required />
                        <input type="text" placeholder="الوصف (اختياري)" value={costCenterForm.description} onChange={e => setCostCenterForm({...costCenterForm, description: e.target.value})} className="w-full p-2 border rounded" />
                        <div className="flex gap-2"><button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded">حفظ</button><button onClick={()=>setShowCostCenterForm(false)} className="bg-gray-300 px-4 py-2 rounded">إلغاء</button></div>
                    </form>
                </div>
            )}

             {showBudgetForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <form onSubmit={handleBudgetSubmit} className="bg-white p-6 rounded-xl w-full max-w-md space-y-4">
                        <h3 className="font-bold text-lg">إعداد ميزانية جديدة</h3>
                        <select value={budgetForm.accountId} onChange={e => setBudgetForm({...budgetForm, accountId: e.target.value})} className="w-full p-2 border rounded" required>
                             <option value="">اختر الحساب...</option>
                             {store.accounts.filter(a => a.type === 'Revenue' || a.type === 'Expense').map(a => <option key={a.id} value={a.id}>{a.name} ({a.type})</option>)}
                        </select>
                        <input type="number" placeholder="السنة" value={budgetForm.year} onChange={e => setBudgetForm({...budgetForm, year: parseInt(e.target.value)})} className="w-full p-2 border rounded" required />
                        <input type="number" placeholder="المبلغ الشهري المستهدف" value={budgetForm.monthlyAmount} onChange={e => setBudgetForm({...budgetForm, monthlyAmount: parseFloat(e.target.value)})} className="w-full p-2 border rounded" required />
                        <div className="flex gap-2"><button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded">حفظ</button><button onClick={()=>setShowBudgetForm(false)} className="bg-gray-300 px-4 py-2 rounded">إلغاء</button></div>
                    </form>
                </div>
            )}

            {showEntryForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-6 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                        <h3 className="font-bold text-lg mb-4">قيد يومية جديد</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <input type="date" value={entryForm.date} onChange={e => setEntryForm({...entryForm, date: e.target.value})} className="p-2 border rounded" />
                            <input type="text" placeholder="وصف القيد" value={entryForm.description} onChange={e => setEntryForm({...entryForm, description: e.target.value})} className="p-2 border rounded" />
                        </div>
                        <div className="space-y-2 mb-4">
                            <div className="flex font-bold text-sm text-gray-600 px-2">
                                <span className="w-4/12">الحساب</span>
                                <span className="w-2/12">مركز التكلفة</span>
                                <span className="w-2/12">مدين</span>
                                <span className="w-2/12">دائن</span>
                                <span className="w-1/12"></span>
                            </div>
                            {entryForm.lines.map((line, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <select value={line.accountId} onChange={e => handleEntryLineChange(idx, 'accountId', e.target.value)} className="w-4/12 p-2 border rounded text-sm">
                                        <option value="">اختر الحساب...</option>
                                        {store.accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                                    </select>
                                    <select value={line.costCenterId || ''} onChange={e => handleEntryLineChange(idx, 'costCenterId', e.target.value)} className="w-2/12 p-2 border rounded text-sm bg-gray-50">
                                        <option value="">-</option>
                                        {store.costCenters.map(cc => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
                                    </select>
                                    <input type="number" value={line.debit} onChange={e => handleEntryLineChange(idx, 'debit', e.target.value)} className="w-2/12 p-2 border rounded" placeholder="مدين" />
                                    <input type="number" value={line.credit} onChange={e => handleEntryLineChange(idx, 'credit', e.target.value)} className="w-2/12 p-2 border rounded" placeholder="دائن" />
                                    <button onClick={() => removeLine(idx)} className="w-1/12 text-red-500">x</button>
                                </div>
                            ))}
                            <button onClick={addLine} className="text-sm text-indigo-600">+ سطر جديد</button>
                        </div>
                        <div className="flex justify-between items-center border-t pt-4">
                            <div className="text-sm font-bold">
                                إجمالي المدين: {entryForm.lines.reduce((s,l)=>s+(parseFloat(l.debit as any)||0),0)} | إجمالي الدائن: {entryForm.lines.reduce((s,l)=>s+(parseFloat(l.credit as any)||0),0)}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleEntrySubmit} className="bg-green-600 text-white px-4 py-2 rounded">حفظ القيد</button>
                                <button onClick={()=>setShowEntryForm(false)} className="bg-gray-300 px-4 py-2 rounded">إلغاء</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GeneralLedger;
