
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
import type { Store, Employee, AISettings, ModuleDefinition, WebTemplate, BlockDefinition, BuilderPlan, Sale, Customer } from './types';
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

const App: React.FC = () => {
    const [stores, setStores] = useState<Store[]>([]);
    const [currentUser, setCurrentUser] = useState<Employee | null>(null);
    const [currentStore, setCurrentStore] = useState<Store | null>(null);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    
    // Super Admin Credentials State
    // Initialize with defaults, in a real app load from DB or secure storage
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
    
    // Website Builder Assets (loaded from DB or defaults)
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
            if (loadedStores) setStores(loadedStores);

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

            // Ideally load super admin creds here too
            const savedAdmin = localStorage.getItem('superAdminAccount');
            if (savedAdmin) {
                try {
                    setSuperAdminAccount(JSON.parse(savedAdmin));
                } catch (e) { console.error('Failed to parse admin creds'); }
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
            return true;
        }
        // Fallback for legacy hardcoded (optional, can remove if confident)
        if ((u === 'superadmin' && p === 'superpassword')) {
            setIsSuperAdmin(true);
            setShowLanding(false);
            return true;
        }
        
        for (const store of stores) {
            const employee = store.employees.find(e => e.username === u && e.password === p);
            if (employee) {
                setCurrentUser(employee);
                setCurrentStore(store);
                setShowLanding(false);
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
        createTaxInvoice: (src: string, type: string) => { /* ... implementation ... */ },
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
