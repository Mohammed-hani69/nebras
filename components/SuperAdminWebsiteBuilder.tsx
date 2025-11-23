
import React, { useState, useEffect, useMemo } from 'react';
import type { Store, AISettings, WebTemplate, WebBlock, BuilderAuditLog, BuilderPlan, DomainRequest, GlobalMediaItem, SEOTemplate, BlockDefinition, PlanSubscriptionRequest } from '../types';
import { 
    LayoutIcon, CubeIcon, BriefcaseIcon, GlobeAltIcon, 
    StoreIcon, PhotoIcon, ClipboardListIcon, PlusIcon, SparklesIcon, TrashIcon, PencilIcon,
    CheckCircleIcon, CogIcon, DocumentTextIcon, CloudArrowUpIcon, XMarkIcon, BellIcon, LockClosedIcon, LockOpenIcon
} from './icons/Icons';
import { generateBuilderComponent } from '../services/geminiService';

interface SuperAdminWebsiteBuilderProps {
    stores: Store[];
    setStores: React.Dispatch<React.SetStateAction<Store[]>>;
    aiSettings: AISettings;
    initialTemplates: WebTemplate[];
    initialBlocks: BlockDefinition[];
    onUpdateTemplates: (templates: WebTemplate[]) => void;
    onUpdateBlocks: (blocks: BlockDefinition[]) => void;
    plans: BuilderPlan[];
    setPlans: React.Dispatch<React.SetStateAction<BuilderPlan[]>>;
}

const INITIAL_DOMAINS: DomainRequest[] = [
    { id: 'dom-1', storeId: 'store-123', storeName: 'متجر الأمل', domain: 'alamal.com', status: 'pending', ssl: false, dnsVerified: false, requestedAt: new Date().toISOString() }
];

const INITIAL_MEDIA: GlobalMediaItem[] = [
    { id: 'img-1', name: 'Banner Default', url: 'https://placehold.co/800x400', type: 'image', accessLevel: 'free' },
    { id: 'icon-1', name: 'Star Icon', url: 'https://placehold.co/64x64', type: 'icon', accessLevel: 'premium' }
];

const TABS = [
    { id: 'plans', label: 'الباقات والاشتراكات', icon: <BriefcaseIcon /> },
    { id: 'templates', label: 'القوالب', icon: <LayoutIcon /> },
    { id: 'units', label: 'الوحدات (Blocks)', icon: <CubeIcon /> },
    { id: 'domains', label: 'الدومينات', icon: <GlobeAltIcon /> },
    { id: 'media', label: 'الوسائط', icon: <PhotoIcon /> },
    { id: 'seo', label: 'SEO', icon: <SparklesIcon /> },
    { id: 'audit', label: 'السجل', icon: <ClipboardListIcon /> },
];

