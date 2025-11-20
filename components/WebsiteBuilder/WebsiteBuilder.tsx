
import React, { useState } from 'react';
import type { Store, Website, WebTemplate } from '../../types';
import { GlobeAltIcon, PencilIcon, EyeIcon, PlusIcon, LayoutIcon, CheckCircleIcon } from '../icons/Icons';
import SiteEditor from './SiteEditor';
import { SUBSCRIPTION_PLANS } from '../../data/subscriptionPlans';
import UpgradeModal from '../UpgradeModal';

interface WebsiteBuilderProps {
    store: Store;
    updateStore: (data: Partial<Store>) => void;
}

const TEMPLATES: WebTemplate[] = [
    {
        id: 'default-store',
        name: 'متجر أساسي',
        type: 'store',
        isPremium: false,
        thumbnail: 'https://placehold.co/300x200/e2e8f0/1e293b?text=Basic+Store',
        defaultTheme: { primaryColor: '#4f46e5', secondaryColor: '#10b981', fontFamily: 'Tajawal' },
        defaultPages: [
            {
                id: 'home',
                slug: '/',
                title: 'الرئيسية',
                isHome: true,
                blocks: [
                    { id: 'h1', type: 'hero', content: { title: `أهلاً بك في متجرنا`, subtitle: 'أفضل المنتجات بأفضل الأسعار', buttonText: 'تسوق الآن' } },
                    { id: 'p1', type: 'product_grid', content: { title: 'منتجات مختارة', limit: 4 } },
                    { id: 'c1', type: 'contact_form', content: { title: 'تواصل معنا' } }
                ]
            }
        ]
    },
    {
        id: 'company-simple',
        name: 'تعريفي بسيط',
        type: 'company',
        isPremium: false,
        thumbnail: 'https://placehold.co/300x200/e2e8f0/1e293b?text=Simple+Company',
        defaultTheme: { primaryColor: '#2563eb', secondaryColor: '#64748b', fontFamily: 'Tajawal' },
        defaultPages: [
            {
                id: 'home',
                slug: '/',
                title: 'الرئيسية',
                isHome: true,
                blocks: [
                    { id: 'h1', type: 'hero', content: { title: `خدمات احترافية`, subtitle: 'نقدم حلولاً متكاملة لأعمالك', buttonText: 'اعرف المزيد' } },
                    { id: 'f1', type: 'features', content: { title: 'خدماتنا' } },
                    { id: 'c1', type: 'contact_form', content: { title: 'اطلب استشارة' } }
                ]
            }
        ]
    },
    {
        id: 'premium-store',
        name: 'متجر احترافي',
        type: 'store',
        isPremium: true,
        thumbnail: 'https://placehold.co/300x200/facc15/854d0e?text=PRO+Store',
        defaultTheme: { primaryColor: '#000000', secondaryColor: '#f59e0b', fontFamily: 'Tajawal' },
        defaultPages: [
            {
                id: 'home',
                slug: '/',
                title: 'الرئيسية',
                isHome: true,
                blocks: [
                    { id: 'h1', type: 'hero', content: { title: `تسوق بلا حدود`, subtitle: 'تجربة شراء فريدة ومميزة', buttonText: 'ابدأ التسوق' } },
                    { id: 'ic1', type: 'image_carousel', content: { title: 'عروض خاصة', images: ['https://placehold.co/800x400/222/fff?text=Offer+1', 'https://placehold.co/800x400/333/fff?text=Offer+2'] } },
                    { id: 'p1', type: 'product_grid', content: { title: 'الأكثر مبيعاً', limit: 8 } },
                    { id: 't1', type: 'testimonials', content: { title: 'ماذا يقول عملاؤنا', items: [{name: 'عميل مميز', text: 'تجربة رائعة!', role: 'مشتري'}] } },
                    { id: 'f1', type: 'footer', content: { copyright: '© 2024 Pro Store', columns: [] } }
                ]
            }
        ]
    }
];

