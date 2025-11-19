
import React, { useState, useMemo } from 'react';
import type { SupportTicket, TicketMessage, TicketStatus, TicketPriority, Employee, Store, TicketAttachment } from '../types';
import { TicketIcon, UsersIcon, DocumentChartBarIcon, PaperAirplaneIcon, CheckCircleIcon, ExclamationTriangleIcon } from './icons/Icons';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface SupportTicketingProps {
    store: Store;
    currentUser: Employee;
    tickets: SupportTicket[];
    addTicket: (ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'messages'>) => void;
    updateTicketStatus: (ticketId: string, status: TicketStatus, assigneeId?: string) => void;
    assignTicket: (ticketId: string, employeeId: string) => void;
    addTicketMessage: (ticketId: string, message: Omit<TicketMessage, 'id' | 'timestamp'>) => void;
    employees: Employee[];
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

const SupportTicketing: React.FC<SupportTicketingProps> = ({ store, currentUser, tickets, addTicket, updateTicketStatus, assignTicket, addTicketMessage, employees }) => {
    const [activeTab, setActiveTab] = useState<'list' | 'reports'>('list');
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    
    // Create Form State
    const [newTicketData, setNewTicketData] = useState({
        title: '',
        description: '',
        priority: 'medium' as TicketPriority,
        customerId: '',
        assignedTo: ''
    });

    // Message Input State
    const [messageInput, setMessageInput] = useState('');

    // Filters
    const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
    const [assigneeFilter, setAssigneeFilter] = useState<string | 'all'>('all');

    const filteredTickets = useMemo(() => {
        let result = [...tickets].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        if (statusFilter !== 'all') result = result.filter(t => t.status === statusFilter);
        if (assigneeFilter !== 'all') result = result.filter(t => t.assignedTo === assigneeFilter);
        return result;
    }, [tickets, statusFilter, assigneeFilter]);

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addTicket({
            title: newTicketData.title,
            description: newTicketData.description,
            priority: newTicketData.priority,
            customerId: newTicketData.customerId || null,
            assignedTo: newTicketData.assignedTo || null,
            status: 'open',
        });
        setShowCreateModal(false);
        setNewTicketData({ title: '', description: '', priority: 'medium', customerId: '', assignedTo: '' });
    };

    const handleSendMessage = () => {
        if (!selectedTicket || !messageInput.trim()) return;
        addTicketMessage(selectedTicket.id, {
            senderId: currentUser.id,
            senderName: currentUser.fullName,
            content: messageInput,
        });
        setMessageInput('');
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!selectedTicket || !e.target.files || e.target.files.length === 0) return;
        
        const file = e.target.files[0];
        // Mock upload - in real app, upload to server and get URL
        const mockAttachment: TicketAttachment = {
            name: file.name,
            url: URL.createObjectURL(file), // Temporary local URL
            type: file.type
        };

        addTicketMessage(selectedTicket.id, {
            senderId: currentUser.id,
            senderName: currentUser.fullName,
            content: `قام بإرفاق ملف: ${file.name}`,
            attachments: [mockAttachment]
        });
    };

    // --- Reports Logic ---
    const reportsData = useMemo(() => {
        const statusCounts = tickets.reduce((acc, t) => {
            acc[t.status] = (acc[t.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const statusChartData = Object.keys(STATUS_LABELS).map(key => ({
            name: STATUS_LABELS[key as TicketStatus],
            value: statusCounts[key] || 0
        }));

        const employeeStats = employees.map(emp => {
            const empTickets = tickets.filter(t => t.assignedTo === emp.id);
            const resolved = empTickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
            return {
                name: emp.fullName,
                total: empTickets.length,
                resolved: resolved
            };
        });

        return { statusChartData, employeeStats };
    }, [tickets, employees]);

    const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#6B7280'];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                        <TicketIcon />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800">مركز البلاغات والدعم</h1>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setActiveTab('list')} className={`px-4 py-2 rounded-lg transition ${activeTab === 'list' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>البلاغات</button>
                    <button onClick={() => setActiveTab('reports')} className={`px-4 py-2 rounded-lg transition ${activeTab === 'reports' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>التقارير</button>
                </div>
            </div>

            {activeTab === 'list' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
                    {/* Ticket List Sidebar */}
                    <div className="bg-white rounded-xl shadow-lg flex flex-col overflow-hidden border border-gray-200">
                        <div className="p-4 border-b border-gray-100 bg-gray-50">
                            <button onClick={() => setShowCreateModal(true)} className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition font-bold mb-3">+ بلاغ جديد</button>
                            <div className="flex gap-2">
                                <select 
                                    value={statusFilter} 
                                    onChange={(e) => setStatusFilter(e.target.value as any)} 
                                    className="flex-1 p-2 text-sm border rounded bg-white"
                                >
                                    <option value="all">كل الحالات</option>
                                    {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                </select>
                                <select 
                                    value={assigneeFilter} 
                                    onChange={(e) => setAssigneeFilter(e.target.value)} 
                                    className="flex-1 p-2 text-sm border rounded bg-white"
                                >
                                    <option value="all">كل الموظفين</option>
                                    {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {filteredTickets.length > 0 ? (
                                filteredTickets.map(ticket => (
                                    <div 
                                        key={ticket.id} 
                                        onClick={() => setSelectedTicket(ticket)}
                                        className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition ${selectedTicket?.id === ticket.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : ''}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-gray-800 line-clamp-1">{ticket.title}</span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_COLORS[ticket.status]}`}>{STATUS_LABELS[ticket.status]}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 line-clamp-2 mb-2">{ticket.description}</p>
                                        <div className="flex justify-between items-center text-xs text-gray-400">
                                            <span>{new Date(ticket.updatedAt).toLocaleDateString('ar-EG')}</span>
                                            <span className={`px-2 py-0.5 rounded ${ticket.priority === 'critical' ? 'bg-red-100 text-red-600' : 'bg-gray-100'}`}>{PRIORITY_LABELS[ticket.priority]}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-gray-500">لا توجد بلاغات.</div>
                            )}
                        </div>
                    </div>

                    {/* Ticket Detail View */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-lg flex flex-col border border-gray-200 overflow-hidden">
                        {selectedTicket ? (
                            <>
                                {/* Header */}
                                <div className="p-4 border-b bg-gray-50 flex justify-between items-start">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                            {selectedTicket.title}
                                            <span className="text-sm font-normal text-gray-500">#{selectedTicket.id}</span>
                                        </h2>
                                        <p className="text-sm text-gray-600 mt-1">{selectedTicket.description}</p>
                                    </div>
                                    <div className="flex flex-col gap-2 items-end">
                                        <select 
                                            value={selectedTicket.status} 
                                            onChange={(e) => updateTicketStatus(selectedTicket.id, e.target.value as TicketStatus)}
                                            className={`text-sm font-bold py-1 px-3 rounded border ${STATUS_COLORS[selectedTicket.status]}`}
                                        >
                                            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                        </select>
                                        <select 
                                            value={selectedTicket.assignedTo || ''} 
                                            onChange={(e) => assignTicket(selectedTicket.id, e.target.value)}
                                            className="text-sm border rounded p-1 bg-white"
                                        >
                                            <option value="">غير مخصص</option>
                                            {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Messages Area */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                                    {/* Ticket Info Block */}
                                    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-sm text-gray-700 mb-4">
                                        <p><strong>العميل:</strong> {store.customers.find(c => c.id === selectedTicket.customerId)?.name || 'غير محدد'}</p>
                                        <p><strong>الأولوية:</strong> {PRIORITY_LABELS[selectedTicket.priority]}</p>
                                        <p><strong>تاريخ الإنشاء:</strong> {new Date(selectedTicket.createdAt).toLocaleString('ar-EG')}</p>
                                    </div>

                                    {selectedTicket.messages.map(msg => (
                                        <div key={msg.id} className={`flex flex-col ${msg.senderId === currentUser.id ? 'items-end' : 'items-start'}`}>
                                            <div className={`max-w-[80%] rounded-lg p-3 ${msg.senderId === currentUser.id ? 'bg-indigo-100 text-indigo-900 rounded-tl-none' : 'bg-white border text-gray-800 rounded-tr-none shadow-sm'}`}>
                                                <p className="text-xs font-bold mb-1 text-opacity-70">{msg.senderName}</p>
                                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                                {msg.attachments && msg.attachments.map((att, idx) => (
                                                    <div key={idx} className="mt-2 p-2 bg-white/50 rounded border text-xs flex items-center gap-2">
                                                        <span className="font-bold">📎 مرفق:</span>
                                                        <a href={att.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate max-w-[150px]">{att.name}</a>
                                                    </div>
                                                ))}
                                                <span className="text-[10px] opacity-50 mt-1 block text-left" dir="ltr">{new Date(msg.timestamp).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Input Area */}
                                <div className="p-4 border-t bg-white flex gap-3 items-center">
                                    <label className="cursor-pointer text-gray-400 hover:text-gray-600 p-2">
                                        <input type="file" className="hidden" onChange={handleFileUpload} />
                                        <span className="text-xl">📎</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="اكتب ردك هنا..." 
                                        className="flex-1 p-3 border rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                    />
                                    <button 
                                        onClick={handleSendMessage}
                                        disabled={!messageInput.trim()}
                                        className="bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 disabled:bg-gray-300 transition"
                                    >
                                        <PaperAirplaneIcon />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <div className="text-6xl mb-4">🎫</div>
                                <p>اختر بلاغاً لعرض التفاصيل</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'reports' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><CheckCircleIcon /> توزيع حالات البلاغات</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={reportsData.statusChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {reportsData.statusChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><UsersIcon /> أداء الموظفين</h3>
                        <div className="h-64">
                             <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={reportsData.employeeStats} margin={{top: 20, right: 30, left: 20, bottom: 5}}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="total" name="إجمالي المسند" fill="#8884d8" />
                                    <Bar dataKey="resolved" name="تم حله" fill="#82ca9d" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-lg col-span-1 md:col-span-2">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><ExclamationTriangleIcon /> البلاغات الحرجة والمفتوحة</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-sm">
                                <thead className="bg-gray-50 border-b"><tr><th className="p-3">#</th><th className="p-3">العنوان</th><th className="p-3">الأولوية</th><th className="p-3">المسؤول</th><th className="p-3">منذ</th></tr></thead>
                                <tbody>
                                    {tickets.filter(t => t.status === 'open' && (t.priority === 'high' || t.priority === 'critical')).map(t => (
                                        <tr key={t.id} className="border-b hover:bg-gray-50">
                                            <td className="p-3">{t.id}</td>
                                            <td className="p-3 font-medium">{t.title}</td>
                                            <td className="p-3"><span className="text-red-600 font-bold">{PRIORITY_LABELS[t.priority]}</span></td>
                                            <td className="p-3">{employees.find(e => e.id === t.assignedTo)?.fullName || 'غير محدد'}</td>
                                            <td className="p-3 text-gray-500">{new Date(t.createdAt).toLocaleDateString('ar-EG')}</td>
                                        </tr>
                                    ))}
                                    {tickets.filter(t => t.status === 'open' && (t.priority === 'high' || t.priority === 'critical')).length === 0 && (
                                        <tr><td colSpan={5} className="text-center p-4 text-gray-500">لا توجد بلاغات حرجة مفتوحة. ممتاز!</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4">إنشاء بلاغ جديد</h2>
                        <form onSubmit={handleCreateSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">عنوان البلاغ</label>
                                <input type="text" required value={newTicketData.title} onChange={e => setNewTicketData({...newTicketData, title: e.target.value})} className="w-full p-2 border rounded" placeholder="مثال: مشكلة في الفاتورة..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">الوصف</label>
                                <textarea required value={newTicketData.description} onChange={e => setNewTicketData({...newTicketData, description: e.target.value})} className="w-full p-2 border rounded h-24" placeholder="تفاصيل المشكلة..." />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">الأولوية</label>
                                    <select value={newTicketData.priority} onChange={e => setNewTicketData({...newTicketData, priority: e.target.value as any})} className="w-full p-2 border rounded">
                                        {Object.entries(PRIORITY_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">تعيين إلى</label>
                                    <select value={newTicketData.assignedTo} onChange={e => setNewTicketData({...newTicketData, assignedTo: e.target.value})} className="w-full p-2 border rounded">
                                        <option value="">تلقائي / غير محدد</option>
                                        {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">العميل (اختياري)</label>
                                <select value={newTicketData.customerId} onChange={e => setNewTicketData({...newTicketData, customerId: e.target.value})} className="w-full p-2 border rounded">
                                    <option value="">اختر عميل...</option>
                                    {store.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-3 mt-4">
                                <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">إنشاء</button>
                                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded hover:bg-gray-200">إلغاء</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupportTicketing;
