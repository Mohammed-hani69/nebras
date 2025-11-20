
import React, { useRef, useState, useEffect } from 'react';
import type { Invoice, Quotation, PurchaseOrder, Store } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { NebrasLogo, DocumentDownloadIcon } from './icons/Icons';
import ProgressBar from './ProgressBar';

interface InvoiceViewerProps {
    document: Invoice | Quotation | PurchaseOrder;
    type: 'invoice' | 'quotation' | 'purchase_order';
    store: Store;
    onClose: () => void;
}

const InvoiceViewer: React.FC<InvoiceViewerProps> = ({ document, type, store, onClose }) => {
    const viewerRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(0);

    // Ensure fonts are loaded before allowing print
    useEffect(() => {
        const loadFonts = async () => {
            await (window.document as any).fonts.ready;
        };
        loadFonts();
    }, []);

    const handleDownloadPDF = async () => {
        const element = viewerRef.current;
        if (!element) return;

        setIsGenerating(true);
        setGenerationProgress(10);

        try {
            // 1. Wait for fonts to be fully ready
            await (window.document as any).fonts.ready;
            setGenerationProgress(30);
            
            // 2. Delay to ensure rendering engine has settled layouts
            await new Promise(resolve => setTimeout(resolve, 800));
            setGenerationProgress(40);

            // 3. Capture High-Res Image with Arabic specific settings
            const canvas = await html2canvas(element, { 
                scale: 3, // Increased scale for sharper text
                useCORS: true, 
                logging: false,
                backgroundColor: '#ffffff',
                allowTaint: true,
                // CRITICAL FOR ARABIC: Must be false. 
                // True splits text into individual letters, breaking Arabic ligatures (connections).
                letterRendering: false, 
                onclone: (clonedDoc) => {
                    const clonedElement = clonedDoc.getElementById('printable-area');
                    if (clonedElement) {
                        clonedElement.style.display = 'block';
                        
                        // Inject specific CSS to force ligature rendering in the cloned document
                        const style = clonedDoc.createElement('style');
                        style.innerHTML = `
                            * {
                                font-family: 'Tajawal', sans-serif !important;
                                font-variant-ligatures: normal !important;
                                font-feature-settings: "liga" 1, "dlig" 1 !important;
                                letter-spacing: 0px !important;
                                word-spacing: normal !important;
                                text-rendering: optimizeLegibility !important;
                            }
                        `;
                        clonedDoc.head.appendChild(style);
                    }
                    setGenerationProgress(60);
                }
            });

            setGenerationProgress(80);

            const imgData = canvas.toDataURL('image/jpeg', 1.0); // Max quality
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            
            // Add image to PDF
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, (imgHeight * pdfWidth) / imgWidth);
            
            setGenerationProgress(95);
            pdf.save(`Nebras-${type}-${document.id}.pdf`);
            setGenerationProgress(100);

        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("حدث خطأ أثناء إنشاء ملف PDF. يرجى المحاولة مرة أخرى.");
        } finally {
            setTimeout(() => {
                setIsGenerating(false);
                setGenerationProgress(0);
            }, 500);
        }
    };

    const handleNativePrint = () => {
        window.print();
    };

    const getDocumentDetails = () => {
        let title = '';
        let clientName = '';
        let clientLabel = '';
        let clientPhone = '';
        let clientAddress = '';
        let items: any[] = [];
        let subtotal = 0;
        let taxAmount = 0;
        let total = 0;
        let paid = 0;
        let balance = 0;
        let date = '';
        let status = '';
        let docIdLabel = '';
        let colorTheme = 'indigo';

        if (type === 'invoice') {
            const inv = document as Invoice;
            title = 'فاتورة ضريبية';
            docIdLabel = 'رقم الفاتورة';
            clientLabel = 'فوتيرت إلى';
            clientName = inv.customerName;
            const customer = store.customers.find(c => c.name === inv.customerName);
            clientPhone = customer?.phone || '';
            clientAddress = customer?.address || '';
            
            items = inv.items.map(i => ({ name: i.description, qty: i.quantity, price: i.unitPrice, total: i.total }));
            subtotal = inv.subtotal;
            taxAmount = inv.taxAmount;
            total = inv.total;
            paid = inv.amountPaid;
            balance = inv.remainingBalance;
            date = inv.date;
            status = inv.remainingBalance <= 0 ? 'مدفوعة' : 'مستحقة';
            colorTheme = 'indigo';
        } else if (type === 'quotation') {
            const q = document as Quotation;
            title = 'عرض سعر';
            docIdLabel = 'رقم العرض';
            clientLabel = 'عرض مقدم لـ';
            const customer = store.customers.find(c => c.id === q.customerId);
            clientName = customer ? customer.name : 'عميل عام';
            clientPhone = customer ? customer.phone : '';
            clientAddress = customer?.address || '';
            items = q.items.map(i => {
                const product = store.products.find(p => p.id === i.productId);
                return { name: product?.name || 'منتج', qty: i.quantity, price: i.unitPrice, total: i.quantity * i.unitPrice };
            });
            subtotal = q.subtotal;
            taxAmount = q.taxAmount;
            total = q.total;
            date = q.date;
            status = q.status === 'approved' ? 'مقبول' : 'ساري';
            colorTheme = 'slate';
        } else if (type === 'purchase_order') {
            const po = document as PurchaseOrder;
            title = 'أمر شراء';
            docIdLabel = 'رقم الطلب';
            clientLabel = 'طلب من المورد';
            const supplier = store.suppliers.find(s => s.id === po.supplierId);
            clientName = supplier ? supplier.name : 'مورد غير معروف';
            clientPhone = supplier ? supplier.phone : '';
            clientAddress = supplier?.address || '';
            items = po.items.map(i => {
                const product = store.products.find(p => p.id === i.productId);
                return { name: product?.name || 'منتج', qty: i.quantity, price: i.costPrice, total: i.quantity * i.costPrice };
            });
            subtotal = items.reduce((acc, i) => acc + i.total, 0);
            total = subtotal; 
            paid = po.payments.reduce((acc, p) => acc + p.amount, 0);
            balance = total - paid;
            date = po.date;
            status = po.status === 'received' ? 'مستلم' : 'قيد التنفيذ';
            colorTheme = 'teal';
        }

        return { title, docIdLabel, clientName, clientLabel, clientPhone, clientAddress, items, subtotal, taxAmount, total, paid, balance, date, status, colorTheme };
    };

    const details = getDocumentDetails();
    const themeColor = details.colorTheme === 'indigo' ? '#4f46e5' : details.colorTheme === 'teal' ? '#0d9488' : '#475569';
    const themeBg = details.colorTheme === 'indigo' ? 'bg-indigo-600' : details.colorTheme === 'teal' ? 'bg-teal-600' : 'bg-slate-600';
    const themeText = details.colorTheme === 'indigo' ? 'text-indigo-600' : details.colorTheme === 'teal' ? 'text-teal-600' : 'text-slate-600';
    const themeBorder = details.colorTheme === 'indigo' ? 'border-indigo-600' : details.colorTheme === 'teal' ? 'border-teal-600' : 'border-slate-600';
    const themeLightBg = details.colorTheme === 'indigo' ? 'bg-indigo-50' : details.colorTheme === 'teal' ? 'bg-teal-50' : 'bg-slate-50';

    return (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-start z-50 p-4 overflow-y-auto backdrop-blur-sm print:p-0 print:bg-white print:static print:overflow-visible">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-[210mm] my-4 flex flex-col print:shadow-none print:w-full print:my-0">
                
                {/* Toolbar */}
                <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl print:hidden sticky top-0 z-10 shadow-sm">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">{details.title} <span dir="ltr" className="text-gray-500 text-sm">#{document.id}</span></h2>
                    </div>
                    <div className="flex gap-3 items-center">
                         {isGenerating && (
                            <div className="w-32 mr-2">
                                <ProgressBar progress={generationProgress} heightClass="h-2" />
                            </div>
                        )}
                        <button 
                            onClick={handleNativePrint} 
                            className="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 transition flex items-center gap-2 shadow-sm"
                            disabled={isGenerating}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                            طباعة
                        </button>
                        <button 
                            onClick={handleDownloadPDF} 
                            disabled={isGenerating}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-indigo-700 transition shadow-sm disabled:bg-indigo-400"
                        >
                            {isGenerating ? 'جاري المعالجة...' : <><DocumentDownloadIcon /> تحميل PDF</>}
                        </button>
                        <button onClick={onClose} className="text-gray-400 hover:text-red-600 text-2xl leading-none px-2 transition">&times;</button>
                    </div>
                </div>
                
                {/* Document Canvas */}
                <div className="p-0 bg-gray-100 flex justify-center print:bg-white">
                    <div 
                        id="printable-area" 
                        ref={viewerRef} 
                        className="bg-white w-[210mm] min-h-[297mm] p-[10mm] relative text-gray-800 shadow-lg print:shadow-none print:w-full print:p-0" 
                        dir="rtl"
                        style={{ 
                            fontFamily: "'Tajawal', sans-serif",
                            fontVariantLigatures: "normal",
                            fontFeatureSettings: '"liga" 1, "dlig" 1',
                            textRendering: "optimizeLegibility"
                        }}
                    >
                        {/* Top Border Accent */}
                        <div className={`absolute top-0 left-0 w-full h-3 ${themeBg}`}></div>

                        {/* Header Section */}
                        <div className="flex justify-between items-start mb-12 mt-4">
                            <div className="flex flex-col gap-4 max-w-[50%]">
                                <div className="flex items-center gap-3">
                                    <div className={`${themeLightBg} p-2 rounded-lg`}>
                                        <NebrasLogo />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{store.name}</h1>
                                        <p className="text-sm text-gray-500">{store.storeType}</p>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-600 space-y-1 mt-2 pr-2 border-r-2 border-gray-200">
                                    <p className="font-medium">{store.billingSettings.address || 'العنوان غير متوفر'}</p>
                                    <p>{store.billingSettings.phone || store.ownerPhone}</p>
                                    <p>{store.ownerEmail}</p>
                                    {store.billingSettings.taxNumber && (
                                        <p className="font-bold text-gray-800 mt-1">الرقم الضريبي: {store.billingSettings.taxNumber}</p>
                                    )}
                                </div>
                            </div>

                            <div className="text-left flex flex-col items-end">
                                <h2 className={`text-5xl font-bold ${themeText} mb-2 uppercase opacity-90`}>{details.title}</h2>
                                <div className="text-right space-y-1">
                                    <p className="text-gray-600 font-medium text-lg"><span className="text-gray-400 text-sm ml-2">{details.docIdLabel}:</span>#{document.id}</p>
                                    <p className="text-gray-600 font-medium"><span className="text-gray-400 text-sm ml-2">التاريخ:</span>{new Date(details.date).toLocaleDateString('en-GB')}</p>
                                    <p className="text-gray-600 font-medium"><span className="text-gray-400 text-sm ml-2">الحالة:</span>{details.status}</p>
                                </div>
                                {/* QR Placeholder */}
                                {type === 'invoice' && (
                                    <div className="mt-4 border-2 border-gray-800 p-1 rounded">
                                        <div className="w-20 h-20 bg-gray-100 flex items-center justify-center text-center text-[8px] text-gray-400">
                                            QR Code<br/>(ZATCA)
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bill To / Ship To */}
                        <div className="flex justify-between bg-gray-50 rounded-lg p-6 mb-8 border border-gray-100">
                            <div>
                                <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${themeText}`}>{details.clientLabel}</h3>
                                <div className="text-gray-800">
                                    <p className="font-bold text-lg">{details.clientName}</p>
                                    {details.clientPhone && <p className="text-sm mt-1">{details.clientPhone}</p>}
                                    {details.clientAddress && <p className="text-sm text-gray-600 max-w-xs">{details.clientAddress}</p>}
                                </div>
                            </div>
                            <div className="text-left">
                                <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${themeText}`}>الإجمالي المستحق</h3>
                                <p className="text-3xl font-bold text-gray-900">{details.balance.toLocaleString()} <span className="text-sm font-normal text-gray-500">ج.م</span></p>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="mb-8">
                            <table className="w-full text-right border-collapse">
                                <thead>
                                    <tr className={`${themeBg} text-white text-sm uppercase tracking-wider`}>
                                        <th className="p-3 rounded-tr-md text-center w-16">#</th>
                                        <th className="p-3 text-right">الوصف</th>
                                        <th className="p-3 text-center w-24">الكمية</th>
                                        <th className="p-3 text-center w-32">سعر الوحدة</th>
                                        <th className="p-3 rounded-tl-md text-left pl-6 w-32">المجموع</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm text-gray-700">
                                    {details.items.map((item, index) => (
                                        <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                                            <td className="p-4 text-center font-bold text-gray-400">{index + 1}</td>
                                            <td className="p-4 font-semibold text-gray-800">{item.name}</td>
                                            <td className="p-4 text-center">{item.qty}</td>
                                            <td className="p-4 text-center">{item.price.toLocaleString()}</td>
                                            <td className="p-4 text-left pl-6 font-bold text-gray-900">{item.total.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {/* Fill empty rows to maintain height if needed */}
                                    {details.items.length < 3 && (
                                        <tr className="h-24"><td colSpan={5}></td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals Section */}
                        <div className="flex flex-col items-end">
                            <div className="w-80 space-y-2">
                                <div className="flex justify-between text-gray-600 py-2 border-b border-gray-100">
                                    <span className="font-medium">المجموع الفرعي</span>
                                    <span className="font-bold text-gray-800">{details.subtotal.toLocaleString()}</span>
                                </div>
                                
                                {(details.taxAmount > 0 || type === 'invoice') && (
                                    <div className="flex justify-between text-gray-600 py-2 border-b border-gray-100">
                                        <span className="font-medium">الضريبة ({store.billingSettings.taxRate}%)</span>
                                        <span className="font-bold text-gray-800">{details.taxAmount.toLocaleString()}</span>
                                    </div>
                                )}

                                <div className={`flex justify-between items-center py-3 px-4 rounded-lg ${themeLightBg} ${themeText} mt-4`}>
                                    <span className="font-bold text-lg">الإجمالي الكلي</span>
                                    <span className="font-extrabold text-2xl">{details.total.toLocaleString()} <span className="text-xs">ج.م</span></span>
                                </div>

                                {type !== 'quotation' && details.paid > 0 && (
                                    <div className="flex justify-between text-green-600 py-1 px-2 text-sm">
                                        <span>المدفوع</span>
                                        <span>- {details.paid.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer / Terms */}
                        <div className="absolute bottom-[15mm] left-[10mm] right-[10mm]">
                            <div className="border-t-2 border-gray-100 pt-4 flex justify-between items-end">
                                <div className="text-xs text-gray-500 max-w-md">
                                    <p className="font-bold text-gray-700 mb-1">الشروط والأحكام:</p>
                                    <p>1. البضاعة المباعة ترد وتستبدل خلال 14 يوم بحالتها الأصلية.</p>
                                    <p>2. يشترط وجود أصل الفاتورة للاستبدال أو الاسترجاع.</p>
                                    <p>3. الأسعار تشمل ضريبة القيمة المضافة حيثما ينطبق.</p>
                                </div>
                                <div className="text-center">
                                     {/* Space for Signature */}
                                     <div className="h-12 w-32 border-b border-gray-300 mb-2"></div>
                                     <p className="text-xs font-bold text-gray-600">التوقيع / الختم</p>
                                </div>
                            </div>
                            <div className="text-center mt-6 text-[10px] text-gray-400">
                                تم إصدار هذا المستند إلكترونياً بواسطة نظام <span className="font-bold">نبراس</span> لإدارة المتاجر
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceViewer;
