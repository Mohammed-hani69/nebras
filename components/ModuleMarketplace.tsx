






import React, { useState } from 'react';
import type { ModuleDefinition, Store } from '../types';
import { 
    SparklesIcon, StoreIcon, ChartBarIcon, CubeIcon, ShoppingCartIcon, WrenchScrewdriverIcon, 
    BanknotesIcon, UsersIcon, PresentationChartLineIcon, BrainIcon, DocumentChartBarIcon, 
    IdentificationIcon, TruckIcon, QuestionMarkCircleIcon, DocumentDuplicateIcon, CalendarDaysIcon, ClipboardListIcon, BriefcaseIcon, ArrowPathRoundedSquareIcon, BuildingLibraryIcon, BookOpenIcon
} from './icons/Icons';

interface ModuleMarketplaceProps {
    availableModules: ModuleDefinition[];
    userStore: Store;
    onEnableModule: (moduleId: string) => void;
}

const ICONS: { [key: string]: React.ReactNode } = {
    'ChartBarIcon': <ChartBarIcon />,
    'CubeIcon': <CubeIcon />,
    'ShoppingCartIcon': <ShoppingCartIcon />,
    'WrenchScrewdriverIcon': <WrenchScrewdriverIcon />,
    'BanknotesIcon': <BanknotesIcon />,
    'PresentationChartLineIcon': <PresentationChartLineIcon />,
    'DocumentChartBarIcon': <DocumentChartBarIcon />,
    'UsersIcon': <UsersIcon />,
    'IdentificationIcon': <IdentificationIcon />,
    'TruckIcon': <TruckIcon />,
    'BrainIcon': <BrainIcon />,
    'QuestionMarkCircleIcon': <QuestionMarkCircleIcon />,
    'StoreIcon': <StoreIcon />,
    'DocumentDuplicateIcon': <DocumentDuplicateIcon />,
    'CalendarDaysIcon': <CalendarDaysIcon />,
    'ClipboardListIcon': <ClipboardListIcon />,
    'BriefcaseIcon': <BriefcaseIcon />,
    'ArrowPathRoundedSquareIcon': <ArrowPathRoundedSquareIcon />,
    'BuildingLibraryIcon': <BuildingLibraryIcon />,
    'BookOpenIcon': <BookOpenIcon />,
};

const CATEGORIES = [
    { id: 'all', label: 'الكل' },
    { id: 'basic', label: 'أساسية' },
    { id: 'advanced', label: 'متقدمة' },
    { id: 'premium', label: 'احترافية' },
];

