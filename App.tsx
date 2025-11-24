
import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import Inventory from './components/Inventory';
import InvoicingModule from './components/InvoicingModule';
import ServiceLog from './components/ServiceLog';
import Expenses from './components/Expenses';
import FinancialDashboard from './components/FinancialDashboard';
import GeneralReports from './components/GeneralReports';
import HRManagement from './components/HRManagement';
import CustomerManagement from './components/CustomerManagement';
import SuppliersManagement from './components/SuppliersManagement';
import ActivityLog from './components/ActivityLog';
import AIAssistant from './components/AIAssistant';
import AIMessages from './components/AIMessages';
import UserGuide from './components/UserGuide';
import Installments from './components/Installments';
import ReturnsRefunds from './components/ReturnsRefunds';
import NotificationsCenter from './components/NotificationsCenter';
import SupportTicketing from './components/SupportTicketing';
import TreasuryBanking from './components/TreasuryBanking';
import GeneralLedger from './components/GeneralLedger';
import CustomerServiceAI from './components/CustomerServiceAI';
import ModuleMarketplace from './components/ModuleMarketplace';
import StoreSystemSupport from './components/StoreSystemSupport';
import WebsiteBuilder from './components/WebsiteBuilder/WebsiteBuilder';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import MobileLayout from './components/Mobile/MobileLayout';
import LandingPage from './components/LandingPage';
import AboutUs from './components/AboutUs';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsAndConditions from './components/TermsAndConditions';

import useIsMobile from './hooks/useIsMobile';
import { 
    initDB, loadStores, saveStores, loadAISettings, saveAISettings, 
    loadMarketplaceSettings, saveMarketplaceSettings,
    loadBuilderAssets, saveBuilderAssets,
    loadWebsitePlans, saveWebsitePlans
} from './services/db';
import type { Store, Employee, AISettings, ModuleDefinition, WebTemplate, BlockDefinition, BuilderPlan, Sale, Customer, Invoice, Product, Service, Expense } from './types';
import { SUBSCRIPTION_PLANS } from './data/subscriptionPlans';

const DEFAULT_AI_SETTINGS: AISettings = {
    model: 'gemini-2.5-flash',
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    enableSuggestions: true,
    enableDashboardInsights: true,
    enableReportAnalysis: true
};

const DEFAULT_MODULES: ModuleDefinition[] = [
    { id: 'dashboard', label: 'لوحة التحكم', description: 'نظرة عامة على أداء المتجر', price: 0, category: 'basic', isCore: true, isVisible: true },
    { id: 'pos', label: 'نقطة البيع (POS)', description: 'واجهة الكاشير لإدارة المبيعات', price: 0, category: 'basic', isCore: true, isVisible: true },
    { id: 'inventory', label: 'المخزون', description: 'إدارة المنتجات والمستودع', price: 0, category: 'basic', isCore: true, isVisible: true },
    { id: 'invoicing', label: 'الفواتير وعروض الأسعار', description: 'إصدار فواتير ضريبية وعروض أسعار', price: 0, category: 'basic', isCore: false, isVisible: true },
    { id: 'services', label: 'الصيانة والخدمات', description: 'تتبع طلبات الصيانة والأجهزة', price: 100, category: 'advanced', isCore: false, isVisible: true },
    { id: 'expenses', label: 'المصروفات', description: 'تتبع النفقات التشغيلية', price: 50, category: 'basic', isCore: false, isVisible: true },
    { id: 'financial-reports', label: 'التقارير المالية', description: 'قوائم الدخل والتدفقات النقدية', price: 200, category: 'premium', isCore: false, isVisible: true },
    { id: 'general-reports', label: 'التقارير العامة', description: 'تقارير المبيعات والمخزون', price: 0, category: 'basic', isCore: true, isVisible: true },
    { id: 'hr-management', label: 'الموارد البشرية', description: 'إدارة الموظفين والرواتب والحضور', price: 150, category: 'advanced', isCore: false, isVisible: true },
    { id: 'customer-management', label: 'إدارة العملاء (CRM)', description: 'قاعدة بيانات العملاء وسجل التعاملات', price: 100, category: 'advanced', isCore: false, isVisible: true },
    { id: 'suppliers-management', label: 'الموردين والمشتريات', description: 'إدارة الموردين وأوامر الشراء', price: 100, category: 'advanced', isCore: false, isVisible: true },
    { id: 'ai-assistant', label: 'المساعد الذكي', description: 'تحليلات واقتراحات مدعومة بالذكاء الاصطناعي', price: 0, category: 'basic', isCore: true, isVisible: true },
    { id: 'installments', label: 'التقسيط والتمويل', description: 'إدارة خطط التقسيط والتحصيل', price: 150, category: 'advanced', isCore: false, isVisible: true },
    { id: 'activity-log', label: 'سجل النشاطات', description: 'تتبع حركات المستخدمين في النظام', price: 50, category: 'basic', isCore: false, isVisible: true },
    { id: 'returns-refunds', label: 'المرتجع والمردودات', description: 'إدارة سياسات وعمليات الإرجاع', price: 0, category: 'basic', isCore: false, isVisible: true },
    { id: 'notifications-center', label: 'مركز الإشعارات', description: 'تنبيهات المخزون والمهام', price: 0, category: 'basic', isCore: true, isVisible: true },
    { id: 'support-ticketing', label: 'نظام التذاكر والدعم', description: 'إدارة شكاوى وطلبات العملاء', price: 100, category: 'advanced', isCore: false, isVisible: true },
    { id: 'treasury-banking', label: 'الخزينة والبنوك', description: 'إدارة النقدية والحسابات البنكية', price: 150, category: 'premium', isCore: false, isVisible: true },
    { id: 'general-ledger', label: 'دفتر الأستاذ العام', description: 'المحاسبة العامة وشجرة الحسابات', price: 250, category: 'premium', isCore: false, isVisible: true },
    { id: 'customer-service-ai', label: 'ذكاء خدمة العملاء', description: 'ردود آلية وتحليل محادثات', price: 300, category: 'premium', isCore: false, isVisible: true },
    { id: 'website-builder', label: 'منشئ المتجر الإلكتروني', description: 'بناء موقع متكامل مرتبط بالنظام', price: 400, category: 'premium', isCore: false, isVisible: true },
    { id: 'user-guide', label: 'دليل الاستخدام', description: 'شروحات النظام', price: 0, category: 'basic', isCore: true, isVisible: true },
];

