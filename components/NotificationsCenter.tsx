
import React, { useState, useMemo } from 'react';
import type { SystemNotification, NotificationType } from '../types';
import { 
    BellIcon, 
    ExclamationTriangleIcon, 
    ChartBarIcon, 
    WrenchScrewdriverIcon, 
    BanknotesIcon, 
    CalendarDaysIcon, 
    CheckCircleIcon, 
    InformationCircleIcon 
} from './icons/Icons';

interface NotificationsCenterProps {
    notifications: SystemNotification[];
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    deleteNotification: (id: string) => void;
}

const NotificationsCenter: React.FC<NotificationsCenterProps> = ({ notifications, markAsRead, markAllAsRead, deleteNotification }) => {
    const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all');
    const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all');

    const filteredNotifications = useMemo(() => {
        let result = [...notifications].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        if (filter === 'unread') {
            result = result.filter(n => !n.read);
        } else if (filter === 'high') {
            result = result.filter(n => n.priority === 'high');
        }

        if (typeFilter !== 'all') {
            result = result.filter(n => n.type === typeFilter);
        }

        return result;
    }, [notifications, filter, typeFilter]);

    const getIcon = (type: NotificationType) => {
        switch (type) {
            case 'stock': return <ExclamationTriangleIcon />;
            case 'invoice': return <ChartBarIcon />;
            case 'service': return <WrenchScrewdriverIcon />;
            case 'expense': return <BanknotesIcon />;
            case 'payment': return <CalendarDaysIcon />;
            case 'subscription': return <ExclamationTriangleIcon />;
            default: return <InformationCircleIcon />;
        }
    };

    const getBgColor = (type: NotificationType) => {
         switch (type) {
            case 'stock': return 'bg-red-100 text-red-600';
            case 'subscription': return 'bg-orange-100 text-orange-600';
            case 'expense': return 'bg-yellow-100 text-yellow-600';
            case 'invoice': return 'bg-green-100 text-green-600';
            case 'service': return 'bg-blue-100 text-blue-600';
            case 'payment': return 'bg-purple-100 text-purple-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <BellIcon />
                        {unreadCount > 0 && (
                             <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                        )}
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800">مركز الإشعارات</h1>
                </div>
                {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="text-sm text-indigo-600 hover:underline">
                        تحديد الكل كمقروء
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm flex flex-wrap gap-4 items-center">
                <div className="flex gap-2">
                    <button onClick={() => setFilter('all')} className={`px-3 py-1 rounded-full text-sm transition ${filter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>الكل</button>
                    <button onClick={() => setFilter('unread')} className={`px-3 py-1 rounded-full text-sm transition ${filter === 'unread' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>غير مقروء</button>
                    <button onClick={() => setFilter('high')} className={`px-3 py-1 rounded-full text-sm transition ${filter === 'high' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>عاجل</button>
                </div>
                <div className="h-6 w-px bg-gray-300 mx-2 hidden md:block"></div>
                <select 
                    value={typeFilter} 
                    onChange={e => setTypeFilter(e.target.value as any)}
                    className="p-2 border rounded-lg text-sm bg-gray-50"
                >
                    <option value="all">كل الأنواع</option>
                    <option value="stock">المخزون</option>
                    <option value="invoice">الفواتير</option>
                    <option value="service">الخدمات</option>
                    <option value="expense">المصروفات</option>
                    <option value="payment">الدفعات</option>
                    <option value="subscription">الاشتراك</option>
                    <option value="system">النظام</option>
                </select>
            </div>

            {/* Notifications List */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {filteredNotifications.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {filteredNotifications.map(notification => (
                            <div 
                                key={notification.id} 
                                className={`p-5 flex items-start gap-4 transition hover:bg-gray-50 ${notification.read ? 'opacity-75' : 'bg-indigo-50/30'}`}
                            >
                                <div className={`p-3 rounded-full flex-shrink-0 ${getBgColor(notification.type)}`}>
                                    {getIcon(notification.type)}
                                </div>
                                <div className="flex-grow">
                                    <div className="flex justify-between items-start">
                                        <h3 className={`font-bold text-gray-800 ${!notification.read ? 'text-indigo-900' : ''}`}>
                                            {notification.title}
                                            {notification.priority === 'high' && <span className="mr-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">عاجل</span>}
                                        </h3>
                                        <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                            {new Date(notification.timestamp).toLocaleString('ar-EG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 text-sm mt-1 leading-relaxed">{notification.message}</p>
                                    
                                    <div className="flex gap-3 mt-3">
                                        {!notification.read && (
                                            <button 
                                                onClick={() => markAsRead(notification.id)}
                                                className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium"
                                            >
                                                <CheckCircleIcon /> تم
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => deleteNotification(notification.id)}
                                            className="text-xs text-gray-400 hover:text-red-500"
                                        >
                                            حذف
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center text-gray-500">
                        <div className="inline-block p-4 bg-gray-100 rounded-full mb-4 text-gray-400">
                            <BellIcon />
                        </div>
                        <p className="text-lg">لا توجد إشعارات حالياً.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsCenter;
