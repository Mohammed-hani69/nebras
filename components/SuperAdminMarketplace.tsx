




import React, { useState } from 'react';
import type { ModuleDefinition, AISettings } from '../types';
import { generateModuleDescription } from '../services/geminiService';
import { SparklesIcon } from './icons/Icons';

interface SuperAdminMarketplaceProps {
    modules: ModuleDefinition[];
    updateModule: (module: ModuleDefinition) => void;
    aiSettings: AISettings;
}

const SuperAdminMarketplace: React.FC<SuperAdminMarketplaceProps> = ({ modules, updateModule, aiSettings }) => {
    const [editingModule, setEditingModule] = useState<ModuleDefinition | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateDescription = async (module: ModuleDefinition) => {
        setIsGenerating(true);
        try {
            const descriptions = await generateModuleDescription(module.label, aiSettings);
            const updated = { ...module, aiShortDescription: descriptions.short, aiLongDescription: descriptions.long };
            setEditingModule(updated); // Update local form state
        } catch (error) {
            alert('فشل توليد الوصف. يرجى المحاولة مرة أخرى.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = () => {
        if (editingModule) {
            updateModule(editingModule);
            setEditingModule(null);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">إدارة سوق المديولات</h1>
            <p className="text-gray-600">تحكم في تسعير ووصف الوحدات التي تظهر لأصحاب المتاجر. استخدم الذكاء الاصطناعي لتوليد أوصاف تسويقية جذابة.</p>

            {editingModule ? (
                <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-indigo-100">
                    <h2 className="text-xl font-bold mb-6 text-indigo-700">تعديل المديول: {editingModule.label}</h2>
                    
                    <div className="space-y-6">
                        {/* Price & Category */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">السعر الشهري (ج.م)</label>
                                <input 
                                    type="number" 
                                    value={editingModule.price} 
                                    onChange={e => setEditingModule({...editingModule, price: parseFloat(e.target.value)})}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    disabled={editingModule.isCore}
                                />
                                {editingModule.isCore && <p className="text-xs text-gray-500 mt-1">لا يمكن تغيير سعر المديولات الأساسية.</p>}
                            </div>
                             <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">الفئة</label>
                                <select 
                                    value={editingModule.category} 
                                    onChange={e => setEditingModule({...editingModule, category: e.target.value as any})}
                                    className="w-full p-3 border rounded-lg bg-gray-50"
                                >
                                    <option value="basic">أساسية</option>
                                    <option value="advanced">متقدمة</option>
                                    <option value="premium">احترافية</option>
                                </select>
                            </div>
                        </div>

                         {/* Visibility Toggle */}
                         <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={editingModule.isVisible !== false} 
                                    onChange={e => setEditingModule({...editingModule, isVisible: e.target.checked})} 
                                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" 
                                />
                                <div>
                                    <span className="block font-bold text-gray-700">عرض في سوق المديولات</span>
                                    <span className="text-xs text-gray-500">عند إلغاء التحديد، لن يظهر هذا المديول لأصحاب المتاجر في السوق.</span>
                                </div>
                            </label>
                        </div>

                        {/* AI Generation Section */}
                        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-indigo-800 flex items-center gap-2">
                                    <SparklesIcon />
                                    الوصف الذكي
                                </h3>
                                <button 
                                    onClick={() => handleGenerateDescription(editingModule)}
                                    disabled={isGenerating}
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition flex items-center gap-2"
                                >
                                    {isGenerating ? 'جاري التوليد...' : 'توليد وصف جديد بالذكاء الاصطناعي'}
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-indigo-600 mb-1">الوصف القصير (للعرض في البطاقات)</label>
                                    <input 
                                        type="text" 
                                        value={editingModule.aiShortDescription || ''} 
                                        onChange={e => setEditingModule({...editingModule, aiShortDescription: e.target.value})}
                                        placeholder="وصف مختصر..."
                                        className="w-full p-2 border border-indigo-300 rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-indigo-600 mb-1">الوصف الطويل (للتفاصيل)</label>
                                    <textarea 
                                        value={editingModule.aiLongDescription || ''} 
                                        onChange={e => setEditingModule({...editingModule, aiLongDescription: e.target.value})}
                                        placeholder="وصف تفصيلي..."
                                        className="w-full p-2 border border-indigo-300 rounded h-32"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button onClick={handleSave} className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 font-bold">حفظ التعديلات</button>
                            <button onClick={() => setEditingModule(null)} className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 font-bold">إلغاء</button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {modules.map(mod => (
                        <div key={mod.id} className="bg-white p-4 rounded-xl shadow flex justify-between items-center hover:shadow-md transition">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold text-white ${mod.category === 'premium' ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : mod.category === 'advanced' ? 'bg-blue-500' : 'bg-gray-500'}`}>
                                    {mod.label.charAt(0)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-lg">{mod.label}</h3>
                                        {mod.isVisible === false ? (
                                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                                 مخفي
                                            </span>
                                        ) : (
                                             <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                 ظاهر
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500">{mod.isCore ? 'أساسي (مجاني)' : mod.price > 0 ? `${mod.price} ج.م / شهر` : 'مجاني'}</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-center">
                                {mod.aiShortDescription ? (
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full hidden md:inline">مدعوم بالذكاء الاصطناعي</span>
                                ) : (
                                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full hidden md:inline">يحتاج وصف</span>
                                )}
                                <button onClick={() => setEditingModule(mod)} className="text-indigo-600 font-bold hover:underline">تعديل</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SuperAdminMarketplace;
