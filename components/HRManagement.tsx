
import React, { useState, useEffect, useMemo } from 'react';
import type { Employee, CustomRole, ModuleDefinition, AttendanceRecord, Payroll, LeaveRequest, Advance, LeaveRequestType, LeaveRequestStatus, HRSettings, AttendanceStatus, Store } from '../types';
import Payslip from './Payslip'; // Import the Payslip component
import { CogIcon } from './icons/Icons';

interface HRManagementProps {
  store: Store;
  employees: Employee[];
  roles: CustomRole[];
  attendance: AttendanceRecord[];
  payrolls: Payroll[];
  leaves: LeaveRequest[];
  advances: Advance[];
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  updateEmployee: (employee: Employee) => void;
  deleteEmployee: (employeeId: string) => void;
  addRole: (role: Omit<CustomRole, 'id'>) => void;
  updateRole: (role: CustomRole) => void;
  deleteRole: (roleId: string) => void;
  logActivity: (action: string) => void;
  allModules: ModuleDefinition[];
  addOrUpdateDailyAttendance: (date: string, dailyRecords: { employeeId: string; status: AttendanceStatus; deductionAmount?: number; notes?: string; }[]) => void;
  generatePayrolls: () => void;
  updatePayroll: (payrollId: string, updates: { bonuses?: number; }) => void;
  markPayrollAsPaid: (payrollId: string) => void;
  addLeaveRequest: (leave: Omit<LeaveRequest, 'id' | 'status'>) => void;
  updateLeaveRequestStatus: (leaveId: string, status: LeaveRequestStatus) => void;
  addAdvance: (advance: Omit<Advance, 'id' | 'status'>) => void;
  // New prop to update store settings directly (passed via parent or we assume store update logic is available via props, 
  // but since App.tsx handles updates via specific functions, we might need to add a specific one or reuse a generic updateStore).
  // For this implementation within the constraints, I will assume we can trigger a store update via a new prop or extend an existing one.
  // Let's assume a new prop `updateHRSettings` is passed or we handle it locally if it was just a UI demo, but for real logic:
  updateHRSettings?: (settings: HRSettings) => void; 
}

