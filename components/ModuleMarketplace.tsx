
import React, { useState } from 'react';
import type { ModuleDefinition, Store } from '../types';
import { SparklesIcon, StoreIcon } from './icons/Icons';

interface ModuleMarketplaceProps {
    availableModules: ModuleDefinition[];
    userStore: Store;
    onEnableModule: (moduleId: string) => void;
}

const ModuleMarketplace: React.FC<ModuleMarketplaceProps> = ({ availableModules, userStore, onEnableModule }) => {
    const [selectedModule, setSelectedModule] = useState<ModuleDefinition | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    const filteredModules = availableModules.filter(mod => {
        if (mod.isCore) return false; // Hide core modules from marketplace
        const matchesSearch = mod.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              (mod.aiShortDescription && mod.aiShortDescription.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory = categoryFilter === 'all' || mod.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const handlePurchase = (mod: ModuleDefinition) => {
        // Ideally, this would integrate with a payment gateway or balance system.
        // For now, we simulate a purchase/enable action.
        if (window.confirm(`هل أنت متأكد من رغبتك في تفعيل مديول "${mod.label}"؟\nالسعر: ${mod.price > 0 ? mod.price + ' ج.م/شهرياً' : 'مجاني'}`)) {
            onEnableModule(mod.id);
            alert('تم تفعيل المديول بنجاح! يمكنك الوصول إليه الآن من القائمة الجانبية.');
            setSelectedModule(null);
        }
    };

    const ModuleDetailModal = () => {
        if (!selectedModule) return null;
        const isOwned = userStore.enabledModules.includes(selectedModule.id);

        return (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white relative">
                         <button onClick={() => setSelectedModule(null)} className="absolute top-4 left-4 text-white opacity-70 hover:opacity-100 text-2xl">&times;</button>
                         <h2 className="text-3xl font-bold mb-1">{selectedModule.label}</h2>
                         <p className="text-indigo-100 text-sm">{selectedModule.category === 'basic' ? 'أساسي' : selectedModule.category === 'advanced' ? 'متقدم' : 'احترافي'}</p>
                    </div>
                    
                    <div className="p-8">
                         <div className="flex items-start gap-4 mb-6">
                            <div className="p-3 bg-indigo-50 rounded-full text-indigo-600">
                                <SparklesIcon />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 mb-2">لماذا تحتاج هذا المديول؟</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    {selectedModule.aiLongDescription || selectedModule.description || "لا يوجد وصف متاح حاليًا."}
                                </p>
                            </div>
                         </div>

                         <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex justify-between items-center mb-6">
                             <div>
                                 <p className="text-sm text-gray-500">سعر الاشتراك</p>
                                 <p className="text-2xl font-bold text-gray-800">{selectedModule.price > 0 ? `${selectedModule.price} ج.م` : 'مجاني'}</p>
                             </div>
                             <div>
                                 <span className={`px-3 py-1 rounded-full text-sm font-bold ${isOwned ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                     {isOwned ? 'مفعل لديك' : 'متاح للتفعيل'}
                                 </span>
                             </div>
                         </div>

                         <button 
                            onClick={() => handlePurchase(selectedModule)}
                            disabled={isOwned}
                            className={`w-full py-4 rounded-xl font-bold text-lg transition shadow-lg ${
                                isOwned 
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-xl hover:scale-[1.02] transform'
                            }`}
                         >
                             {isOwned ? 'تمتلك هذا المديول بالفعل' : `تفعيل ${selectedModule.label} الآن`}
                         </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8">
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-8 rounded-2xl shadow-2xl text-white relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                 <div className="absolute -bottom-8 -left-8 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                 
                 <div className="relative z-10 flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                            <StoreIcon />
                            سوق المديولات
                        </h1>
                        <p className="text-indigo-200 text-lg max-w-2xl">
                            اكتشف ميزات قوية وقم بتوسيع إمكانيات متجرك. اختر المديولات التي تناسب احتياجاتك وادفع فقط مقابل ما تستخدمه.
                        </p>
                    </div>
                 </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 bg-white p-4 rounded-xl shadow-md sticky top-20 z-30 border border-gray-100">
                <input 
                    type="text" 
                    placeholder="ابحث عن مديول..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="flex-grow p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <select 
                    value={categoryFilter} 
                    onChange={e => setCategoryFilter(e.target.value)}
                    className="p-2 border border-gray-300 rounded-lg bg-gray-50"
                >
                    <option value="all">كل الفئات</option>
                    <option value="basic">أساسية</option>
                    <option value="advanced">متقدمة</option>
                    <option value="premium">احترافية</option>
                </select>
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredModules.map(mod => {
                    const isOwned = userStore.enabledModules.includes(mod.id);
                    return (
                        <div key={mod.id} onClick={() => setSelectedModule(mod)} className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer group transition hover:shadow-2xl hover:-translate-y-1 border border-transparent hover:border-indigo-100">
                            <div className={`h-3 bg-gradient-to-r ${mod.category === 'premium' ? 'from-purple-500 to-pink-500' : mod.category === 'advanced' ? 'from-blue-400 to-indigo-500' : 'from-gray-300 to-gray-400'}`}></div>
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center text-2xl font-bold text-gray-700 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition">
                                        {mod.label.charAt(0)}
                                    </div>
                                    {isOwned && <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded">مملوك</span>}
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">{mod.label}</h3>
                                <p className="text-gray-600 text-sm mb-4 line-clamp-2 h-10">
                                    {mod.aiShortDescription || mod.description}
                                </p>
                                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                    <span className="font-bold text-indigo-600">{mod.price > 0 ? `${mod.price} ج.م` : 'مجاني'}</span>
                                    <span className="text-xs text-gray-400 hover:text-gray-600">التفاصيل &rarr;</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {filteredModules.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    لا توجد مديولات تطابق بحثك.
                </div>
            )}

            <ModuleDetailModal />
        </div>
    );
};

export default ModuleMarketplace;
