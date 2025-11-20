
import React, { useState, useEffect, useRef } from 'react';
import type { Website, WebPage, WebBlock, Store, BlockDefinition } from '../../types';
import { TrashIcon, PlusIcon, EyeIcon, CheckCircleIcon, LayoutIcon, CogIcon, ChartPieIcon, StoreIcon, ClipboardListIcon, PhotoIcon, XMarkIcon } from '../icons/Icons';
import { SUBSCRIPTION_PLANS } from '../../data/subscriptionPlans';
import UpgradeModal from '../UpgradeModal';

interface SiteEditorProps {
    website: Website;
    store: Store;
    availableBlocks: BlockDefinition[];
    onSave: (updatedWebsite: Website) => void;
    onCancel: () => void;
}

const SiteEditor: React.FC<SiteEditorProps> = ({ website, store, availableBlocks, onSave, onCancel }) => {
    // --- History Management ---
    const [history, setHistory] = useState<Website[]>([]);
    const [future, setFuture] = useState<Website[]>([]);
    const [currentSite, setCurrentSite] = useState<Website>(website);

    // --- Editor State ---
    const [activePageId, setActivePageId] = useState<string>(website.pages[0].id);
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
    const [previewMode, setPreviewMode] = useState(false);
    const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
    const [isSaving, setIsSaving] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    // --- Drag & Drop State ---
    const [draggedBlockIndex, setDraggedBlockIndex] = useState<number | null>(null);

    const activePage = currentSite.pages.find(p => p.id === activePageId)!;
    const currentPlan = SUBSCRIPTION_PLANS[store.plan] || SUBSCRIPTION_PLANS.free;

    // --- Actions ---

    const pushToHistory = (newSite: Website) => {
        setHistory(prev => [...prev, currentSite]);
        setFuture([]); // Clear future on new change
        setCurrentSite(newSite);
    };

    const undo = () => {
        if (history.length === 0) return;
        const previous = history[history.length - 1];
        const newHistory = history.slice(0, -1);
        setFuture(prev => [currentSite, ...prev]);
        setCurrentSite(previous);
        setHistory(newHistory);
    };

    const redo = () => {
        if (future.length === 0) return;
        const next = future[0];
        const newFuture = future.slice(1);
        setHistory(prev => [...prev, currentSite]);
        setCurrentSite(next);
        setFuture(newFuture);
    };

    const updateBlock = (blockId: string, updates: { content?: any, style?: any }) => {
        const newSite = {
            ...currentSite,
            pages: currentSite.pages.map(p => 
                p.id === activePageId 
                ? { 
                    ...p, 
                    blocks: p.blocks.map(b => 
                        b.id === blockId 
                        ? { 
                            ...b, 
                            content: updates.content ? { ...b.content, ...updates.content } : b.content,
                            style: updates.style ? { ...b.style, ...updates.style } : b.style
                          } 
                        : b
                    ) 
                  }
                : p
            )
        };
        pushToHistory(newSite);
    };

    const addBlock = (definition: BlockDefinition) => {
        // Check Premium Access
        if (definition.isPremium && !currentPlan.features.premiumBlocks) {
            setShowUpgradeModal(true);
            return;
        }

        const newBlock: WebBlock = {
            id: `blk-${Date.now()}`,
            type: definition.type,
            category: definition.category,
            isPremium: definition.isPremium,
            content: JSON.parse(JSON.stringify(definition.defaultContent)), // Deep copy
            style: JSON.parse(JSON.stringify(definition.defaultStyle))
        };
        const newSite = {
            ...currentSite,
            pages: currentSite.pages.map(p => 
                p.id === activePageId ? { ...p, blocks: [...p.blocks, newBlock] } : p
            )
        };
        pushToHistory(newSite);
        setSelectedBlockId(newBlock.id);
    };

    const removeBlock = (blockId: string) => {
        const newSite = {
            ...currentSite,
            pages: currentSite.pages.map(p => 
                p.id === activePageId ? { ...p, blocks: p.blocks.filter(b => b.id !== blockId) } : p
            )
        };
        pushToHistory(newSite);
        setSelectedBlockId(null);
    };

    const reorderBlocks = (fromIndex: number, toIndex: number) => {
        if (fromIndex === toIndex) return;
        const blocks = [...activePage.blocks];
        const [movedBlock] = blocks.splice(fromIndex, 1);
        blocks.splice(toIndex, 0, movedBlock);

        const newSite = {
            ...currentSite,
            pages: currentSite.pages.map(p => 
                p.id === activePageId ? { ...p, blocks } : p
            )
        };
        pushToHistory(newSite);
    };

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            onSave(currentSite);
            setIsSaving(false);
        }, 800);
    };

    // --- Drag Handlers ---
    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedBlockIndex(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedBlockIndex !== null) {
            reorderBlocks(draggedBlockIndex, index);
            setDraggedBlockIndex(null);
        }
    };

    // --- Helper: Smart Input Renderer ---
    const renderInputControl = (key: string, value: any, onChange: (val: any) => void, level = 0) => {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        
        // 1. Boolean
        if (typeof value === 'boolean') {
            return (
                <div className="flex items-center justify-between py-2" key={key}>
                    <label className="text-xs font-medium text-gray-700 capitalize">{label}</label>
                    <input 
                        type="checkbox" 
                        checked={value} 
                        onChange={e => onChange(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                </div>
            );
        }

        // 2. Image URL
        if (key.toLowerCase().includes('image') || key.toLowerCase().includes('url') || key.toLowerCase().includes('src') || key.toLowerCase().includes('thumbnail')) {
            return (
                <div className="mb-3" key={key}>
                    <label className="block text-xs font-medium text-gray-700 mb-1 capitalize">{label}</label>
                    <div className="flex gap-2 items-center">
                        {value && typeof value === 'string' && (
                             <div className="w-10 h-10 flex-shrink-0 border rounded overflow-hidden bg-gray-100">
                                 <img src={value} alt="" className="w-full h-full object-cover" />
                             </div>
                        )}
                        <div className="relative flex-1">
                            <input 
                                type="text" 
                                value={value} 
                                onChange={e => onChange(e.target.value)}
                                className="w-full p-2 pl-8 border rounded text-xs bg-gray-50 focus:ring-1 focus:ring-indigo-500"
                                placeholder="https://..."
                            />
                            <span className="absolute left-2 top-2 text-gray-400"><PhotoIcon /></span>
                        </div>
                    </div>
                </div>
            );
        }

        // 3. Long Text
        if (key.toLowerCase().includes('text') || key.toLowerCase().includes('desc') || key.toLowerCase().includes('message') || key.toLowerCase().includes('copyright')) {
            return (
                <div className="mb-3" key={key}>
                    <label className="block text-xs font-medium text-gray-700 mb-1 capitalize">{label}</label>
                    <textarea 
                        value={value} 
                        onChange={e => onChange(e.target.value)}
                        className="w-full p-2 border rounded text-xs h-20 bg-gray-50 focus:ring-1 focus:ring-indigo-500"
                    />
                </div>
            );
        }

        // 4. Number
        if (typeof value === 'number') {
             return (
                <div className="mb-3" key={key}>
                    <label className="block text-xs font-medium text-gray-700 mb-1 capitalize">{label}</label>
                    <input 
                        type="number" 
                        value={value} 
                        onChange={e => onChange(parseFloat(e.target.value))}
                        className="w-full p-2 border rounded text-xs bg-gray-50 focus:ring-1 focus:ring-indigo-500"
                    />
                </div>
            );
        }

        // 5. Default String
        return (
            <div className="mb-3" key={key}>
                <label className="block text-xs font-medium text-gray-700 mb-1 capitalize">{label}</label>
                <input 
                    type="text" 
                    value={value} 
                    onChange={e => onChange(e.target.value)}
                    className="w-full p-2 border rounded text-xs bg-gray-50 focus:ring-1 focus:ring-indigo-500"
                />
            </div>
        );
    };

    const renderArrayControl = (key: string, array: any[], onChange: (newArray: any[]) => void) => {
        const addItem = () => {
            // Clone the structure of the first item or create an empty object/string
            let newItem;
            if (array.length > 0) {
                const template = array[0];
                if (typeof template === 'object') {
                     newItem = Object.keys(template).reduce((acc, k) => ({...acc, [k]: typeof template[k] === 'string' ? 'New Item' : ''}), {});
                } else {
                    newItem = "New Item";
                }
            } else {
                 // Heuristic guess if array is empty
                 if (key === 'images') newItem = "https://placehold.co/600x400";
                 else newItem = { title: "New Item", text: "Description" };
            }
            onChange([...array, newItem]);
        };

        const removeItem = (idx: number) => {
            const newArr = array.filter((_, i) => i !== idx);
            onChange(newArr);
        };

        const updateItem = (idx: number, newVal: any) => {
            const newArr = [...array];
            newArr[idx] = newVal;
            onChange(newArr);
        };

        return (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200" key={key}>
                <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-gray-700 uppercase">{key}</label>
                    <button onClick={addItem} className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-200 flex items-center gap-1">
                        <PlusIcon /> إضافة
                    </button>
                </div>
                <div className="space-y-2">
                    {array.map((item, idx) => (
                        <div key={idx} className="relative p-2 bg-white border rounded-md group">
                            <button 
                                onClick={() => removeItem(idx)}
                                className="absolute top-2 left-2 text-red-400 hover:text-red-600 z-10"
                            >
                                <XMarkIcon />
                            </button>
                            
                            {typeof item === 'object' ? (
                                <div className="pt-4 pl-6">
                                    {Object.keys(item).map(subKey => 
                                        renderInputControl(subKey, item[subKey], (val) => updateItem(idx, { ...item, [subKey]: val }))
                                    )}
                                </div>
                            ) : (
                                <div className="pl-6">
                                    {renderInputControl(`Item ${idx+1}`, item, (val) => updateItem(idx, val))}
                                </div>
                            )}
                        </div>
                    ))}
                    {array.length === 0 && <p className="text-xs text-center text-gray-400 py-2">لا توجد عناصر.</p>}
                </div>
            </div>
        );
    };

    // --- Renderers ---
    const renderBlockPreview = (block: WebBlock, index: number) => {
        const isSelected = selectedBlockId === block.id;
        
        // Default styles + Block specific styles
        const blockStyle = {
            backgroundColor: block.style?.backgroundColor || '#ffffff',
            padding: block.style?.padding || '2rem',
            textAlign: block.style?.textAlign || 'center',
            color: block.style?.color || '#1f2937',
            ...block.style
        };

        return (
            <div 
                key={block.id}
                draggable={!previewMode}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onClick={(e) => { e.stopPropagation(); if (!previewMode) setSelectedBlockId(block.id); }} 
                className={`relative transition-all duration-200 ${
                    !previewMode 
                        ? `cursor-pointer hover:ring-2 hover:ring-indigo-200 border border-dashed border-transparent hover:border-indigo-300 ${isSelected ? 'ring-2 ring-indigo-500 z-10' : ''}`
                        : ''
                } ${draggedBlockIndex === index ? 'opacity-50 bg-gray-100' : ''}`}
                style={blockStyle}
            >
                {/* Edit Controls Overlay */}
                {isSelected && !previewMode && (
                    <div className="absolute -top-3 right-2 flex gap-1 bg-indigo-600 text-white shadow-lg rounded-md p-1 z-20 text-xs">
                        <span className="px-2 py-1 font-bold cursor-move">✥ نقل</span>
                        <button onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }} className="px-2 py-1 hover:bg-indigo-700 rounded bg-red-500">
                            <TrashIcon />
                        </button>
                    </div>
                )}

                {/* Content Rendering - DYNAMIC based on Type String */}
                {block.type === 'hero' ? (
                    <div className="space-y-4">
                        <h2 className="text-4xl font-bold leading-tight">{block.content.title}</h2>
                        <p className="text-xl opacity-90">{block.content.subtitle}</p>
                        <button className="bg-white text-gray-900 px-8 py-3 rounded-full font-bold shadow-sm inline-block mt-4">
                            {block.content.buttonText}
                        </button>
                    </div>
                ) : block.type === 'text' ? (
                    <div className="prose max-w-none mx-auto">
                        <p>{block.content.text}</p>
                    </div>
                ) : block.type === 'product_grid' ? (
                    <div className="w-full">
                        <h3 className="text-2xl font-bold mb-6">{block.content.title}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
                            {[1,2,3,4].slice(0, block.content.limit || 4).map(i => (
                                <div key={i} className="border rounded-xl p-3 bg-white shadow-sm">
                                    <div className="bg-gray-200 h-32 mb-3 rounded-lg"></div>
                                    <div className="h-4 bg-gray-300 w-3/4 mb-2 rounded"></div>
                                    <div className="h-4 bg-gray-200 w-1/2 rounded"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : block.type === 'features' ? (
                    <div>
                         <h3 className="text-2xl font-bold mb-8">{block.content.title}</h3>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[1,2,3].map(i => (
                                <div key={i} className="p-4 border rounded-xl bg-white/50">
                                    <div className="w-12 h-12 bg-indigo-100 rounded-full mx-auto mb-3 flex items-center justify-center text-indigo-600 font-bold text-xl">{i}</div>
                                    <h4 className="font-bold text-lg mb-1">عنوان الميزة</h4>
                                    <p className="text-sm opacity-70">شرح بسيط للميزة هنا.</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : block.type === 'contact_form' ? (
                    <div className="max-w-md mx-auto p-6 border rounded-xl bg-white shadow-sm">
                        <h3 className="text-xl font-bold mb-4">{block.content.title}</h3>
                        <div className="space-y-3 text-left">
                            <div className="h-10 border rounded bg-gray-50 w-full"></div>
                            <div className="h-10 border rounded bg-gray-50 w-full"></div>
                            <div className="h-24 border rounded bg-gray-50 w-full"></div>
                            <div className="h-10 bg-indigo-600 rounded w-full"></div>
                        </div>
                    </div>
                ) : block.type === 'image_carousel' ? (
                    <div>
                        <h3 className="text-xl font-bold mb-4">{block.content.title}</h3>
                        <div className="flex gap-2 overflow-hidden">
                            {(block.content.images || []).map((src: string, i: number) => (
                                <div key={i} className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center border text-gray-400">
                                    <img src={src} alt={`slide ${i}`} className="w-full h-full object-cover rounded-lg" />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : block.type === 'video' ? (
                    <div className="max-w-2xl mx-auto">
                        <h3 className="text-xl font-bold mb-4">{block.content.title}</h3>
                        <div className="aspect-w-16 aspect-h-9 bg-black rounded-xl flex items-center justify-center text-white">
                             <img src={`https://img.youtube.com/vi/${block.content.videoUrl?.split('/').pop()}/0.jpg`} className="w-full h-full object-cover opacity-50" />
                             <span className="absolute">▶ Play</span>
                        </div>
                    </div>
                ) : block.type === 'testimonials' ? (
                    <div>
                        <h3 className="text-2xl font-bold mb-8">{block.content.title}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {(block.content.items || []).map((item: any, i: number) => (
                                <div key={i} className="p-6 border rounded-xl bg-white shadow-sm text-center">
                                    <p className="italic text-gray-600 mb-4">"{item.text}"</p>
                                    <h4 className="font-bold text-gray-800">{item.name}</h4>
                                    <p className="text-xs text-indigo-500">{item.role}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : block.type === 'faq' ? (
                    <div className="max-w-2xl mx-auto">
                        <h3 className="text-2xl font-bold mb-6">{block.content.title}</h3>
                        <div className="space-y-3">
                            {(block.content.items || []).map((item: any, i: number) => (
                                <div key={i} className="border rounded-lg p-3 bg-white text-right">
                                    <div className="font-bold text-gray-800 flex justify-between">
                                        <span>{item.q}</span>
                                        <span>▼</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : block.type === 'cta' ? (
                    <div className="bg-indigo-600 text-white p-10 rounded-2xl text-center">
                        <h2 className="text-3xl font-bold mb-2">{block.content.title}</h2>
                        <p className="text-indigo-100 mb-6">{block.content.subtitle}</p>
                        <button className="bg-white text-indigo-600 px-6 py-3 rounded-full font-bold shadow-md">
                            {block.content.buttonText}
                        </button>
                    </div>
                ) : block.type === 'footer' ? (
                    <div className="bg-gray-900 text-white p-8 mt-4">
                        <div className="grid grid-cols-3 gap-8 mb-8 text-right">
                            {(block.content.columns || []).map((col: any, i: number) => (
                                <div key={i}>
                                    <h4 className="font-bold mb-4 text-gray-300">{col.title}</h4>
                                    <ul className="space-y-2 text-sm text-gray-400">
                                        {(col.links || []).map((link: string, j: number) => (
                                            <li key={j}>{link}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                        <div className="text-center text-xs text-gray-500 border-t border-gray-800 pt-4">
                            {block.content.copyright}
                        </div>
                    </div>
                ) : (
                    // Fallback for unknown block types (e.g. Custom AI Blocks)
                    <div className="border p-4 rounded text-center">
                         <h3 className="font-bold text-lg">{block.content.title || block.type}</h3>
                         <div className="text-xs text-gray-500 mt-2 overflow-hidden text-left">
                             <pre>{JSON.stringify(block.content, null, 2)}</pre>
                         </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100 fixed inset-0 z-50 font-sans" dir="rtl">
            
            <UpgradeModal 
                isOpen={showUpgradeModal} 
                onClose={() => setShowUpgradeModal(false)}
                title="عنصر مميز (Premium)"
                message="هذا العنصر متاح فقط في الباقات المتقدمة. قم بترقية اشتراكك لاستخدامه."
            />

            {/* 1. Top Header Toolbar */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center shadow-sm z-40">
                <div className="flex items-center gap-4">
                    <button onClick={onCancel} className="text-gray-500 hover:text-gray-800 font-medium">✕ خروج</button>
                    <div className="h-6 w-px bg-gray-300 mx-2"></div>
                    
                    {/* Page Selector */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 uppercase font-bold">الصفحة:</span>
                        <select 
                            value={activePageId} 
                            onChange={e => setActivePageId(e.target.value)} 
                            className="text-sm border-none bg-gray-100 rounded-md px-2 py-1 focus:ring-0 cursor-pointer hover:bg-gray-200"
                        >
                            {currentSite.pages.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                        </select>
                    </div>
                </div>

                {/* Center Controls */}
                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                    <button onClick={undo} disabled={history.length === 0} className="p-2 text-gray-600 hover:bg-white hover:shadow rounded-md disabled:opacity-30 transition" title="تراجع">
                        <svg className="w-4 h-4 transform scale-x-[-1]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                    </button>
                    <button onClick={redo} disabled={future.length === 0} className="p-2 text-gray-600 hover:bg-white hover:shadow rounded-md disabled:opacity-30 transition" title="إعادة">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                    </button>
                    <div className="w-px h-4 bg-gray-300 mx-1"></div>
                    <button onClick={() => setDeviceMode('desktop')} className={`p-2 rounded-md transition ${deviceMode === 'desktop' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-800'}`} title="كمبيوتر">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </button>
                    <button onClick={() => setDeviceMode('mobile')} className={`p-2 rounded-md transition ${deviceMode === 'mobile' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-800'}`} title="موبايل">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    </button>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => { setPreviewMode(!previewMode); setSelectedBlockId(null); }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${previewMode ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <EyeIcon /> {previewMode ? 'وضع التعديل' : 'معاينة'}
                    </button>
                    <button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition shadow flex items-center gap-2 disabled:bg-gray-400"
                    >
                        {isSaving ? 'جاري الحفظ...' : <><CheckCircleIcon /> نشر التغييرات</>}
                    </button>
                </div>
            </div>

            {/* 2. Main Workspace */}
            <div className="flex-1 flex overflow-hidden">
                
                {/* Left Sidebar: Block Library (Hidden in Preview Mode) */}
                {!previewMode && (
                    <div className="w-64 bg-white border-l border-gray-200 flex flex-col shadow-inner z-30">
                        <div className="p-4 border-b bg-gray-50">
                            <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                <PlusIcon /> مكتبة العناصر
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            <p className="text-xs text-gray-500 mb-2">اضغط لإضافة عنصر للصفحة</p>
                            {availableBlocks.map((item) => {
                                const isLocked = item.isPremium && !currentPlan.features.premiumBlocks;
                                return (
                                <button 
                                    key={item.id}
                                    onClick={() => addBlock(item)}
                                    className={`w-full flex items-center justify-between p-3 border rounded-lg transition text-right group relative ${isLocked ? 'bg-gray-50 border-gray-200 opacity-70' : 'bg-white border-gray-200 hover:border-indigo-500 hover:shadow-md'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl group-hover:scale-110 transition">{item.icon}</span>
                                        <span className="text-sm font-medium text-gray-700">{item.label}</span>
                                    </div>
                                    {isLocked && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full flex items-center gap-1">🔒</span>}
                                </button>
                            )})}
                        </div>
                    </div>
                )}

                {/* Center Canvas Area */}
                <div className="flex-1 bg-gray-100 overflow-y-auto p-8 flex justify-center relative" onClick={() => setSelectedBlockId(null)}>
                    <div 
                        className={`bg-white shadow-2xl transition-all duration-500 ease-in-out flex flex-col ${
                            deviceMode === 'mobile' ? 'w-[375px] min-h-[667px] rounded-[30px] border-[8px] border-gray-800 my-auto' : 'w-full max-w-5xl min-h-[800px] rounded-lg'
                        }`}
                    >
                        {/* Fake Browser Header for Desktop */}
                        {deviceMode === 'desktop' && (
                            <div className="bg-gray-50 border-b px-4 py-2 flex gap-2 items-center rounded-t-lg">
                                <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                                </div>
                                <div className="flex-1 bg-white border rounded-md px-3 py-0.5 text-xs text-center text-gray-400 font-mono mx-8 truncate">
                                    {currentSite.subdomain}.nebras.app
                                </div>
                            </div>
                        )}

                        {/* Content Canvas */}
                        <div className="flex-1 relative">
                            {activePage.blocks.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 p-10 border-2 border-dashed border-gray-200 m-4 rounded-xl">
                                    <LayoutIcon />
                                    <p className="mt-2">الصفحة فارغة.</p>
                                    <p className="text-sm">اختر عناصر من القائمة اليمنى لإضافتها.</p>
                                </div>
                            ) : (
                                activePage.blocks.map((block, index) => renderBlockPreview(block, index))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Sidebar: Properties Panel (Only visible when block selected & not preview) */}
                {!previewMode && selectedBlockId && (
                    <div className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-xl z-30 animate-slide-in-right">
                        <div className="p-4 border-b bg-indigo-50 flex justify-between items-center">
                            <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                                <CogIcon /> خصائص العنصر
                            </h3>
                            <button onClick={() => setSelectedBlockId(null)} className="text-indigo-400 hover:text-indigo-700 text-sm">إغلاق</button>
                        </div>
                        
                        {(() => {
                            const block = activePage.blocks.find(b => b.id === selectedBlockId);
                            if (!block) return null;
                            return (
                                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                                    {/* Content Section */}
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-1">المحتوى</h4>
                                        {Object.keys(block.content).map(key => {
                                            // Array Handling (Nested Lists)
                                            if (Array.isArray(block.content[key])) {
                                                return (
                                                    <div key={key}>
                                                        {renderArrayControl(key, block.content[key], (newArr) => updateBlock(block.id, { content: { [key]: newArr } }))}
                                                    </div>
                                                );
                                            }
                                            
                                            // Primitive Values
                                            return (
                                                <div key={key}>
                                                    {renderInputControl(key, block.content[key], (val) => updateBlock(block.id, { content: { [key]: val } }))}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Design Section */}
                                    <div className="space-y-3 pt-4 border-t">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-1">التصميم</h4>
                                        
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-1">لون الخلفية</label>
                                            <div className="flex gap-2 items-center">
                                                <input 
                                                    type="color" 
                                                    value={block.style?.backgroundColor || '#ffffff'} 
                                                    onChange={e => updateBlock(block.id, { style: { backgroundColor: e.target.value } })}
                                                    className="h-8 w-8 rounded cursor-pointer border-none p-0"
                                                />
                                                <span className="text-xs text-gray-500 font-mono">{block.style?.backgroundColor || '#ffffff'}</span>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-1">لون النص</label>
                                            <div className="flex gap-2 items-center">
                                                <input 
                                                    type="color" 
                                                    value={block.style?.color || '#000000'} 
                                                    onChange={e => updateBlock(block.id, { style: { color: e.target.value } })}
                                                    className="h-8 w-8 rounded cursor-pointer border-none p-0"
                                                />
                                                 <span className="text-xs text-gray-500 font-mono">{block.style?.color || '#000000'}</span>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-1">محاذاة النص</label>
                                            <div className="flex bg-gray-100 rounded p-1">
                                                {['left', 'center', 'right'].map(align => (
                                                    <button 
                                                        key={align}
                                                        onClick={() => updateBlock(block.id, { style: { textAlign: align } })}
                                                        className={`flex-1 py-1 rounded text-xs capitalize ${block.style?.textAlign === align ? 'bg-white shadow text-indigo-600 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                                                    >
                                                        {align === 'right' ? 'يمين' : align === 'center' ? 'وسط' : 'يسار'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-1">الهوامش الداخلية (Padding)</label>
                                            <select 
                                                value={block.style?.padding || '2rem'} 
                                                onChange={e => updateBlock(block.id, { style: { padding: e.target.value } })}
                                                className="w-full p-2 border rounded text-sm bg-white"
                                            >
                                                <option value="0">0</option>
                                                <option value="1rem">صغير (1rem)</option>
                                                <option value="2rem">متوسط (2rem)</option>
                                                <option value="4rem">كبير (4rem)</option>
                                                <option value="6rem">كبير جداً (6rem)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SiteEditor;