const HRManagement: React.FC<HRManagementProps> = (props) => {
    const {
        store, employees, roles, attendance, payrolls, leaves, advances, addEmployee, updateEmployee, deleteEmployee,
        addRole, updateRole, deleteRole, allModules, addOrUpdateDailyAttendance,
        generatePayrolls, updatePayroll, markPayrollAsPaid, addLeaveRequest, updateLeaveRequestStatus, addAdvance,
        updateHRSettings
    } = props;

    const [activeTab, setActiveTab] = useState('employees');
    const [showEmployeeForm, setShowEmployeeForm] = useState(false);
    const [isEditingEmployee, setIsEditingEmployee] = useState<Employee | null>(null);
    const [employeeFormData, setEmployeeFormData] = useState<Omit<Employee, 'id'>>({ username: '', password: '', roleId: '', fullName: '', phone: '', hireDate: new Date().toISOString().split('T')[0], baseSalary: 0, identityNumber: '', address: '' });
    
    const [showRoleForm, setShowRoleForm] = useState(false);
    const [isEditingRole, setIsEditingRole] = useState<CustomRole | null>(null);
    const [roleFormData, setRoleFormData] = useState<{ name: string, permissions: string[] }>({ name: '', permissions: [] });
    const [showLeaveForm, setShowLeaveForm] = useState(false);
    const [leaveFormData, setLeaveFormData] = useState<Omit<LeaveRequest, 'id' | 'status'>>({ employeeId: '', leaveType: 'annual', startDate: '', endDate: '', reason: '' });
    const [showAdvanceForm, setShowAdvanceForm] = useState(false);
    const [advanceFormData, setAdvanceFormData] = useState<Omit<Advance, 'id' | 'status'>>({ employeeId: '', amount: 0, date: new Date().toISOString().split('T')[0], notes: '' });
    const [selectedPayrollMonth, setSelectedPayrollMonth] = useState(new Date().toISOString().slice(0, 7));

    const [selectedAttendanceDate, setSelectedAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [dailyAttendanceRecords, setDailyAttendanceRecords] = useState<Map<string, { status: AttendanceStatus, deductionAmount: number, notes: string }>>(new Map());
    
    const [viewingPayslip, setViewingPayslip] = useState<Payroll | null>(null);

    // Settings State
    const [hrSettingsData, setHrSettingsData] = useState<HRSettings>(store.hrSettings || {
        workingDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
        officialCheckInTime: '09:00',
        absenceDeductionMethod: 'daily_rate'
    });

    useEffect(() => {
        if (store.hrSettings) {
            setHrSettingsData(store.hrSettings);
        }
    }, [store.hrSettings]);

    useEffect(() => {
        const recordsMap = new Map<string, { status: AttendanceStatus, deductionAmount: number, notes: string }>();
        (employees || []).forEach(emp => {
            const record = (attendance || []).find(a => a.employeeId === emp.id && a.date === selectedAttendanceDate);
            if (record) {
                recordsMap.set(emp.id, { status: record.status, deductionAmount: record.deductionAmount, notes: record.notes });
            } else {
                recordsMap.set(emp.id, { status: 'present', deductionAmount: 0, notes: '' });
            }
        });
        setDailyAttendanceRecords(recordsMap);
    }, [selectedAttendanceDate, attendance, employees]);
    
    const handleDailyAttendanceChange = (employeeId: string, field: 'status' | 'deductionAmount' | 'notes', value: any) => {
        setDailyAttendanceRecords(prev => {
            const newMap = new Map(prev);
            const record = newMap.get(employeeId) || { status: 'present', deductionAmount: 0, notes: '' };
            (record as any)[field] = value;
            
            // Auto-calculate deduction based on settings if status changes to absent
            if (field === 'status') {
                if (value === 'absent') {
                    if (hrSettingsData.absenceDeductionMethod === 'daily_rate') {
                        const emp = employees.find(e => e.id === employeeId);
                        if (emp) {
                            // Approx daily rate: Base Salary / 30
                            const dailyRate = Math.round(emp.baseSalary / 30);
                            record.deductionAmount = dailyRate;
                        }
                    }
                } else if (value === 'present') {
                    record.deductionAmount = 0;
                }
            }

            newMap.set(employeeId, record);
            return newMap;
        });
    };

    const handleSaveDailyAttendance = () => {
        const recordsToSave = Array.from(dailyAttendanceRecords.entries()).map(([employeeId, data]) => ({ employeeId, ...data }));
        addOrUpdateDailyAttendance(selectedAttendanceDate, recordsToSave);
        alert('تم حفظ سجل الحضور اليومي بنجاح!');
    };

    const handleSettingsSave = () => {
        if (updateHRSettings) {
            updateHRSettings(hrSettingsData);
            alert('تم حفظ إعدادات الموارد البشرية بنجاح.');
        } else {
            // Fallback if prop not provided (handled in parent in real scenario)
            console.log('Settings to save:', hrSettingsData);
            alert('ميزة الحفظ تحتاج إلى ربط مع قاعدة البيانات الرئيسية (UpdateStore).');
        }
    };

    const toggleWorkingDay = (day: string) => {
        setHrSettingsData(prev => {
            const days = prev.workingDays || [];
            if (days.includes(day as any)) {
                return { ...prev, workingDays: days.filter(d => d !== day) };
            } else {
                return { ...prev, workingDays: [...days, day as any] };
            }
        });
    };

    const resetEmployeeForm = () => { setShowEmployeeForm(false); setIsEditingEmployee(null); setEmployeeFormData({ username: '', password: '', roleId: '', fullName: '', phone: '', hireDate: new Date().toISOString().split('T')[0], baseSalary: 0, identityNumber: '', address: '' }); };
    const resetRoleForm = () => { setShowRoleForm(false); setIsEditingRole(null); setRoleFormData({ name: '', permissions: [] }); };
    const handleEmployeeSubmit = (e: React.FormEvent) => { e.preventDefault(); if (isEditingEmployee) { updateEmployee({ ...isEditingEmployee, ...employeeFormData, password: employeeFormData.password || isEditingEmployee.password }); } else { if (!employeeFormData.password) { alert('الرجاء إدخال كلمة المرور.'); return; } addEmployee(employeeFormData); } resetEmployeeForm(); };
    const handleRoleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (isEditingRole) { updateRole({ ...isEditingRole, ...roleFormData }); } else { addRole(roleFormData); } resetRoleForm(); };
    const handleLeaveSubmit = (e: React.FormEvent) => { e.preventDefault(); if (leaveFormData.employeeId && leaveFormData.startDate && leaveFormData.endDate) { addLeaveRequest(leaveFormData); setShowLeaveForm(false); setLeaveFormData({ employeeId: '', leaveType: 'annual', startDate: '', endDate: '', reason: '' }); } };
    const handleAdvanceSubmit = (e: React.FormEvent) => { e.preventDefault(); if (advanceFormData.employeeId && advanceFormData.amount > 0) { addAdvance(advanceFormData); setShowAdvanceForm(false); setAdvanceFormData({ employeeId: '', amount: 0, date: new Date().toISOString().split('T')[0], notes: '' }); } };
    const handlePermissionChange = (moduleId: string) => { setRoleFormData(prev => ({ ...prev, permissions: prev.permissions.includes(moduleId) ? prev.permissions.filter(p => p !== moduleId) : [...prev.permissions, moduleId] })); };
    const handleDeleteEmployee = (employeeId: string) => { if (window.confirm('هل أنت متأكد؟')) { deleteEmployee(employeeId); } };
    const handleDeleteRole = (roleId: string) => { if (window.confirm('هل أنت متأكد؟')) { deleteRole(roleId); } };

    // --- Render Functions for Tabs ---
    const renderEmployeesTab = () => (
        <div className="space-y-4">
            <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-gray-800">بيانات الموظفين</h2><button onClick={() => { setIsEditingEmployee(null); setEmployeeFormData({ username: '', password: '', roleId: '', fullName: '', phone: '', hireDate: new Date().toISOString().split('T')[0], baseSalary: 0 }); setShowEmployeeForm(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg">إضافة موظف</button></div>
            <div className="overflow-x-auto"><table className="w-full text-right"><thead className="border-b-2"><tr><th className="p-3">الاسم الكامل</th><th className="p-3">اسم المستخدم</th><th className="p-3">الدور</th><th className="p-3">الهاتف</th><th className="p-3">الراتب الأساسي</th><th className="p-3">الإجراءات</th></tr></thead><tbody>
                {(employees || []).map(emp => (<tr key={emp.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{emp.fullName}</td><td className="p-3">{emp.username}</td><td className="p-3">{roles.find(r => r.id === emp.roleId)?.name}</td><td className="p-3">{emp.phone}</td><td className="p-3">{emp.baseSalary.toLocaleString()} ج.م</td>
                    <td className="p-3 flex gap-2"><button onClick={() => { setEmployeeFormData({...emp, password: ''}); setIsEditingEmployee(emp); setShowEmployeeForm(true); }} className="text-blue-600">تعديل</button><button onClick={() => handleDeleteEmployee(emp.id)} className="text-red-600">حذف</button></td>
                </tr>))}</tbody></table></div>
        </div>
    );
    const renderAttendanceTab = () => (
        <div className="space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-4"><h2 className="text-2xl font-bold text-gray-800">سجل الحضور اليومي</h2><div className="flex gap-4 items-center"><input type="date" value={selectedAttendanceDate} onChange={e => setSelectedAttendanceDate(e.target.value)} className="p-2 border rounded-lg" /><button onClick={handleSaveDailyAttendance} className="bg-green-500 text-white px-4 py-2 rounded-lg">حفظ التغييرات</button></div></div>
            <div className="overflow-x-auto bg-white rounded-xl shadow-lg border"><table className="w-full text-right"><thead className="border-b-2 bg-gray-50"><tr><th className="p-3">الموظف</th><th className="p-3">الحالة</th><th className="p-3">مبلغ الخصم</th><th className="p-3">ملاحظات</th></tr></thead><tbody>
            {(employees || []).map(emp => { const record = dailyAttendanceRecords.get(emp.id); return (<tr key={emp.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium">{emp.fullName}</td>
                <td className="p-2"><select value={record?.status || 'present'} onChange={e => handleDailyAttendanceChange(emp.id, 'status', e.target.value as AttendanceStatus)} className="p-1 border rounded bg-gray-50"><option value="present">حاضر</option><option value="absent">غائب</option><option value="late">متأخر</option><option value="on_leave">إجازة</option></select></td>
                <td className="p-2">{(record?.status === 'absent' || record?.status === 'late') && (<input type="number" value={record?.deductionAmount || 0} onChange={e => handleDailyAttendanceChange(emp.id, 'deductionAmount', parseFloat(e.target.value))} className="w-24 p-1 border rounded" />)}</td>
                <td className="p-2"><input type="text" value={record?.notes || ''} onChange={e => handleDailyAttendanceChange(emp.id, 'notes', e.target.value)} placeholder="ملاحظات..." className="w-full p-1 border rounded" /></td>
            </tr>);})}</tbody></table></div>
        </div>
    );
    const renderLeavesTab = () => (
        <div className="space-y-4">
            <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-gray-800">طلبات الإجازات</h2><button onClick={() => setShowLeaveForm(true)} className="bg-cyan-600 text-white px-4 py-2 rounded-lg">طلب إجازة جديد</button></div>
            <div className="overflow-x-auto"><table className="w-full text-right"><thead className="border-b-2"><tr><th className="p-3">الموظف</th><th className="p-3">النوع</th><th className="p-3">من</th><th className="p-3">إلى</th><th className="p-3">الحالة</th><th className="p-3">الإجراءات</th></tr></thead><tbody>
            {(leaves || []).map(l => (<tr key={l.id} className="border-b hover:bg-gray-50">
                <td className="p-3">{employees.find(e => e.id === l.employeeId)?.fullName}</td><td>{l.leaveType}</td><td>{l.startDate}</td><td>{l.endDate}</td><td>{l.status}</td>
                <td>{l.status === 'pending' && (<div className="flex gap-2"><button onClick={() => updateLeaveRequestStatus(l.id, 'approved')} className="text-green-600">موافقة</button><button onClick={() => updateLeaveRequestStatus(l.id, 'rejected')} className="text-red-600">رفض</button></div>)}</td>
            </tr>))}</tbody></table></div>
        </div>
    );
    const renderAdvancesTab = () => (
        <div className="space-y-4">
            <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-gray-800">السلف المالية</h2><button onClick={() => setShowAdvanceForm(true)} className="bg-teal-600 text-white px-4 py-2 rounded-lg">تسجيل سلفة</button></div>
            <div className="overflow-x-auto"><table className="w-full text-right"><thead className="border-b-2"><tr><th className="p-3">الموظف</th><th className="p-3">المبلغ</th><th className="p-3">التاريخ</th><th className="p-3">الحالة</th></tr></thead><tbody>
            {(advances || []).map(a => (<tr key={a.id} className="border-b hover:bg-gray-50">
                <td className="p-3">{employees.find(e => e.id === a.employeeId)?.fullName}</td><td>{a.amount.toLocaleString()} ج.م</td><td>{new Date(a.date).toLocaleDateString('ar-EG')}</td>
                <td className={`font-bold ${a.status === 'paid' ? 'text-green-600' : 'text-orange-500'}`}>{a.status === 'paid' ? `تم السداد` : 'غير مسددة'}</td>
            </tr>))}</tbody></table></div>
        </div>
    );
    const renderPayrollTab = () => {
         const filteredPayrolls = (payrolls || []).filter(p => p.monthYear === selectedPayrollMonth);
        return (<div className="space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-4"><h2 className="text-2xl font-bold text-gray-800">الرواتب</h2><div className="flex gap-4 items-center"><input type="month" value={selectedPayrollMonth} onChange={e => setSelectedPayrollMonth(e.target.value)} className="p-2 border rounded"/><button onClick={generatePayrolls} className="bg-indigo-600 text-white px-4 py-2 rounded-lg">توليد رواتب الشهر</button></div></div>
            <div className="overflow-x-auto bg-white rounded-xl shadow-lg border"><table className="w-full text-right text-sm"><thead className="border-b-2 bg-gray-50"><tr><th className="p-2">الموظف</th><th className="p-2">الأساسي</th><th className="p-2">المكافآت</th><th className="p-2">إجمالي الخصومات</th><th className="p-2">الصافي</th><th className="p-2">الحالة</th><th className="p-2">الإجراء</th></tr></thead><tbody>
            {filteredPayrolls.map(p => (<tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="p-2">{employees.find(e => e.id === p.employeeId)?.fullName}</td><td>{p.baseSalary.toLocaleString()} ج.م</td>
                <td className="p-2"><input type="number" value={p.bonuses} onChange={e => updatePayroll(p.id, { bonuses: parseFloat(e.target.value)})} className="w-20 p-1 border rounded" disabled={p.status==='paid'}/></td>
                <td className="text-red-500 font-semibold">{p.totalDeductions > 0 ? p.totalDeductions.toLocaleString() + ' ج.م' : '-'}</td>
                <td className="font-bold">{p.netSalary.toLocaleString()} ج.م</td>
                <td className={`font-bold ${p.status === 'paid' ? 'text-green-600' : 'text-orange-500'}`}>{p.status === 'paid' ? 'مدفوع' : 'معلق'}</td>
                <td className="p-2 flex gap-2">
                    {p.status === 'pending' && <button onClick={() => markPayrollAsPaid(p.id)} className="bg-green-500 text-white px-2 py-1 text-xs rounded">دفع</button>}
                    {p.status === 'paid' && <button onClick={() => setViewingPayslip(p)} className="bg-blue-500 text-white px-2 py-1 text-xs rounded">عرض الكشف</button>}
                </td>
            </tr>))}</tbody></table>{filteredPayrolls.length === 0 && <p className="text-center p-4 text-gray-500">لم يتم توليد رواتب لهذا الشهر بعد.</p>}</div>
        </div>);
    };
    const renderRolesTab = () => (
         <div className="space-y-4">
            <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-gray-800">الأدوار والصلاحيات</h2><button onClick={() => { setIsEditingRole(null); setRoleFormData({ name: '', permissions: [] }); setShowRoleForm(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg">إضافة دور</button></div>
             <table className="w-full text-right"><thead className="border-b-2"><tr><th className="p-3">اسم الدور</th><th className="p-3">الصلاحيات</th><th className="p-3">الإجراءات</th></tr></thead><tbody>
            {(roles || []).map(role => (<tr key={role.id}><td className="p-3 font-medium">{role.name}</td><td>{role.permissions.length} صلاحية</td><td className="flex gap-2"><button onClick={() => { setRoleFormData({ name: role.name, permissions: role.permissions }); setIsEditingRole(role); setShowRoleForm(true); }}>تعديل</button><button onClick={() => handleDeleteRole(role.id)}>حذف</button></td></tr>))}</tbody></table>
        </div>
    );

    const renderSettingsTab = () => (
        <div className="space-y-6 bg-white p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <CogIcon /> إعدادات الموارد البشرية
                </h2>
                <button onClick={handleSettingsSave} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition shadow">
                    حفظ الإعدادات
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Working Days */}
                <div>
                    <h3 className="text-lg font-bold text-gray-700 mb-3">أيام العمل الرسمية</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                            const arDays: {[key:string]: string} = {'Sunday': 'الأحد', 'Monday': 'الإثنين', 'Tuesday': 'الثلاثاء', 'Wednesday': 'الأربعاء', 'Thursday': 'الخميس', 'Friday': 'الجمعة', 'Saturday': 'السبت'};
                            const isChecked = hrSettingsData.workingDays.includes(day as any);
                            return (
                                <label key={day} className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition ${isChecked ? 'bg-indigo-50 border-indigo-200' : 'hover:bg-gray-50'}`}>
                                    <input 
                                        type="checkbox" 
                                        checked={isChecked} 
                                        onChange={() => toggleWorkingDay(day)}
                                        className="w-5 h-5 text-indigo-600" 
                                    />
                                    <span className="mr-2 font-medium">{arDays[day]}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>

                {/* Other Policies */}
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-bold text-gray-700 mb-3">توقيت الدوام</h3>
                        <label className="block text-sm text-gray-600 mb-1">وقت الحضور الرسمي</label>
                        <input 
                            type="time" 
                            value={hrSettingsData.officialCheckInTime} 
                            onChange={e => setHrSettingsData({...hrSettingsData, officialCheckInTime: e.target.value})}
                            className="w-full p-2 border rounded-lg"
                        />
                        <p className="text-xs text-gray-500 mt-1">يستخدم هذا التوقيت لحساب التأخيرات تلقائياً.</p>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-gray-700 mb-3">سياسة الخصم</h3>
                        <div className="flex flex-col gap-2">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="deductionMethod" 
                                    value="daily_rate" 
                                    checked={hrSettingsData.absenceDeductionMethod === 'daily_rate'}
                                    onChange={() => setHrSettingsData({...hrSettingsData, absenceDeductionMethod: 'daily_rate'})}
                                    className="w-4 h-4 text-indigo-600"
                                />
                                <span className="mr-2">خصم تلقائي (يومية الموظف)</span>
                            </label>
                             <label className="flex items-center space-x-2 cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="deductionMethod" 
                                    value="manual" 
                                    checked={hrSettingsData.absenceDeductionMethod === 'manual'}
                                    onChange={() => setHrSettingsData({...hrSettingsData, absenceDeductionMethod: 'manual'})}
                                    className="w-4 h-4 text-indigo-600"
                                />
                                <span className="mr-2">تحديد يدوي عند التسجيل</span>
                            </label>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 p-2 bg-yellow-50 border border-yellow-100 rounded">
                            ملاحظة: الخصم التلقائي يقوم باحتساب قيمة اليوم بناءً على (الراتب الأساسي / 30).
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">الموارد البشرية (HR)</h1>
            <div className="flex border-b overflow-x-auto">
                <button onClick={() => setActiveTab('employees')} className={`px-4 py-2 whitespace-nowrap ${activeTab === 'employees' ? 'border-b-2 border-indigo-600 font-bold text-indigo-600' : 'text-gray-600'}`}>الموظفين</button>
                <button onClick={() => setActiveTab('attendance')} className={`px-4 py-2 whitespace-nowrap ${activeTab === 'attendance' ? 'border-b-2 border-indigo-600 font-bold text-indigo-600' : 'text-gray-600'}`}>الحضور اليومي</button>
                <button onClick={() => setActiveTab('leaves')} className={`px-4 py-2 whitespace-nowrap ${activeTab === 'leaves' ? 'border-b-2 border-indigo-600 font-bold text-indigo-600' : 'text-gray-600'}`}>الإجازات</button>
                <button onClick={() => setActiveTab('advances')} className={`px-4 py-2 whitespace-nowrap ${activeTab === 'advances' ? 'border-b-2 border-indigo-600 font-bold text-indigo-600' : 'text-gray-600'}`}>السلف</button>
                <button onClick={() => setActiveTab('payroll')} className={`px-4 py-2 whitespace-nowrap ${activeTab === 'payroll' ? 'border-b-2 border-indigo-600 font-bold text-indigo-600' : 'text-gray-600'}`}>الرواتب</button>
                <button onClick={() => setActiveTab('roles')} className={`px-4 py-2 whitespace-nowrap ${activeTab === 'roles' ? 'border-b-2 border-indigo-600 font-bold text-indigo-600' : 'text-gray-600'}`}>الأدوار</button>
                <button onClick={() => setActiveTab('settings')} className={`px-4 py-2 whitespace-nowrap ${activeTab === 'settings' ? 'border-b-2 border-indigo-600 font-bold text-indigo-600' : 'text-gray-600'}`}>الإعدادات</button>
            </div>
            
            {activeTab === 'employees' && renderEmployeesTab()}
            {activeTab === 'attendance' && renderAttendanceTab()}
            {activeTab === 'leaves' && renderLeavesTab()}
            {activeTab === 'advances' && renderAdvancesTab()}
            {activeTab === 'payroll' && renderPayrollTab()}
            {activeTab === 'roles' && renderRolesTab()}
            {activeTab === 'settings' && renderSettingsTab()}
            
             {viewingPayslip && (<Payslip payroll={viewingPayslip} employee={employees.find(e => e.id === viewingPayslip.employeeId)!} storeName={store.name} onClose={() => setViewingPayslip(null)}/>)}
             {showEmployeeForm && (<div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"><div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"><h2 className="text-xl font-bold mb-4">{isEditingEmployee ? 'تعديل موظف' : 'إضافة موظف'}</h2><form onSubmit={handleEmployeeSubmit} className="space-y-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label>الاسم الكامل</label><input type="text" value={employeeFormData.fullName} onChange={e => setEmployeeFormData({...employeeFormData, fullName: e.target.value})} className="w-full p-2 border rounded" required /></div><div><label>اسم المستخدم</label><input type="text" value={employeeFormData.username} onChange={e => setEmployeeFormData({...employeeFormData, username: e.target.value})} className="w-full p-2 border rounded" required disabled={!!isEditingEmployee} /></div><div><label>كلمة المرور</label><input type="password" value={employeeFormData.password} onChange={e => setEmployeeFormData({...employeeFormData, password: e.target.value})} placeholder={isEditingEmployee ? 'اتركها فارغة لعدم التغيير' : ''} className="w-full p-2 border rounded" required={!isEditingEmployee} /></div><div><label>الدور</label><select value={employeeFormData.roleId} onChange={e => setEmployeeFormData({...employeeFormData, roleId: e.target.value})} className="w-full p-2 border rounded bg-gray-50" required><option value="">اختر دور...</option>{(roles || []).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div><div><label>الهاتف</label><input type="text" value={employeeFormData.phone} onChange={e => setEmployeeFormData({...employeeFormData, phone: e.target.value})} className="w-full p-2 border rounded" required/></div><div><label>الراتب الأساسي</label><input type="number" value={employeeFormData.baseSalary} onChange={e => setEmployeeFormData({...employeeFormData, baseSalary: parseFloat(e.target.value)})} className="w-full p-2 border rounded" required/></div><div><label>تاريخ التعيين</label><input type="date" value={employeeFormData.hireDate} onChange={e => setEmployeeFormData({...employeeFormData, hireDate: e.target.value})} className="w-full p-2 border rounded" required/></div></div><div className="flex gap-4"><button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">حفظ</button><button type="button" onClick={resetEmployeeForm} className="bg-gray-500 text-white px-4 py-2 rounded">إلغاء</button></div></form></div></div>)}
            {showRoleForm && (<div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"><div className="bg-white p-6 rounded-lg w-full max-w-lg"><h2 className="text-xl font-bold mb-4">{isEditingRole ? 'تعديل دور' : 'إضافة دور'}</h2><form onSubmit={handleRoleSubmit} className="space-y-4"><div><label>اسم الدور</label><input type="text" value={roleFormData.name} onChange={e => setRoleFormData({...roleFormData, name: e.target.value})} className="w-full p-2 border rounded" required /></div><div><label>الصلاحيات</label><div className="grid grid-cols-2 gap-2 border p-2 rounded max-h-48 overflow-y-auto">{(allModules || []).map(m => (<label key={m.id}><input type="checkbox" checked={roleFormData.permissions.includes(m.id)} onChange={() => handlePermissionChange(m.id)} /> {m.label}</label>))}</div></div><div className="flex gap-4"><button type="submit">حفظ</button><button type="button" onClick={resetRoleForm}>إلغاء</button></div></form></div></div>)}
            {showLeaveForm && (<div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"><form onSubmit={handleLeaveSubmit} className="bg-white p-6 rounded-lg space-y-3 w-full max-w-md"><h2 className="text-xl font-bold">طلب إجازة</h2><select value={leaveFormData.employeeId} onChange={e => setLeaveFormData(f => ({...f, employeeId: e.target.value}))} required className="w-full p-2 border rounded"><option value="">اختر الموظف</option>{(employees||[]).map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}</select><select value={leaveFormData.leaveType} onChange={e => setLeaveFormData(f => ({...f, leaveType: e.target.value as LeaveRequestType}))} className="w-full p-2 border rounded"><option value="annual">سنوية</option><option value="sick">مرضية</option><option value="unpaid">بدون أجر</option><option value="other">أخرى</option></select><div><label>من</label><input type="date" value={leaveFormData.startDate} onChange={e => setLeaveFormData(f => ({...f, startDate: e.target.value}))} className="w-full p-2 border rounded" required/></div><div><label>إلى</label><input type="date" value={leaveFormData.endDate} min={leaveFormData.startDate} onChange={e => setLeaveFormData(f => ({...f, endDate: e.target.value}))} className="w-full p-2 border rounded" required/></div><textarea value={leaveFormData.reason} onChange={e => setLeaveFormData(f => ({...f, reason: e.target.value}))} placeholder="السبب..." className="w-full p-2 border rounded"></textarea><div className="flex gap-2"><button type="submit">إرسال</button><button type="button" onClick={()=>setShowLeaveForm(false)}>إلغاء</button></div></form></div>)}
            {showAdvanceForm && (<div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"><form onSubmit={handleAdvanceSubmit} className="bg-white p-6 rounded-lg space-y-3 w-full max-w-md"><h2 className="text-xl font-bold">تسجيل سلفة</h2><select value={advanceFormData.employeeId} onChange={e => setAdvanceFormData(f => ({...f, employeeId: e.target.value}))} required className="w-full p-2 border rounded"><option value="">اختر الموظف</option>{(employees||[]).map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}</select><input type="number" value={advanceFormData.amount} onChange={e => setAdvanceFormData(f => ({...f, amount: parseFloat(e.target.value)}))} min="1" placeholder="المبلغ" className="w-full p-2 border rounded" required /><input type="date" value={advanceFormData.date} onChange={e => setAdvanceFormData(f => ({...f, date: e.target.value}))} className="w-full p-2 border rounded"/><textarea value={advanceFormData.notes} onChange={e => setAdvanceFormData(f => ({...f, notes: e.target.value}))} placeholder="ملاحظات..." className="w-full p-2 border rounded"></textarea><div className="flex gap-2"><button type="submit">حفظ</button><button type="button" onClick={()=>setShowAdvanceForm(false)}>إلغاء</button></div></form></div>)}
        </div>
    );
};
export default HRManagement;
