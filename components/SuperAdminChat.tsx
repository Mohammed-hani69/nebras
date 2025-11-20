


import React, { useState, useRef, useEffect } from 'react';
import { processSuperAdminIntent } from '../services/geminiService';
import type { Store, AISettings, ModuleDefinition } from '../types';
import { BrainIcon, PaperAirplaneIcon, SparklesIcon } from './icons/Icons';
import { aiAvatarBase64 } from '../assets/ai-avatar';

interface SuperAdminChatProps {
    stores: Store[];
    aiSettings: AISettings;
    marketplaceModules: ModuleDefinition[];
    onUpdateMarketplaceModule: (module: ModuleDefinition) => void;
    actions: {
        createStore: (data: any) => void;
        navigate: (view: string) => void;
        broadcast: (message: string) => void;
    };
}

interface Message {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    type?: 'text' | 'action_result';
}

const SuperAdminChat: React.FC<SuperAdminChatProps> = ({ stores, aiSettings, marketplaceModules, onUpdateMarketplaceModule, actions }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', sender: 'ai', text: 'مرحباً بك أيها المدير! أنا هنا لمساعدتك في إدارة النظام. يمكنك أن تطلب مني تسجيل متجر جديد، التحكم في المديولات، أو إرسال تنبيهات.' }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            // Pass modules to the intent processor
            const response = await processSuperAdminIntent(userMsg.text, stores, marketplaceModules, aiSettings);

            if (response.toolCall) {
                const tool = response.toolCall;
                const args = tool.args;
                let resultMsg = '';

                // Execute Tool
                if (tool.name === 'create_store') {
                    actions.createStore(args);
                    resultMsg = `✅ تم تسجيل متجر جديد باسم: ${args.name}`;
                } else if (tool.name === 'navigate_to') {
                    actions.navigate(args.view);
                    resultMsg = `🔄 جاري الانتقال إلى صفحة: ${args.view}`;
                } else if (tool.name === 'send_broadcast') {
                    actions.broadcast(args.message);
                    resultMsg = `📢 تم إرسال التعميم بنجاح: "${args.message}"`;
                } else if (tool.name === 'toggle_module_visibility') {
                    const moduleToUpdate = marketplaceModules.find(m => m.id === args.moduleId);
                    if (moduleToUpdate) {
                        onUpdateMarketplaceModule({ ...moduleToUpdate, isVisible: args.isVisible });
                        resultMsg = `🛠️ تم ${args.isVisible ? 'إظهار' : 'إخفاء'} مديول "${moduleToUpdate.label}" في السوق بنجاح.`;
                    } else {
                        resultMsg = `⚠️ لم يتم العثور على مديول بالمعرف "${args.moduleId}".`;
                    }
                }

                setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'ai', text: resultMsg, type: 'action_result' }]);
            } else if (response.text) {
                setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'ai', text: response.text || '' }]);
            }

        } catch (error) {
            setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'ai', text: 'عذرًا، حدث خطأ أثناء معالجة الطلب.' }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <>
            {/* Floating Button */}
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="fixed bottom-6 left-6 z-50 w-16 h-16 rounded-full shadow-2xl bg-white border-2 border-indigo-100 hover:scale-110 transition-transform flex items-center justify-center overflow-hidden group"
                title="المساعد الذكي للإدارة"
            >
                <img src={aiAvatarBase64} alt="AI" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-indigo-500 mix-blend-overlay opacity-0 group-hover:opacity-20 transition"></div>
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-24 left-6 z-50 w-96 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200 animate-fade-in-up overflow-hidden font-sans">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <SparklesIcon />
                            <span className="font-bold">مساعد الإدارة</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-white hover:bg-white/20 rounded-full p-1 px-3">&times;</button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}>
                                <div className={`max-w-[85%] p-3 rounded-xl text-sm shadow-sm ${
                                    msg.sender === 'user' 
                                        ? 'bg-indigo-600 text-white rounded-br-none' 
                                        : msg.type === 'action_result' 
                                            ? 'bg-green-50 text-green-800 border border-green-200 rounded-bl-none'
                                            : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-end">
                                <div className="bg-white border p-3 rounded-xl rounded-bl-none shadow-sm">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 bg-white border-t flex gap-2">
                        <input 
                            type="text" 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="اطلب شيئاً (مثلاً: أخفِ مديول الموارد البشرية...)" 
                            className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                        />
                        <button 
                            onClick={handleSend} 
                            disabled={!input.trim() || isTyping}
                            className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 transition"
                        >
                            <PaperAirplaneIcon />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default SuperAdminChat;
