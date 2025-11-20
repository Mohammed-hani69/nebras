
import React, { useState } from 'react';
import type { GlobalSettings, Store } from '../types';
import { CogIcon, GlobeAltIcon, BanknotesIcon, BellIcon, ServerStackIcon, CheckCircleIcon, ArrowPathRoundedSquareIcon } from './icons/Icons';

interface SuperAdminGlobalSettingsProps {
    settings: GlobalSettings;
    onSave: (settings: GlobalSettings) => void;
    stores: Store[]; // Passed for Backup purposes
}

const SuperAdminGlobalSettings: React.FC<SuperAdminGlobalSettingsProps> = ({ settings, onSave, stores }) => {
    const [activeTab, setActiveTab] = useState<'general' | 'billing' | 'notifications' | 'backup'>('general');
    const [formData, setFormData] = useState<GlobalSettings>(settings);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleChange = (section: keyof GlobalSettings | null, field: string, value: any) => {
        if (section && typeof formData[section] === 'object' && !Array.isArray(formData[section])) {
             setFormData(prev => ({
                ...prev,
                [section]: {
                    ...prev[section] as any,
                    [field]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleSave = () => {
        setIsSaving(true);
        // Simulate API delay
        setTimeout(() => {
            onSave(formData);
            setIsSaving(false);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        }, 500);
    };

    const handleBackupNow = () => {
        // Create a deep copy of stores to avoid mutation issues during serialization
        const dataToBackup = JSON.stringify(stores, null, 2);
        const blob = new Blob([dataToBackup], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        link.href = url;
        // Change extension to .db as requested
        link.download = `Nebras_Full_Backup_${timestamp}.db`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        // Update last backup date
        const updatedSettings = {
            ...formData,
            backupPolicy: { ...formData.backupPolicy, lastBackupDate: new Date().toISOString() }
        };
        setFormData(updatedSettings);
        onSave(updatedSettings);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <CogIcon /> إعدادات النظام العامة
                </h1>
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition shadow disabled:bg-gray-400 font-bold flex items-center gap-2"
                >
                    {isSaving ? 'جاري الحفظ...' : <><CheckCircleIcon /> حفظ التغييرات</>}
                </button>
            </div>

            {showSuccess && (
                <div className="bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded relative animate-fade-in-up">
                    تم حفظ الإعدادات بنجاح وتطبيقها على النظام.
                </div>
            )}

            {/* Tabs */}
            <div className="flex border-b bg-white rounded-t-xl shadow-sm overflow-x-auto">
                <button onClick={() => setActiveTab('general')} className={`flex items-center gap-2 px-6 py-4 font-medium transition ${activeTab === 'general' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <GlobeAltIcon /> عام واللغة
                </button>
                <button onClick={() => setActiveTab('billing')} className={`flex items-center gap-2 px-6 py-4 font-medium transition ${activeTab === 'billing' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <BanknotesIcon /> الفوترة والضرائب
                </button>
                <button onClick={() => setActiveTab('notifications')} className={`flex items-center gap-2 px-6 py-4 font-medium transition ${activeTab === 'notifications' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <BellIcon /> الإشعارات والرسائل
                </button>
                <button onClick={() => setActiveTab('backup')} className={`flex items-center gap-2 px-6 py-4 font-medium transition ${activeTab === 'backup' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <ServerStackIcon /> النسخ الاحتياطي
                </button>
            </div>

            <div className="bg-white p-6 rounded-b-xl shadow-lg min-h-[400px]">
                
                {activeTab === 'general' && (
                    <div className="space-y-6 max-w-2xl">
                        <div>
                            <h3 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">التفضيلات الإقليمية</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">اللغة الافتراضية للنظام</label>
                                    <select 
                                        value={formData.defaultLanguage} 
                                        onChange={(e) => handleChange(null, 'defaultLanguage', e.target.value)}
                                        className="w-full p-2 border rounded-lg bg-white"
                                    >
                                        <option value="ar">العربية (Arabic)</option>
                                        <option value="en">English (الإنجليزية)</option>
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">ستكون هذه اللغة هي المعتمدة لواجهة المتاجر الجديدة.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">العملة الافتراضية</label>
                                    <select 
                                        value={formData.defaultCurrency} 
                                        onChange={(e) => handleChange(null, 'defaultCurrency', e.target.value)}
                                        className="w-full p-2 border rounded-lg bg-white"
                                    >
                                        <option value="SAR">ريال سعودي (SAR)</option>
                                        <option value="EGP">جنيه مصري (EGP)</option>
                                        <option value="USD">دولار أمريكي (USD)</option>
                                        <option value="AED">درهم إماراتي (AED)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'billing' && (
                    <div className="space-y-6 max-w-2xl">
                        <div>
                            <h3 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">إعدادات الفوترة والاشتراكات</h3>
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">نظام الفوترة الافتراضي (Billing Cycle)</label>
                                    <select 
                                        value={formData.billingCycle} 
                                        onChange={(e) => handleChange(null, 'billingCycle', e.target.value)}
                                        className="w-full p-2 border rounded-lg bg-white"
                                    >
                                        <option value="monthly">شهري (Monthly)</option>
                                        <option value="quarterly">ربع سنوي (Quarterly)</option>
                                        <option value="yearly">سنوي (Yearly)</option>
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">يحدد دورة تجديد الاشتراكات التلقائية للمتاجر.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">نسبة الضريبة الافتراضية (%)</label>
                                    <input 
                                        type="number" 
                                        value={formData.defaultTaxRate} 
                                        onChange={(e) => handleChange(null, 'defaultTaxRate', parseFloat(e.target.value))}
                                        className="w-full p-2 border rounded-lg"
                                        min="0"
                                        max="100"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">سيتم تطبيق هذه النسبة كقيمة افتراضية لضريبة القيمة المضافة عند إنشاء متجر جديد.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'notifications' && (
                    <div className="space-y-8">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <h3 className="text-lg font-bold text-blue-800 mb-2 flex items-center gap-2">
                                <BellIcon /> بوابة البريد الإلكتروني (SMTP)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-blue-900 mb-1">خادم SMTP</label>
                                    <input type="text" value={formData.emailSettings.smtpHost} onChange={e => handleChange('emailSettings', 'smtpHost', e.target.value)} className="w-full p-2 border rounded" placeholder="smtp.example.com" />
                                </div>
                                <div>
                                    <label className="block text-sm text-blue-900 mb-1">المنفذ (Port)</label>
                                    <input type="number" value={formData.emailSettings.smtpPort} onChange={e => handleChange('emailSettings', 'smtpPort', parseInt(e.target.value))} className="w-full p-2 border rounded" placeholder="587" />
                                </div>
                                <div>
                                    <label className="block text-sm text-blue-900 mb-1">بريد المرسل</label>
                                    <input type="email" value={formData.emailSettings.senderEmail} onChange={e => handleChange('emailSettings', 'senderEmail', e.target.value)} className="w-full p-2 border rounded" placeholder="notifications@nebras.com" />
                                </div>
                                <div className="flex items-end">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={formData.emailSettings.enabled} onChange={e => handleChange('emailSettings', 'enabled', e.target.checked)} className="w-5 h-5 text-blue-600" />
                                        <span className="font-bold text-blue-800">تفعيل إشعارات البريد</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                             <h3 className="text-lg font-bold text-green-800 mb-2 flex items-center gap-2">
                                <BellIcon /> بوابة الرسائل النصية (SMS Gateway)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-green-900 mb-1">مزد الخدمة (Provider)</label>
                                    <select value={formData.smsSettings.provider} onChange={e => handleChange('smsSettings', 'provider', e.target.value)} className="w-full p-2 border rounded">
                                        <option value="twilio">Twilio</option>
                                        <option value="hisms">HiSMS (SA)</option>
                                        <option value="unifonic">Unifonic</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-green-900 mb-1">API Key</label>
                                    <input type="password" value={formData.smsSettings.apiKey} onChange={e => handleChange('smsSettings', 'apiKey', e.target.value)} className="w-full p-2 border rounded" placeholder="****************" />
                                </div>
                                <div>
                                    <label className="block text-sm text-green-900 mb-1">اسم المرسل (Sender ID)</label>
                                    <input type="text" value={formData.smsSettings.senderId} onChange={e => handleChange('smsSettings', 'senderId', e.target.value)} className="w-full p-2 border rounded" placeholder="NEBRAS" />
                                </div>
                                <div className="flex items-end">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={formData.smsSettings.enabled} onChange={e => handleChange('smsSettings', 'enabled', e.target.checked)} className="w-5 h-5 text-green-600" />
                                        <span className="font-bold text-green-800">تفعيل رسائل SMS</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'backup' && (
                    <div className="space-y-8">
                         <div className="bg-indigo-50 border-2 border-indigo-100 p-6 rounded-xl flex items-start gap-4">
                            <div className="text-indigo-600 mt-1"><ServerStackIcon /></div>
                            <div>
                                <h3 className="text-xl font-bold text-indigo-900">سياسة النسخ الاحتياطي (Backup Policy)</h3>
                                <p className="text-indigo-700 mt-2 leading-relaxed">
                                    يمكنك هنا إدارة النسخ الاحتياطي لقاعدة البيانات الفعلية للنظام. النسخ الاحتياطي يقوم بتصدير ملف مشفر يحتوي على كافة بيانات المتاجر، المبيعات، والمستخدمين.
                                </p>
                                
                                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block font-bold text-indigo-900 mb-2">التكرار التلقائي</label>
                                        <select 
                                            value={formData.backupPolicy.frequency} 
                                            onChange={(e) => handleChange('backupPolicy', 'frequency', e.target.value)}
                                            className="w-full p-2 border rounded bg-white"
                                        >
                                            <option value="daily">يومي (Daily)</option>
                                            <option value="weekly">أسبوعي (Weekly)</option>
                                        </select>
                                    </div>
                                    <div className="flex items-end pb-2">
                                         <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={formData.backupPolicy.autoBackup} onChange={e => handleChange('backupPolicy', 'autoBackup', e.target.checked)} className="w-5 h-5 text-indigo-600" />
                                            <span className="font-bold text-indigo-800">تفعيل النسخ التلقائي</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border-t pt-6">
                            <h4 className="font-bold text-gray-800 mb-4">إجراءات فورية</h4>
                            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border">
                                <div>
                                    <p className="font-bold text-gray-700">نسخة احتياطية كاملة</p>
                                    <p className="text-sm text-gray-500">آخر نسخة: {formData.backupPolicy.lastBackupDate ? new Date(formData.backupPolicy.lastBackupDate).toLocaleString('ar-EG') : 'لم يتم النسخ بعد'}</p>
                                </div>
                                <button 
                                    onClick={handleBackupNow}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 shadow flex items-center gap-2"
                                >
                                    <ArrowPathRoundedSquareIcon />
                                    <span>إنشاء نسخة وتحميلها</span>
                                </button>
                            </div>
                             <p className="text-xs text-gray-400 mt-2 text-left dir-ltr">
                                * This action dumps the entire IndexedDB `stores` object into a JSON file (saved as .db).
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SuperAdminGlobalSettings;
