


import React, { useState, useMemo, useEffect } from 'react';
import type { Customer, Sale, Product, CustomerTransaction, Lead, CRMInteraction, CRMTask, LeadStatus, InteractionType, AISettings } from '../types';
import { UsersIcon, ChartBarIcon, CheckCircleIcon, CalendarDaysIcon, PaperAirplaneIcon, BrainIcon, SparklesIcon, ClipboardListIcon } from './icons/Icons';
import { analyzeLeadPotential, suggestBestContactTime, classifyCustomer } from '../services/geminiService';

interface CustomerManagementProps {
    customers: Customer[];
    sales: Sale[];
    products: Product[];
    leads: Lead[];
    aiSettings: AISettings;
    addCustomer: (customer: Omit<Customer, 'id'|'joinDate'|'loyaltyPoints'|'transactions'>) => Customer;
    updateCustomer: (customer: Customer) => void;
    deleteCustomer: (customerId: string) => void;
    addCustomerTransaction: (customerId: string, transaction: Omit<CustomerTransaction, 'id'|'date'>) => void;
    logActivity: (action: string) => void;
    // CRM
    addLead: (lead: Omit<Lead, 'id'|'createdAt'|'interactions'|'tasks'>) => void;
    updateLeadStatus: (leadId: string, status: LeadStatus) => void;
    addCRMInteraction: (leadId: string, interaction: Omit<CRMInteraction, 'id'>) => void;
    addCRMTask: (leadId: string, task: Omit<CRMTask, 'id'>) => void;
    updateLeadAI: (leadId: string, data: { aiScore?: number; aiNotes?: string; aiBestContactTime?: string }) => void;
}