// --- Demo Data Generator ---
const createDemoStore = (): Store => {
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Products
    const products: Product[] = [
        { id: 'PROD-001', name: 'iPhone 15 Pro Max', category: 'موبايل', costPrice: 45000, sellPrice: 52000, initialQuantity: 10, quantityAvailable: 8, quantitySold: 2, supplierId: 'SUP-001' },
        { id: 'PROD-002', name: 'Samsung S24 Ultra', category: 'موبايل', costPrice: 40000, sellPrice: 48000, initialQuantity: 15, quantityAvailable: 12, quantitySold: 3, supplierId: 'SUP-001' },
        { id: 'PROD-003', name: 'AirPods Pro 2', category: 'إكسسوار', costPrice: 8000, sellPrice: 10500, initialQuantity: 50, quantityAvailable: 45, quantitySold: 5, supplierId: 'SUP-002' },
        { id: 'PROD-004', name: 'Anker Charger 20W', category: 'إكسسوار', costPrice: 500, sellPrice: 850, initialQuantity: 100, quantityAvailable: 88, quantitySold: 12, supplierId: 'SUP-002' },
        { id: 'PROD-005', name: 'Screen Protector Glass', category: 'إكسسوار', costPrice: 50, sellPrice: 150, initialQuantity: 200, quantityAvailable: 150, quantitySold: 50, supplierId: 'SUP-002' },
    ];

    // Customers
    const customers: Customer[] = [
        { id: 'CUST-001', name: 'أحمد محمد', phone: '01012345678', joinDate: oneMonthAgo.toISOString(), loyaltyPoints: 150, transactions: [], segment: 'vip' },
        { id: 'CUST-002', name: 'سارة علي', phone: '01122334455', joinDate: new Date().toISOString(), loyaltyPoints: 50, transactions: [], segment: 'new' },
        { id: 'CUST-003', name: 'شركة الأمل للتجارة', phone: '01233344455', joinDate: oneMonthAgo.toISOString(), loyaltyPoints: 500, transactions: [], segment: 'vip' },
    ];

    // Sales
    const sales: Sale[] = [
        { 
            invoiceId: 'INV-1001', date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), 
            productId: 'PROD-001', quantity: 1, unitPrice: 52000, customerId: 'CUST-001', 
            paymentMethod: 'cash', subtotal: 52000, taxRate: 14, taxAmount: 7280, totalAmount: 59280, amountPaid: 59280, remainingBalance: 0, isFullyPaid: true 
        },
        { 
            invoiceId: 'INV-1002', date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), 
            productId: 'PROD-003', quantity: 2, unitPrice: 10500, customerId: 'CUST-002', 
            paymentMethod: 'card', subtotal: 21000, taxRate: 14, taxAmount: 2940, totalAmount: 23940, amountPaid: 23940, remainingBalance: 0, isFullyPaid: true 
        },
         { 
            invoiceId: 'INV-1003', date: new Date().toISOString(), 
            productId: 'PROD-005', quantity: 5, unitPrice: 150, customerId: null, 
            paymentMethod: 'cash', subtotal: 750, taxRate: 14, taxAmount: 105, totalAmount: 855, amountPaid: 855, remainingBalance: 0, isFullyPaid: true 
        }
    ];

    // Invoices for the sales
    const invoices: Invoice[] = sales.map(s => ({
        id: `TAX-${s.invoiceId}`,
        sourceId: s.invoiceId,
        sourceType: 'sale',
        date: s.date,
        customerName: customers.find(c => c.id === s.customerId)?.name || 'عميل عام',
        items: [{
            description: products.find(p => p.id === s.productId)?.name || 'منتج',
            quantity: s.quantity,
            unitPrice: s.unitPrice,
            total: s.subtotal
        }],
        subtotal: s.subtotal,
        taxRate: s.taxRate,
        taxAmount: s.taxAmount,
        total: s.totalAmount,
        amountPaid: s.amountPaid,
        remainingBalance: s.remainingBalance,
        zatcaStatus: 'pending'
    }));

    // Services
    const services: Service[] = [
        { 
            orderId: 'SRV-501', date: new Date().toISOString(), description: 'تغيير شاشة iPhone 13', 
            revenue: 3500, partsCost: 1200, paymentMethod: 'cash', customerId: 'CUST-001',
            taxRate: 14, taxAmount: 490, totalAmount: 3990, amountPaid: 3990, remainingBalance: 0, isFullyPaid: true
        }
    ];

    // Expenses
    const expenses: Expense[] = [
        { id: 'EXP-001', date: oneMonthAgo.toISOString(), description: 'إيجار المحل', amount: 5000, paymentMethod: 'cash' },
        { id: 'EXP-002', date: new Date().toISOString(), description: 'فواتير كهرباء وإنترنت', amount: 1200, paymentMethod: 'bank_transfer' },
    ];

    return {
        id: 'demo-store',
        name: 'متجر المستقبل (تجريبي)',
        ownerName: 'أحمد التجريبي',
        ownerPhone: '01000000000',
        ownerEmail: 'demo@nebras.com',
        subscriptionStartDate: new Date().toISOString(),
        subscriptionEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
        subscriptionMonthlyPrice: 0,
        storeType: 'إلكترونيات',
        plan: 'pro',
        enabledModules: DEFAULT_MODULES.map(m => m.id),
        products,
        sales,
        invoices, // Pre-populate tax invoices
        services,
        expenses,
        customers,
        employees: [
            { id: 'EMP-001', username: 'manager', password: '123', roleId: 'admin', fullName: 'المدير العام', phone: '01000000000', hireDate: new Date().toISOString(), baseSalary: 5000 }
        ],
        roles: [
            { id: 'admin', name: 'مدير النظام', permissions: ['all'] }
        ],
        suppliers: [
             { id: 'SUP-001', name: 'شركة العربي جروب', phone: '011111', email: 'sales@elaraby.com', address: 'القاهرة', contactPerson: 'أ. علي' },
             { id: 'SUP-002', name: 'دبي فون', phone: '022222', email: 'info@dubaiphone.com', address: 'دبي', contactPerson: 'أ. خالد' }
        ],
        purchaseOrders: [],
        paymentHistory: [],
        aiMessages: [{ id: 'MSG-001', content: 'مرحباً بك في نظام نبراس! هذه بيانات تجريبية لمساعدتك على استكشاف النظام.', timestamp: new Date().toISOString(), read: false }],
        billingSettings: { storeName: 'متجر المستقبل', taxNumber: '3000111222', taxRate: 14, address: 'الرياض - شارع العليا', phone: '0500000000' },
        inventoryMovements: [],
        saleReturns: [],
        purchaseReturns: [],
        activityLogs: [],
        installmentPlans: [],
        quotations: [],
        attendance: [],
        payrolls: [],
        leaves: [],
        advances: [],
        hrSettings: { workingDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'], officialCheckInTime: '09:00', absenceDeductionMethod: 'daily_rate' },
        notifications: [],
        supportTickets: [],
        leads: [],
        treasuries: [{ id: 'TR-01', name: 'الخزينة الرئيسية', balance: 50000 }],
        bankAccounts: [{ id: 'BK-01', bankName: 'البنك الأهلي', accountNumber: 'SA123456', balance: 100000, currency: 'SAR' }],
        financialTransactions: [],
        accounts: [],
        journalEntries: [],
        costCenters: [],
        budgets: []
    };
};

