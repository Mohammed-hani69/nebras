
import React, { useState } from 'react';
import type { Store, AttendanceRecord } from '../types';

interface HRManagementProps {
    store: Store;
    updateStore: (data: Partial<Store>) => void;
}

const HRManagement: React.FC<HRManagementProps> = ({ store, updateStore }) => {
    const [activeTab, setActiveTab] = useState<'employees' | 'attendance' | 'payroll' | 'requests' | 'settings'>('employees');
    const { employees, attendance, hrSettings } = store;
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);

    const handleDailyAttendanceChange = (employeeId: string, field: string, value: any) => {
        const hrSettingsData = hrSettings;
        const newAttendance = [...attendance];
        let recordIndex = newAttendance.findIndex(a => a.employeeId === employeeId && a.date === attendanceDate);
        
        let record: AttendanceRecord;
        
        if (recordIndex === -1) {
            record = {
                id: `ATT-${Date.now()}-${Math.random()}`,
                employeeId,
                date: attendanceDate,
                status: 'present',
                deductionAmount: 0,
                notes: ''
            };
            newAttendance.push(record);
            recordIndex = newAttendance.length - 1;
        } else {
            // Ensure we clone the object to avoid direct mutation if it was a reference
            record = { ...newAttendance[recordIndex] };
        }

        if (field === 'status') {
            // @ts-ignore: Ensure value matches AttendanceStatus type
            record.status = value;
            if (value === 'absent') {
                if (hrSettingsData.absenceDeductionMethod === 'daily_rate') {
                    const emp = employees.find(e => e.id === employeeId);
                    if (emp) {
                        const dailyRate = Math.round(emp.baseSalary / 30);
                        record.deductionAmount = dailyRate;
                    }
                }
            } else if (value === 'present') {
                record.deductionAmount = 0;
            }
        } else if (field === 'deductionAmount') {
            record.deductionAmount = parseFloat(value) || 0;
        } else if (field === 'notes') {
            record.notes = value;
        }

        newAttendance[recordIndex] = record;
        updateStore({ attendance: newAttendance });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <h1 className="text-3xl font-bold text-gray-800">الموارد البشرية</h1>
            </div>
             <div className="flex border-b bg-white rounded-t-xl shadow-sm overflow-x-auto">
                <button onClick={() => setActiveTab('employees')} className={`px-6 py-3 font-medium transition ${activeTab === 'employees' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'}`}>الموظفين</button>
                <button onClick={() => setActiveTab('attendance')} className={`px-6 py-3 font-medium transition ${activeTab === 'attendance' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'}`}>الحضور</button>
                <button onClick={() => setActiveTab('payroll')} className={`px-6 py-3 font-medium transition ${activeTab === 'payroll' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'}`}>الرواتب</button>
                 <button onClick={() => setActiveTab('requests')} className={`px-6 py-3 font-medium transition ${activeTab === 'requests' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'}`}>الطلبات والسلف</button>
                <button onClick={() => setActiveTab('settings')} className={`px-6 py-3 font-medium transition ${activeTab === 'settings' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'}`}>الإعدادات</button>
            </div>
            
            <div className="bg-white rounded-b-xl shadow-lg p-6">
                 {activeTab === 'employees' && (
                     <div className="overflow-x-auto">
                         <table className="w-full text-right">
                             <thead className="bg-gray-50 border-b">
                                 <tr>
                                     <th className="p-3">الاسم</th>
                                     <th className="p-3">الوظيفة</th>
                                     <th className="p-3">الراتب الأساسي</th>
                                     <th className="p-3">تاريخ التعيين</th>
                                     <th className="p-3">الهاتف</th>
                                 </tr>
                             </thead>
                             <tbody>
                                 {employees.map(emp => (
                                     <tr key={emp.id} className="border-b hover:bg-gray-50">
                                         <td className="p-3 font-bold">{emp.fullName}</td>
                                         <td className="p-3">{store.roles.find(r => r.id === emp.roleId)?.name || emp.roleId}</td>
                                         <td className="p-3">{emp.baseSalary.toLocaleString()} ج.m</td>
                                         <td className="p-3">{new Date(emp.hireDate).toLocaleDateString('ar-EG')}</td>
                                         <td className="p-3">{emp.phone}</td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                     </div>
                 )}

                 {activeTab === 'attendance' && (
                     <div>
                         <div className="mb-4 flex gap-4 items-center">
                             <label className="font-bold">التاريخ:</label>
                             <input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} className="p-2 border rounded" />
                         </div>
                         <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="p-3">الموظف</th>
                                        <th className="p-3">الحالة</th>
                                        <th className="p-3">خصم (ج.م)</th>
                                        <th className="p-3">ملاحظات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {employees.map(emp => {
                                        const record = attendance.find(a => a.employeeId === emp.id && a.date === attendanceDate) || { status: 'present', deductionAmount: 0, notes: '' };
                                        return (
                                            <tr key={emp.id} className="border-b hover:bg-gray-50">
                                                <td className="p-3">{emp.fullName}</td>
                                                <td className="p-3">
                                                    <select 
                                                        value={record.status} 
                                                        onChange={(e) => handleDailyAttendanceChange(emp.id, 'status', e.target.value)}
                                                        className="p-2 border rounded bg-white"
                                                    >
                                                        <option value="present">حاضر</option>
                                                        <option value="absent">غائب</option>
                                                        <option value="late">متأخر</option>
                                                        <option value="on_leave">إجازة</option>
                                                    </select>
                                                </td>
                                                <td className="p-3">
                                                    <input 
                                                        type="number" 
                                                        value={record.deductionAmount} 
                                                        onChange={(e) => handleDailyAttendanceChange(emp.id, 'deductionAmount', e.target.value)}
                                                        className="w-24 p-2 border rounded"
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <input 
                                                        type="text" 
                                                        value={record.notes} 
                                                        onChange={(e) => handleDailyAttendanceChange(emp.id, 'notes', e.target.value)}
                                                        className="w-full p-2 border rounded"
                                                        placeholder="ملاحظات..."
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                         </div>
                     </div>
                 )}
                 
                 {activeTab === 'payroll' && <div className="text-center text-gray-500 p-8">نظام مسير الرواتب (قيد التطوير)</div>}
                 {activeTab === 'requests' && <div className="text-center text-gray-500 p-8">إدارة الإجازات والسلف (قيد التطوير)</div>}
                 {activeTab === 'settings' && <div className="text-center text-gray-500 p-8">إعدادات الموارد البشرية (قيد التطوير)</div>}
            </div>
        </div>
    );
};

export default HRManagement;