const STAGES: { id: LeadStatus; label: string; color: string }[] = [
    { id: 'new', label: 'جديد', color: 'bg-blue-100 text-blue-800 border-blue-300' },
    { id: 'contacted', label: 'تم التواصل', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    { id: 'qualified', label: 'مؤهل', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
    { id: 'proposal', label: 'عرض سعر', color: 'bg-purple-100 text-purple-800 border-purple-300' },
    { id: 'negotiation', label: 'تفاويض', color: 'bg-orange-100 text-orange-800 border-orange-300' },
    { id: 'won', label: 'تم البيع (Won)', color: 'bg-green-100 text-green-800 border-green-300' },
    { id: 'lost', label: 'خسارة (Lost)', color: 'bg-red-100 text-red-800 border-red-300' }
];

const CustomerManagement: React.FC<CustomerManagementProps> = ({ 
    customers, sales, products, leads, aiSettings, 
    addCustomer, updateCustomer, deleteCustomer, addCustomerTransaction, logActivity,
    addLead, updateLeadStatus, addCRMInteraction, addCRMTask, updateLeadAI
}) => {
    const [activeView, setActiveView] = useState<'pipeline' | 'database'>('pipeline');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Customer Modals
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [customerFormData, setCustomerFormData] = useState({ name: '', phone: '', email: '', address: '' });
    
    // Lead Modals
    const [showLeadForm, setShowLeadForm] = useState(false);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [leadFormData, setLeadFormData] = useState({ name: '', phone: '', source: '', potentialValue: 0, status: 'new' as LeadStatus });
    const [interactionNote, setInteractionNote] = useState('');
    const [interactionType, setInteractionType] = useState<InteractionType>('call');

    const [isAnalyzing, setIsAnalyzing] = useState(false);


    // --- Derived Data ---
    const filteredCustomers = useMemo(() => {
        return customers.filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone.includes(searchTerm)
        );
    }, [customers, searchTerm]);

    // Sync selected lead with latest data
    useEffect(() => {
        if (selectedLead) {
            const updated = leads.find(l => l.id === selectedLead.id);
            if (updated) setSelectedLead(updated);
        }
    }, [leads]);
    
    // Sync selected customer with latest data
    useEffect(() => {
        if (selectedCustomer) {
             const updated = customers.find(c => c.id === selectedCustomer.id);
             if (updated) setSelectedCustomer(updated);
             else setSelectedCustomer(null);
        }
    }, [customers]);

    const handleAddLead = (e: React.FormEvent) => {
        e.preventDefault();
        addLead(leadFormData);
        setShowLeadForm(false);
        setLeadFormData({ name: '', phone: '', source: '', potentialValue: 0, status: 'new' });
    };

    const handleAddCustomer = (e: React.FormEvent) => {
        e.preventDefault();
        addCustomer(customerFormData);
        setIsFormVisible(false);
        setCustomerFormData({ name: '', phone: '', email: '', address: '' });
    };

    const handleAddInteraction = () => {
        if (!selectedLead || !interactionNote) return;
        addCRMInteraction(selectedLead.id, {
            date: new Date().toISOString().split('T')[0],
            type: interactionType,
            summary: interactionNote
        });
        setInteractionNote('');
    };

    const handleRunAiAnalysis = async () => {
        if (!selectedLead) return;
        setIsAnalyzing(true);
        try {
            const analysis = await analyzeLeadPotential(selectedLead, aiSettings);
            const bestTime = await suggestBestContactTime(selectedLead, aiSettings);
            
            updateLeadAI(selectedLead.id, {
                aiScore: analysis.score,
                aiNotes: `${analysis.note} - الإجراء المقترح: ${analysis.action}`,
                aiBestContactTime: bestTime
            });
        } catch (e) {
            alert('حدث خطأ أثناء التحليل');
        } finally {
            setIsAnalyzing(false);
        }
    };
    
    const handleClassifyCustomer = async (customer: Customer) => {
        const totalSpent = sales.filter(s => s.customerId === customer.id).reduce((a,b) => a + b.totalAmount, 0);
        const txCount = sales.filter(s => s.customerId === customer.id).length;
        const segment = await classifyCustomer(customer, totalSpent, txCount, aiSettings);
        updateCustomer({ ...customer, segment: segment as any });
    };


    // --- Renders ---

    const renderPipeline = () => (
        <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-250px)] items-start">
            {STAGES.map(stage => (
                <div key={stage.id} className="min-w-[280px] w-[280px] bg-gray-50 rounded-xl border border-gray-200 flex flex-col max-h-full">
                    <div className={`p-3 rounded-t-xl border-b ${stage.color} font-bold flex justify-between`}>
                        <span>{stage.label}</span>
                        <span className="bg-white/50 px-2 rounded text-sm">
                            {leads.filter(l => l.status === stage.id).length}
                        </span>
                    </div>
                    <div className="p-2 flex-1 overflow-y-auto space-y-2">
                        {leads.filter(l => l.status === stage.id).map(lead => (
                            <div 
                                key={lead.id} 
                                onClick={() => setSelectedLead(lead)}
                                className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition hover:border-indigo-300"
                            >
                                <h4 className="font-bold text-gray-800">{lead.name}</h4>
                                <p className="text-xs text-gray-500 mt-1">{lead.phone}</p>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 font-mono">{lead.potentialValue.toLocaleString()} ج.م</span>
                                    {lead.aiScore !== undefined && (
                                        <span className={`text-xs font-bold px-1 ${lead.aiScore > 70 ? 'text-green-600' : lead.aiScore > 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                                            {lead.aiScore}%
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                         {leads.filter(l => l.status === stage.id).length === 0 && (
                             <div className="text-center text-gray-400 text-sm py-4">فارغ</div>
                         )}
                    </div>
                </div>
            ))}
        </div>
    );

    const renderLeadModal = () => {
        if (!selectedLead) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                {selectedLead.name}
                                <span className="text-sm font-normal bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">{selectedLead.source}</span>
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">قيمة متوقعة: {selectedLead.potentialValue.toLocaleString()} ج.م</p>
                        </div>
                        <button onClick={() => setSelectedLead(null)} className="text-gray-400 hover:text-red-500 text-2xl">&times;</button>
                    </div>

                    <div className="flex flex-1 overflow-hidden">
                        {/* Left: Timeline & Actions */}
                        <div className="w-2/3 p-6 overflow-y-auto border-l">
                            {/* Pipeline Mover */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">مرحلة البيع الحالية</label>
                                <div className="flex gap-1 overflow-x-auto pb-2">
                                    {STAGES.map(s => (
                                        <button 
                                            key={s.id} 
                                            onClick={() => updateLeadStatus(selectedLead.id, s.id)}
                                            className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition ${selectedLead.status === s.id ? 'bg-indigo-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Interactions */}
                            <div className="mb-6">
                                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><ClipboardListIcon /> سجل التواصل</h3>
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4">
                                    <div className="flex gap-2 mb-2">
                                        <select 
                                            value={interactionType} 
                                            onChange={(e) => setInteractionType(e.target.value as any)}
                                            className="p-2 border rounded text-sm"
                                        >
                                            <option value="call">اتصال هاتفي</option>
                                            <option value="meeting">اجتماع</option>
                                            <option value="email">بريد إلكتروني</option>
                                            <option value="whatsapp">واتساب</option>
                                            <option value="note">ملاحظة</option>
                                        </select>
                                        <input 
                                            type="text" 
                                            value={interactionNote} 
                                            onChange={e => setInteractionNote(e.target.value)}
                                            placeholder="ملخص التواصل..." 
                                            className="flex-1 p-2 border rounded text-sm" 
                                        />
                                        <button onClick={handleAddInteraction} className="bg-indigo-600 text-white px-4 rounded hover:bg-indigo-700"><PaperAirplaneIcon /></button>
                                    </div>
                                </div>
                                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                    {[...selectedLead.interactions].reverse().map(i => (
                                        <div key={i.id} className="flex gap-3 items-start p-3 bg-white border rounded shadow-sm">
                                            <div className="bg-indigo-50 p-2 rounded-full text-xs text-indigo-600">{i.type === 'call' ? '📞' : i.type === 'meeting' ? '🤝' : '📝'}</div>
                                            <div>
                                                <p className="text-sm text-gray-800">{i.summary}</p>
                                                <p className="text-xs text-gray-400 mt-1">{i.date}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {selectedLead.interactions.length === 0 && <p className="text-center text-gray-400 text-sm">لا يوجد سجل تواصل.</p>}
                                </div>
                            </div>
                        </div>

                        {/* Right: Info & AI */}
                        <div className="w-1/3 p-6 bg-gray-50/50 overflow-y-auto">
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100 mb-4">
                                <h3 className="font-bold text-indigo-900 mb-2 flex items-center gap-2"><BrainIcon /> تحليل الذكاء الاصطناعي</h3>
                                {isAnalyzing ? (
                                    <p className="text-sm text-indigo-500 animate-pulse">جاري تحليل البيانات...</p>
                                ) : selectedLead.aiScore !== undefined ? (
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">احتمالية الإغلاق:</span>
                                            <span className="font-bold text-lg text-indigo-600">{selectedLead.aiScore}%</span>
                                        </div>
                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-red-400 via-yellow-400 to-green-400" style={{ width: `${selectedLead.aiScore}%` }}></div>
                                        </div>
                                        <p className="text-xs text-gray-600 bg-indigo-50 p-2 rounded border border-indigo-100 leading-relaxed">{selectedLead.aiNotes}</p>
                                        {selectedLead.aiBestContactTime && (
                                            <p className="text-xs font-bold text-green-700 mt-1">⏰ أفضل وقت مقترح: {selectedLead.aiBestContactTime}</p>
                                        )}
                                        <button onClick={handleRunAiAnalysis} className="text-xs text-indigo-500 underline mt-2 w-full text-center">تحديث التحليل</button>
                                    </div>
                                ) : (
                                    <button onClick={handleRunAiAnalysis} className="w-full bg-indigo-600 text-white py-2 rounded text-sm hover:bg-indigo-700 flex items-center justify-center gap-2"><SparklesIcon /> تحليل الآن</button>
                                )}
                            </div>

                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                <h3 className="font-bold text-gray-800 mb-2">معلومات الاتصال</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between"><span className="text-gray-500">الهاتف:</span> <span>{selectedLead.phone}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">البريد:</span> <span>{selectedLead.email || '-'}</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center">
                <div className="flex gap-4">
                    <button onClick={() => setActiveView('pipeline')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${activeView === 'pipeline' ? 'bg-indigo-600 text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
                        <ChartBarIcon /> Pipeline
                    </button>
                    <button onClick={() => setActiveView('database')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${activeView === 'database' ? 'bg-indigo-600 text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
                        <UsersIcon /> قاعدة العملاء
                    </button>
                </div>
                
                {activeView === 'pipeline' ? (
                    <button onClick={() => setShowLeadForm(true)} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 shadow font-bold">+ فرصة جديدة</button>
                ) : (
                    <button onClick={() => setIsFormVisible(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow font-bold">+ عميل جديد</button>
                )}
            </div>

            {/* Main Content Area */}
            <div className="flex-1">
                {activeView === 'pipeline' && renderPipeline()}
                
                {activeView === 'database' && (
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="mb-4">
                            <input type="text" placeholder="بحث بالاسم أو الهاتف..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-3 border rounded-lg" />
                        </div>
                        <table className="w-full text-right">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="p-3">الاسم</th>
                                    <th className="p-3">الهاتف</th>
                                    <th className="p-3">التصنيف (AI)</th>
                                    <th className="p-3">نقاط الولاء</th>
                                    <th className="p-3">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCustomers.map(cust => (
                                    <tr key={cust.id} className="border-b hover:bg-gray-50">
                                        <td className="p-3 font-bold">{cust.name}</td>
                                        <td className="p-3 text-gray-600">{cust.phone}</td>
                                        <td className="p-3">
                                            {cust.segment ? (
                                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                                    cust.segment === 'vip' ? 'bg-purple-100 text-purple-700' :
                                                    cust.segment === 'at_risk' ? 'bg-red-100 text-red-700' :
                                                    cust.segment === 'new' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                                }`}>{cust.segment}</span>
                                            ) : (
                                                <button onClick={() => handleClassifyCustomer(cust)} className="text-xs text-indigo-600 hover:underline">تصنيف الآن</button>
                                            )}
                                        </td>
                                        <td className="p-3 font-mono text-indigo-600">{cust.loyaltyPoints}</td>
                                        <td className="p-3 flex gap-2">
                                            <button onClick={() => setSelectedCustomer(cust)} className="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded">عرض</button>
                                            <button onClick={() => deleteCustomer(cust.id)} className="text-red-600 hover:bg-red-50 px-2 py-1 rounded">حذف</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modals */}
            {renderLeadModal()}

            {showLeadForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <form onSubmit={handleAddLead} className="bg-white p-6 rounded-lg w-full max-w-md space-y-4 shadow-xl">
                        <h3 className="font-bold text-xl mb-4 text-gray-800">إضافة فرصة بيعية (Lead)</h3>
                        <input type="text" required placeholder="الاسم / الشركة" value={leadFormData.name} onChange={e => setLeadFormData({...leadFormData, name: e.target.value})} className="w-full p-2 border rounded" />
                        <input type="text" required placeholder="رقم الهاتف" value={leadFormData.phone} onChange={e => setLeadFormData({...leadFormData, phone: e.target.value})} className="w-full p-2 border rounded" />
                        <select value={leadFormData.source} onChange={e => setLeadFormData({...leadFormData, source: e.target.value})} className="w-full p-2 border rounded" required>
                            <option value="">المصدر...</option>
                            <option value="Social Media">سوشيال ميديا</option>
                            <option value="Walk-in">زيارة فرع</option>
                            <option value="Referral">توصية</option>
                            <option value="Website">الموقع</option>
                        </select>
                        <input type="number" placeholder="قيمة الصفقة المتوقعة" value={leadFormData.potentialValue} onChange={e => setLeadFormData({...leadFormData, potentialValue: parseFloat(e.target.value)})} className="w-full p-2 border rounded" />
                        <div className="flex gap-3">
                            <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 font-bold">حفظ</button>
                            <button type="button" onClick={() => setShowLeadForm(false)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300">إلغاء</button>
                        </div>
                    </form>
                </div>
            )}

            {isFormVisible && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <form onSubmit={handleAddCustomer} className="bg-white p-6 rounded-lg w-full max-w-md space-y-4 shadow-xl">
                        <h3 className="font-bold text-xl mb-4">إضافة عميل جديد</h3>
                        <input type="text" required placeholder="الاسم الكامل" value={customerFormData.name} onChange={e => setCustomerFormData({...customerFormData, name: e.target.value})} className="w-full p-2 border rounded" />
                        <input type="text" required placeholder="رقم الهاتف" value={customerFormData.phone} onChange={e => setCustomerFormData({...customerFormData, phone: e.target.value})} className="w-full p-2 border rounded" />
                        <input type="email" placeholder="البريد الإلكتروني" value={customerFormData.email} onChange={e => setCustomerFormData({...customerFormData, email: e.target.value})} className="w-full p-2 border rounded" />
                        <input type="text" placeholder="العنوان" value={customerFormData.address} onChange={e => setCustomerFormData({...customerFormData, address: e.target.value})} className="w-full p-2 border rounded" />
                        <div className="flex gap-3">
                            <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-bold">حفظ</button>
                            <button type="button" onClick={() => setIsFormVisible(false)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300">إلغاء</button>
                        </div>
                    </form>
                </div>
            )}

             {/* Customer Detail View (Reused logic or simple modal for database view) */}
            {selectedCustomer && !selectedLead && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 relative">
                         <button onClick={() => setSelectedCustomer(null)} className="absolute top-4 left-4 text-gray-500 text-2xl">&times;</button>
                         <h2 className="text-2xl font-bold mb-4">{selectedCustomer.name}</h2>
                         <div className="grid grid-cols-2 gap-4 mb-6">
                             <div className="p-3 bg-gray-50 rounded"><strong>الهاتف:</strong> {selectedCustomer.phone}</div>
                             <div className="p-3 bg-gray-50 rounded"><strong>النقاط:</strong> {selectedCustomer.loyaltyPoints}</div>
                             <div className="p-3 bg-gray-50 rounded"><strong>التصنيف:</strong> {selectedCustomer.segment || 'غير مصنف'}</div>
                             <div className="p-3 bg-gray-50 rounded"><strong>الديون:</strong> {selectedCustomer.transactions.reduce((a,b) => a + (b.type === 'debt' ? b.amount : -b.amount), 0)} ج.م</div>
                         </div>
                         <h3 className="font-bold mb-2">سجل المعاملات</h3>
                         <div className="max-h-40 overflow-y-auto border rounded">
                             <table className="w-full text-sm text-right">
                                 <thead><tr className="bg-gray-100 border-b"><th className="p-2">التاريخ</th><th className="p-2">النوع</th><th className="p-2">المبلغ</th></tr></thead>
                                 <tbody>
                                     {selectedCustomer.transactions.map(t => (
                                         <tr key={t.id} className="border-b">
                                             <td className="p-2">{new Date(t.date).toLocaleDateString()}</td>
                                             <td className="p-2">{t.type === 'debt' ? 'دين' : 'دفع'}</td>
                                             <td className="p-2">{t.amount}</td>
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                         </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerManagement;