const App: React.FC = () => {
    const [stores, setStores] = useState<Store[]>([]);
    const [currentUser, setCurrentUser] = useState<Employee | null>(null);
    const [currentStore, setCurrentStore] = useState<Store | null>(null);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    
    // Super Admin Credentials State
    const [superAdminAccount, setSuperAdminAccount] = useState({
        username: 'admin@nebras.com',
        password: '123', // Default initial password
        fullName: 'مدير النظام',
        phone: '01000000000'
    });

    const [activeView, setActiveView] = useState('dashboard');
    const [isLoading, setIsLoading] = useState(true);
    const [aiSettings, setAiSettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);
    const [marketplaceModules, setMarketplaceModules] = useState<ModuleDefinition[]>(DEFAULT_MODULES);
    
    // Website Builder Assets
    const [webTemplates, setWebTemplates] = useState<WebTemplate[]>([]);
    const [webBlocks, setWebBlocks] = useState<BlockDefinition[]>([]);
    const [websitePlans, setWebsitePlans] = useState<BuilderPlan[]>(Object.values(SUBSCRIPTION_PLANS));

    // Navigation state for Landing Page
    const [showLanding, setShowLanding] = useState(true);
    const [landingView, setLandingView] = useState<'main' | 'about' | 'privacy' | 'terms'>('main');

    const isMobile = useIsMobile();

    useEffect(() => {
        const initializeData = async () => {
            setIsLoading(true);
            await initDB();
            
            const loadedStores = await loadStores();
            let currentStoresList = loadedStores || [];
            
            // Seed Demo Data if no stores exist
            if (currentStoresList.length === 0) {
                const demoStore = createDemoStore();
                currentStoresList = [demoStore];
                await saveStores(currentStoresList);
            }
            
            setStores(currentStoresList);

            const loadedAiSettings = await loadAISettings();
            if (loadedAiSettings) setAiSettings(loadedAiSettings);
            
            const loadedModules = await loadMarketplaceSettings();
            if (loadedModules) setMarketplaceModules(loadedModules);

            const loadedBuilderAssets = await loadBuilderAssets();
            if (loadedBuilderAssets) {
                setWebTemplates(loadedBuilderAssets.templates);
                setWebBlocks(loadedBuilderAssets.blocks);
            }

            const loadedPlans = await loadWebsitePlans();
            if (loadedPlans) setWebsitePlans(loadedPlans);

            const savedAdmin = localStorage.getItem('superAdminAccount');
            if (savedAdmin) {
                try {
                    setSuperAdminAccount(JSON.parse(savedAdmin));
                } catch (e) { console.error('Failed to parse admin creds'); }
            }

            // Check for saved session
            const storedSession = localStorage.getItem('mazad_session');
            if (storedSession) {
                try {
                    const session = JSON.parse(storedSession);
                    if (session.role === 'superadmin') {
                         setIsSuperAdmin(true);
                         setShowLanding(false);
                    } else if (session.storeId && session.username) {
                         const foundStore = currentStoresList.find(s => s.id === session.storeId);
                         if (foundStore) {
                             const foundUser = foundStore.employees.find(e => e.username === session.username);
                             if (foundUser) {
                                 setCurrentUser(foundUser);
                                 setCurrentStore(foundStore);
                                 setShowLanding(false);
                             }
                         }
                    }
                } catch (e) {
                    console.error("Failed to restore session", e);
                    localStorage.removeItem('mazad_session');
                }
            }

            setIsLoading(false);
        };
        initializeData();
    }, []);

    // Persist stores on change
    useEffect(() => {
        if (!isLoading && stores.length > 0) {
            saveStores(stores);
        }
    }, [stores, isLoading]);
    
    // Persist website plans on change
    useEffect(() => {
        if (!isLoading && websitePlans.length > 0) {
            saveWebsitePlans(websitePlans);
        }
    }, [websitePlans, isLoading]);

    // Persist Admin Creds
    const updateSuperAdmin = (newCreds: typeof superAdminAccount) => {
        setSuperAdminAccount(newCreds);
        localStorage.setItem('superAdminAccount', JSON.stringify(newCreds));
    };

    // Login Logic
    const handleLogin = (u: string, p: string) => {
        // Check dynamic super admin credentials
        if (u === superAdminAccount.username && p === superAdminAccount.password) {
            setIsSuperAdmin(true);
            setShowLanding(false);
            localStorage.setItem('mazad_session', JSON.stringify({ role: 'superadmin' }));
            return true;
        }
        // Fallback for legacy hardcoded (optional, can remove if confident)
        if ((u === 'superadmin' && p === 'superpassword')) {
            setIsSuperAdmin(true);
            setShowLanding(false);
            localStorage.setItem('mazad_session', JSON.stringify({ role: 'superadmin' }));
            return true;
        }
        
        for (const store of stores) {
            const employee = store.employees.find(e => e.username === u && e.password === p);
            if (employee) {
                setCurrentUser(employee);
                setCurrentStore(store);
                setShowLanding(false);
                // Persist session
                localStorage.setItem('mazad_session', JSON.stringify({ 
                    role: 'user', 
                    storeId: store.id, 
                    username: employee.username 
                }));
                return true;
            }
        }
        return false;
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setCurrentStore(null);
        setIsSuperAdmin(false);
        setShowLanding(true);
        setLandingView('main');
        localStorage.removeItem('mazad_session');
    };

    // Update Store Helper
    const updateCurrentStore = (updater: (store: Store) => Store) => {
        if (!currentStore) return;
        const updatedStore = updater(currentStore);
        setCurrentStore(updatedStore);
        setStores(prevStores => prevStores.map(s => s.id === updatedStore.id ? updatedStore : s));
    };

    // Helper to create handlers
    const createHandlers = () => ({
        // Inventory
        addProduct: (p: any) => updateCurrentStore(s => ({...s, products: [...s.products, { ...p, id: `PROD-${Date.now()}`, quantitySold: 0, quantityAvailable: p.initialQuantity }]})),
        
        // POS
        addSale: (sale: Omit<Sale, 'invoiceId'>) => updateCurrentStore(s => {
            // Update product quantity
             const updatedProducts = s.products.map(p => p.id === sale.productId ? { ...p, quantityAvailable: p.initialQuantity - (p.quantitySold || 0) - sale.quantity, quantitySold: (p.quantitySold || 0) + sale.quantity } : p);
             return {...s, products: updatedProducts, sales: [...s.sales, { ...sale, invoiceId: `INV-${Date.now()}` }]};
        }),
        addCustomer: (c: any) => {
            const newC = { ...c, id: `CUST-${Date.now()}`, joinDate: new Date().toISOString(), loyaltyPoints: 0, transactions: [] };
            updateCurrentStore(s => ({...s, customers: [...s.customers, newC]}));
            return newC;
        },
        
        // Generic update for MobileLayout
        updateStore: updateCurrentStore,
        updateStorePartial: (data: Partial<Store>) => updateCurrentStore(s => ({...s, ...data})),
        
        // Logging
        logActivity: (action: string) => updateCurrentStore(s => ({...s, activityLogs: [...(s.activityLogs || []), { id: `LOG-${Date.now()}`, timestamp: new Date().toISOString(), userId: currentUser?.id || 'unknown', username: currentUser?.username || 'unknown', action }]})),
        
        // Others... (simplified mapping for now)
        handleAddTransaction: (data: any) => { /* Simplified for mobile pos */ },
        addExpense: (e: any) => updateCurrentStore(s => ({...s, expenses: [...s.expenses, {...e, id: `EXP-${Date.now()}`}]})),
        addQuotation: (q: any) => updateCurrentStore(s => ({...s, quotations: [...s.quotations, {...q, id: `QT-${Date.now()}`, date: new Date().toISOString(), status: 'pending'}]})),
        updateQuotationStatus: (id: string, status: any) => updateCurrentStore(s => ({...s, quotations: s.quotations.map(q => q.id === id ? {...q, status} : q)})),
        convertQuotationToInvoice: (id: string) => { /* ... implementation ... */ },
        addService: (srv: any) => updateCurrentStore(s => ({...s, services: [...s.services, {...srv, orderId: `SRV-${Date.now()}`}]})),
        createTaxInvoice: (src: string, type: 'sale' | 'service') => updateCurrentStore(s => {
            // Check duplicates
            if (s.invoices.some(inv => inv.sourceId === src && inv.sourceType === type)) return s;

            let newInvoice: Invoice | null = null;
            const invoiceId = `TAX-${Date.now()}`;
            const dateNow = new Date().toISOString();

            if (type === 'sale') {
                const sale = s.sales.find(x => x.invoiceId === src);
                if (sale) {
                    const product = s.products.find(p => p.id === sale.productId);
                    const customer = s.customers.find(c => c.id === sale.customerId);
                    newInvoice = {
                        id: invoiceId,
                        sourceId: src,
                        sourceType: 'sale',
                        date: dateNow,
                        customerName: customer?.name || 'عميل عام',
                        items: [{
                            description: product?.name || 'منتج',
                            quantity: sale.quantity,
                            unitPrice: sale.unitPrice,
                            total: sale.subtotal
                        }],
                        subtotal: sale.subtotal,
                        taxRate: sale.taxRate,
                        taxAmount: sale.taxAmount,
                        total: sale.totalAmount,
                        amountPaid: sale.amountPaid,
                        remainingBalance: sale.remainingBalance,
                        zatcaStatus: 'pending'
                    };
                }
            } else if (type === 'service') {
                const service = s.services.find(x => x.orderId === src);
                if (service) {
                    const customer = s.customers.find(c => c.id === service.customerId);
                    newInvoice = {
                        id: invoiceId,
                        sourceId: src,
                        sourceType: 'service',
                        date: dateNow,
                        customerName: customer?.name || 'عميل عام',
                        items: [{
                            description: service.description,
                            quantity: 1,
                            unitPrice: service.revenue,
                            total: service.revenue
                        }],
                        subtotal: service.revenue,
                        taxRate: service.taxRate,
                        taxAmount: service.taxAmount,
                        total: service.totalAmount,
                        amountPaid: service.amountPaid,
                        remainingBalance: service.remainingBalance,
                        zatcaStatus: 'pending'
                    };
                }
            }

            if (newInvoice) {
                return { ...s, invoices: [...s.invoices, newInvoice] };
            }
            return s;
        }),
        updateInvoiceStatus: (id: string, status: any) => updateCurrentStore(s => ({...s, invoices: s.invoices.map(inv => inv.id === id ? {...inv, zatcaStatus: status} : inv)})),
        addSupplier: (sup: any) => updateCurrentStore(s => ({...s, suppliers: [...s.suppliers, {...sup, id: `SUP-${Date.now()}`}]})),
        updateSupplier: (sup: any) => updateCurrentStore(s => ({...s, suppliers: s.suppliers.map(x => x.id === sup.id ? sup : x)})),
        addPurchaseOrder: (po: any) => updateCurrentStore(s => ({...s, purchaseOrders: [...s.purchaseOrders, {...po, id: `PO-${Date.now()}`, status: 'pending', payments: []}]})),
        addPurchaseOrderPayment: (poId: string, payment: any) => updateCurrentStore(s => ({...s, purchaseOrders: s.purchaseOrders.map(po => po.id === poId ? {...po, payments: [...po.payments, {...payment, id: `PAY-${Date.now()}`}]} : po)})),
        updatePurchaseOrderStatus: (id: string, status: any) => updateCurrentStore(s => ({...s, purchaseOrders: s.purchaseOrders.map(po => po.id === id ? {...po, status} : po)})),
        addInstallmentPayment: (planId: string, payId: string, amount: number) => { /* ... */ },
        addPurchaseReturn: (pr: any) => updateCurrentStore(s => ({...s, purchaseReturns: [...s.purchaseReturns, {...pr, id: `PR-${Date.now()}`, date: new Date().toISOString(), status: 'pending'}]})),
        updateSaleReturnStatus: (id: string, st: any) => updateCurrentStore(s => ({...s, saleReturns: s.saleReturns.map(r => r.id === id ? {...r, status: st} : r)})),
        updatePurchaseReturnStatus: (id: string, st: any) => updateCurrentStore(s => ({...s, purchaseReturns: s.purchaseReturns.map(r => r.id === id ? {...r, status: st} : r)})),
        addTicket: (t: any) => updateCurrentStore(s => ({...s, supportTickets: [...(s.supportTickets||[]), {...t, id: `TKT-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), messages: []}]})),
        updateTicketStatus: (id: string, st: any, assigneeId?: string) => updateCurrentStore(s => ({...s, supportTickets: s.supportTickets.map(t => t.id === id ? {...t, status: st, assignedTo: assigneeId || t.assignedTo} : t)})),
        assignTicket: (id: string, empId: string) => updateCurrentStore(s => ({...s, supportTickets: s.supportTickets.map(t => t.id === id ? {...t, assignedTo: empId} : t)})),
        addTicketMessage: (id: string, msg: any) => updateCurrentStore(s => ({...s, supportTickets: s.supportTickets.map(t => t.id === id ? {...t, messages: [...t.messages, {...msg, id: `MSG-${Date.now()}`, timestamp: new Date().toISOString()}]} : t)})),
        addTreasury: (t: any) => updateCurrentStore(s => ({...s, treasuries: [...s.treasuries, {...t, id: `TR-${Date.now()}`, balance: t.initialBalance}]})),
        addBankAccount: (b: any) => updateCurrentStore(s => ({...s, bankAccounts: [...s.bankAccounts, {...b, id: `BK-${Date.now()}`, balance: b.initialBalance}]})),
        addFinancialTransaction: (tx: any) => updateCurrentStore(s => ({...s, financialTransactions: [...s.financialTransactions, {...tx, id: `TX-${Date.now()}`, status: 'pending'}]})),
        updateTransactionStatus: (id: string, st: any) => updateCurrentStore(s => ({...s, financialTransactions: s.financialTransactions.map(t => t.id === id ? {...t, status: st} : t)})),
        addJournalEntry: (je: any) => updateCurrentStore(s => ({...s, journalEntries: [...s.journalEntries, {...je, id: `JE-${Date.now()}`}]})),
        addAccount: (acc: any) => updateCurrentStore(s => ({...s, accounts: [...s.accounts, {...acc, id: `ACC-${Date.now()}`}]})),
        updateAccount: (acc: any) => updateCurrentStore(s => ({...s, accounts: s.accounts.map(a => a.id === acc.id ? acc : a)})),
        addCostCenter: (cc: any) => updateCurrentStore(s => ({...s, costCenters: [...s.costCenters, {...cc, id: `CC-${Date.now()}`}]})),
        addBudget: (bg: any) => updateCurrentStore(s => ({...s, budgets: [...s.budgets, {...bg, id: `BG-${Date.now()}`}]})),
        handleEnableModule: (mid: string) => updateCurrentStore(s => ({...s, enabledModules: [...s.enabledModules, mid]})),
        markAiMessagesAsRead: () => updateCurrentStore(s => ({...s, aiMessages: s.aiMessages.map(m => ({...m, read: true}))})),
    });

    const handlers = createHandlers();

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    if (showLanding) {
        if (landingView === 'about') return <AboutUs onBack={() => setLandingView('main')} />;
        if (landingView === 'privacy') return <PrivacyPolicy onBack={() => setLandingView('main')} />;
        if (landingView === 'terms') return <TermsAndConditions onBack={() => setLandingView('main')} />;
        return <LandingPage onNavigateToLogin={() => setShowLanding(false)} onNavigate={(page) => setLandingView(page as any)} />;
    }

    if (!currentUser && !isSuperAdmin) {
        return <Login onLogin={handleLogin} />;
    }

    if (isSuperAdmin) {
        return (
            <SuperAdminDashboard 
                stores={stores} 
                setStores={setStores} 
                onLogout={handleLogout}
                aiSettings={aiSettings}
                onUpdateAISettings={(s) => { setAiSettings(s); saveAISettings(s); }}
                marketplaceModules={marketplaceModules}
                onUpdateMarketplaceModule={(m) => {
                    const newModules = marketplaceModules.map(mod => mod.id === m.id ? m : mod);
                    setMarketplaceModules(newModules);
                    saveMarketplaceSettings(newModules);
                }}
                initialTemplates={webTemplates}
                initialBlocks={webBlocks}
                onUpdateTemplates={(t) => { setWebTemplates(t); saveBuilderAssets(t, webBlocks); }}
                onUpdateBlocks={(b) => { setWebBlocks(b); saveBuilderAssets(webTemplates, b); }}
                websitePlans={websitePlans}
                setWebsitePlans={setWebsitePlans}
                superAdminAccount={superAdminAccount}
                onUpdateSuperAdmin={updateSuperAdmin}
            />
        );
    }

    if (currentStore && currentUser) {
        // Check permissions
        const userRole = currentStore.roles.find(r => r.id === currentUser.roleId);
        const permissions = userRole?.permissions || [];
        const isAdmin = currentUser.roleId === 'admin';
        
        // Filter nav items based on permissions & enabled modules
        const availableModules = marketplaceModules.filter(m => 
            (currentStore.enabledModules.includes(m.id) || m.isCore) && 
            (isAdmin || permissions.includes(m.id) || permissions.includes('all'))
        );

        if (isMobile) {
            return (
                <MobileLayout 
                    store={currentStore} 
                    user={currentUser} 
                    activeView={activeView} 
                    setActiveView={setActiveView} 
                    onLogout={handleLogout}
                    handlers={handlers} // Pass the heavy lifting object
                    aiSettings={aiSettings}
                    modules={marketplaceModules} // Passing all to allow marketplace browsing
                />
            );
        }

        return (
            <div className="flex h-screen bg-gray-100">
                <Sidebar 
                    user={{...currentUser, role: userRole?.name || 'User', permissions}} 
                    activeView={activeView} 
                    setActiveView={setActiveView} 
                    onLogout={handleLogout} 
                    navItems={availableModules.map(m => ({ id: m.id, label: m.label }))}
                    unreadMessagesCount={currentStore.aiMessages?.filter(m => !m.read).length || 0}
                    unreadNotificationsCount={currentStore.notifications?.filter(n => !n.read).length || 0}
                />
                
                <main className="flex-1 overflow-y-auto p-8">
                    {/* Render Content Based on activeView */}
                    {activeView === 'dashboard' && (
                        <Dashboard 
                            store={currentStore}
                            products={currentStore.products as any} // Casting for intersection type
                            sales={currentStore.sales}
                            services={currentStore.services}
                            expenses={currentStore.expenses}
                            purchaseOrders={currentStore.purchaseOrders}
                            aiSettings={aiSettings}
                        />
                    )}
                     {activeView === 'pos' && (
                        <POS 
                            store={currentStore}
                            products={currentStore.products as any}
                            addSale={handlers.addSale}
                            sales={currentStore.sales}
                            customers={currentStore.customers}
                            addCustomer={handlers.addCustomer}
                            createTaxInvoice={handlers.createTaxInvoice}
                            updateInvoiceStatus={handlers.updateInvoiceStatus}
                            saleReturns={currentStore.saleReturns}
                            addSaleReturn={(r: any) => handlers.updateStore(s => ({...s, saleReturns: [...s.saleReturns, {...r, id: `RET-${Date.now()}`, date: new Date().toISOString(), status: 'pending'}]}))}
                            logActivity={handlers.logActivity}
                            taxRate={currentStore.billingSettings.taxRate}
                            invoices={currentStore.invoices}
                        />
                    )}
                    {activeView === 'inventory' && (
                        <Inventory 
                            store={currentStore}
                            products={currentStore.products as any}
                            addProduct={handlers.addProduct}
                            suppliers={currentStore.suppliers}
                            logActivity={handlers.logActivity}
                            inventoryMovements={currentStore.inventoryMovements}
                        />
                    )}
                    {activeView === 'invoicing' && (
                        <InvoicingModule 
                            store={currentStore} 
                            addQuotation={handlers.addQuotation} 
                            updateQuotationStatus={handlers.updateQuotationStatus} 
                            convertQuotationToInvoice={handlers.convertQuotationToInvoice} 
                        />
                    )}
                    {activeView === 'services' && (
                        <ServiceLog 
                            services={currentStore.services} 
                            addService={handlers.addService} 
                            createTaxInvoice={handlers.createTaxInvoice} 
                            logActivity={handlers.logActivity} 
                            customers={currentStore.customers} 
                            taxRate={currentStore.billingSettings.taxRate} 
                            invoices={currentStore.invoices} 
                        />
                    )}
                    {activeView === 'expenses' && (
                        <Expenses 
                            expenses={currentStore.expenses} 
                            addExpense={handlers.addExpense} 
                            logActivity={handlers.logActivity} 
                        />
                    )}
                    {activeView === 'financial-reports' && <FinancialDashboard store={currentStore} />}
                    {activeView === 'general-reports' && <GeneralReports products={currentStore.products} sales={currentStore.sales} services={currentStore.services} expenses={currentStore.expenses} aiSettings={aiSettings} />}
                    {activeView === 'hr-management' && <HRManagement store={currentStore} updateStore={handlers.updateStorePartial} />}
                    {activeView === 'customer-management' && (
                        <CustomerManagement 
                            customers={currentStore.customers} 
                            sales={currentStore.sales}
                            products={currentStore.products}
                            leads={currentStore.leads}
                            aiSettings={aiSettings}
                            addCustomer={handlers.addCustomer}
                            updateCustomer={(c) => handlers.updateStore(s => ({...s, customers: s.customers.map(x => x.id === c.id ? c : x)}))}
                            deleteCustomer={(id) => handlers.updateStore(s => ({...s, customers: s.customers.filter(x => x.id !== id)}))}
                            addCustomerTransaction={(id, t) => handlers.updateStore(s => ({...s, customers: s.customers.map(c => c.id === id ? {...c, transactions: [...c.transactions, {...t, id: `TRX-${Date.now()}`, date: new Date().toISOString()}]} : c)}))}
                            logActivity={handlers.logActivity}
                            addLead={(l) => handlers.updateStore(s => ({...s, leads: [...s.leads, {...l, id: `LEAD-${Date.now()}`, createdAt: new Date().toISOString(), interactions: [], tasks: []}]}))}
                            updateLeadStatus={(id, st) => handlers.updateStore(s => ({...s, leads: s.leads.map(l => l.id === id ? {...l, status: st} : l)}))}
                            addCRMInteraction={(id, i) => handlers.updateStore(s => ({...s, leads: s.leads.map(l => l.id === id ? {...l, interactions: [...l.interactions, {...i, id: `INT-${Date.now()}`}]} : l)}))}
                            addCRMTask={(id, t) => handlers.updateStore(s => ({...s, leads: s.leads.map(l => l.id === id ? {...l, tasks: [...l.tasks, {...t, id: `TSK-${Date.now()}`}]} : l)}))}
                            updateLeadAI={(id, data) => handlers.updateStore(s => ({...s, leads: s.leads.map(l => l.id === id ? {...l, ...data} : l)}))}
                        />
                    )}
                    {activeView === 'suppliers-management' && (
                        <SuppliersManagement 
                            suppliers={currentStore.suppliers} 
                            products={currentStore.products} 
                            sales={currentStore.sales} 
                            purchaseOrders={currentStore.purchaseOrders} 
                            purchaseReturns={currentStore.purchaseReturns} 
                            addSupplier={handlers.addSupplier} 
                            updateSupplier={handlers.updateSupplier} 
                            addPurchaseOrder={handlers.addPurchaseOrder} 
                            addPurchaseOrderPayment={handlers.addPurchaseOrderPayment} 
                            updatePurchaseOrderStatus={handlers.updatePurchaseOrderStatus} 
                            logActivity={handlers.logActivity} 
                        />
                    )}
                    {activeView === 'ai-assistant' && <AIMessages messages={currentStore.aiMessages} markAllAsRead={handlers.markAiMessagesAsRead} />}
                    {activeView === 'user-guide' && <UserGuide enabledModules={currentStore.enabledModules} />}
                    {activeView === 'installments' && <Installments store={currentStore} addInstallmentPayment={handlers.addInstallmentPayment} />}
                    {activeView === 'activity-log' && <ActivityLog logs={currentStore.activityLogs} employees={currentStore.employees} />}
                    {activeView === 'returns-refunds' && (
                        <ReturnsRefunds 
                            store={currentStore} 
                            addPurchaseReturn={handlers.addPurchaseReturn} 
                            updateSaleReturnStatus={handlers.updateSaleReturnStatus} 
                            updatePurchaseReturnStatus={handlers.updatePurchaseReturnStatus} 
                            logActivity={handlers.logActivity} 
                        />
                    )}
                    {activeView === 'notifications-center' && (
                        <NotificationsCenter 
                            notifications={currentStore.notifications} 
                            markAsRead={(id) => handlers.updateStore(s => ({...s, notifications: s.notifications.map(n => n.id === id ? {...n, read: true} : n)}))} 
                            markAllAsRead={() => handlers.updateStore(s => ({...s, notifications: s.notifications.map(n => ({...n, read: true}))}))}
                            deleteNotification={(id) => handlers.updateStore(s => ({...s, notifications: s.notifications.filter(n => n.id !== id)}))}
                        />
                    )}
                    {activeView === 'support-ticketing' && (
                        <SupportTicketing 
                            store={currentStore} 
                            currentUser={currentUser} 
                            tickets={currentStore.supportTickets || []} 
                            employees={currentStore.employees} 
                            addTicket={handlers.addTicket} 
                            updateTicketStatus={handlers.updateTicketStatus} 
                            assignTicket={handlers.assignTicket} 
                            addTicketMessage={handlers.addTicketMessage} 
                        />
                    )}
                    {activeView === 'treasury-banking' && (
                        <TreasuryBanking 
                            store={currentStore} 
                            addTreasury={handlers.addTreasury} 
                            addBankAccount={handlers.addBankAccount} 
                            addFinancialTransaction={handlers.addFinancialTransaction} 
                            updateTransactionStatus={handlers.updateTransactionStatus} 
                        />
                    )}
                    {activeView === 'general-ledger' && (
                        <GeneralLedger 
                            store={currentStore} 
                            addJournalEntry={handlers.addJournalEntry} 
                            addAccount={handlers.addAccount} 
                            updateAccount={handlers.updateAccount} 
                            addCostCenter={handlers.addCostCenter} 
                            addBudget={handlers.addBudget} 
                            aiSettings={aiSettings} 
                        />
                    )}
                    {activeView === 'customer-service-ai' && (
                        <CustomerServiceAI 
                            store={currentStore} 
                            updateStore={handlers.updateStorePartial} 
                            aiSettings={aiSettings} 
                        />
                    )}
                    {activeView === 'marketplace' && (
                         <ModuleMarketplace 
                            availableModules={marketplaceModules} 
                            userStore={currentStore} 
                            onEnableModule={handlers.handleEnableModule} 
                        />
                    )}
                    {activeView === 'system-support' && <StoreSystemSupport store={currentStore} currentUser={currentUser} onUpdateStore={handlers.updateStore} />}
                    {activeView === 'website-builder' && (
                         <WebsiteBuilder 
                            store={currentStore} 
                            updateStore={handlers.updateStorePartial} 
                            availableTemplates={webTemplates} 
                            availableBlocks={webBlocks} 
                            availablePlans={websitePlans} 
                        />
                    )}
                    
                    {/* Default fallback if view not found */}
                    {!['dashboard', 'pos', 'inventory', 'invoicing', 'services', 'expenses', 'financial-reports', 'general-reports', 'hr-management', 'customer-management', 'suppliers-management', 'ai-assistant', 'user-guide', 'installments', 'activity-log', 'returns-refunds', 'notifications-center', 'support-ticketing', 'treasury-banking', 'general-ledger', 'customer-service-ai', 'marketplace', 'system-support', 'website-builder'].includes(activeView) && (
                         <div className="p-8 text-center text-gray-500">
                             الصفحة المطلوبة غير متوفرة أو قيد التطوير. ({activeView})
                         </div>
                    )}
                </main>
            </div>
        );
    }
    
    return null;
};

export default App;
