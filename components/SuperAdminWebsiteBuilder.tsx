
import React, { useState, useEffect } from 'react';
import type { Store, AISettings, WebTemplate, WebBlock, BuilderAuditLog, BuilderPlan, DomainRequest, GlobalMediaItem, SEOTemplate, BlockDefinition } from '../types';
import { 
    LayoutIcon, CubeIcon, BriefcaseIcon, GlobeAltIcon, 
    StoreIcon, PhotoIcon, ClipboardListIcon, PlusIcon, SparklesIcon, TrashIcon, PencilIcon,
    CheckCircleIcon, CogIcon, DocumentTextIcon, CloudArrowUpIcon, XMarkIcon
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
}

// --- Mock Data for other tabs ---
const INITIAL_PLANS: BuilderPlan[] = [
    { id: 'basic-web', name: 'موقع تعريفي أساسي', price: 0, limits: { pages: 3, products: 0, storage: 100 }, features: { customDomain: false, ssl: false, builderAccess: true, htmlCssAccess: false }, allowedTemplates: ['temp-2'], allowedBlocks: ['blk-1'] },
    { id: 'store-pro', name: 'متجر احترافي', price: 500, limits: { pages: 20, products: 1000, storage: 5000 }, features: { customDomain: true, ssl: true, builderAccess: true, htmlCssAccess: true }, allowedTemplates: 'all', allowedBlocks: 'all' }
];

const INITIAL_DOMAINS: DomainRequest[] = [
    { id: 'dom-1', storeId: 'store-123', storeName: 'متجر الأمل', domain: 'alamal.com', status: 'pending', ssl: false, dnsVerified: false, requestedAt: new Date().toISOString() }
];

const INITIAL_MEDIA: GlobalMediaItem[] = [
    { id: 'img-1', name: 'Banner Default', url: 'https://placehold.co/800x400', type: 'image', accessLevel: 'free' },
    { id: 'icon-1', name: 'Star Icon', url: 'https://placehold.co/64x64', type: 'icon', accessLevel: 'premium' }
];

const TABS = [
    { id: 'templates', label: 'القوالب', icon: <LayoutIcon /> },
    { id: 'units', label: 'الوحدات (Blocks)', icon: <CubeIcon /> },
    { id: 'plans', label: 'الباقات', icon: <BriefcaseIcon /> },
    { id: 'domains', label: 'الدومينات', icon: <GlobeAltIcon /> },
    { id: 'media', label: 'الوسائط', icon: <PhotoIcon /> },
    { id: 'seo', label: 'SEO', icon: <SparklesIcon /> },
    { id: 'audit', label: 'السجل', icon: <ClipboardListIcon /> },
];

const SuperAdminWebsiteBuilder: React.FC<SuperAdminWebsiteBuilderProps> = ({ 
    stores, setStores, aiSettings, 
    initialTemplates, initialBlocks, onUpdateTemplates, onUpdateBlocks 
}) => {
    const [activeTab, setActiveTab] = useState('templates');
    
    // Shared Data States
    const [templates, setTemplates] = useState<WebTemplate[]>(initialTemplates);
    const [blocks, setBlocks] = useState<BlockDefinition[]>(initialBlocks);
    
    // Local Data States
    const [plans, setPlans] = useState<BuilderPlan[]>(INITIAL_PLANS);
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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">إدارة منشئ المواقع</h2>
                <div className="flex gap-2">
                    {activeTab === 'templates' && <button onClick={() => { setEditingTemplate({}); setIsTemplateModalOpen(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center gap-2"><PlusIcon /> إضافة قالب</button>}
                    {activeTab === 'units' && <button onClick={() => { setEditingBlock({}); setIsBlockModalOpen(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center gap-2"><PlusIcon /> إضافة وحدة</button>}
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

                {/* Placeholder Views for other tabs */}
                {['plans', 'domains', 'media', 'seo', 'audit'].includes(activeTab) && (
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

        </div>
    );
};

export default SuperAdminWebsiteBuilder;