const WebsiteBuilder: React.FC<WebsiteBuilderProps> = ({ store, updateStore }) => {
    const [view, setView] = useState<'dashboard' | 'editor' | 'wizard'>('dashboard');
    const [selectedType, setSelectedType] = useState<'store' | 'company' | null>(null);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    
    const hasWebsite = !!store.website;
    const currentPlan = SUBSCRIPTION_PLANS[store.plan] || SUBSCRIPTION_PLANS.free;

    const handleStartWizard = (type: 'store' | 'company') => {
        setSelectedType(type);
        setView('wizard');
    };

    const handleSelectTemplate = (template: WebTemplate) => {
        if (template.isPremium && !currentPlan.features.premiumTemplates) {
            setShowUpgradeModal(true);
            return;
        }

        const newWebsite: Website = {
            id: `WEB-${Date.now()}`,
            storeId: store.id,
            subdomain: store.name.toLowerCase().replace(/[\s\.]+/g, '-'),
            title: store.name,
            type: template.type,
            templateId: template.id,
            theme: template.defaultTheme,
            pages: template.defaultPages,
            status: 'draft',
            settings: {
                shippingRate: 50,
                allowCashOnDelivery: true,
                contactEmail: store.ownerEmail,
                contactPhone: store.ownerPhone
            }
        };

        updateStore({ website: newWebsite });
        setView('editor');
    };

    if (view === 'editor' && store.website) {
        return <SiteEditor website={store.website} store={store} onSave={(w) => { updateStore({ website: w }); setView('dashboard'); }} onCancel={() => setView('dashboard')} />;
    }

    return (
        <div className="space-y-6 h-full">
            <UpgradeModal 
                isOpen={showUpgradeModal} 
                onClose={() => setShowUpgradeModal(false)} 
                title="قالب احترافي (Premium)"
                message="هذا القالب متاح فقط للمشتركين في الباقات المتقدمة. قم بالترقية للحصول عليه."
            />

            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                        <GlobeAltIcon />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800">منشئ المتجر الإلكتروني</h1>
                </div>
                {hasWebsite && (
                    <div className="flex gap-2">
                        <a 
                            href={`#site/${store.id}`} 
                            target="_blank"
                            className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                        >
                            <EyeIcon /> معاينة الموقع
                        </a>
                        <button 
                            onClick={() => setView('editor')} 
                            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                        >
                            <PencilIcon /> تعديل التصميم
                        </button>
                    </div>
                )}
            </div>

            {view === 'wizard' && (
                <div className="bg-white p-8 rounded-xl shadow-lg animate-fade-in-up">
                    <div className="flex items-center gap-4 mb-6 border-b pb-4">
                        <button onClick={() => setView('dashboard')} className="text-gray-500 hover:text-indigo-600">← عودة</button>
                        <h2 className="text-2xl font-bold text-gray-800">اختر القالب المناسب</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {TEMPLATES.filter(t => t.type === selectedType).map(template => {
                            const isLocked = template.isPremium && !currentPlan.features.premiumTemplates;
                            return (
                                <div key={template.id} className="border rounded-xl overflow-hidden hover:shadow-xl transition group relative">
                                    <div className="h-48 bg-gray-200 relative">
                                        <img src={template.thumbnail} alt={template.name} className="w-full h-full object-cover" />
                                        {isLocked && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                                                <div className="bg-white/20 p-3 rounded-full text-white text-2xl">🔒</div>
                                            </div>
                                        )}
                                        {template.isPremium && (
                                            <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded shadow">Premium</div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-bold text-lg mb-2">{template.name}</h3>
                                        <button 
                                            onClick={() => handleSelectTemplate(template)}
                                            className={`w-full py-2 rounded-lg font-bold transition ${isLocked ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                                        >
                                            {isLocked ? 'متاح في الباقات الأعلى' : 'استخدام القالب'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {view === 'dashboard' && !hasWebsite && (
                <div className="flex flex-col items-center justify-center h-[60vh] space-y-8 text-center">
                    <div className="max-w-md">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">لم تقم بإنشاء موقعك بعد!</h2>
                        <p className="text-gray-600 mb-8">ابدأ الآن بإنشاء واجهة رقمية لمتجرك. يمكنك الاختيار بين متجر إلكتروني كامل للبيع أونلاين، أو موقع تعريفي لخدماتك.</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button 
                                onClick={() => handleStartWizard('store')}
                                className="p-6 bg-white border-2 border-indigo-100 rounded-xl hover:border-indigo-500 hover:shadow-lg transition group text-right"
                            >
                                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition">
                                    <LayoutIcon />
                                </div>
                                <h3 className="font-bold text-lg mb-1">متجر إلكتروني</h3>
                                <p className="text-sm text-gray-500">بيع منتجاتك أونلاين، سلة مشتريات، ودفع إلكتروني.</p>
                            </button>

                            <button 
                                onClick={() => handleStartWizard('company')}
                                className="p-6 bg-white border-2 border-blue-100 rounded-xl hover:border-blue-500 hover:shadow-lg transition group text-right"
                            >
                                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition">
                                    <GlobeAltIcon />
                                </div>
                                <h3 className="font-bold text-lg mb-1">موقع تعريفي</h3>
                                <p className="text-sm text-gray-500">صفحة تعريفية بخدماتك، طرق التواصل، ومعرض أعمال.</p>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {view === 'dashboard' && hasWebsite && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Stats Card */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-700 mb-4">أداء المتجر الإلكتروني</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">الزيارات (تقريبي)</span>
                                <span className="font-bold text-xl">1,240 / {currentPlan.limits.visits.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">الطلبات الجديدة</span>
                                <span className="font-bold text-xl text-green-600">
                                    {store.onlineOrders ? store.onlineOrders.filter(o => o.status === 'new').length : 0}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                         <h3 className="font-bold text-gray-700 mb-4">إدارة المحتوى</h3>
                         <div className="space-y-2">
                             <button onClick={() => setView('editor')} className="w-full text-right p-3 hover:bg-gray-50 rounded-lg flex items-center gap-2 transition">
                                 <PencilIcon /> تعديل الصفحة الرئيسية
                             </button>
                             <div className="h-px bg-gray-100"></div>
                             <button className="w-full text-right p-3 hover:bg-gray-50 rounded-lg flex items-center gap-2 transition">
                                 <LayoutIcon /> إدارة القوائم (Navbar)
                             </button>
                         </div>
                    </div>

                    {/* Link Sharing */}
                    <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                        <h3 className="font-bold text-indigo-800 mb-2">رابط موقعك</h3>
                        <p className="text-sm text-indigo-600 mb-4">شارك هذا الرابط مع عملائك للوصول لمتجرك.</p>
                        <div className="bg-white p-3 rounded border flex justify-between items-center">
                            <span className="text-sm text-gray-600 truncate" dir="ltr">
                                {`https://nebras.app/#site/${store.id}`}
                            </span>
                            <button 
                                onClick={() => navigator.clipboard.writeText(`https://nebras.app/#site/${store.id}`)}
                                className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200"
                            >
                                نسخ
                            </button>
                        </div>
                        {currentPlan.features.customDomain && (
                            <div className="mt-4 pt-4 border-t border-indigo-200">
                                <button className="text-xs text-indigo-700 hover:underline font-bold flex items-center gap-1">
                                    <PlusIcon /> ربط دومين خاص (Custom Domain)
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {hasWebsite && store.onlineOrders && store.onlineOrders.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="p-4 border-b bg-gray-50 font-bold">آخر الطلبات الإلكترونية</div>
                    <table className="w-full text-right text-sm">
                        <thead>
                            <tr className="border-b"><th className="p-3">رقم الطلب</th><th className="p-3">العميل</th><th className="p-3">الإجمالي</th><th className="p-3">الحالة</th><th className="p-3">التاريخ</th></tr>
                        </thead>
                        <tbody>
                            {store.onlineOrders.slice(-5).reverse().map(order => (
                                <tr key={order.id} className="border-b hover:bg-gray-50">
                                    <td className="p-3 font-mono">{order.id}</td>
                                    <td className="p-3">{order.customerName}</td>
                                    <td className="p-3 font-bold">{order.totalAmount.toLocaleString()} ج.م</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded-full text-xs ${order.status === 'new' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
                                            {order.status === 'new' ? 'جديد' : order.status}
                                        </span>
                                    </td>
                                    <td className="p-3 text-gray-500">{new Date(order.date).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default WebsiteBuilder;
