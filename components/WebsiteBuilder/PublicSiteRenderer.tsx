
import React, { useState, useMemo } from 'react';
import type { Website, Store, OnlineOrder, WebBlock } from '../../types';
import { ShoppingCartIcon, CheckCircleIcon, EyeIcon, XMarkIcon } from '../icons/Icons';

interface PublicSiteRendererProps {
    store: Store;
    onBack: () => void;
    onNewOrder: (order: OnlineOrder) => void;
}

const PublicSiteRenderer: React.FC<PublicSiteRendererProps> = ({ store, onBack, onNewOrder }) => {
    const website = store.website!;
    const [cart, setCart] = useState<{productId: string, quantity: number}[]>([]);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', address: '' });

    // Filter products based on visibility setting
    const products = useMemo(() => {
        return store.products.filter(p => p.isVisibleOnline !== false);
    }, [store.products]);

    const sales = store.sales || [];
    // Consider orders that are 'new' or 'processing' as reserved stock
    const pendingOrders = (store.onlineOrders || []).filter(o => o.status === 'new' || o.status === 'processing');

    // Helper to calculate real-time available stock
    const getAvailableStock = (productId: string) => {
        const product = products.find(p => p.id === productId);
        if (!product) return 0;

        const soldQty = sales.filter(s => s.productId === productId).reduce((acc, s) => acc + s.quantity, 0);
        const reservedQty = pendingOrders.reduce((acc, order) => {
            const item = order.items.find(i => i.productId === productId);
            return acc + (item ? item.quantity : 0);
        }, 0);

        // Also consider what's currently in the user's cart
        const inCartQty = cart.find(i => i.productId === productId)?.quantity || 0;

        return Math.max(0, product.initialQuantity - soldQty - reservedQty - inCartQty);
    };

    const addToCart = (productId: string) => {
        const available = getAvailableStock(productId);
        if (available <= 0) {
            alert('عفواً، الكمية المطلوبة غير متوفرة حالياً.');
            return;
        }

        setCart(prev => {
            const existing = prev.find(i => i.productId === productId);
            if (existing) {
                return prev.map(i => i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { productId, quantity: 1 }];
        });

        // Simple toast
        const toast = document.createElement('div');
        toast.innerText = 'تمت الإضافة للسلة';
        toast.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50 animate-fade-in-up font-bold text-sm';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(i => i.productId !== productId));
    };

    const cartTotal = cart.reduce((sum, item) => {
        const p = products.find(p => p.id === item.productId);
        return sum + (p ? p.sellPrice * item.quantity : 0);
    }, 0);

    const handleCheckout = (e: React.FormEvent) => {
        e.preventDefault();
        if (cart.length === 0) return;

        const order: OnlineOrder = {
            id: `ORD-${Date.now()}`,
            storeId: store.id,
            customerName: customerInfo.name,
            customerPhone: customerInfo.phone,
            address: customerInfo.address,
            items: cart.map(i => {
                const p = products.find(prod => prod.id === i.productId)!;
                return { productId: i.productId, quantity: i.quantity, price: p.sellPrice, name: p.name };
            }),
            totalAmount: cartTotal,
            status: 'new',
            date: new Date().toISOString(),
            paymentMethod: 'cod' // Default for MVP
        };
        
        onNewOrder(order);
        alert('تم استلام طلبك بنجاح! رقم الطلب: ' + order.id);
        setCart([]);
        setIsCheckoutOpen(false);
        setCustomerInfo({ name: '', phone: '', address: '' });
    };

    // --- Block Renderers ---
    const renderBlock = (block: WebBlock) => {
        switch (block.type) {
            case 'hero':
                return (
                    <div key={block.id} className="bg-gray-900 text-white py-20 px-4 text-center" style={{ backgroundColor: website.theme.primaryColor }}>
                        <h1 className="text-5xl font-bold mb-4">{block.content.title}</h1>
                        <p className="text-xl opacity-90 mb-8">{block.content.subtitle}</p>
                        <button className="bg-white text-gray-900 px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition shadow-lg transform hover:scale-105">
                            {block.content.buttonText}
                        </button>
                    </div>
                );
            case 'text':
                return (
                    <div key={block.id} className="container mx-auto px-4 py-12 prose max-w-4xl text-center">
                        <p className="text-lg text-gray-600 leading-relaxed">{block.content.text}</p>
                    </div>
                );
            case 'product_grid':
                return (
                    <div key={block.id} className="container mx-auto px-4 py-12 bg-gray-50">
                        <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">{block.content.title}</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {products.slice(0, block.content.limit || 8).map(product => {
                                const stock = getAvailableStock(product.id) + (cart.find(c => c.productId === product.id)?.quantity || 0);
                                const isOutOfStock = stock <= 0;
                                const hasImage = product.images && product.images.length > 0;
                                
                                return (
                                    <div key={product.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden flex flex-col group relative">
                                        <div className="h-48 bg-gray-100 flex items-center justify-center text-gray-400 relative overflow-hidden">
                                            {hasImage ? (
                                                <img src={product.images![0]} alt={product.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                            ) : (
                                                <EyeIcon />
                                            )} 
                                            {isOutOfStock && (
                                                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
                                                    <span className="bg-red-500 text-white px-3 py-1 rounded-full font-bold text-sm shadow-md">نفذت الكمية</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4 flex-1 flex flex-col">
                                            <h3 className="font-bold text-gray-800 mb-1 truncate">{product.name}</h3>
                                            <p className="text-sm text-gray-500 mb-2">{product.category}</p>
                                            {product.description && <p className="text-xs text-gray-400 line-clamp-2 mb-2">{product.description}</p>}
                                            <div className="flex justify-between items-center mb-4 mt-auto">
                                                <p className="text-indigo-600 font-bold text-lg">{product.sellPrice.toLocaleString()} ج.م</p>
                                                {!isOutOfStock && <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">متاح: {stock}</span>}
                                            </div>
                                            <button 
                                                onClick={() => addToCart(product.id)}
                                                disabled={isOutOfStock}
                                                className={`w-full py-2 rounded font-bold transition ${isOutOfStock ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                                            >
                                                {isOutOfStock ? 'غير متوفر' : 'إضافة للسلة'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            case 'features':
                return (
                     <div key={block.id} className="container mx-auto px-4 py-12">
                        <h2 className="text-3xl font-bold text-center mb-12">{block.content.title}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                             <div className="p-6 border rounded-xl hover:border-indigo-200 transition bg-white">
                                 <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🚀</div>
                                 <h3 className="font-bold text-xl mb-2">سرعة في التوصيل</h3>
                                 <p className="text-gray-600">نصلك أينما كنت في أسرع وقت.</p>
                             </div>
                             <div className="p-6 border rounded-xl hover:border-green-200 transition bg-white">
                                 <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🛡️</div>
                                 <h3 className="font-bold text-xl mb-2">ضمان الجودة</h3>
                                 <p className="text-gray-600">منتجات أصلية ومضمونة 100%.</p>
                             </div>
                             <div className="p-6 border rounded-xl hover:border-yellow-200 transition bg-white">
                                 <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">💬</div>
                                 <h3 className="font-bold text-xl mb-2">دعم متواصل</h3>
                                 <p className="text-gray-600">فريق دعم فني جاهز لخدمتكم.</p>
                             </div>
                        </div>
                     </div>
                );
            case 'contact_form':
                return (
                    <div key={block.id} className="bg-gray-100 py-12">
                        <div className="container mx-auto px-4 max-w-lg">
                             <h2 className="text-3xl font-bold text-center mb-8">{block.content.title}</h2>
                             <form className="bg-white p-6 rounded-xl shadow-sm space-y-4" onSubmit={(e) => { e.preventDefault(); alert('شكرا لتواصلك معنا!'); }}>
                                 <input type="text" placeholder="الاسم" className="w-full p-3 border rounded focus:ring-2 focus:ring-indigo-500 outline-none" required />
                                 <input type="email" placeholder="البريد الإلكتروني" className="w-full p-3 border rounded focus:ring-2 focus:ring-indigo-500 outline-none" required />
                                 <textarea placeholder="رسالتك" className="w-full p-3 border rounded h-32 focus:ring-2 focus:ring-indigo-500 outline-none" required></textarea>
                                 <button className="w-full bg-gray-800 text-white py-3 rounded font-bold hover:bg-gray-900">إرسال</button>
                             </form>
                        </div>
                    </div>
                );
            case 'image_carousel':
                return (
                    <div key={block.id} className="w-full overflow-hidden relative group bg-gray-100">
                        <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide">
                            {(block.content.images || []).map((src: string, idx: number) => (
                                <div key={idx} className="w-full flex-shrink-0 snap-center">
                                    <img src={src} alt={`Slide ${idx}`} className="w-full h-[400px] object-cover" />
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'video':
                return (
                    <div key={block.id} className="container mx-auto px-4 py-12 text-center">
                        <h2 className="text-2xl font-bold mb-6">{block.content.title}</h2>
                        <div className="max-w-3xl mx-auto aspect-w-16 aspect-h-9">
                            <iframe 
                                src={block.content.videoUrl} 
                                title={block.content.title} 
                                className="w-full h-[400px] rounded-xl shadow-lg" 
                                allowFullScreen
                            ></iframe>
                        </div>
                    </div>
                );
            case 'testimonials':
                return (
                    <div key={block.id} className="bg-indigo-50 py-16">
                        <div className="container mx-auto px-4">
                            <h2 className="text-3xl font-bold text-center mb-10 text-indigo-900">{block.content.title}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {(block.content.items || []).map((item: any, idx: number) => (
                                    <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100 text-center hover:shadow-md transition">
                                        <div className="w-16 h-16 bg-indigo-200 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl">👤</div>
                                        <p className="text-gray-600 italic mb-4">"{item.text}"</p>
                                        <h4 className="font-bold text-gray-800">{item.name}</h4>
                                        <p className="text-xs text-indigo-500 uppercase tracking-wide">{item.role}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'faq':
                return (
                    <div key={block.id} className="container mx-auto px-4 py-12 max-w-3xl">
                        <h2 className="text-3xl font-bold text-center mb-8">{block.content.title}</h2>
                        <div className="space-y-4">
                            {(block.content.items || []).map((item: any, idx: number) => (
                                <details key={idx} className="bg-white border rounded-lg group shadow-sm">
                                    <summary className="p-4 cursor-pointer font-bold text-gray-800 flex justify-between items-center group-open:text-indigo-600">
                                        {item.q}
                                        <span className="transform transition group-open:rotate-180">▼</span>
                                    </summary>
                                    <div className="p-4 pt-0 text-gray-600 border-t border-gray-100">
                                        {item.a}
                                    </div>
                                </details>
                            ))}
                        </div>
                    </div>
                );
            case 'cta':
                return (
                    <div key={block.id} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16 px-4 text-center">
                        <h2 className="text-4xl font-bold mb-4">{block.content.title}</h2>
                        <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">{block.content.subtitle}</p>
                        <button className="bg-white text-indigo-600 px-8 py-3 rounded-full font-bold text-lg shadow-lg hover:bg-gray-100 transition transform hover:scale-105">
                            {block.content.buttonText}
                        </button>
                    </div>
                );
            case 'footer':
                return (
                    <footer key={block.id} className="bg-gray-900 text-gray-300 py-12 mt-auto">
                        <div className="container mx-auto px-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-right">
                                <div>
                                    <h3 className="font-bold text-white text-lg mb-4">{website.title}</h3>
                                    <p className="text-sm text-gray-400">متجرك المفضل للتسوق الإلكتروني.</p>
                                </div>
                                {(block.content.columns || []).map((col: any, idx: number) => (
                                    <div key={idx}>
                                        <h4 className="font-bold text-white mb-4">{col.title}</h4>
                                        <ul className="space-y-2 text-sm">
                                            {(col.links || []).map((link: string, lIdx: number) => (
                                                <li key={lIdx}><a href="#" className="hover:text-white transition">{link}</a></li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-gray-800 pt-8 text-center text-sm">
                                {block.content.copyright}
                            </div>
                        </div>
                    </footer>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans relative" style={{ fontFamily: website.theme.fontFamily }}>
            {/* Top Bar (Simulation Controls) */}
            <div className="fixed top-0 left-0 right-0 bg-gray-900 text-white p-2 z-50 flex justify-between items-center px-4 text-sm">
                <div>معاينة المتجر: <span className="font-bold text-indigo-400">{website.subdomain}.nebras.app</span></div>
                <button onClick={onBack} className="bg-white text-gray-900 px-3 py-1 rounded hover:bg-gray-200 font-medium">عودة للوحة التحكم</button>
            </div>

            {/* Website Header */}
            <header className="sticky top-[36px] z-40 bg-white/95 backdrop-blur-md border-b shadow-sm mt-[36px]">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="text-2xl font-bold text-gray-800">{website.title}</div>
                    <div className="flex items-center gap-6">
                        <nav className="hidden md:flex gap-6 text-gray-600">
                            <a href="#" className="hover:text-indigo-600 font-medium transition">الرئيسية</a>
                            <a href="#" className="hover:text-indigo-600 font-medium transition">المنتجات</a>
                            <a href="#" className="hover:text-indigo-600 font-medium transition">من نحن</a>
                        </nav>
                        <button 
                            onClick={() => setIsCheckoutOpen(true)}
                            className="relative p-2 text-gray-600 hover:text-indigo-600 transition"
                        >
                            <ShoppingCartIcon />
                            {cart.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
                                    {cart.reduce((s, i) => s + i.quantity, 0)}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* Website Content */}
            <main>
                {website.pages.find(p => p.isHome)?.blocks.map(renderBlock)}
            </main>

            {/* Checkout Modal */}
            {isCheckoutOpen && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex justify-end backdrop-blur-sm transition-opacity duration-300">
                    <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 overflow-y-auto animate-slide-in-left flex flex-col">
                        <div className="flex justify-between items-center mb-6 border-b pb-4">
                            <h2 className="text-2xl font-bold text-gray-800">سلة المشتريات</h2>
                            <button onClick={() => setIsCheckoutOpen(false)} className="text-gray-400 hover:text-red-500 text-2xl">&times;</button>
                        </div>

                        {cart.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                                <ShoppingCartIcon />
                                <p className="mt-4">السلة فارغة.</p>
                                <button onClick={() => setIsCheckoutOpen(false)} className="mt-4 text-indigo-600 hover:underline font-bold">تصفح المنتجات</button>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-4 mb-6 flex-1 overflow-y-auto">
                                    {cart.map(item => {
                                        const p = products.find(prod => prod.id === item.productId)!;
                                        const hasImage = p.images && p.images.length > 0;
                                        return (
                                            <div key={item.productId} className="flex justify-between items-center border-b pb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-400 overflow-hidden">
                                                        {hasImage ? <img src={p.images![0]} alt="" className="w-full h-full object-cover"/> : <EyeIcon />}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-800 text-sm">{p.name}</h4>
                                                        <p className="text-xs text-gray-500">{item.quantity} x {p.sellPrice.toLocaleString()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-indigo-600">{(item.quantity * p.sellPrice).toLocaleString()}</span>
                                                    <button onClick={() => removeFromCart(item.productId)} className="text-red-400 hover:text-red-600"><XMarkIcon /></button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                
                                <div className="border-t pt-4 bg-gray-50 -mx-6 px-6 py-4 rounded-t-xl">
                                    <div className="flex justify-between text-xl font-bold text-gray-800 mb-6">
                                        <span>الإجمالي</span>
                                        <span>{cartTotal.toLocaleString()} ج.م</span>
                                    </div>

                                    <form onSubmit={handleCheckout} className="space-y-3">
                                        <h3 className="font-bold text-gray-700 mb-2">بيانات الشحن</h3>
                                        <input required type="text" placeholder="الاسم الكامل" className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} />
                                        <input required type="tel" placeholder="رقم الهاتف" className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none" value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} />
                                        <input required type="text" placeholder="العنوان بالتفصيل" className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none" value={customerInfo.address} onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})} />
                                        
                                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800 flex items-center gap-2">
                                            <span className="text-lg">🚚</span> الدفع عند الاستلام هو الخيار المتاح حالياً.
                                        </div>

                                        <button className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg flex items-center justify-center gap-2">
                                            <CheckCircleIcon /> تأكيد الطلب
                                        </button>
                                    </form>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublicSiteRenderer;
