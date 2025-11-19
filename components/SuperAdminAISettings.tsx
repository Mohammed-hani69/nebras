
import React, { useState, useEffect } from 'react';
import type { AISettings } from '../types';

interface SuperAdminAISettingsProps {
    settings: AISettings;
    onSave: (newSettings: AISettings) => void;
}

const SuperAdminAISettings: React.FC<SuperAdminAISettingsProps> = ({ settings, onSave }) => {
    const [formData, setFormData] = useState<AISettings>(settings);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        setFormData(settings);
    }, [settings]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else if (type === 'range' || type === 'number') {
            setFormData(prev => ({ ...prev, [name]: parseFloat(value) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value as AISettings['model'] }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">إعدادات المساعد الذكي</h1>
            {showSuccess && (
                <div className="p-4 bg-green-100 text-green-700 border border-green-200 rounded-lg text-center animate-pulse">
                    تم حفظ الإعدادات بنجاح!
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Model and Sampling Settings */}
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-bold mb-4 text-gray-700">إعدادات النموذج</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Model Selection */}
                        <div>
                            <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">نموذج الذكاء الاصطناعي</label>
                            <select
                                id="model"
                                name="model"
                                value={formData.model}
                                onChange={handleChange}
                                className="w-full p-2 border rounded bg-gray-50"
                            >
                                <option value="gemini-2.5-flash">Gemini 2.5 Flash (أسرع، للاستخدام العام)</option>
                                <option value="gemini-2.5-pro">Gemini 2.5 Pro (أقوى، للمهام المعقدة)</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">اختر النموذج الذي سيتم استخدامه في جميع أنحاء النظام.</p>
                        </div>
                        <div></div> {/* Spacer */}
                        {/* Temperature */}
                        <div>
                            <label htmlFor="temperature" className="block text-sm font-medium text-gray-700 mb-1">الإبداع (Temperature): {formData.temperature.toFixed(1)}</label>
                            <input
                                type="range"
                                id="temperature"
                                name="temperature"
                                min="0"
                                max="1"
                                step="0.1"
                                value={formData.temperature}
                                onChange={handleChange}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <p className="text-xs text-gray-500 mt-1">القيم الأعلى (مثل 0.9) تعطي إجابات أكثر إبداعًا، والقيم الأقل (مثل 0.2) أكثر دقة.</p>
                        </div>
                        {/* Top-K */}
                        <div>
                             <label htmlFor="topK" className="block text-sm font-medium text-gray-700 mb-1">Top-K: {formData.topK}</label>
                            <input
                                type="range"
                                id="topK"
                                name="topK"
                                min="1"
                                max="100"
                                step="1"
                                value={formData.topK}
                                onChange={handleChange}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <p className="text-xs text-gray-500 mt-1">يتحكم في عشوائية الاختيار بين الكلمات المحتملة.</p>
                        </div>
                         {/* Top-P */}
                        <div>
                             <label htmlFor="topP" className="block text-sm font-medium text-gray-700 mb-1">Top-P: {formData.topP.toFixed(2)}</label>
                            <input
                                type="range"
                                id="topP"
                                name="topP"
                                min="0"
                                max="1"
                                step="0.05"
                                value={formData.topP}
                                onChange={handleChange}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <p className="text-xs text-gray-500 mt-1">يتحكم في اختيار الكلمات بناءً على مجموع احتمالاتها.</p>
                        </div>
                    </div>
                </div>

                {/* System Instructions */}
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-bold mb-4 text-gray-700">تعليمات النظام العامة</h2>
                    <div>
                        <label htmlFor="systemInstructions" className="block text-sm font-medium text-gray-700 mb-1">تعليمات المساعد الذكي (System Prompt)</label>
                        <textarea
                            id="systemInstructions"
                            name="systemInstructions"
                            value={formData.systemInstructions || ''}
                            onChange={handleChange}
                            className="w-full p-3 border rounded-lg bg-gray-50 h-32 text-sm"
                            placeholder="أدخل التعليمات التي سيتبعها الذكاء الاصطناعي في جميع المتاجر..."
                        />
                        <p className="text-xs text-gray-500 mt-1">هذه التعليمات سيتم دمجها مع كل طلب يتم إرساله للذكاء الاصطناعي.</p>
                    </div>
                </div>


                {/* Feature Toggles */}
                 <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-bold mb-4 text-gray-700">ميزات الذكاء الاصطناعي</h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input type="checkbox" name="enableSuggestions" checked={formData.enableSuggestions} onChange={handleChange} className="h-5 w-5 text-indigo-600 rounded" />
                            <span>الاقتراحات اليومية المنبثقة</span>
                        </label>
                         <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input type="checkbox" name="enableDashboardInsights" checked={formData.enableDashboardInsights} onChange={handleChange} className="h-5 w-5 text-indigo-600 rounded" />
                            <span>المساعد الذكي في لوحة التحكم</span>
                        </label>
                         <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input type="checkbox" name="enableReportAnalysis" checked={formData.enableReportAnalysis} onChange={handleChange} className="h-5 w-5 text-indigo-600 rounded" />
                            <span>تحليل التقارير العامة</span>
                        </label>
                    </div>
                </div>
                
                <div className="flex justify-end">
                    <button type="submit" className="bg-green-500 text-white px-8 py-3 rounded-lg hover:bg-green-600 transition font-bold">
                        حفظ الإعدادات
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SuperAdminAISettings;
