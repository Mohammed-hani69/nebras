
import React, { useState, useMemo } from 'react';
import type { Store, Conversation, BotSettings, AISettings } from '../types';
import { ChatBubbleLeftRightIcon, BrainIcon, SparklesIcon, CheckCircleIcon } from './icons/Icons';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { analyzeConversation } from '../services/geminiService';

interface CustomerServiceAIProps {
    store: Store;
    updateStore: (updatedData: Partial<Store>) => void;
    aiSettings: AISettings;
}

const CustomerServiceAI: React.FC<CustomerServiceAIProps> = ({ store, updateStore, aiSettings }) => {
    const [activeTab, setActiveTab] = useState<'inbox' | 'bot-settings' | 'reports'>('inbox');
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Mock data if not present
    const conversations = store.csConversations || [];
    const botSettings = store.csBotSettings || {
        enableWhatsApp: false,
        enableMessenger: false,
        welcomeMessage: "مرحباً بك في متجر نبراس! كيف يمكنني مساعدتك اليوم؟",
        autoReplyEnabled: false
    };

    const selectedConversation = useMemo(() => 
        conversations.find(c => c.id === selectedConversationId), 
    [conversations, selectedConversationId]);

    const handleBotSettingChange = (field: keyof BotSettings, value: any) => {
        const newSettings = { ...botSettings, [field]: value };
        updateStore({ csBotSettings: newSettings });
    };

    const handleAnalyze = async () => {
        if (!selectedConversation) return;
        setIsAnalyzing(true);
        try {
            const analysis = await analyzeConversation(selectedConversation, aiSettings);
            const updatedConvos = conversations.map(c => {
                if (c.id === selectedConversation.id) {
                    return { ...c, aiSummary: analysis.summary, sentiment: analysis.sentiment };
                }
                return c;
            });
            // Also append the suggested reply as a 'draft' or just show it? Let's just show it in the UI for now.
            // For persistent storage:
            updateStore({ csConversations: updatedConvos });
            alert(`اقتراح الرد: ${analysis.suggestedReply}`);
        } catch (e) {
            alert('حدث خطأ أثناء التحليل');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const sentimentData = useMemo(() => {
        const counts = { positive: 0, neutral: 0, negative: 0 };
        conversations.forEach(c => {
            if (c.sentiment) counts[c.sentiment]++;
        });
        return [
            { name: 'إيجابي', value: counts.positive },
            { name: 'محايد', value: counts.neutral },
            { name: 'سلبي', value: counts.negative },
        ];
    }, [conversations]);

    const COLORS = ['#10B981', '#9CA3AF', '#EF4444'];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                        <ChatBubbleLeftRightIcon />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800">ذكاء خدمة العملاء</h1>
                </div>
            </div>

            <div className="flex border-b bg-white rounded-t-xl overflow-x-auto">
                <button onClick={() => setActiveTab('inbox')} className={`px-6 py-3 font-medium transition ${activeTab === 'inbox' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'}`}>صندوق المحادثات</button>
                <button onClick={() => setActiveTab('bot-settings')} className={`px-6 py-3 font-medium transition ${activeTab === 'bot-settings' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'}`}>إعدادات البوت</button>
                <button onClick={() => setActiveTab('reports')} className={`px-6 py-3 font-medium transition ${activeTab === 'reports' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'}`}>تقارير الرضا</button>
            </div>

            <div className="bg-white rounded-b-xl shadow-lg p-6 min-h-[500px]">
                {activeTab === 'inbox' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                        {/* List */}
                        <div className="border rounded-xl overflow-hidden flex flex-col">
                            <div className="p-3 bg-gray-50 border-b font-bold text-gray-700">المحادثات النشطة</div>
                            <div className="flex-1 overflow-y-auto">
                                {conversations.map(c => (
                                    <div 
                                        key={c.id} 
                                        onClick={() => setSelectedConversationId(c.id)}
                                        className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition ${selectedConversationId === c.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : ''}`}
                                    >
                                        <div className="flex justify-between mb-1">
                                            <span className="font-bold text-gray-800">{c.customerName}</span>
                                            <span className="text-xs text-gray-400">{new Date(c.lastActivity).toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'})}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{c.platform}</span>
                                            {c.sentiment && (
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${c.sentiment === 'positive' ? 'bg-green-100 text-green-700' : c.sentiment === 'negative' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                                                    {c.sentiment === 'positive' ? '😊' : c.sentiment === 'negative' ? '😠' : '😐'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {conversations.length === 0 && <div className="p-4 text-center text-gray-500">لا توجد محادثات.</div>}
                            </div>
                        </div>

                        {/* Chat Area */}
                        <div className="lg:col-span-2 border rounded-xl flex flex-col overflow-hidden bg-gray-50">
                            {selectedConversation ? (
                                <>
                                    <div className="p-4 bg-white border-b flex justify-between items-center shadow-sm">
                                        <div>
                                            <h3 className="font-bold text-lg">{selectedConversation.customerName}</h3>
                                            <p className="text-xs text-gray-500">{selectedConversation.customerPhone}</p>
                                        </div>
                                        <button 
                                            onClick={handleAnalyze}
                                            disabled={isAnalyzing}
                                            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:shadow-md transition disabled:opacity-50"
                                        >
                                            <SparklesIcon />
                                            {isAnalyzing ? 'جاري التحليل...' : 'تحليل ذكي'}
                                        </button>
                                    </div>
                                    
                                    {/* AI Summary Section */}
                                    {selectedConversation.aiSummary && (
                                        <div className="bg-purple-50 p-3 border-b border-purple-100 text-sm text-purple-800 flex items-start gap-2">
                                            <BrainIcon />
                                            <div>
                                                <span className="font-bold block mb-1">ملخص الذكاء الاصطناعي:</span>
                                                {selectedConversation.aiSummary}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                        {selectedConversation.messages.map(msg => (
                                            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}>
                                                <div className={`max-w-[75%] p-3 rounded-xl text-sm ${msg.sender === 'user' ? 'bg-white border text-gray-800 rounded-tr-none' : 'bg-indigo-600 text-white rounded-tl-none'}`}>
                                                    <p>{msg.content}</p>
                                                    <span className={`text-[10px] block mt-1 opacity-70 text-left`}>
                                                        {new Date(msg.timestamp).toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'})}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-3 bg-white border-t">
                                        <input type="text" placeholder="اكتب رداً..." className="w-full p-3 border rounded-full focus:ring-2 focus:ring-indigo-500 outline-none" />
                                    </div>
                                </>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                    <ChatBubbleLeftRightIcon />
                                    <p className="mt-2">اختر محادثة للبدء</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'bot-settings' && (
                    <div className="max-w-2xl mx-auto space-y-6">
                        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-start gap-3">
                            <div className="text-indigo-600 mt-1"><BrainIcon /></div>
                            <div>
                                <h3 className="font-bold text-indigo-800">بوت الرد الآلي الذكي</h3>
                                <p className="text-sm text-indigo-600 mt-1">قم بربط حسابات التواصل الاجتماعي ليقوم البوت بالرد التلقائي على العملاء وتحليل استفساراتهم.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 border rounded-xl bg-white shadow-sm">
                                <div>
                                    <h4 className="font-bold text-gray-800">WhatsApp Business</h4>
                                    <p className="text-xs text-gray-500">الرد على رسائل واتساب تلقائياً</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={botSettings.enableWhatsApp} onChange={e => handleBotSettingChange('enableWhatsApp', e.target.checked)} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-xl bg-white shadow-sm">
                                <div>
                                    <h4 className="font-bold text-gray-800">Facebook Messenger</h4>
                                    <p className="text-xs text-gray-500">الرد على رسائل الصفحة</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={botSettings.enableMessenger} onChange={e => handleBotSettingChange('enableMessenger', e.target.checked)} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                                </label>
                            </div>

                            <div className="p-4 border rounded-xl bg-white shadow-sm">
                                <label className="block font-bold text-gray-700 mb-2">رسالة الترحيب التلقائية</label>
                                <textarea 
                                    value={botSettings.welcomeMessage}
                                    onChange={e => handleBotSettingChange('welcomeMessage', e.target.value)}
                                    className="w-full p-3 border rounded-lg h-24 focus:ring-2 focus:ring-indigo-500"
                                    placeholder="أهلاً بك..."
                                />
                            </div>
                            
                            <button className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg">
                                حفظ الإعدادات
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'reports' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white p-6 rounded-xl border shadow-sm">
                            <h3 className="font-bold text-lg text-gray-800 mb-4 text-center">تحليل مشاعر العملاء</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" label>
                                            {sentimentData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <p className="text-center text-sm text-gray-500 mt-2">بناءً على تحليل آخر المحادثات</p>
                        </div>

                        <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col justify-center items-center">
                            <div className="text-center mb-6">
                                <h3 className="font-bold text-lg text-gray-800">مؤشر الرضا العام</h3>
                                <p className="text-4xl font-bold text-indigo-600 mt-2">85%</p>
                                <p className="text-sm text-green-600 mt-1">▲ 5% عن الشهر الماضي</p>
                            </div>
                            <div className="w-full space-y-3">
                                <div className="flex justify-between text-sm"><span>سرعة الرد</span><span className="font-bold">92%</span></div>
                                <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{width: '92%'}}></div></div>
                                
                                <div className="flex justify-between text-sm"><span>حل المشكلة</span><span className="font-bold">78%</span></div>
                                <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-yellow-500 h-2 rounded-full" style={{width: '78%'}}></div></div>
                                
                                <div className="flex justify-between text-sm"><span>التعامل اللبق</span><span className="font-bold">95%</span></div>
                                <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-indigo-500 h-2 rounded-full" style={{width: '95%'}}></div></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerServiceAI;
