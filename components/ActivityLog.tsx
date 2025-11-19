
import React, { useState, useMemo } from 'react';
import type { ActivityLog, Employee } from '../types';

interface ActivityLogProps {
    logs: ActivityLog[];
    employees: Employee[];
}

const ActivityLogComponent: React.FC<ActivityLogProps> = ({ logs, employees }) => {
    const [filterUser, setFilterUser] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    const filteredLogs = useMemo(() => {
        let filtered = logs || [];

        if (filterUser) {
            filtered = filtered.filter(log => log.userId === filterUser);
        }

        const start = startDate ? new Date(startDate) : null;
        if (start) start.setHours(0, 0, 0, 0);

        const end = endDate ? new Date(endDate) : null;
        if (end) end.setHours(23, 59, 59, 999);

        if (start || end) {
            filtered = filtered.filter(log => {
                const logDate = new Date(log.timestamp);
                if (start && end) return logDate >= start && logDate <= end;
                if (start) return logDate >= start;
                if (end) return logDate <= end;
                return true;
            });
        }

        return filtered;
    }, [logs, filterUser, startDate, endDate]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">سجل الحركات</h1>
            <p className="text-gray-600">مراقبة جميع الإجراءات والأنشطة التي تمت على النظام من قبل المستخدمين.</p>

            <div className="bg-white p-4 rounded-xl shadow-lg">
                <div className="flex items-center gap-4 flex-wrap">
                    <label className="font-medium">فلترة حسب:</label>
                    <select value={filterUser} onChange={e => setFilterUser(e.target.value)} className="p-2 border rounded-lg bg-gray-50">
                        <option value="">كل الموظفين</option>
                        {(employees || []).map(employee => (
                            <option key={employee.id} value={employee.id}>{employee.fullName} ({employee.username})</option>
                        ))}
                    </select>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border rounded-lg" />
                    <span className="text-gray-500">إلى</span>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border rounded-lg" min={startDate} />
                    <button onClick={() => { setFilterUser(''); setStartDate(''); setEndDate(''); }} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition">مسح الفلاتر</button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="border-b-2 border-gray-200 bg-gray-50">
                            <tr>
                                <th className="p-3">التاريخ والوقت</th>
                                <th className="p-3">اسم المستخدم</th>
                                <th className="p-3">الإجراء</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.map(log => (
                                <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="p-3 text-sm text-gray-600">{new Date(log.timestamp).toLocaleString('ar-EG')}</td>
                                    <td className="p-3 font-medium">{log.username}</td>
                                    <td className="p-3">{log.action}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredLogs.length === 0 && (
                        <p className="text-center p-6 text-gray-500">لا توجد حركات تطابق الفلاتر المحددة.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActivityLogComponent;
