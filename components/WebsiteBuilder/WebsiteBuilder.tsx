
import React, { useState, useMemo } from 'react';
import type { Store, Website, WebTemplate, BlockDefinition, OnlineOrder, Sale, Invoice, InventoryMovement, JournalEntry, Product } from '../../types';
import { GlobeAltIcon, PencilIcon, EyeIcon, PlusIcon, LayoutIcon, CheckCircleIcon, ShoppingCartIcon, CubeIcon, CogIcon, BanknotesIcon, TruckIcon, XMarkIcon, PhotoIcon, ChatBubbleLeftRightIcon } from '../icons/Icons';
import SiteEditor from './SiteEditor';
import { SUBSCRIPTION_PLANS } from '../../data/subscriptionPlans';
import UpgradeModal from '../UpgradeModal';

interface WebsiteBuilderProps {
    store: Store;
    updateStore: (data: Partial<Store>) => void;
    availableTemplates: WebTemplate[];
    availableBlocks: BlockDefinition[];
}

const WebsiteBuilder: React.FC<WebsiteBuilderProps> = ({ store, updateStore, availableTemplates, availableBlocks }) => {
    const [view, setView] = useState<'admin_panel' | 'editor' | 'wizard'>('admin_panel');
    const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'settings'>('overview');
    const [selectedType, setSelectedType] = useState<'store' | 'company' | null>(null);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    
    // --- Product Edit State ---
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [productImageUrl, setProductImageUrl] = useState('');

    // --- Order Processing State ---
    const [processModalOpen, setProcessModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<OnlineOrder | null>(null);
    const [estimatedDelivery, setEstimatedDelivery] = useState('');

    const hasWebsite = !!store.website;
    const currentPlan = SUBSCRIPTION_PLANS[store.plan] || SUBSCRIPTION_PLANS.free;

    // --- Logic for Processing Orders ---
    const openProcessModal = (order: OnlineOrder) => {
        setSelectedOrder(order);
        setEstimatedDelivery('');
        setProcessModalOpen(true);
    };

    const confirmProcessOrder = () => {
        if (!selectedOrder) return;
        const order = selectedOrder;
        const dateNow = new Date().toISOString();
        
        // 1. Create Sales Records & 2. Inventory Movements
        const newSales: Sale[] = [];
        const newMovements: InventoryMovement[] = [];
        let totalCost = 0;

        // Check Stock First
        for (const item of order.items) {
            const product = store.products.find(p => p.id === item.productId);
            if (!product) continue; // Skip if product deleted
            
            // Determine available stock (simple calculation based on initial - sold)
            const soldQty = store.sales.filter(s => s.productId === item.productId).reduce((acc, s) => acc + s.quantity, 0);
            const currentStock = product.initialQuantity - soldQty;

            if (currentStock < item.quantity) {
                alert(`تنبيه: المخزون غير كافٍ للمنتج ${product.name}. الكمية المتاحة: ${currentStock}`);
                return; // Stop processing
            }

            const saleRecord: Sale = {
                invoiceId: `INV-${order.id}`,
                date: dateNow,
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.price,
                customerId: null, // Online customer (could create new customer record here if needed)
                paymentMethod: 'cash', // Assuming COD or Online Payment settled to Cash/Bank
                subtotal: item.quantity * item.price,
                taxRate: store.billingSettings.taxRate,
                taxAmount: (item.quantity * item.price) * (store.billingSettings.taxRate / 100),
                totalAmount: (item.quantity * item.price) * (1 + store.billingSettings.taxRate / 100),
                amountPaid: (item.quantity * item.price) * (1 + store.billingSettings.taxRate / 100),
                remainingBalance: 0,
                isFullyPaid: true
            };
            newSales.push(saleRecord);

            const movement: InventoryMovement = {
                id: `MOV-ORD-${Date.now()}-${Math.random()}`,
                date: dateNow,
                productId: item.productId,
                type: 'sale',
                quantity: -item.quantity,
                referenceId: `INV-${order.id}`,
                notes: `طلب أونلاين #${order.id}`
            };
            newMovements.push(movement);

            totalCost += (product.costPrice * item.quantity);
        }

        // 3. Create Invoice
        const newInvoice: Invoice = {
            id: `INV-${order.id}`,
            sourceId: order.id,
            sourceType: 'sale',
            date: dateNow,
            customerName: order.customerName,
            items: order.items.map(i => ({ description: i.name, quantity: i.quantity, unitPrice: i.price, total: i.quantity * i.price })),
            subtotal: newSales.reduce((a, s) => a + s.subtotal, 0),
            taxRate: store.billingSettings.taxRate,
            taxAmount: newSales.reduce((a, s) => a + s.taxAmount, 0),
            total: newSales.reduce((a, s) => a + s.totalAmount, 0),
            amountPaid: newSales.reduce((a, s) => a + s.totalAmount, 0),
            remainingBalance: 0
        };

        // 4. Create Journal Entry (GL)
        const totalRevenue = newInvoice.total;
        const journalEntry: JournalEntry = {
            id: `JE-ORD-${order.id}`,
            date: dateNow,
            description: `إثبات مبيعات طلب أونلاين #${order.id}`,
            isAutoGenerated: true,
            lines: [
                { accountId: '101', debit: totalRevenue, credit: 0, description: 'تحصيل نقدية (COD)' },
                { accountId: '401', debit: 0, credit: totalRevenue, description: 'إيرادات مبيعات أونلاين' },
                { accountId: '501', debit: totalCost, credit: 0, description: 'تكلفة البضاعة المباعة' },
                { accountId: '103', debit: 0, credit: totalCost, description: 'نقص المخزون' }
            ]
        };

        // 5. Update Order Status to Processing
        const updatedOrders = (store.onlineOrders || []).map(o => 
            o.id === order.id ? { ...o, status: 'processing' as const, estimatedDelivery } : o
        );

        // Commit All Changes
        updateStore({
            sales: [...store.sales, ...newSales],
            inventoryMovements: [...store.inventoryMovements, ...newMovements],
            invoices: [...store.invoices, newInvoice],
            journalEntries: [...store.journalEntries, journalEntry],
            onlineOrders: updatedOrders
        });

        setProcessModalOpen(false);
        setSelectedOrder(null);
        alert('تم اعتماد الطلب بنجاح! الحالة الآن: قيد التجهيز.');
    };

    const updateOrderStatus = (orderId: string, newStatus: 'shipped' | 'delivered') => {
        const updatedOrders = (store.onlineOrders || []).map(o => 
            o.id === orderId ? { ...o, status: newStatus } : o
        );
        updateStore({ onlineOrders: updatedOrders });
    };

    const handleRejectOrder = (order: OnlineOrder) => {
        if(window.confirm('هل أنت متأكد من رفض هذا الطلب؟ سيتم إلغاؤه وتحرير المخزون المحجوز.')) {
            const updatedOrders = (store.onlineOrders || []).map(o => 
                o.id === order.id ? { ...o, status: 'cancelled' as const } : o
            );
            updateStore({ onlineOrders: updatedOrders });
        }
    }

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
        setView('admin_panel');
    };

    // --- Product Management Logic ---
    const toggleProductVisibility = (productId: string) => {
        const updatedProducts = store.products.map(p => 
            p.id === productId ? { ...p, isVisibleOnline: p.isVisibleOnline === false ? true : false } : p
        );
        updateStore({ products: updatedProducts });
    };

    const handleUpdateProduct = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct) return;

        const updatedProducts = store.products.map(p => 
            p.id === editingProduct.id ? editingProduct : p
        );
        updateStore({ products: updatedProducts });
        setEditingProduct(null);
    };

    const handleAddImage = () => {
        if (!productImageUrl || !editingProduct) return;
        const currentImages = editingProduct.images || [];
        setEditingProduct({
            ...editingProduct,
            images: [...currentImages, productImageUrl]
        });
        setProductImageUrl('');
    };

    const handleRemoveImage = (index: number) => {
        if (!editingProduct) return;
        const currentImages = editingProduct.images || [];
        setEditingProduct({
            ...editingProduct,
            images: currentImages.filter((_, i) => i !== index)
        });
    };

    if (view === 'editor' && store.website) {
        return <SiteEditor website={store.website} store={store} availableBlocks={availableBlocks} onSave={(w) => { updateStore({ website: w }); setView('admin_panel'); }} onCancel={() => setView('admin_panel')} />;
    }

    // --- WIZARD VIEW ---
    if (view === 'wizard') {
        return (
            <div className="bg-white p-8 rounded-xl shadow-lg animate-fade-in-up h-full overflow-y-auto">
                <div className="flex items-center gap-4 mb-6 border-b pb-4">
                    <button onClick={() => setView('admin_panel')} className="text-gray-500 hover:text-indigo-600">← عودة</button>
                    <h2 className="text-2xl font-bold text-gray-800">اختر القالب المناسب</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {availableTemplates.filter(t => t.type === selectedType).map(template => {
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
                     {availableTemplates.filter(t => t.type === selectedType).length === 0 && (
                         <p className="text-gray-500 col-span-3 text-center">لا توجد قوالب متاحة لهذا النوع.</p>
                     )}
                </div>
            </div>
        );
    }

    // --- NO WEBSITE STATE ---
    if (!hasWebsite && view === 'admin_panel') {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] space-y-8 text-center">
                <UpgradeModal 
                    isOpen={showUpgradeModal} 
                    onClose={() => setShowUpgradeModal(false)} 
                    title="قالب احترافي (Premium)"
                    message="هذا القالب متاح فقط للمشتركين في الباقات المتقدمة. قم بالترقية للحصول عليه."
                />
                <div className="max-w-md">
                    <div className="inline-block p-6 bg-indigo-50 rounded-full mb-6">
                        <GlobeAltIcon />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-4">ابدأ تجارتك الإلكترونية الآن</h2>
                    <p className="text-gray-600 mb-8 text-lg">أنشئ متجراً إلكترونياً احترافياً مرتبطاً بنظام المخزون والمحاسبة لديك في دقائق معدودة.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button 
                            onClick={() => handleStartWizard('store')}
                            className="p-6 bg-white border-2 border-indigo-100 rounded-xl hover:border-indigo-500 hover:shadow-lg transition group text-right relative overflow-hidden"
                        >
                            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition">
                                <LayoutIcon />
                            </div>
                            <h3 className="font-bold text-lg mb-1">متجر إلكتروني</h3>
                            <p className="text-sm text-gray-500">بيع منتجات، سلة مشتريات، ودفع إلكتروني.</p>
                        </button>

                        <button 
                            onClick={() => handleStartWizard('company')}
                            className="p-6 bg-white border-2 border-blue-100 rounded-xl hover:border-blue-500 hover:shadow-lg transition group text-right relative overflow-hidden"
                        >
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition">
                                <GlobeAltIcon />
                            </div>
                            <h3 className="font-bold text-lg mb-1">موقع تعريفي</h3>
                            <p className="text-sm text-gray-500">عرض خدمات، معرض أعمال، ومعلومات تواصل.</p>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- ADMIN PANEL (MAIN DASHBOARD) ---
    return (
        <div className="space-y-6 h-full flex flex-col">
            <UpgradeModal 
                isOpen={showUpgradeModal} 
                onClose={() => setShowUpgradeModal(false)} 
            />

            {/* Process Order Modal */}
            {processModalOpen && selectedOrder && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-fade-in-up">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">اعتماد الطلب #{selectedOrder.id}</h3>
                        <p className="text-gray-600 text-sm mb-4">سيتم خصم المخزون وإنشاء الفاتورة. يرجى تحديد وقت التوصيل المتوقع للعميل.</p>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-bold text-gray-700 mb-1">وقت التوصيل المتوقع</label>
                            <input 
                                type="text" 
                                placeholder="مثال: غداً مساءً، خلال يومين..." 
                                value={estimatedDelivery}
                                onChange={(e) => setEstimatedDelivery(e.target.value)}
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button 
                                onClick={confirmProcessOrder}
                                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700 transition"
                            >
                                تأكيد واعتماد
                            </button>
                            <button 
                                onClick={() => setProcessModalOpen(false)}
                                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-bold hover:bg-gray-300 transition"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                        <GlobeAltIcon />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">لوحة تحكم المتجر الإلكتروني</h1>
                        <a href={`#site/${store.id}`} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
                            {store.website?.subdomain}.nebras.app <EyeIcon />
                        </a>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setView('editor')} 
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-sm"
                    >
                        <PencilIcon /> وضع التصميم (Editor)
                    </button>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex border-b bg-white rounded-t-xl shadow-sm overflow-x-auto">
                <button onClick={() => setActiveTab('overview')} className={`px-6 py-3 font-medium transition flex items-center gap-2 ${activeTab === 'overview' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <LayoutIcon /> نظرة عامة
                </button>
                <button onClick={() => setActiveTab('orders')} className={`px-6 py-3 font-medium transition flex items-center gap-2 ${activeTab === 'orders' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <ShoppingCartIcon /> الطلبات {store.onlineOrders && store.onlineOrders.filter(o => o.status === 'new').length > 0 && <span className="bg-red-500 text-white text-xs px-1.5 rounded-full">{store.onlineOrders.filter(o => o.status === 'new').length}</span>}
                </button>
                <button onClick={() => setActiveTab('products')} className={`px-6 py-3 font-medium transition flex items-center gap-2 ${activeTab === 'products' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <CubeIcon /> المنتجات
                </button>
                <button onClick={() => setActiveTab('settings')} className={`px-6 py-3 font-medium transition flex items-center gap-2 ${activeTab === 'settings' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <CogIcon /> الإعدادات
                </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 bg-white rounded-b-xl shadow-lg p-6 overflow-y-auto">
                
                {activeTab === 'overview' && (
                    <div className="space-y-8">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-gray-500 text-sm font-medium">الطلبات الجديدة</span>
                                    <span className="bg-green-100 text-green-700 p-2 rounded-lg"><ShoppingCartIcon /></span>
                                </div>
                                <p className="text-3xl font-bold text-gray-800">{store.onlineOrders ? store.onlineOrders.filter(o => o.status === 'new').length : 0}</p>
                            </div>
                            <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-gray-500 text-sm font-medium">إجمالي مبيعات الأونلاين</span>
                                    <span className="bg-blue-100 text-blue-700 p-2 rounded-lg"><BanknotesIcon /></span>
                                </div>
                                <p className="text-3xl font-bold text-gray-800">
                                    {store.onlineOrders ? store.onlineOrders.filter(o => o.status === 'delivered').reduce((acc, o) => acc + o.totalAmount, 0).toLocaleString() : 0} <span className="text-sm font-normal">ج.م</span>
                                </p>
                            </div>
                            <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-gray-500 text-sm font-medium">الزيارات (شهرية)</span>
                                    <span className="bg-purple-100 text-purple-700 p-2 rounded-lg"><EyeIcon /></span>
                                </div>
                                <p className="text-3xl font-bold text-gray-800">1,240 <span className="text-xs text-gray-400 font-normal">/ {currentPlan.limits.visits.toLocaleString()}</span></p>
                            </div>
                        </div>

                        {/* Recent Activity Table */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 mb-4">آخر الطلبات الواردة</h3>
                            <div className="border rounded-xl overflow-hidden">
                                <table className="w-full text-right text-sm">
                                    <thead className="bg-gray-50 text-gray-600">
                                        <tr>
                                            <th className="p-3 font-medium">رقم الطلب</th>
                                            <th className="p-3 font-medium">العميل</th>
                                            <th className="p-3 font-medium">الحالة</th>
                                            <th className="p-3 font-medium">القيمة</th>
                                            <th className="p-3 font-medium">التاريخ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(store.onlineOrders || []).slice(-5).reverse().map(order => (
                                            <tr key={order.id} className="border-t hover:bg-gray-50">
                                                <td className="p-3 font-mono">{order.id}</td>
                                                <td className="p-3">{order.customerName}</td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${order.status === 'new' ? 'bg-green-100 text-green-700' : order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                                        {order.status === 'new' ? 'جديد' : order.status === 'cancelled' ? 'ملغي' : order.status}
                                                    </span>
                                                </td>
                                                <td className="p-3 font-bold">{order.totalAmount.toLocaleString()} ج.م</td>
                                                <td className="p-3 text-gray-500">{new Date(order.date).toLocaleDateString('ar-EG')}</td>
                                            </tr>
                                        ))}
                                        {(!store.onlineOrders || store.onlineOrders.length === 0) && (
                                            <tr><td colSpan={5} className="text-center p-4 text-gray-500">لا توجد طلبات حتى الآن.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">إدارة الطلبات</h2>
                            <div className="text-sm text-gray-500">متابعة حالات الطلبات والتوصيل.</div>
                        </div>
                        
                        <div className="border rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-right">
                                <thead className="bg-gray-100 text-gray-700">
                                    <tr>
                                        <th className="p-4">الطلب</th>
                                        <th className="p-4">العميل / التوصيل</th>
                                        <th className="p-4">المنتجات</th>
                                        <th className="p-4">الحالة / المتوقع</th>
                                        <th className="p-4">تواصل</th>
                                        <th className="p-4">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {(store.onlineOrders || []).slice().reverse().map(order => (
                                        <tr key={order.id} className="hover:bg-gray-50">
                                            <td className="p-4 align-top">
                                                <div className="font-mono font-bold text-gray-800">{order.id}</div>
                                                <div className="text-xs text-gray-500 mt-1">{new Date(order.date).toLocaleDateString('ar-EG')}</div>
                                                <div className="text-xs font-bold text-indigo-600 mt-1">{order.totalAmount.toLocaleString()} ج.م</div>
                                            </td>
                                            <td className="p-4 align-top">
                                                <div className="font-bold">{order.customerName}</div>
                                                <div className="text-sm text-gray-600">{order.customerPhone}</div>
                                                <div className="text-xs text-gray-500 mt-1">{order.address}</div>
                                            </td>
                                            <td className="p-4 align-top">
                                                <ul className="text-sm space-y-1">
                                                    {order.items.map((item, idx) => (
                                                        <li key={idx} className="flex justify-between gap-4">
                                                            <span>{item.quantity}x {item.name}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </td>
                                            <td className="p-4 align-top">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block mb-2 ${
                                                    order.status === 'new' ? 'bg-green-100 text-green-700' : 
                                                    order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                                                    order.status === 'shipped' ? 'bg-purple-100 text-purple-700' :
                                                    order.status === 'delivered' ? 'bg-gray-200 text-gray-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                    {order.status === 'new' ? 'جديد' : 
                                                     order.status === 'processing' ? 'قيد التجهيز' :
                                                     order.status === 'shipped' ? 'تم الشحن' :
                                                     order.status === 'delivered' ? 'تم التسليم' : 'ملغي'}
                                                </span>
                                                {order.estimatedDelivery && (
                                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                                        <TruckIcon /> {order.estimatedDelivery}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4 align-top">
                                                <div className="flex gap-2">
                                                    <a 
                                                        href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}`} 
                                                        target="_blank" 
                                                        rel="noreferrer" 
                                                        className="p-2 bg-green-50 text-green-600 rounded hover:bg-green-100 transition"
                                                        title="واتساب"
                                                    >
                                                        <ChatBubbleLeftRightIcon />
                                                    </a>
                                                </div>
                                            </td>
                                            <td className="p-4 align-top">
                                                <div className="flex flex-col gap-2">
                                                    {order.status === 'new' && (
                                                        <button 
                                                            onClick={() => openProcessModal(order)}
                                                            className="bg-indigo-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-indigo-700 shadow-sm flex items-center gap-1 justify-center"
                                                        >
                                                            <CheckCircleIcon /> اعتماد
                                                        </button>
                                                    )}
                                                    
                                                    {order.status === 'processing' && (
                                                        <button 
                                                            onClick={() => updateOrderStatus(order.id, 'shipped')}
                                                            className="bg-purple-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-purple-700 shadow-sm flex items-center gap-1 justify-center"
                                                        >
                                                            <TruckIcon /> تم الشحن
                                                        </button>
                                                    )}

                                                    {order.status === 'shipped' && (
                                                        <button 
                                                            onClick={() => updateOrderStatus(order.id, 'delivered')}
                                                            className="bg-gray-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-gray-700 shadow-sm flex items-center gap-1 justify-center"
                                                        >
                                                            <CheckCircleIcon /> تم التسليم
                                                        </button>
                                                    )}

                                                    {order.status !== 'delivered' && order.status !== 'cancelled' && (
                                                        <button 
                                                            onClick={() => handleRejectOrder(order)}
                                                            className="bg-white border border-red-200 text-red-600 px-3 py-1.5 rounded text-xs font-bold hover:bg-red-50 shadow-sm flex items-center gap-1 justify-center"
                                                        >
                                                            <XMarkIcon /> {order.status === 'new' ? 'رفض' : 'إلغاء'}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!store.onlineOrders || store.onlineOrders.length === 0) && (
                                        <tr><td colSpan={6} className="text-center p-10 text-gray-500">لا توجد طلبات في الوقت الحالي.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'products' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">منتجات المتجر</h2>
                                <p className="text-sm text-gray-500 mt-1">تحكم في ظهور المنتجات وإضافة الصور لعرضها في الموقع.</p>
                            </div>
                        </div>
                        
                        {editingProduct && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                                <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-2xl">
                                    <div className="flex justify-between items-center mb-6 border-b pb-3">
                                        <h3 className="text-xl font-bold text-indigo-800">تعديل منتج: {editingProduct.name}</h3>
                                        <button onClick={() => setEditingProduct(null)} className="text-gray-400 hover:text-red-600 text-2xl">&times;</button>
                                    </div>
                                    <form onSubmit={handleUpdateProduct} className="space-y-4">
                                        <div className="bg-gray-50 p-4 rounded-lg border">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={editingProduct.isVisibleOnline !== false} 
                                                    onChange={e => setEditingProduct({...editingProduct, isVisibleOnline: e.target.checked})} 
                                                    className="w-5 h-5 text-indigo-600" 
                                                />
                                                <span className="font-bold text-gray-700">عرض في المتجر الإلكتروني</span>
                                            </label>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">وصف المنتج (للموقع)</label>
                                            <textarea 
                                                className="w-full p-3 border rounded-lg h-24" 
                                                placeholder="وصف تفصيلي يظهر للعملاء..."
                                                value={editingProduct.description || ''}
                                                onChange={e => setEditingProduct({...editingProduct, description: e.target.value})}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">صور المنتج</label>
                                            <div className="flex gap-2 mb-3">
                                                <input 
                                                    type="text" 
                                                    placeholder="رابط الصورة (URL)..." 
                                                    className="flex-1 p-2 border rounded" 
                                                    value={productImageUrl}
                                                    onChange={e => setProductImageUrl(e.target.value)}
                                                />
                                                <button 
                                                    type="button" 
                                                    onClick={handleAddImage}
                                                    className="bg-blue-100 text-blue-700 px-4 py-2 rounded hover:bg-blue-200"
                                                >
                                                    + إضافة
                                                </button>
                                            </div>
                                            <div className="flex gap-3 overflow-x-auto py-2">
                                                {(editingProduct.images || []).map((img, idx) => (
                                                    <div key={idx} className="relative w-24 h-24 flex-shrink-0 border rounded bg-gray-100 group">
                                                        <img src={img} alt="" className="w-full h-full object-cover rounded" />
                                                        <button 
                                                            type="button"
                                                            onClick={() => handleRemoveImage(idx)}
                                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
                                                        >
                                                            &times;
                                                        </button>
                                                    </div>
                                                ))}
                                                {(!editingProduct.images || editingProduct.images.length === 0) && (
                                                    <div className="text-sm text-gray-400 p-2">لا توجد صور مضافة.</div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex justify-end pt-4 border-t">
                                            <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700">حفظ التعديلات</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        <div className="border rounded-xl overflow-hidden">
                            <table className="w-full text-right text-sm">
                                <thead className="bg-gray-50 font-medium text-gray-600">
                                    <tr>
                                        <th className="p-3">صورة</th>
                                        <th className="p-3">اسم المنتج</th>
                                        <th className="p-3">الفئة</th>
                                        <th className="p-3">السعر</th>
                                        <th className="p-3">المخزون</th>
                                        <th className="p-3 text-center">الحالة في الموقع</th>
                                        <th className="p-3">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {store.products.map(product => {
                                        const isVisible = product.isVisibleOnline !== false;
                                        const hasImages = product.images && product.images.length > 0;
                                        return (
                                        <tr key={product.id} className="hover:bg-gray-50">
                                            <td className="p-3">
                                                {hasImages ? (
                                                    <div className="w-10 h-10 rounded border overflow-hidden">
                                                        <img src={product.images![0]} alt={product.name} className="w-full h-full object-cover" />
                                                    </div>
                                                ) : (
                                                    <div className="w-10 h-10 bg-gray-100 rounded border flex items-center justify-center text-gray-400">
                                                        <PhotoIcon />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-3 font-medium">{product.name}</td>
                                            <td className="p-3 text-gray-500">{product.category}</td>
                                            <td className="p-3 font-bold">{product.sellPrice.toLocaleString()} ج.م</td>
                                            <td className="p-3">{product.initialQuantity}</td>
                                            <td className="p-3 text-center">
                                                <button 
                                                    onClick={() => toggleProductVisibility(product.id)}
                                                    className={`px-3 py-1 rounded-full text-xs font-bold transition ${isVisible ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                                                >
                                                    {isVisible ? 'ظاهر للعملاء' : 'مخفي'}
                                                </button>
                                            </td>
                                            <td className="p-3">
                                                <button 
                                                    onClick={() => setEditingProduct(product)}
                                                    className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded text-sm flex items-center gap-1"
                                                >
                                                    <PencilIcon /> تعديل / صور
                                                </button>
                                            </td>
                                        </tr>
                                    )})}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="max-w-2xl space-y-6">
                        <div className="bg-white border p-6 rounded-xl">
                            <h3 className="font-bold text-lg mb-4 border-b pb-2">إعدادات التوصيل والدفع</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">تكلفة الشحن الافتراضية (ج.م)</label>
                                    <input type="number" className="w-full p-2 border rounded" defaultValue={store.website?.settings.shippingRate} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" defaultChecked={store.website?.settings.allowCashOnDelivery} className="w-4 h-4 text-indigo-600" />
                                    <label className="text-sm text-gray-700">تفعيل الدفع عند الاستلام (Cash on Delivery)</label>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border p-6 rounded-xl">
                            <h3 className="font-bold text-lg mb-4 border-b pb-2">بيانات التواصل</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                                    <input type="email" className="w-full p-2 border rounded" defaultValue={store.website?.settings.contactEmail} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
                                    <input type="text" className="w-full p-2 border rounded" defaultValue={store.website?.settings.contactPhone} />
                                </div>
                            </div>
                        </div>
                        <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-bold shadow">
                            حفظ الإعدادات
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WebsiteBuilder;
