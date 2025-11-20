
import React, { useState, useMemo } from 'react';
import type { Store, SupportTicket, TicketStatus, TicketPriority } from '../types';
import { TicketIcon, PaperAirplaneIcon, CheckCircleIcon, ExclamationTriangleIcon } from './icons/Icons';

interface SuperAdminSupportProps {
    stores: Store[];
    setStores: React.Dispatch<React.SetStateAction<Store[]>>;
}

const STATUS_LABELS: Record<TicketStatus, string> = {
    'open': 'مفتوح',
    'in_progress': 'قيد التنفيذ',
    'resolved': 'تم الحل',
    'closed': 'مغلق'
};

const PRIORITY_LABELS: Record<TicketPriority, string> = {
    'low': 'منخفض',
    'medium': 'متوسط',
    'high': 'عالي',
    'critical': 'حرج'
};

const STATUS_COLORS: Record<TicketStatus, string> = {
    'open': 'bg-red-100 text-red-700',
    'in_progress': 'bg-yellow-100 text-yellow-700',
    'resolved': 'bg-green-100 text-green-700',
    'closed': 'bg-gray-100 text-gray-700'
};

const SuperAdminSupport: React.FC<SuperAdminSupportProps> = ({ stores, setStores }) => {
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
    const [replyInput, setReplyInput] = useState('');

    // Flatten all system tickets from all stores
    const allSystemTickets = useMemo(() => {
        const tickets: (SupportTicket & { storeId: string, storeName: string })[] = [];
        stores.forEach(store => {
            (store.supportTickets || []).forEach(ticket => {
                if (ticket.isSystemTicket) {
                    tickets.push({
                        ...ticket,
                        storeId: store.id,
                        storeName: store.name
                    });
                }
            });
        });
        return tickets.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }, [stores]);

    const filteredTickets = useMemo(() => {
        if (statusFilter === 'all') return allSystemTickets;
        return allSystemTickets.filter(t => t.status === statusFilter);
    }, [allSystemTickets, statusFilter]);

    const selectedTicket = useMemo(() => 
        allSystemTickets.find(t => t.id === selectedTicketId), 
    [allSystemTickets, selectedTicketId]);

    const updateTicket = (ticketId: string, storeId: string, updates: Partial<SupportTicket>) => {
        setStores(prev => prev.map(store => {
            if (store.id === storeId) {
                return {
                    ...store,
                    supportTickets: store.supportTickets.map(t => 
                        t.id === ticketId 
                        ? { ...t, ...updates, updatedAt: new Date().toISOString() } 
                        : t
                    )
                };
            }
            return store;
        }));
    };

    const handleReply = () => {
        if (!selectedTicket || !replyInput.trim()) return;

        const newMessage = {
            id: `MSG-${Date.now()}`,
            senderId: 'super-admin',
            senderName: 'الدعم الفني (System Admin)',
            content: replyInput,
            timestamp: new Date().toISOString()
        };

        const updatedMessages = [...selectedTicket.messages, newMessage];
        
        // Auto update status to 'in_progress' or 'resolved' depending on context, for now 'in_progress' if it was open
        let newStatus = selectedTicket.status;
        if (selectedTicket.status === 'open') newStatus = 'in_progress';

        updateTicket(selectedTicket.id, selectedTicket.storeId, { 
            messages: updatedMessages, 
            status: newStatus 
        });
        
        setReplyInput('');
    };

    return (
        <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                        <TicketIcon />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800">مركز الدعم الفني (للمتاجر)</h1>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
                {/* Ticket List */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col overflow-hidden">
                    <div className="p-4 border-b bg-gray-50">
                        <select 
                            value={statusFilter} 
                            onChange={(e) => setStatusFilter(e.target.value as any)} 
                            className="w-full p-2 border rounded bg-white"
                        >
                            <option value="all">كل الحالات</option>
                            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {filteredTickets.map(ticket => (
                            <div 
                                key={ticket.id} 
                                onClick={() => setSelectedTicketId(ticket.id)}
                                className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition ${selectedTicketId === ticket.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-gray-800 text-sm">{ticket.storeName}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_COLORS[ticket.status]}`}>{STATUS_LABELS[ticket.status]}</span>
                                </div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-1">{ticket.title}</h4>
                                <p className="text-xs text-gray-500 line-clamp-2 mb-2">{ticket.description}</p>
                                <div className="flex justify-between items-center text-[10px] text-gray-400">
                                    <span>{new Date(ticket.updatedAt).toLocaleDateString('ar-EG')}</span>
                                    <span className={`px-2 py-0.5 rounded ${ticket.priority === 'critical' ? 'bg-red-100 text-red-600' : 'bg-gray-100'}`}>{PRIORITY_LABELS[ticket.priority]}</span>
                                </div>
                            </div>
                        ))}
                        {filteredTickets.length === 0 && <div className="p-8 text-center text-gray-500">لا توجد تذاكر.</div>}
                    </div>
                </div>

                {/* Ticket Detail */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col overflow-hidden">
                    {selectedTicket ? (
                        <>
                            <div className="p-4 border-b bg-gray-50 flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">{selectedTicket.title}</h2>
                                    <p className="text-sm text-gray-500">المتجر: <span className="font-semibold text-indigo-600">{selectedTicket.storeName}</span></p>
                                </div>
                                <div className="flex gap-2">
                                    <select 
                                        value={selectedTicket.priority}
                                        onChange={(e) => updateTicket(selectedTicket.id, selectedTicket.storeId, { priority: e.target.value as TicketPriority })}
                                        className="text-xs border rounded p-1"
                                    >
                                        {Object.entries(PRIORITY_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                                    </select>
                                    <select 
                                        value={selectedTicket.status}
                                        onChange={(e) => updateTicket(selectedTicket.id, selectedTicket.storeId, { status: e.target.value as TicketStatus })}
                                        className={`text-xs border rounded p-1 font-bold ${STATUS_COLORS[selectedTicket.status]}`}
                                    >
                                        {Object.entries(STATUS_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
                                {/* Original Issue Description */}
                                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
                                    <h4 className="text-sm font-bold text-gray-700 mb-2">وصف المشكلة:</h4>
                                    <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{selectedTicket.description}</p>
                                </div>

                                {selectedTicket.messages.map(msg => {
                                    const isMe = msg.senderId === 'super-admin';
                                    return (
                                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                            <div className={`max-w-[80%] rounded-lg p-3 shadow-sm ${isMe ? 'bg-indigo-600 text-white rounded-tl-none' : 'bg-white border text-gray-800 rounded-tr-none'}`}>
                                                <p className={`text-[10px] mb-1 font-bold ${isMe ? 'text-indigo-200' : 'text-gray-500'}`}>{msg.senderName}</p>
                                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                                <span className={`text-[9px] block mt-2 text-right ${isMe ? 'text-indigo-200' : 'text-gray-400'}`} dir="ltr">
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
                                />
                                <button 
                                    onClick={handleReply}
                                    className="bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-300"
                                    disabled={!replyInput.trim()}
                                >
                                    <PaperAirplaneIcon />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <div className="text-6xl mb-4">🎫</div>
                            <p>اختر تذكرة لعرض التفاصيل والرد عليها</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SuperAdminSupport;