const ModuleMarketplace: React.FC<ModuleMarketplaceProps> = ({ availableModules, userStore, onEnableModule }) => {
    const [selectedModule, setSelectedModule] = useState<ModuleDefinition | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    const filteredModules = availableModules.filter(mod => {
        if (mod.isCore) return false;
        const matchesSearch = mod.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              (mod.aiShortDescription && mod.aiShortDescription.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory = categoryFilter === 'all' || mod.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const handlePurchase = (mod: ModuleDefinition) => {
        if (window.confirm(`هل أنت متأكد من رغبتك في تفعيل مديول "${mod.label}"؟\nالسعر: ${mod.price > 0 ? mod.price + ' ج.م/شهرياً' : 'مجاني'}`)) {
            onEnableModule(mod.id);
            alert('تم تفعيل المديول بنجاح! يمكنك الوصول إليه الآن من القائمة الجانبية.');
            setSelectedModule(null);
        }
    };
    
    const getCategoryStyles = (category: 'basic' | 'advanced' | 'premium') => {
        switch(category) {
            case 'premium': return { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', iconBg: 'bg-gradient-to-br from-purple-500 to-indigo-600' };
            case 'advanced': return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-500' };
            default: return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200', iconBg: 'bg-gradient-to-br from-gray-500 to-gray-600' };
        }
    };

    return (
        <div className="space-y-8">
            <div className="bg-slate-800 p-8 md:p-12 rounded-2xl shadow-2xl text-white relative overflow-hidden">
                 <div className="absolute -top-16 -right-16 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
                 <div className="absolute -bottom-24 -left-12 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
                 
                 <div className="relative z-10 text-center">
                    <div className="inline-block p-4 bg-white/10 rounded-2xl mb-4">
                        <StoreIcon />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-3">
                        سوق المديولات
                    </h1>
                    <p className="text-indigo-200 text-lg max-w-2xl mx-auto">
                        اكتشف ميزات قوية وقم بتوسيع إمكانيات متجرك. اختر المديولات التي تناسب احتياجاتك وادفع فقط مقابل ما تستخدمه.
                    </p>
                 </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-md sticky top-4 z-30 border border-gray-100">
                <div className="relative flex-grow">
                    <input 
                        type="text" 
                        placeholder="ابحث عن مديول..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                    <svg className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                    {CATEGORIES.map(cat => (
                        <button 
                            key={cat.id} 
                            onClick={() => setCategoryFilter(cat.id)}
                            className={`px-4 py-2 text-sm font-semibold rounded-md transition ${categoryFilter === cat.id ? 'bg-white text-indigo-600 shadow' : 'text-gray-600 hover:bg-gray-200'}`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-stagger-in">
                {filteredModules.map((mod, index) => {
                    const isOwned = userStore.enabledModules.includes(mod.id);
                    const categoryStyles = getCategoryStyles(mod.category);
                    const iconComponent = mod.icon && ICONS[mod.icon] ? ICONS[mod.icon] : <StoreIcon />;

                    return (
                        <div key={mod.id} onClick={() => setSelectedModule(mod)} className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer group transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5 border border-gray-100" style={{ animationDelay: `${index * 50}ms` }}>
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl text-white ${categoryStyles.iconBg} shadow-lg group-hover:scale-105 transition-transform`}>
                                        {iconComponent}
                                    </div>
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${categoryStyles.bg} ${categoryStyles.text} border ${categoryStyles.border}`}>
                                        {CATEGORIES.find(c => c.id === mod.category)?.label}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2 truncate">{mod.label}</h3>
                                <p className="text-gray-500 text-sm mb-5 h-10 line-clamp-2">
                                    {mod.aiShortDescription || mod.description}
                                </p>
                                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                    <span className="font-bold text-2xl text-indigo-600">{mod.price > 0 ? `${mod.price}` : 'مجاني'}<span className="text-sm font-normal text-gray-500">{mod.price > 0 && ' ج.م'}</span></span>
                                    {isOwned && <span className="text-xs font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full">مُفعّل</span>}
                                </div>
                            </div>
                            <div className={`h-2 ${categoryStyles.iconBg} group-hover:h-3 transition-all`}></div>
                        </div>
                    );
                })}
            </div>
            
            {filteredModules.length === 0 && (
                <div className="text-center py-16 text-gray-500 bg-white rounded-xl shadow-md">
                    <p className="text-xl font-semibold">لا توجد مديولات تطابق بحثك</p>
                    <p className="mt-1 text-sm">حاول تغيير فلتر البحث أو الفئة.</p>
                </div>
            )}

            {selectedModule && (() => {
                const isOwned = userStore.enabledModules.includes(selectedModule.id);
                const categoryStyles = getCategoryStyles(selectedModule.category);
                const iconComponent = selectedModule.icon && ICONS[selectedModule.icon] ? ICONS[selectedModule.icon] : <StoreIcon />;

                return (
                    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up">
                            <div className={`p-6 text-white relative ${categoryStyles.iconBg}`}>
                                 <button onClick={() => setSelectedModule(null)} className="absolute top-4 left-4 text-white opacity-70 hover:opacity-100 text-2xl">&times;</button>
                                 <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center text-white text-3xl">
                                        {iconComponent}
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-bold mb-1">{selectedModule.label}</h2>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold bg-white/30 text-white`}>
                                             {CATEGORIES.find(c => c.id === selectedModule.category)?.label}
                                        </span>
                                    </div>
                                 </div>
                            </div>
                            
                            <div className="p-8">
                                 <div className="flex items-start gap-4 mb-6">
                                    <div className={`p-3 rounded-full ${categoryStyles.bg} ${categoryStyles.text}`}>
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
                                     className={`w-full py-4 rounded-xl font-bold text-lg transition shadow-lg transform ${
                                        isOwned 
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                        : `${categoryStyles.iconBg} text-white hover:shadow-xl hover:scale-[1.02]`
                                    }`}
                                 >
                                     {isOwned ? 'تمتلك هذا المديول بالفعل' : `تفعيل ${selectedModule.label} الآن`}
                                 </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default ModuleMarketplace;
