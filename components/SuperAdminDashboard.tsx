




import React, { useState, useEffect, useMemo } from 'react';
import type { Store, Employee, PurchaseOrder, AISettings, CustomRole, ModuleDefinition, HRSettings } from '../types';
import SuperAdminSidebar from './SuperAdminSidebar';
import SuperAdminProfit from './SuperAdminProfit';
import SuperAdminAnalysis from './SuperAdminAnalysis';
import SuperAdminAISettings from './SuperAdminAISettings';
import SuperAdminMarketplace from './SuperAdminMarketplace';
import { DocumentDownloadIcon, BellIcon, ExclamationTriangleIcon, PaperAirplaneIcon, SparklesIcon } from './icons/Icons';
import { generateNotificationMessage } from '../services/geminiService';

interface SuperAdminDashboardProps {
  stores: Store[];
  setStores: React.Dispatch<React.SetStateAction<Store[]>>;
  onLogout: () => void;
  aiSettings: AISettings;
  onUpdateAISettings: (settings: AISettings) => void;
  marketplaceModules: ModuleDefinition[];
  onUpdateMarketplaceModule: (module: ModuleDefinition) => void;
}

const INITIAL_FORM_STATE = {
    name: '',
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    subscriptionStartDate: '',
    subscriptionEndDate: '',
    subscriptionMonthlyPrice: 0,
    storeType: '',
    enabledModules: [] as string[],
    adminFullName: '',
    adminPhone: '',
    adminUsername: '',
    adminPassword: '',
    aiInstructions: '',
};

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ stores, setStores, onLogout, aiSettings, onUpdateAISettings, marketplaceModules, onUpdateMarketplaceModule }) => {
    const [activeView, setActiveView] = useState('management');
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState<Store | null>(null);
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [showNotifications, setShowNotifications] = useState(false);
    
    // Broadcast State
    const [broadcastTopic, setBroadcastTopic] = useState('');
    const [broadcastTone, setBroadcastTone] = useState('رسمي ومهذب');
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [isGeneratingMsg, setIsGeneratingMsg] = useState(false);
    const [selectedStoreId, setSelectedStoreId] = useState('all');

    const notifications = useMemo(() => {
        const today = new Date();
        const alerts = [];

        for (const store of stores) {
            const endDate = new Date(store.subscriptionEndDate);
            const diffTime = endDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays <= 0) {
                alerts.push({
                    storeName: store.name,
                    message: 'اشتراك منتهي!',
                    type: 'expired' as const,
                    days: Math.abs(diffDays)
                });
            } else if (diffDays <= 3) {
                 alerts.push({
                    storeName: store.name,
                    message: `الاشتراك ينتهي خلال ${diffDays} يوم/أيام.`,
                    type: 'expiring' as const,
                    days: diffDays
                });
            }
        }
        return alerts.sort((a,b) => a.days - b.days);
    }, [stores]);


    const storePerformance = useMemo(() => {
        return stores.map(store => {
            const { products, sales, services, expenses, purchaseOrders } = store;

            const grossSales = sales.reduce((acc, sale) => acc + (sale.quantity * sale.unitPrice), 0);
            const serviceRevenue = services.reduce((acc, service) => acc + service.revenue, 0);
            const totalRevenue = grossSales + serviceRevenue;

            const costOfGoodsSold = sales.reduce((acc, sale) => {
                const product = products.find(p => p.id === sale.productId);
                return acc + (sale.quantity * (product?.costPrice || 0));
            }, 0);
            const partsCost = services.reduce((acc, service) => acc + service.partsCost, 0);
            const totalOperatingExpenses = expenses.reduce((acc, expense) => acc + expense.amount, 0);
            const totalSupplierPayments = purchaseOrders.flatMap(po => po.payments).reduce((acc, p) => acc + p.amount, 0);

            const netProfit = totalRevenue - costOfGoodsSold - partsCost - totalOperatingExpenses - totalSupplierPayments;
            const isSubscriptionActive = new Date(store.subscriptionEndDate) > new Date();

            return {
                id: store.id,
                name: store.name,
                totalRevenue,
                netProfit,
                isSubscriptionActive,
            };
        });
    }, [stores]);


    useEffect(() => {
        if (isEditing) {
            const adminUser = isEditing.employees.find(u => u.roleId === 'admin');
            setFormData({
                name: isEditing.name,
                ownerName: isEditing.ownerName,
                ownerPhone: isEditing.ownerPhone,
                ownerEmail: isEditing.ownerEmail,
                subscriptionStartDate: isEditing.subscriptionStartDate.split('T')[0],
                subscriptionEndDate: isEditing.subscriptionEndDate.split('T')[0],
                subscriptionMonthlyPrice: isEditing.subscriptionMonthlyPrice,
                storeType: isEditing.storeType,
                enabledModules: isEditing.enabledModules,
                adminUsername: adminUser?.username || '',
                adminPassword: '', // Don't pre-fill password
                adminFullName: adminUser?.fullName || '',
                adminPhone: adminUser?.phone || '',
                aiInstructions: isEditing.aiInstructions || '',
            });
            setShowForm(true);
        } else {
            resetForm();
        }
    }, [isEditing]);

    const resetForm = () => {
        setFormData(INITIAL_FORM_STATE);
        setIsEditing(null);
        setShowForm(false);
    };
    
    const handleGenerateMessage = async () => {
        if (!broadcastTopic) return alert('الرجاء إدخال موضوع الرسالة.');
        setIsGeneratingMsg(true);
        try {
            const msg = await generateNotificationMessage(broadcastTopic, broadcastTone, aiSettings);
            setBroadcastMessage(msg);
        } catch (e) {
            console.error(e);
        } finally {
            setIsGeneratingMsg(false);
        }
    };

    const handleSendBroadcast = () => {
        if (!broadcastMessage) return alert('لا توجد رسالة لإرسالها.');
        
        setStores(prev => prev.map(store => {
            if (selectedStoreId !== 'all' && store.id !== selectedStoreId) return store;
            
            const newNotification = {
                id: `SYS-MSG-${Date.now()}-${Math.random()}`,
                type: 'system' as const,
                title: 'تنبيه من الإدارة',
                message: broadcastMessage,
                timestamp: new Date().toISOString(),
                read: false,
                priority: 'high' as const
            };
            
            return {
                ...store,
                notifications: [newNotification, ...(store.notifications || [])]
            };
        }));
        
        alert('تم إرسال الإشعار بنجاح.');
        setBroadcastTopic('');
        setBroadcastMessage('');
    };


    const handleModuleChange = (moduleId: string) => {
        setFormData(prev => {
            const newModules = prev.enabledModules.includes(moduleId)
                ? prev.enabledModules.filter(m => m !== moduleId)
                : [...prev.enabledModules, moduleId];
            return { ...prev, enabledModules: newModules };
        });
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const isNumeric = ['subscriptionMonthlyPrice'].includes(name);
        setFormData(prev => ({ ...prev, [name]: isNumeric ? parseFloat(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const requiredFields = ['name', 'ownerName', 'subscriptionStartDate', 'subscriptionEndDate', 'ownerPhone', 'ownerEmail', 'storeType'];
        if (!isEditing) {
            requiredFields.push('adminUsername', 'adminPassword', 'adminFullName', 'adminPhone');
        }

        if (requiredFields.some(field => !formData[field as keyof typeof formData])) {
            alert('الرجاء تعبئة جميع الحقول المطلوبة.');
            return;
        }

        const subscriptionStartDateISO = new Date(formData.subscriptionStartDate).toISOString();
        const subscriptionEndDateISO = new Date(formData.subscriptionEndDate).toISOString();

        if (isEditing) {
            setStores(prevStores => prevStores.map(store => {
                if (store.id === isEditing.id) {
                    const updatedEmployees = store.employees.map(emp => {
                        if (emp.roleId === 'admin') {
                            return {
                                ...emp,
                                password: formData.adminPassword ? formData.adminPassword : emp.password,
                                fullName: formData.adminFullName,
                                phone: formData.adminPhone,
                            };
                        }
                        return emp;
                    });
                    return {
                        ...store,
                        name: formData.name,
                        ownerName: formData.ownerName,
                        ownerPhone: formData.ownerPhone,
                        ownerEmail: formData.ownerEmail,
                        subscriptionStartDate: subscriptionStartDateISO,
                        subscriptionEndDate: subscriptionEndDateISO,
                        subscriptionMonthlyPrice: formData.subscriptionMonthlyPrice,
                        storeType: formData.storeType,
                        enabledModules: formData.enabledModules,
                        aiInstructions: formData.aiInstructions,
                        employees: updatedEmployees,
                    };
                }
                return store;
            }));
        } else {
            const newStoreAdmin: Employee = { 
                id: 'u001', 
                username: formData.adminUsername, 
                password: formData.adminPassword, 
                roleId: 'admin',
                fullName: formData.adminFullName,
                phone: formData.adminPhone,
                hireDate: new Date().toISOString(),
                baseSalary: 0,
            };

            const defaultRoles: CustomRole[] = [
                { id: 'admin', name: 'مدير النظام', permissions: marketplaceModules.map(m => m.id) },
                { id: 'cashier', name: 'كاشير', permissions: ['dashboard', 'pos', 'customer-management', 'expenses'] },
                { id: 'inventory_manager', name: 'مسؤول مخزون', permissions: ['dashboard', 'inventory', 'suppliers-management'] },
            ];

            const newStore: Store = {
                id: `store${(Date.now()).toString().slice(-4)}`,
                name: formData.name,
                ownerName: formData.ownerName,
                ownerPhone: formData.ownerPhone,
                ownerEmail: formData.ownerEmail,
                subscriptionStartDate: subscriptionStartDateISO,
                subscriptionEndDate: subscriptionEndDateISO,
                subscriptionMonthlyPrice: formData.subscriptionMonthlyPrice,
                storeType: formData.storeType,
                enabledModules: formData.enabledModules.length > 0 ? formData.enabledModules : marketplaceModules.filter(m => m.isCore).map(m => m.id),
                products: [], sales: [], services: [], expenses: [], customers: [],
                suppliers: [], purchaseOrders: [],
                employees: [newStoreAdmin],
                roles: defaultRoles,
                paymentHistory: [],
                aiMessages: [],
                aiInstructions: formData.aiInstructions,
                billingSettings: { storeName: formData.name, taxNumber: '', taxRate: 15, address: '', phone: '' },
                invoices: [],
                inventoryMovements: [],
                saleReturns: [],
                purchaseReturns: [],
                activityLogs: [],
                installmentPlans: [],
                quotations: [],
                attendance: [],
                payrolls: [],
                leaves: [],
                advances: [],
                hrSettings: {
                    workingDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
                    absenceDeductionMethod: 'daily_rate',
                    officialCheckInTime: '09:00',
                },
                notifications: [], // Initialize notifications
                supportTickets: [], // Initialize support tickets
                leads: [], // Initialize leads
                treasuries: [],
                bankAccounts: [],
                financialTransactions: [],
            };
            setStores(prev => [...prev, newStore]);
        }
        resetForm();
    };

    const deleteStore = (storeId: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذا المتجر وكل بياناته؟ لا يمكن التراجع عن هذا الإجراء.')) {
            setStores(prev => prev.filter(s => s.id !== storeId));
        }
    };
    
    const reactivateStore = (storeId: string) => {
        setStores(prevStores => prevStores.map(store => {
            if (store.id === storeId) {
                const newEndDate = new Date();
                newEndDate.setMonth(newEndDate.getMonth() + 1);
                
                const newPayment = {
                    date: new Date().toISOString(),
                    amount: store.subscriptionMonthlyPrice
                };

                return { 
                    ...store, 
                    subscriptionEndDate: newEndDate.toISOString(),
                    paymentHistory: [...store.paymentHistory, newPayment] 
                };
            }
            return store;
        }));
    };

    const handleExportCSV = () => {
        if (stores.length === 0) {
            alert('لا توجد متاجر لتصديرها.');
            return;
        }

        const dataToExport = stores.map(store => {
            const performance = storePerformance.find(p => p.id === store.id);
            const isSubscriptionActive = new Date(store.subscriptionEndDate) > new Date();

            return {
                name: store.name,
                storeType: store.storeType,
                subscriptionMonthlyPrice: store.subscriptionMonthlyPrice,
                subscriptionStatus: isSubscriptionActive ? 'نشط' : 'منتهي الصلاحية',
                subscriptionEndDate: new Date(store.subscriptionEndDate).toLocaleDateString('ar-EG'),
                ownerName: store.ownerName,
                ownerPhone: store.ownerPhone,
                ownerEmail: store.ownerEmail,
                totalRevenue: performance?.totalRevenue || 0,
                netProfit: performance?.netProfit || 0,
            };
        });

        const headers = [
            'اسم المتجر', 'نوعه', 'الاشتراك الشهري (ج.م)', 'حالة الاشتراك', 'تاريخ الانتهاء', 
            'اسم المالك', 'هاتف المالك', 'بريد المالك', 'إجمالي الإيرادات (ج.م)', 'صافي الربح (ج.م)'
        ];

        const csvRows = [
            headers.join(','),
            ...dataToExport.map(row => [
                `"${row.name.replace(/"/g, '""')}"`,
                `"${row.storeType.replace(/"/g, '""')}"`,
                row.subscriptionMonthlyPrice,
                `"${row.subscriptionStatus}"`,
                row.subscriptionEndDate,
                `"${row.ownerName.replace(/"/g, '""')}"`,
                `"${row.ownerPhone}"`,
                `"${row.ownerEmail}"`,
                row.totalRevenue,
                row.netProfit,
            ].join(','))
        ];

        const csvContent = csvRows.join('\n');
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const today = new Date().toISOString().split('T')[0];
        
        link.setAttribute('href', url);
        link.setAttribute('download', `تقرير-المتاجر-${today}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const renderManagementView = () => (
        <div className="space-y-8">
            {/* Broadcast Section */}
            <div className="bg-indigo-50 border-2 border-indigo-200 p-6 rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-4">
                     <h3 className="text-lg font-bold text-indigo-800 flex items-center gap-2">
                        <BellIcon /> إرسال تنبيه عام (Broadcast)
                     </h3>
                     <div className="flex items-center gap-2">
                         <label className="text-sm font-medium">إلى:</label>
                         <select 
                            value={selectedStoreId} 
                            onChange={e => setSelectedStoreId(e.target.value)}
                            className="p-2 border rounded-lg text-sm"
                        >
                             <option value="all">جميع المتاجر</option>
                             {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                         </select>
                     </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="md:col-span-2">
                        <input 
                            type="text" 
                            value={broadcastTopic} 
                            onChange={e => setBroadcastTopic(e.target.value)}
                            placeholder="موضوع الرسالة (مثلاً: خصم خاص على التجديد، تنبيه صيانة...)" 
                            className="w-full p-2 border rounded-lg"
                        />
                    </div>
                    <div>
                        <select 
                            value={broadcastTone} 
                            onChange={e => setBroadcastTone(e.target.value)}
                            className="w-full p-2 border rounded-lg"
                        >
                            <option value="رسمي ومهذب">رسمي ومهذب</option>
                            <option value="عاجل وتحذيري">عاجل وتحذيري</option>
                            <option value="ودي وتسويقي">ودي وتسويقي</option>
                        </select>
                    </div>
                </div>
                
                <div className="relative mb-4">
                     <textarea 
                        value={broadcastMessage} 
                        onChange={e => setBroadcastMessage(e.target.value)}
                        placeholder="نص الرسالة (يمكنك كتابته يدوياً أو توليده بالذكاء الاصطناعي)..."
                        className="w-full p-3 border rounded-lg h-24"
                     />
                     <button 
                        onClick={handleGenerateMessage}
                        disabled={isGeneratingMsg}
                        className="absolute top-2 left-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md hover:bg-indigo-200 flex items-center gap-1"
                     >
                        <SparklesIcon /> {isGeneratingMsg ? 'جاري التوليد...' : 'صياغة بالذكاء الاصطناعي'}
                     </button>
                </div>
                
                <button 
                    onClick={handleSendBroadcast}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-bold flex items-center gap-2"
                >
                    <PaperAirplaneIcon /> إرسال الآن
                </button>
            </div>

            <div className="flex justify-between items-center flex-wrap gap-4">
                <h2 className="text-3xl font-bold text-gray-800">قائمة المتاجر</h2>
                 <div className="flex items-center gap-4">
                    <button 
                        onClick={handleExportCSV}
                        className="bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600 transition shadow flex items-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                        disabled={stores.length === 0}
                        aria-label="تصدير البيانات كملف CSV"
                    >
                        <DocumentDownloadIcon />
                        <span className="mr-2">تصدير البيانات</span>
                    </button>
                    <button id="super-admin-add-store-btn" onClick={() => { isEditing ? resetForm() : setShowForm(!showForm) }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow">
                        {showForm ? 'إغلاق النموذج' : 'إضافة متجر جديد'}
                    </button>
                </div>
            </div>
            
            {showForm && (
                <div id="super-admin-form" className="bg-white p-6 rounded-xl shadow-lg transition-all duration-300">
                    <h3 className="text-xl font-bold mb-4">{isEditing ? `تعديل متجر: ${isEditing.name}` : 'إضافة متجر جديد'}</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <h4 className="font-semibold text-gray-700 border-b pb-2">بيانات المتجر والمالك</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="اسم المتجر" className="p-2 border rounded" required />
                            <input type="text" name="ownerName" value={formData.ownerName} onChange={handleChange} placeholder="اسم المالك" className="p-2 border rounded" required />
                             <input type="text" name="storeType" value={formData.storeType} onChange={handleChange} placeholder="نوع المتجر" className="p-2 border rounded" required />
                            <input type="text" name="ownerPhone" value={formData.ownerPhone} onChange={handleChange} placeholder="هاتف المالك" className="p-2 border rounded" required />
                            <input type="email" name="ownerEmail" value={formData.ownerEmail} onChange={handleChange} placeholder="بريد المالك" className="p-2 border rounded" required />
                        </div>
                         <h4 className="font-semibold text-gray-700 border-b pb-2">بيانات الاشتراك</h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                             <input type="number" name="subscriptionMonthlyPrice" value={formData.subscriptionMonthlyPrice} onChange={handleChange} placeholder="سعر الاشتراك الشهري" className="p-2 border rounded" required />
                             <div><label className="text-xs">تاريخ البدء</label><input type="date" name="subscriptionStartDate" value={formData.subscriptionStartDate} onChange={handleChange} className="p-2 border rounded w-full" required /></div>
                             <div><label className="text-xs">تاريخ الانتهاء</label><input type="date" name="subscriptionEndDate" value={formData.subscriptionEndDate} onChange={handleChange} className="p-2 border rounded w-full" required /></div>
                         </div>

                        <h4 className="font-semibold text-gray-700 border-b pb-2">بيانات حساب المدير</h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                             <input type="text" name="adminFullName" value={formData.adminFullName} onChange={handleChange} placeholder="الاسم الكامل للمدير" className="p-2 border rounded" required />
                             <input type="text" name="adminPhone" value={formData.adminPhone} onChange={handleChange} placeholder="هاتف المدير" className="p-2 border rounded" required />
                             <input type="text" name="adminUsername" value={formData.adminUsername} onChange={handleChange} placeholder="اسم مستخدم المدير" className="p-2 border rounded" required disabled={!!isEditing} />
                             <input type="password" name="adminPassword" value={formData.adminPassword} onChange={handleChange} placeholder={isEditing ? 'كلمة مرور جديدة (اختياري)' : 'كلمة المرور'} className="p-2 border rounded" required={!isEditing} />
                         </div>

                         <h4 className="font-semibold text-gray-700 border-b pb-2">إعدادات الذكاء الاصطناعي</h4>
                         <div>
                            <textarea
                                name="aiInstructions"
                                value={formData.aiInstructions}
                                onChange={handleChange}
                                placeholder="تعليمات المساعد الذكي الخاصة بهذا المتجر (مثلاً: ركز على بيع الإكسسوارات، أو هذا المتجر متخصص في صيانة الآيفون...)"
                                className="w-full p-2 border rounded h-24"
                            />
                            <p className="text-xs text-gray-500 mt-1">هذه التعليمات ستوجه المساعد الذكي عند تقديم النصائح والردود لمدير هذا المتجر.</p>
                         </div>

                        <h4 className="font-semibold text-gray-700 border-b pb-2">الوحدات المفعلة</h4>
                         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {marketplaceModules.map(m => (
                                <label key={m.id} className="flex items-center space-x-2 p-2 rounded-lg bg-gray-50 cursor-pointer">
                                    <input type="checkbox" checked={formData.enabledModules.includes(m.id)} onChange={() => handleModuleChange(m.id)} className="form-checkbox h-5 w-5 text-indigo-600" disabled={m.isCore} />
                                    <span>{m.label}</span>
                                </label>
                            ))}
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button type="submit" className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition">
                                {isEditing ? 'حفظ التغييرات' : 'إنشاء المتجر'}
                            </button>
                             <button type="button" onClick={resetForm} className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition">
                                إلغاء
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div id="super-admin-stores-table" className="bg-white p-6 rounded-xl shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="border-b-2 border-gray-200">
                            <tr>
                                <th className="p-3">اسم المتجر</th>
                                <th className="p-3">اسم المالك</th>
                                <th className="p-3">هاتف المالك</th>
                                <th className="p-3">الاشتراك</th>
                                <th className="p-3">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stores.map(store => {
                                const isSubscriptionActive = new Date(store.subscriptionEndDate) > new Date();
                                return (
                                <tr key={store.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="p-3 font-medium">{store.name}</td>
                                    <td className="p-3">{store.ownerName}</td>
                                    <td className="p-3">{store.ownerPhone}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${isSubscriptionActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {isSubscriptionActive ? 'نشط' : 'منتهي'}
                                        </span>
                                        <span className="text-xs text-gray-500 mr-2">
                                            (ينتهي في: {new Date(store.subscriptionEndDate).toLocaleDateString('ar-EG')})
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex gap-3 text-sm">
                                            <button onClick={() => setIsEditing(store)} className="text-blue-600 hover:underline">تعديل</button>
                                            <button onClick={() => deleteStore(store.id)} className="text-red-600 hover:underline">حذف</button>
                                            {!isSubscriptionActive && (
                                                 <button onClick={() => reactivateStore(store.id)} className="text-green-600 hover:underline">تجديد شهر</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                     {stores.length === 0 && <p className="text-center p-6 text-gray-500">لا توجد متاجر مسجلة بعد. قم بإضافة متجر جديد.</p>}
                </div>
            </div>
            <div id="super-admin-performance-summary" className="bg-white p-6 rounded-xl shadow-lg">
                 <h2 className="text-2xl font-bold text-gray-800 mb-4">ملخص أداء المتاجر</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                     {storePerformance.map(perf => (
                         <div key={perf.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                             <h3 className="font-bold text-lg text-indigo-700">{perf.name}</h3>
                             <p className="text-sm text-gray-500 mt-2">إجمالي الإيرادات: <span className="font-semibold text-gray-700">{perf.totalRevenue.toLocaleString()} ج.م</span></p>
                             <p className="text-sm text-gray-500">صافي الربح: <span className={`font-semibold ${perf.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{perf.netProfit.toLocaleString()} ج.م</span></p>
                             <p className="text-sm text-gray-500">الاشتراك: <span className={`font-semibold ${perf.isSubscriptionActive ? 'text-green-600' : 'text-red-600'}`}>{perf.isSubscriptionActive ? 'نشط' : 'منتهي'}</span></p>
                         </div>
                     ))}
                 </div>
                 {stores.length === 0 && <p className="text-center text-gray-500 py-4">لا توجد متاجر لعرض ملخصها بعد.</p>}
            </div>
        </div>
    );
    
    const renderView = () => {
        switch (activeView) {
            case 'management':
                return renderManagementView();
            case 'profits':
                return <SuperAdminProfit stores={stores} />;
            case 'analysis':
                return <SuperAdminAnalysis stores={stores} />;
            case 'ai-settings':
                return <SuperAdminAISettings settings={aiSettings} onSave={onUpdateAISettings} />;
            case 'marketplace-settings':
                return <SuperAdminMarketplace modules={marketplaceModules} updateModule={onUpdateMarketplaceModule} aiSettings={aiSettings} />;
            default:
                return renderManagementView();
        }
    };

    return (
        <div className="bg-gray-100 min-h-screen flex">
            <SuperAdminSidebar activeView={activeView} setActiveView={setActiveView} onLogout={onLogout} />
            <main className="flex-1 p-6 lg:p-10 relative">
                 <div id="super-admin-notifications" className="absolute top-6 left-6">
                    <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 bg-white rounded-full shadow hover:bg-gray-100 transition">
                        <BellIcon />
                        {notifications.length > 0 && (
                             <span className="absolute -top-1 -right-1 flex h-5 w-5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-white text-xs items-center justify-center">
                                    {notifications.length}
                                </span>
                            </span>
                        )}
                    </button>
                    {showNotifications && (
                        <div className="absolute left-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-20 border">
                            <div className="p-3 border-b font-bold text-gray-700">التنبيهات</div>
                            <ul className="max-h-96 overflow-y-auto">
                                {notifications.length > 0 ? (
                                    notifications.map((n, index) => (
                                        <li key={index} className={`flex items-start p-3 border-b hover:bg-gray-50 ${n.type === 'expired' ? 'bg-red-50' : 'bg-yellow-50'}`}>
                                           <div className={`flex-shrink-0 mt-1 mr-3 p-1 rounded-full ${n.type === 'expired' ? 'bg-red-200 text-red-700' : 'bg-yellow-200 text-yellow-700'}`}>
                                                <ExclamationTriangleIcon />
                                           </div>
                                           <div>
                                               <p className="font-semibold text-gray-800">{n.storeName}</p>
                                               <p className="text-sm text-gray-600">{n.message}</p>
                                           </div>
                                        </li>
                                    ))
                                ) : (
                                    <li className="p-4 text-center text-gray-500">لا توجد تنبيهات جديدة.</li>
                                )}
                            </ul>
                        </div>
                    )}
                </div>
                {renderView()}
            </main>
        </div>
    );
};

export default SuperAdminDashboard;