const SuperAdminWebsiteBuilder: React.FC<SuperAdminWebsiteBuilderProps> = ({ 
    stores, setStores, aiSettings, 
    initialTemplates, initialBlocks, onUpdateTemplates, onUpdateBlocks,
    plans, setPlans
}) => {
    const [activeTab, setActiveTab] = useState('plans');
    const [activePlansSubTab, setActivePlansSubTab] = useState<'manage' | 'requests'>('manage');
    
    // Shared Data States
    const [templates, setTemplates] = useState<WebTemplate[]>(initialTemplates);
    const [blocks, setBlocks] = useState<BlockDefinition[]>(initialBlocks);
    
    // Local Data States
    const [domains, setDomains] = useState<DomainRequest[]>(INITIAL_DOMAINS);
    const [media, setMedia] = useState<GlobalMediaItem[]>(INITIAL_MEDIA);
    const [logs, setLogs] = useState<BuilderAuditLog[]>([]);
    const [seoTemplates, setSeoTemplates] = useState<SEOTemplate[]>([
        { id: 'seo-1', type: 'product', metaTitlePattern: '{product_name} | {store_name}', metaDescriptionPattern: 'تسوق {product_name} بأفضل الأسعار.' }
    ]);

    // Editor Modal States
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Partial<WebTemplate>>({});
    
    const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
    const [editingBlock, setEditingBlock] = useState<Partial<BlockDefinition>>({});

    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Partial<BuilderPlan>>({});

    // AI Generation State
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Sync props to state
    useEffect(() => { setTemplates(initialTemplates); }, [initialTemplates]);
    useEffect(() => { setBlocks(initialBlocks); }, [initialBlocks]);

    // --- Helper Functions ---
    const addLog = (action: string, target?: string) => {
        setLogs(prev => [{ id: `log-${Date.now()}`, timestamp: new Date().toISOString(), adminUser: 'superadmin', action, target }, ...prev]);
    };

    // --- AI Generation ---
    const handleAiGenerate = async (type: 'block' | 'template') => {
        if (!aiPrompt.trim()) return;
        setIsGenerating(true);
        try {
            const result = await generateBuilderComponent(aiPrompt, type, aiSettings);
            
            if (type === 'template') {
                setEditingTemplate(prev => ({
                    ...prev,
                    ...result, // Merges generated structure
                    name: prev.name || result.name || 'AI Generated Template',
                    type: prev.type || result.type || 'store',
                    thumbnail: 'https://placehold.co/600x400/eee/333?text=Template+Preview'
                }));
            } else {
                setEditingBlock(prev => ({
                    ...prev,
                    ...result, // Merges generated structure (content, style)
                    label: prev.label || aiPrompt.slice(0, 20),
                    type: result.type || 'custom', // Usually maps to existing types or 'custom'
                    category: prev.category || 'marketing',
                    icon: '✨'
                }));
            }
            addLog(`AI Generated ${type}`, aiPrompt);
        } catch (e) {
            alert('فشل التوليد. تأكد من الاتصال بالإنترنت والمفتاح.');
        } finally {
            setIsGenerating(false);
        }
    };

    // --- Template Actions ---
    const saveTemplate = () => {
        if (!editingTemplate.name || !editingTemplate.type) return alert('البيانات ناقصة');
        
        const newTemplate: WebTemplate = {
            id: editingTemplate.id || `temp-${Date.now()}`,
            name: editingTemplate.name,
            type: editingTemplate.type,
            isPremium: editingTemplate.isPremium || false,
            thumbnail: editingTemplate.thumbnail || 'https://placehold.co/600x400',
            defaultTheme: editingTemplate.defaultTheme || { primaryColor: '#000', secondaryColor: '#fff', fontFamily: 'Tajawal' },
            defaultPages: editingTemplate.defaultPages || []
        };

        const updatedList = editingTemplate.id 
            ? templates.map(t => t.id === newTemplate.id ? newTemplate : t)
            : [...templates, newTemplate];
            
        setTemplates(updatedList);
        onUpdateTemplates(updatedList);
        setIsTemplateModalOpen(false);
        setEditingTemplate({});
        addLog(editingTemplate.id ? 'Update Template' : 'Create Template', newTemplate.name);
    };

    const deleteTemplate = (id: string) => {
        if (!window.confirm('حذف القالب؟')) return;
        const updatedList = templates.filter(t => t.id !== id);
        setTemplates(updatedList);
        onUpdateTemplates(updatedList);
        addLog('Delete Template', id);
    };

    // --- Block Actions ---
    const saveBlock = () => {
        if (!editingBlock.label || !editingBlock.type) return alert('البيانات ناقصة');

        const newBlock: BlockDefinition = {
            id: editingBlock.id || `blk-def-${Date.now()}`,
            label: editingBlock.label,
            type: editingBlock.type,
            category: editingBlock.category || 'basic',
            icon: editingBlock.icon || '📦',
            isPremium: editingBlock.isPremium || false,
            defaultContent: editingBlock.defaultContent || {},
            defaultStyle: editingBlock.defaultStyle || {}
        };

        const updatedList = editingBlock.id 
            ? blocks.map(b => b.id === newBlock.id ? newBlock : b)
            : [...blocks, newBlock];

        setBlocks(updatedList);
        onUpdateBlocks(updatedList);
        setIsBlockModalOpen(false);
        setEditingBlock({});
        addLog(editingBlock.id ? 'Update Block Def' : 'Create Block Def', newBlock.label);
    };
    
    const deleteBlock = (id: string) => {
        if (!window.confirm('حذف الوحدة؟')) return;
        const updatedList = blocks.filter(b => b.id !== id);
        setBlocks(updatedList);
        onUpdateBlocks(updatedList);
        addLog('Delete Block Def', id);
    };

    // --- Plan Actions ---
    const savePlan = () => {
        if (!editingPlan.name || editingPlan.price === undefined) return alert('يرجى إدخال الاسم والسعر');

        const newPlan: BuilderPlan = {
            id: editingPlan.id || `plan-${Date.now()}`,
            name: editingPlan.name,
            price: editingPlan.price,
            limits: editingPlan.limits || { pages: 1, products: 0, storage: 100, visits: 1000 },
            features: editingPlan.features || { customDomain: false, ssl: false, builderAccess: true, htmlCssAccess: false },
            allowedTemplates: editingPlan.allowedTemplates || 'all',
            allowedBlocks: editingPlan.allowedBlocks || 'all'
        };

        const updatedList = editingPlan.id
            ? plans.map(p => p.id === newPlan.id ? newPlan : p)
            : [...plans, newPlan];

        setPlans(updatedList);
        setIsPlanModalOpen(false);
        setEditingPlan({});
        addLog(editingPlan.id ? 'Update Plan' : 'Create Plan', newPlan.name);
    };

    const deletePlan = (id: string) => {
        if (!window.confirm('هل أنت متأكد من حذف هذه الباقة؟')) return;
        setPlans(prev => prev.filter(p => p.id !== id));
        addLog('Delete Plan', id);
    };

    const toggleAllowedItem = (type: 'template' | 'block', id: string) => {
        const field = type === 'template' ? 'allowedTemplates' : 'allowedBlocks';
        const current = editingPlan[field] || 'all';
        
        if (current === 'all') {
            setEditingPlan({ ...editingPlan, [field]: [id] });
        } else {
            const list = Array.isArray(current) ? current : [];
            const newList = list.includes(id) 
                ? list.filter(x => x !== id)
                : [...list, id];
            setEditingPlan({ ...editingPlan, [field]: newList });
        }
    };

    const setAllowedAll = (type: 'template' | 'block', isAll: boolean) => {
        const field = type === 'template' ? 'allowedTemplates' : 'allowedBlocks';
        setEditingPlan({ ...editingPlan, [field]: isAll ? 'all' : [] });
    };

    // --- Subscription Requests Logic ---
    const pendingRequests = useMemo(() => {
        return stores
            .filter(s => s.websitePlanRequest && s.websitePlanRequest.status === 'pending')
            .map(s => s.websitePlanRequest!);
    }, [stores]);

    const handleRequestAction = (request: PlanSubscriptionRequest, action: 'approve' | 'reject') => {
        if (action === 'approve') {
            setStores(prev => prev.map(s => {
                if (s.id === request.storeId) {
                    return {
                        ...s,
                        plan: request.planId,
                        websitePlanRequest: { ...request, status: 'approved' }
                    };
                }
                return s;
            }));
            addLog('Approve Subscription', request.storeName);
        } else {
            setStores(prev => prev.map(s => {
                if (s.id === request.storeId) {
                    return {
                        ...s,
                        websitePlanRequest: { ...request, status: 'rejected' }
                    };
                }
                return s;
            }));
            addLog('Reject Subscription', request.storeName);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">إدارة منشئ المواقع</h2>
                <div className="flex gap-2">
                    {activeTab === 'templates' && <button onClick={() => { setEditingTemplate({}); setIsTemplateModalOpen(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center gap-2"><PlusIcon /> إضافة قالب</button>}
                    {activeTab === 'units' && <button onClick={() => { setEditingBlock({}); setIsBlockModalOpen(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center gap-2"><PlusIcon /> إضافة وحدة</button>}
                    {activeTab === 'plans' && activePlansSubTab === 'manage' && <button onClick={() => { setEditingPlan({ limits: { pages: 1, products: 0, storage: 100, visits: 1000 }, features: { customDomain: false, ssl: false, builderAccess: true, htmlCssAccess: false }, allowedTemplates: 'all', allowedBlocks: 'all' }); setIsPlanModalOpen(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center gap-2"><PlusIcon /> إضافة باقة</button>}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b bg-white rounded-t-xl shadow-sm overflow-x-auto">
                {TABS.map(tab => (
                    <button 
                        key={tab.id} 
                        onClick={() => setActiveTab(tab.id)} 
                        className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap transition ${activeTab === tab.id ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        {tab.icon} {tab.label}
                        {tab.id === 'plans' && pendingRequests.length > 0 && <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingRequests.length}</span>}
                    </button>
                ))}
            </div>

            <div className="bg-white p-6 rounded-b-xl shadow-lg min-h-[500px]">
                {activeTab === 'templates' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {templates.map(t => (
                            <div key={t.id} className="border rounded-xl overflow-hidden hover:shadow-md transition relative group">
                                <div className="h-40 bg-gray-100 relative">
                                    <img src={t.thumbnail} alt={t.name} className="w-full h-full object-cover" />
                                    <div className="absolute top-2 right-2 flex gap-1">
                                        {t.isPremium && <span className="bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded font-bold">Premium</span>}
                                        <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded">{t.type}</span>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold">{t.name}</h3>
                                    <p className="text-xs text-gray-500">{t.defaultPages.length} صفحات</p>
                                    <div className="flex justify-end gap-2 mt-3">
                                        <button onClick={() => { setEditingTemplate(t); setIsTemplateModalOpen(true); }} className="text-blue-600"><PencilIcon /></button>
                                        <button onClick={() => deleteTemplate(t.id)} className="text-red-600"><TrashIcon /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'units' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {blocks.map(b => (
                            <div key={b.id} className="border rounded-xl p-4 flex flex-col items-center text-center hover:bg-gray-50 transition relative group">
                                <div className="text-3xl mb-2">{b.icon}</div>
                                <h4 className="font-bold text-gray-800">{b.label}</h4>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded mt-1">{b.category}</span>
                                {b.isPremium && <span className="text-xs text-yellow-600 font-bold mt-1">Premium</span>}
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition flex gap-1">
                                    <button onClick={() => { setEditingBlock(b); setIsBlockModalOpen(true); }} className="text-blue-600 bg-white rounded-full p-1 shadow"><PencilIcon /></button>
                                    <button onClick={() => deleteBlock(b.id)} className="text-red-600 bg-white rounded-full p-1 shadow"><TrashIcon /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'plans' && (
                    <div className="space-y-6">
                        <div className="flex gap-4 border-b pb-2">
                            <button 
                                onClick={() => setActivePlansSubTab('manage')} 
                                className={`text-sm font-bold pb-2 ${activePlansSubTab === 'manage' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
                            >
                                إدارة الباقات
                            </button>
                            <button 
                                onClick={() => setActivePlansSubTab('requests')} 
                                className={`text-sm font-bold pb-2 flex items-center gap-2 ${activePlansSubTab === 'requests' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
                            >
                                طلبات الاشتراك
                                {pendingRequests.length > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">{pendingRequests.length}</span>}
                            </button>
                        </div>

                        {activePlansSubTab === 'manage' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {plans.map(p => {
                                    const isRestrictedTemplates = Array.isArray(p.allowedTemplates);
                                    const isRestrictedBlocks = Array.isArray(p.allowedBlocks);
                                    return (
                                    <div key={p.id} className="border rounded-xl p-6 hover:shadow-lg transition relative group bg-white">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-bold text-xl text-gray-800">{p.name}</h3>
                                                <p className="text-indigo-600 font-bold text-2xl mt-1">{p.price} <span className="text-sm font-normal text-gray-500">ج.م</span></p>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                                <button onClick={() => { setEditingPlan(p); setIsPlanModalOpen(true); }} className="text-blue-600 p-1 bg-gray-100 rounded hover:bg-blue-100"><PencilIcon /></button>
                                                <button onClick={() => deletePlan(p.id)} className="text-red-600 p-1 bg-gray-100 rounded hover:bg-red-100"><TrashIcon /></button>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-3 text-sm mb-6 border-b pb-4 bg-gray-50 p-3 rounded-lg">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">الصفحات</span>
                                                <span className="font-bold">{p.limits.pages}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">المنتجات</span>
                                                <span className="font-bold">{p.limits.products}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">المساحة</span>
                                                <span className="font-bold">{p.limits.storage} MB</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">الزيارات</span>
                                                <span className="font-bold">{p.limits.visits}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-2 text-sm">
                                            <div className={`flex items-center gap-2 ${p.features.customDomain ? 'text-green-700' : 'text-gray-400'}`}>
                                                {p.features.customDomain ? <CheckCircleIcon /> : <XMarkIcon />} دومين خاص
                                            </div>
                                            <div className={`flex items-center gap-2 ${p.features.ssl ? 'text-green-700' : 'text-gray-400'}`}>
                                                {p.features.ssl ? <CheckCircleIcon /> : <XMarkIcon />} شهادة SSL
                                            </div>
                                            <div className={`flex items-center gap-2 ${p.features.builderAccess ? 'text-green-700' : 'text-gray-400'}`}>
                                                {p.features.builderAccess ? <CheckCircleIcon /> : <XMarkIcon />} وصول للمنشئ
                                            </div>
                                            <div className={`flex items-center gap-2 ${p.features.htmlCssAccess ? 'text-green-700' : 'text-gray-400'}`}>
                                                {p.features.htmlCssAccess ? <CheckCircleIcon /> : <XMarkIcon />} تعديل HTML/CSS
                                            </div>
                                            <div className="flex items-center gap-2 pt-2 border-t mt-2 text-gray-600">
                                                {isRestrictedTemplates ? <LockClosedIcon /> : <LockOpenIcon />} 
                                                <span>{isRestrictedTemplates ? 'قوالب محددة' : 'كل القوالب'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600">
                                                {isRestrictedBlocks ? <LockClosedIcon /> : <LockOpenIcon />} 
                                                <span>{isRestrictedBlocks ? 'وحدات محددة' : 'كل الوحدات'}</span>
                                            </div>
                                        </div>
                                    </div>
                                )})}
                            </div>
                        )}

                        {activePlansSubTab === 'requests' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-right text-sm bg-white border rounded-lg">
                                    <thead className="bg-gray-50 text-gray-700">
                                        <tr>
                                            <th className="p-4">اسم المتجر</th>
                                            <th className="p-4">الباقة المطلوبة</th>
                                            <th className="p-4">تاريخ الطلب</th>
                                            <th className="p-4">الإجراء</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingRequests.length > 0 ? pendingRequests.map(req => (
                                            <tr key={req.id} className="border-b last:border-0 hover:bg-gray-50">
                                                <td className="p-4 font-bold">{req.storeName}</td>
                                                <td className="p-4">
                                                    <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">{req.planName}</span>
                                                </td>
                                                <td className="p-4 text-gray-500">{new Date(req.requestDate).toLocaleDateString('ar-EG')}</td>
                                                <td className="p-4 flex gap-2">
                                                    <button onClick={() => handleRequestAction(req, 'approve')} className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-xs font-bold">قبول</button>
                                                    <button onClick={() => handleRequestAction(req, 'reject')} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-xs font-bold">رفض</button>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan={4} className="p-8 text-center text-gray-500">لا توجد طلبات اشتراك معلقة.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Placeholder Views for other tabs */}
                {['domains', 'media', 'seo', 'audit'].includes(activeTab) && (
                    <div className="text-center py-20 text-gray-400">
                        <div className="text-6xl mb-4">🚧</div>
                        <p>هذا القسم قيد التطوير</p>
                    </div>
                )}
            </div>

            {/* Template Modal */}
            {isTemplateModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4">{editingTemplate.id ? 'تعديل قالب' : 'قالب جديد'}</h3>
                        
                        {/* AI Generator */}
                        <div className="bg-indigo-50 p-4 rounded-lg mb-6 flex gap-2 items-center">
                            <SparklesIcon />
                            <input 
                                type="text" 
                                value={aiPrompt} 
                                onChange={e => setAiPrompt(e.target.value)} 
                                placeholder="صف القالب لتوليده بالذكاء الاصطناعي..." 
                                className="flex-1 p-2 border rounded text-sm"
                            />
                            <button 
                                onClick={() => handleAiGenerate('template')}
                                disabled={isGenerating}
                                className="bg-indigo-600 text-white px-3 py-2 rounded text-sm disabled:opacity-50"
                            >
                                {isGenerating ? 'جاري التوليد...' : 'توليد'}
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <input type="text" placeholder="اسم القالب" className="p-2 border rounded" value={editingTemplate.name || ''} onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})} />
                                <select className="p-2 border rounded" value={editingTemplate.type || 'store'} onChange={e => setEditingTemplate({...editingTemplate, type: e.target.value as any})}>
                                    <option value="store">متجر</option>
                                    <option value="company">شركة</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" checked={editingTemplate.isPremium || false} onChange={e => setEditingTemplate({...editingTemplate, isPremium: e.target.checked})} />
                                <label>Premium Template</label>
                            </div>
                            {/* JSON Editor Placeholder for complex fields */}
                            <div>
                                <label className="block text-sm mb-1">JSON Configuration (Pages & Theme)</label>
                                <textarea 
                                    className="w-full h-40 p-2 border rounded font-mono text-xs"
                                    value={JSON.stringify({ defaultTheme: editingTemplate.defaultTheme, defaultPages: editingTemplate.defaultPages }, null, 2)}
                                    onChange={e => {
                                        try {
                                            const parsed = JSON.parse(e.target.value);
                                            setEditingTemplate({...editingTemplate, ...parsed});
                                        } catch (err) {}
                                    }}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={saveTemplate} className="bg-green-600 text-white px-4 py-2 rounded">حفظ</button>
                            <button onClick={() => setIsTemplateModalOpen(false)} className="bg-gray-300 px-4 py-2 rounded">إلغاء</button>
                        </div>
                    </div>
                </div>
            )}

             {/* Block Modal */}
             {isBlockModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4">{editingBlock.id ? 'تعديل وحدة' : 'وحدة جديدة'}</h3>
                        
                         {/* AI Generator */}
                         <div className="bg-indigo-50 p-4 rounded-lg mb-6 flex gap-2 items-center">
                            <SparklesIcon />
                            <input 
                                type="text" 
                                value={aiPrompt} 
                                onChange={e => setAiPrompt(e.target.value)} 
                                placeholder="صف الوحدة لتوليدها..." 
                                className="flex-1 p-2 border rounded text-sm"
                            />
                            <button 
                                onClick={() => handleAiGenerate('block')}
                                disabled={isGenerating}
                                className="bg-indigo-600 text-white px-3 py-2 rounded text-sm disabled:opacity-50"
                            >
                                {isGenerating ? 'جاري التوليد...' : 'توليد'}
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <input type="text" placeholder="اسم الوحدة (Label)" className="p-2 border rounded" value={editingBlock.label || ''} onChange={e => setEditingBlock({...editingBlock, label: e.target.value})} />
                                <input type="text" placeholder="النوع (Type ID)" className="p-2 border rounded" value={editingBlock.type || ''} onChange={e => setEditingBlock({...editingBlock, type: e.target.value})} />
                                <select className="p-2 border rounded" value={editingBlock.category || 'basic'} onChange={e => setEditingBlock({...editingBlock, category: e.target.value as any})}>
                                    <option value="basic">Basic</option>
                                    <option value="marketing">Marketing</option>
                                    <option value="commerce">Commerce</option>
                                    <option value="advanced">Advanced</option>
                                </select>
                                <input type="text" placeholder="أيقونة (Emoji)" className="p-2 border rounded" value={editingBlock.icon || ''} onChange={e => setEditingBlock({...editingBlock, icon: e.target.value})} />
                            </div>
                             <div className="flex items-center gap-2">
                                <input type="checkbox" checked={editingBlock.isPremium || false} onChange={e => setEditingBlock({...editingBlock, isPremium: e.target.checked})} />
                                <label>Premium Block</label>
                            </div>
                            <div>
                                <label className="block text-sm mb-1">Default Content (JSON)</label>
                                <textarea 
                                    className="w-full h-24 p-2 border rounded font-mono text-xs"
                                    value={JSON.stringify(editingBlock.defaultContent || {}, null, 2)}
                                    onChange={e => { try { setEditingBlock({...editingBlock, defaultContent: JSON.parse(e.target.value)}); } catch(err){} }}
                                />
                            </div>
                             <div>
                                <label className="block text-sm mb-1">Default Style (JSON)</label>
                                <textarea 
                                    className="w-full h-24 p-2 border rounded font-mono text-xs"
                                    value={JSON.stringify(editingBlock.defaultStyle || {}, null, 2)}
                                    onChange={e => { try { setEditingBlock({...editingBlock, defaultStyle: JSON.parse(e.target.value)}); } catch(err){} }}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={saveBlock} className="bg-green-600 text-white px-4 py-2 rounded">حفظ</button>
                            <button onClick={() => setIsBlockModalOpen(false)} className="bg-gray-300 px-4 py-2 rounded">إلغاء</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Plan Modal */}
            {isPlanModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4">{editingPlan.id ? 'تعديل باقة' : 'باقة جديدة'}</h3>
                        <div className="space-y-6">
                            {/* General Info */}
                            <div className="space-y-4">
                                <h4 className="font-bold text-gray-700 text-sm border-b pb-1">المعلومات الأساسية</h4>
                                <div>
                                    <label className="block text-sm mb-1">اسم الباقة</label>
                                    <input type="text" value={editingPlan.name || ''} onChange={e => setEditingPlan({...editingPlan, name: e.target.value})} className="w-full p-2 border rounded" />
                                </div>
                                <div>
                                    <label className="block text-sm mb-1">السعر (ج.م)</label>
                                    <input type="number" value={editingPlan.price || 0} onChange={e => setEditingPlan({...editingPlan, price: parseFloat(e.target.value)})} className="w-full p-2 border rounded" />
                                </div>
                            </div>
                            
                            {/* Limits */}
                            <div className="bg-gray-50 p-3 rounded border space-y-4">
                                <h4 className="font-bold text-gray-700 text-sm border-b pb-1">الحدود (Limits)</h4>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <label>الصفحات</label>
                                        <input type="number" value={editingPlan.limits?.pages || 0} onChange={e => setEditingPlan({...editingPlan, limits: {...editingPlan.limits!, pages: parseInt(e.target.value)}})} className="w-full p-1 border rounded" />
                                    </div>
                                    <div>
                                        <label>المنتجات</label>
                                        <input type="number" value={editingPlan.limits?.products || 0} onChange={e => setEditingPlan({...editingPlan, limits: {...editingPlan.limits!, products: parseInt(e.target.value)}})} className="w-full p-1 border rounded" />
                                    </div>
                                    <div className="col-span-2">
                                        <label>المساحة (MB)</label>
                                        <input type="number" value={editingPlan.limits?.storage || 0} onChange={e => setEditingPlan({...editingPlan, limits: {...editingPlan.limits!, storage: parseInt(e.target.value)}})} className="w-full p-1 border rounded" />
                                    </div>
                                    <div className="col-span-2">
                                        <label>الزيارات الشهرية</label>
                                        <input type="number" value={editingPlan.limits?.visits || 0} onChange={e => setEditingPlan({...editingPlan, limits: {...editingPlan.limits!, visits: parseInt(e.target.value)}})} className="w-full p-1 border rounded" />
                                    </div>
                                </div>
                            </div>

                            {/* Features */}
                            <div className="bg-gray-50 p-3 rounded border space-y-2">
                                <h4 className="font-bold text-gray-700 text-sm border-b pb-1">المميزات التقنية</h4>
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input type="checkbox" checked={editingPlan.features?.customDomain || false} onChange={e => setEditingPlan({...editingPlan, features: {...editingPlan.features!, customDomain: e.target.checked}})} />
                                    دومين خاص (Custom Domain)
                                </label>
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input type="checkbox" checked={editingPlan.features?.ssl || false} onChange={e => setEditingPlan({...editingPlan, features: {...editingPlan.features!, ssl: e.target.checked}})} />
                                    شهادة أمان (SSL)
                                </label>
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input type="checkbox" checked={editingPlan.features?.builderAccess || false} onChange={e => setEditingPlan({...editingPlan, features: {...editingPlan.features!, builderAccess: e.target.checked}})} />
                                    وصول للمنشئ المرئي
                                </label>
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input type="checkbox" checked={editingPlan.features?.htmlCssAccess || false} onChange={e => setEditingPlan({...editingPlan, features: {...editingPlan.features!, htmlCssAccess: e.target.checked}})} />
                                    تعديل الكود (HTML/CSS)
                                </label>
                            </div>

                            {/* Permissions - Templates & Blocks */}
                            <div className="bg-indigo-50 p-3 rounded border border-indigo-100 space-y-4">
                                <h4 className="font-bold text-indigo-800 text-sm border-b border-indigo-200 pb-1">صلاحيات الوصول (Permissions)</h4>
                                
                                {/* Templates Access */}
                                <div>
                                    <label className="block text-xs font-bold text-indigo-700 mb-2">القوالب المسموحة</label>
                                    <div className="flex gap-3 mb-2 text-sm">
                                        <label className="flex items-center gap-1 cursor-pointer">
                                            <input type="radio" checked={editingPlan.allowedTemplates === 'all'} onChange={() => setAllowedAll('template', true)} name="tpl_access" /> الكل
                                        </label>
                                        <label className="flex items-center gap-1 cursor-pointer">
                                            <input type="radio" checked={Array.isArray(editingPlan.allowedTemplates)} onChange={() => setAllowedAll('template', false)} name="tpl_access" /> محددة
                                        </label>
                                    </div>
                                    {Array.isArray(editingPlan.allowedTemplates) && (
                                        <div className="max-h-24 overflow-y-auto bg-white border rounded p-2 space-y-1">
                                            {templates.map(t => (
                                                <label key={t.id} className="flex items-center gap-2 text-xs cursor-pointer">
                                                    <input type="checkbox" checked={(editingPlan.allowedTemplates as string[]).includes(t.id)} onChange={() => toggleAllowedItem('template', t.id)} />
                                                    {t.name} ({t.isPremium ? 'Premium' : 'Free'})
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Blocks Access */}
                                <div>
                                    <label className="block text-xs font-bold text-indigo-700 mb-2">الوحدات المسموحة (Blocks)</label>
                                    <div className="flex gap-3 mb-2 text-sm">
                                        <label className="flex items-center gap-1 cursor-pointer">
                                            <input type="radio" checked={editingPlan.allowedBlocks === 'all'} onChange={() => setAllowedAll('block', true)} name="blk_access" /> الكل
                                        </label>
                                        <label className="flex items-center gap-1 cursor-pointer">
                                            <input type="radio" checked={Array.isArray(editingPlan.allowedBlocks)} onChange={() => setAllowedAll('block', false)} name="blk_access" /> محددة
                                        </label>
                                    </div>
                                    {Array.isArray(editingPlan.allowedBlocks) && (
                                        <div className="max-h-24 overflow-y-auto bg-white border rounded p-2 space-y-1">
                                            {blocks.map(b => (
                                                <label key={b.id} className="flex items-center gap-2 text-xs cursor-pointer">
                                                    <input type="checkbox" checked={(editingPlan.allowedBlocks as string[]).includes(b.id)} onChange={() => toggleAllowedItem('block', b.id)} />
                                                    {b.label}
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={savePlan} className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700">حفظ الباقة</button>
                            <button onClick={() => setIsPlanModalOpen(false)} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">إلغاء</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default SuperAdminWebsiteBuilder;
