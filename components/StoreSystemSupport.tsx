
import React, { useState, useMemo } from 'react';
import type { Store, SupportTicket, TicketPriority, TicketStatus, Employee } from '../types';
import { TicketIcon, PaperAirplaneIcon, LifebuoyIcon } from './icons/Icons';

interface StoreSystemSupportProps {
    store: Store;
    currentUser: Employee;
    onUpdateStore: (updater: (store: Store) => Store) => void;
}

const STATUS_LABELS: Record<TicketStatus, string> = {
    'open': 'مفتوح',
    'in_progress': 'قيد التنفيذ',
    'resolved': 'تم الحل',
    'closed': 'مغلق'
};

const STATUS_COLORS: Record<TicketStatus, string> = {
    'open': 'bg-red-100 text-red-700',
    'in_progress': 'bg-yellow-100 text-yellow-700',
    'resolved': 'bg-green-100 text-green-700',
    'closed': 'bg-gray-100 text-gray-700'
};

const StoreSystemSupport: React.FC<StoreSystemSupportProps> = ({ store, currentUser, onUpdateStore }) => {
    const [activeView, setActiveView] = useState<'list' | 'create'>('list');
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    
    const [newTicket, setNewTicket] = useState({ title: '', description: '', priority: 'medium' as TicketPriority });
    const [replyInput, setReplyInput] = useState('');

    // Filter only System Tickets
    const myTickets = useMemo(() => {
        return (store.supportTickets || [])
            .filter(t => t.isSystemTicket)
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }, [store.supportTickets]);

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const ticket: SupportTicket = {
            id: `SYS-TKT-${Date.now()}`,
            title: newTicket.title,
            description: newTicket.description,
            priority: newTicket.priority,
            status: 'open',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messages: [],
            isSystemTicket: true,
            storeId: store.id,
            storeName: store.name
        };

        onUpdateStore(s => ({
            ...s,
            supportTickets: [...(s.supportTickets || []), ticket]
        }));
        
        setNewTicket({ title: '', description: '', priority: 'medium' });
        setActiveView('list');
    };

    const handleReply = () => {
        if (!selectedTicket || !replyInput.trim()) return;

        const newMessage = {
            id: `MSG-${Date.now()}`,
            senderId: currentUser.id,
            senderName: currentUser.fullName || currentUser.username, // Store User
            content: replyInput,
            timestamp: new Date().toISOString()
        };

        const updatedMessages = [...selectedTicket.messages, newMessage];

        onUpdateStore(s => ({
            ...s,
            supportTickets: s.supportTickets.map(t => 
                t.id === selectedTicket.id 
                ? { ...t, messages: updatedMessages, updatedAt: new Date().toISOString(), status: 'open' } // Re-open if user replies
                : t
            )
        }));

        // Update local state to show new message immediately
        setSelectedTicket(prev => prev ? { ...prev, messages: updatedMessages } : null);
        setReplyInput('');
    };

    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <LifebuoyIcon />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800">الدعم الفني للنظام</h1>
                </div>
                {activeView === 'list' && !selectedTicket && (
                    <button 
                        onClick={() => setActiveView('create')} 
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                    >
                        + تذكرة جديدة
                    </button>
                )}
                {(activeView === 'create' || selectedTicket) && (
                    <button 
                        onClick={() => { setActiveView('list'); setSelectedTicket(null); }} 
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                    >
                        العودة للقائمة
                    </button>
                )}
            </div>

            {activeView === 'create' && (
                <div className="bg-white p-8 rounded-xl shadow-lg max-w-2xl mx-auto w-full">
                    <h2 className="text-xl font-bold mb-6 text-gray-700">فتح تذكرة دعم فني جديدة</h2>
                    <form onSubmit={handleCreateSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">عنوان المشكلة</label>
                            <input type="text" required value={newTicket.title} onChange={e => setNewTicket({...newTicket, title: e.target.value})} className="w-full p-2 border rounded-lg" placeholder="مثال: لا يمكنني إصدار فاتورة..." />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">التفاصيل</label>
                            <textarea required value={newTicket.description} onChange={e => setNewTicket({...newTicket, description: e.target.value})} className="w-full p-2 border rounded-lg h-32" placeholder="اشرح المشكلة بالتفصيل..." />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">الأولوية</label>
                            <select value={newTicket.priority} onChange={e => setNewTicket({...newTicket, priority: e.target.value as any})} className="w-full p-2 border rounded-lg">
                                <option value="low">منخفضة</option>
                                <option value="medium">متوسطة</option>
                                <option value="high">عالية</option>
                                <option value="critical">حرجة (توقف العمل)</option>
                            </select>
                        </div>
                        <div className="pt-4">
                            <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 font-bold">إرسال التذكرة</button>
                        </div>
                    </form>
                </div>
            )}

            {activeView === 'list' && !selectedTicket && (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden flex-1 flex flex-col">
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-right">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="p-4">العنوان</th>
                                    <th className="p-4">الحالة</th>
                                    <th className="p-4">الأولوية</th>
                                    <th className="p-4">آخر تحديث</th>
                                    <th className="p-4">إجراء</th>
                                </tr>
                            </thead>
                            <tbody>
                                {myTickets.map(ticket => (
                                    <tr key={ticket.id} className="border-b hover:bg-gray-50">
                                        <td className="p-4 font-medium text-gray-800">{ticket.title}</td>
                                        <td className="p-4"><span className={`px-2 py-1 rounded text-xs ${STATUS_COLORS[ticket.status]}`}>{STATUS_LABELS[ticket.status]}</span></td>
                                        <td className="p-4 text-gray-500 text-sm">{ticket.priority}</td>
                                        <td className="p-4 text-gray-500 text-sm">{new Date(ticket.updatedAt).toLocaleDateString('ar-EG')}</td>
                                        <td className="p-4">
                                            <button onClick={() => setSelectedTicket(ticket)} className="text-blue-600 hover:underline text-sm">عرض / رد</button>
                                        </td>
                                    </tr>
                                ))}
                                {myTickets.length === 0 && (
                                    <tr><td colSpan={5} className="text-center p-8 text-gray-500">لا توجد تذاكر سابقة.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {selectedTicket && (
                <div className="bg-white rounded-xl shadow-lg flex-1 flex flex-col overflow-hidden border border-gray-200">
                     <div className="p-4 border-b bg-gray-50 flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">{selectedTicket.title}</h2>
                            <p className="text-sm text-gray-500 mt-1">ID: {selectedTicket.id}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${STATUS_COLORS[selectedTicket.status]}`}>{STATUS_LABELS[selectedTicket.status]}</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                         {/* Original Description */}
                         <div className="bg-white border p-4 rounded-lg shadow-sm">
                            <p className="text-sm text-gray-500 mb-1">الوصف الأصلي:</p>
                            <p className="text-gray-800 whitespace-pre-wrap">{selectedTicket.description}</p>
                         </div>

                         {selectedTicket.messages.map(msg => {
                             const isMe = msg.senderId === currentUser.id;
                             return (
                                 <div key={msg.id} className={`flex flex-col ${isMe ? 'items-start' : 'items-end'}`}>
                                     <div className={`max-w-[80%] p-3 rounded-xl shadow-sm ${isMe ? 'bg-white border text-gray-800 rounded-tl-none' : 'bg-blue-600 text-white rounded-tr-none'}`}>
                                         <p className={`text-[10px] font-bold mb-1 ${isMe ? 'text-gray-400' : 'text-blue-200'}`}>{msg.senderName}</p>
                                         <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                         <span className={`text-[9px] block mt-2 text-left ${isMe ? 'text-gray-400' : 'text-blue-200'}`} dir="ltr">
                                             {new Date(msg.timestamp).toLocaleString('ar-EG')}
                                         </span>
                                     </div>
                                 </div>
                             );
                         })}
                    </div>

                    <div className="p-4 border-t bg-white flex gap-2">
                        <input 
                            type="text" 
                            value={replyInput}
                            onChange={(e) => setReplyInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleReply()}
                            placeholder="اكتب ردك هنا..."
                            className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            disabled={selectedTicket.status === 'closed'}
                        />
                        <button 
                            onClick={handleReply}
                            className="bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-300"
                            disabled={!replyInput.trim() || selectedTicket.status === 'closed'}
                        >
                            <PaperAirplaneIcon />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StoreSystemSupport;
