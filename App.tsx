
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import POS from './components/POS';
import InvoicingModule from './components/InvoicingModule';
import ServiceLog from './components/ServiceLog';
import Expenses from './components/Expenses';
import FinancialDashboard from './components/FinancialDashboard';
import GeneralReports from './components/GeneralReports';
import HRManagement from './components/HRManagement';
import CustomerManagement from './components/CustomerManagement';
import SuppliersManagement from './components/SuppliersManagement';
import AIAssistant from './components/AIAssistant';
import AIMessages from './components/AIMessages';
import UserGuide from './components/UserGuide';
import Installments from './components/Installments';
import ActivityLogComponent from './components/ActivityLog';
import ReturnsRefunds from './components/ReturnsRefunds';
import NotificationsCenter from './components/NotificationsCenter';
import SupportTicketing from './components/SupportTicketing';
import TreasuryBanking from './components/TreasuryBanking';
import GeneralLedger from './components/GeneralLedger';
import ModuleMarketplace from './components/ModuleMarketplace';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import CustomerServiceAI from './components/CustomerServiceAI';
import StoreSystemSupport from './components/StoreSystemSupport';
import WebsiteBuilder from './components/WebsiteBuilder/WebsiteBuilder';
import PublicSiteRenderer from './components/WebsiteBuilder/PublicSiteRenderer';

import { initDB, loadStores, saveStores, loadAISettings, saveAISettings, loadMarketplaceSettings, saveMarketplaceSettings, loadBuilderAssets, saveBuilderAssets } from './services/db';
import { getAiSuggestions } from './services/geminiService';
import type { Store, Employee, AISettings, ModuleDefinition, CostCenter, ActivityLog, SupportTicket, TicketMessage, TicketStatus, JournalEntry, JournalLine, OnlineOrder, WebTemplate, BlockDefinition } from './types';

const DEFAULT_MODULES: ModuleDefinition[] = [
    { id: 'dashboard', label: 'لوحة التحكم', description: 'نظرة عامة على أداء المتجر', price: 0, category: 'basic', isCore: true, isVisible: true },
    { id: 'pos', label: 'نقطة البيع (POS)', description: 'إدارة المبيعات اليومية', price: 0, category: 'basic', isCore: true, isVisible: true },
    { id: 'inventory', label: 'المخزون', description: 'تتبع المنتجات والكميات', price: 0, category: 'basic', isCore: true, isVisible: true },
    { id: 'expenses', label: 'المصروفات', description: 'تسجيل المصاريف التشغيلية', price: 0, category: 'basic', isCore: true, isVisible: true },
    { id: 'invoicing', label: 'الفواتير وعروض الأسعار', description: 'إصدار الفواتير وعروض الأسعار', price: 0, category: 'basic', isCore: true, isVisible: true },
    { id: 'services', label: 'الصيانة', description: 'إدارة طلبات الصيانة', price: 100, category: 'advanced', isCore: false, isVisible: true },
    { id: 'customer-management', label: 'إدارة العملاء (CRM)', description: 'قاعدة بيانات العملاء والديون', price: 150, category: 'advanced', isCore: false, isVisible: true },
    { id: 'suppliers-management', label: 'الموردين', description: 'إدارة الموردين والمشتريات', price: 100, category: 'advanced', isCore: false, isVisible: true },
    { id: 'hr-management', label: 'الموارد البشرية', description: 'شؤون الموظفين والرواتب', price: 200, category: 'premium', isCore: false, isVisible: true },
    { id: 'financial-reports', label: 'التقارير المالية', description: 'تحليل مالي متقدم', price: 250, category: 'premium', isCore: false, isVisible: true },
    { id: 'general-reports', label: 'التقارير العامة', description: 'تقارير المبيعات والمخزون', price: 0, category: 'basic', isCore: true, isVisible: true },
    { id: 'ai-assistant', label: 'المساعد الذكي', description: 'رؤى ونصائح بالذكاء الاصطناعي', price: 300, category: 'premium', isCore: false, isVisible: true },
    { id: 'installments', label: 'التقسيط', description: 'إدارة مبيعات التقسيط', price: 150, category: 'advanced', isCore: false, isVisible: true },
    { id: 'returns-refunds', label: 'المرتجعات', description: 'إدارة المردودات', price: 50, category: 'basic', isCore: false, isVisible: true },
    { id: 'activity-log', label: 'سجل الحركات', description: 'مراقبة نشاط المستخدمين', price: 100, category: 'advanced', isCore: false, isVisible: true },
    { id: 'notifications-center', label: 'مركز الإشعارات', description: 'تنبيهات النظام والمخزون', price: 0, category: 'basic', isCore: true, isVisible: true },
    { id: 'support-ticketing', label: 'الدعم الفني والبلاغات', description: 'نظام تذاكر الدعم الداخلي', price: 150, category: 'advanced', isCore: false, isVisible: true },
    { id: 'treasury-banking', label: 'الخزينة والبنوك', description: 'إدارة السيولة والحسابات البنكية', price: 200, category: 'premium', isCore: false, isVisible: true },
    { id: 'general-ledger', label: 'دفتر الأستاذ (GL)', description: 'المحاسبة العامة والقيود', price: 300, category: 'premium', isCore: false, isVisible: true },
    { id: 'customer-service-ai', label: 'ذكاء خدمة العملاء', description: 'بوت واتساب وتحليل محادثات', price: 200, category: 'advanced', isCore: false, isVisible: true },
    { id: 'website-builder', label: 'بناء المتجر الإلكتروني', description: 'أنشئ موقعاً تعريفياً أو متجراً للبيع أونلاين', price: 400, category: 'premium', isCore: false, isVisible: true },
    { id: 'user-guide', label: 'دليل المستخدم', description: 'شرح استخدام النظام', price: 0, category: 'basic', isCore: true, isVisible: true },
];

const DEFAULT_AI_SETTINGS: AISettings = {
    model: 'gemini-2.5-flash',
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    enableSuggestions: true,
    enableDashboardInsights: true,
    enableReportAnalysis: true,
    systemInstructions: 'أنت مساعد ذكي في نظام إدارة موارد المؤسسات (ERP) المخصص لمتاجر التجزئة والصيانة...'
};

// --- Default Builder Assets ---
const DEFAULT_TEMPLATES: WebTemplate[] = [
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
    }
];

const DEFAULT_BLOCK_DEFINITIONS: BlockDefinition[] = [
    { id: 'hero-def', type: 'hero', label: 'واجهة رئيسية (Hero)', icon: '🖼️', category: 'marketing', isPremium: false, defaultContent: { title: 'عنوان رئيسي جديد', subtitle: 'أضف وصفاً جذاباً هنا', buttonText: 'اضغط هنا' }, defaultStyle: { padding: '2rem', backgroundColor: '#ffffff', textAlign: 'center' } },
    { id: 'text-def', type: 'text', label: 'محتوى نصي', icon: '📝', category: 'basic', isPremium: false, defaultContent: { text: 'اكتب النص الخاص بك هنا...' }, defaultStyle: { padding: '2rem', backgroundColor: '#ffffff' } },
    { id: 'product-grid-def', type: 'product_grid', label: 'شبكة منتجات', icon: '🛍️', category: 'commerce', isPremium: false, defaultContent: { title: 'منتجات مختارة', limit: 4 }, defaultStyle: { padding: '2rem' } },
    { id: 'features-def', type: 'features', label: 'المميزات والخدمات', icon: '✨', category: 'marketing', isPremium: false, defaultContent: { title: 'مميزاتنا' }, defaultStyle: { padding: '2rem' } },
    { id: 'contact-form-def', type: 'contact_form', label: 'نموذج تواصل', icon: '📧', category: 'basic', isPremium: false, defaultContent: { title: 'تواصل معنا' }, defaultStyle: { padding: '2rem' } },
    { id: 'footer-def', type: 'footer', label: 'تذييل الصفحة', icon: '🦶', category: 'basic', isPremium: false, defaultContent: { copyright: `© ${new Date().getFullYear()} جميع الحقوق محفوظة.` }, defaultStyle: { backgroundColor: '#111827', color: '#ffffff' } },
    // Premium
    { id: 'video-def', type: 'video', label: 'مشغل فيديو', icon: '🎬', category: 'marketing', isPremium: true, defaultContent: { videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', title: 'فيديو مميز' }, defaultStyle: { padding: '2rem' } },
    { id: 'testimonials-def', type: 'testimonials', label: 'آراء العملاء', icon: '💬', category: 'marketing', isPremium: true, defaultContent: { title: 'آراء العملاء', items: [{name: 'عميل', text: 'خدمة رائعة', role: 'مشتري'}] }, defaultStyle: { padding: '2rem' } },
];

const App: React.FC = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [marketplaceModules, setMarketplaceModules] = useState<ModuleDefinition[]>(DEFAULT_MODULES);
  const [aiSettings, setAiSettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);
  const [isDbInitialized, setIsDbInitialized] = useState(false);
  
  // Builder Assets State
  const [websiteTemplates, setWebsiteTemplates] = useState<WebTemplate[]>(DEFAULT_TEMPLATES);
  const [websiteBlocks, setWebsiteBlocks] = useState<BlockDefinition[]>(DEFAULT_BLOCK_DEFINITIONS);

  // Public view state
  const [viewingPublicSite, setViewingPublicSite] = useState<{storeId: string} | null>(null);

  // --- Initialization ---
  useEffect(() => {
    const init = async () => {
      try {
        await initDB();
        setIsDbInitialized(true);
        const loadedStores = await loadStores();
        const loadedAiSettings = await loadAISettings();
        const loadedMarketplace = await loadMarketplaceSettings();
        const loadedBuilderAssets = await loadBuilderAssets();
        
        if (loadedStores && loadedStores.length > 0) {
             // --- DATA MIGRATION / FIX ---
             const patchedStores = loadedStores.map(store => {
                 let updatedStore = { ...store };
                 
                 // 1. Enable new core modules if missing
                 const coreModules = ['treasury-banking', 'notifications-center', 'user-guide'];
                 const missingModules = coreModules.filter(m => !updatedStore.enabledModules.includes(m));
                 if (missingModules.length > 0) {
                     updatedStore.enabledModules = [...updatedStore.enabledModules, ...missingModules];
                 }
                 // 2. Grant permission to Admin role if missing
                 updatedStore.roles = updatedStore.roles.map(role => {
                     if (role.id === 'admin') {
                         const missingPerms = coreModules.filter(m => !role.permissions.includes(m));
                         if (missingPerms.length > 0) {
                             return { ...role, permissions: [...role.permissions, ...missingPerms] };
                         }
                     }
                     return role;
                 });
                 if (!updatedStore.csConversations) updatedStore.csConversations = [];
                 if (!updatedStore.csBotSettings) updatedStore.csBotSettings = { enableWhatsApp: false, enableMessenger: false, welcomeMessage: "", autoReplyEnabled: false };
                 if (!updatedStore.betaFeatures) updatedStore.betaFeatures = [];
                 if (!updatedStore.onlineOrders) updatedStore.onlineOrders = []; 
                 if (!updatedStore.plan) updatedStore.plan = 'free'; // Init plan

                 return updatedStore;
             });

            setStores(patchedStores);
            saveStores(patchedStores);
        } else {
            // --- SEED DEFAULT DEMO STORE ---
            const defaultStore: Store = {
                id: 'demo-store-001',
                name: 'متجر نبراس النموذجي',
                ownerName: 'مدير النظام',
                ownerPhone: '0500000000',
                ownerEmail: 'admin@nebras.com',
                subscriptionStartDate: new Date().toISOString(),
                subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
                subscriptionMonthlyPrice: 0,
                storeType: 'متجر شامل',
                plan: 'pro', // Give demo store Pro plan
                enabledModules: DEFAULT_MODULES.map(m => m.id), // Enable ALL modules
                betaFeatures: [],
                products: [
                    { id: 'p1', name: 'iPhone 15 Pro', category: 'موبايل', costPrice: 3500, sellPrice: 4200, initialQuantity: 20, supplierId: 'sup1' },
                    { id: 'p2', name: 'Samsung S24 Ultra', category: 'موبايل', costPrice: 3200, sellPrice: 3900, initialQuantity: 15, supplierId: 'sup1' },
                    { id: 'p3', name: 'AirPods Pro', category: 'إكسسوار', costPrice: 600, sellPrice: 900, initialQuantity: 30, supplierId: 'sup2' },
                    { id: 'p4', name: 'شاحن 20W', category: 'إكسسوار', costPrice: 50, sellPrice: 100, initialQuantity: 100, supplierId: 'sup2' }
                ],
                suppliers: [
                    { id: 'sup1', name: 'المورد الأول للتقنية', contactPerson: 'أحمد', phone: '0511111111', email: 'supplier1@tech.com', address: 'الرياض' },
                    { id: 'sup2', name: 'عالم الإكسسوارات', contactPerson: 'خالد', phone: '0522222222', email: 'acc@tech.com', address: 'جدة' }
                ],
                customers: [
                    { id: 'cust1', name: 'عميل مميز', phone: '0533333333', email: 'vip@client.com', joinDate: new Date().toISOString(), loyaltyPoints: 150, transactions: [], address: 'الدمام', segment: 'vip' },
                    { id: 'cust2', name: 'عميل جديد', phone: '0544444444', email: 'new@client.com', joinDate: new Date().toISOString(), loyaltyPoints: 0, transactions: [], address: 'الخبر', segment: 'new' }
                ],
                employees: [
                    { id: 'emp1', username: 'admin', password: 'password', roleId: 'admin', fullName: 'مدير المتجر', phone: '0500000000', hireDate: new Date().toISOString(), baseSalary: 8000 },
                    { id: 'emp2', username: 'cashier', password: '123', roleId: 'sales', fullName: 'موظف مبيعات', phone: '0500000001', hireDate: new Date().toISOString(), baseSalary: 4000 }
                ],
                roles: [
                    { id: 'admin', name: 'مدير النظام', permissions: DEFAULT_MODULES.map(m => m.id).concat(['all']) },
                    { id: 'sales', name: 'مبيعات', permissions: ['dashboard', 'pos', 'customer-management'] }
                ],
                sales: [],
                services: [],
                expenses: [],
                purchaseOrders: [],
                paymentHistory: [],
                aiMessages: [],
                billingSettings: { storeName: 'متجر نبراس النموذجي', taxNumber: '300123456700003', taxRate: 15, address: 'الرياض، المملكة العربية السعودية', phone: '920000000' },
                invoices: [],
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
                treasuries: [{ id: 'trs1', name: 'الخزينة الرئيسية', balance: 10000, description: 'النقدية اليومية' }],
                bankAccounts: [{ id: 'bnk1', bankName: 'مصرف الراجحي', accountNumber: 'SA1234567890123456789012', balance: 150000, currency: 'SAR' }],
                financialTransactions: [],
                accounts: [
                    { id: '101', code: '1010', name: 'النقدية بالصندوق', type: 'Asset', isSystem: true },
                    { id: '102', code: '1020', name: 'البنك', type: 'Asset', isSystem: true },
                    { id: '103', code: '1030', name: 'المخزون', type: 'Asset', isSystem: true },
                    { id: '401', code: '4010', name: 'إيرادات المبيعات', type: 'Revenue', isSystem: true },
                    { id: '501', code: '5010', name: 'تكلفة البضاعة المباعة', type: 'Expense', isSystem: true },
                    { id: '502', code: '5020', name: 'رواتب وأجور', type: 'Expense', isSystem: true },
                    { id: '503', code: '5030', name: 'مصروفات تشغيلية', type: 'Expense', isSystem: true }
                ],
                journalEntries: [],
                costCenters: [],
                budgets: [],
                csConversations: [],
                csBotSettings: { enableWhatsApp: false, enableMessenger: false, welcomeMessage: "", autoReplyEnabled: false },
                onlineOrders: []
            };
            setStores([defaultStore]);
        }

        if (loadedAiSettings) setAiSettings(loadedAiSettings);
        if (loadedMarketplace) {
            const mergedModules = DEFAULT_MODULES.map(defMod => {
                const existing = loadedMarketplace.find(m => m.id === defMod.id);
                return existing ? { ...existing, isCore: defMod.isCore, isVisible: existing.isVisible ?? defMod.isVisible } : defMod;
            });
            setMarketplaceModules(mergedModules);
        }
        
        if (loadedBuilderAssets) {
             if (loadedBuilderAssets.templates && loadedBuilderAssets.templates.length > 0) {
                 setWebsiteTemplates(loadedBuilderAssets.templates);
             }
             if (loadedBuilderAssets.blocks && loadedBuilderAssets.blocks.length > 0) {
                 setWebsiteBlocks(loadedBuilderAssets.blocks);
             }
        }

      } catch (error) {
        console.error("DB Initialization Failed:", error);
      }
    };
    init();

    // Check for "Public View" simulated route hash: #site/{storeId}
    const checkHash = () => {
        const hash = window.location.hash;
        if (hash.startsWith('#site/')) {
            const storeId = hash.split('/')[1];
            if (storeId) setViewingPublicSite({ storeId });
        } else {
            setViewingPublicSite(null);
        }
    };

    window.addEventListener('hashchange', checkHash);
    checkHash(); // Check on load

    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  // --- Persistence ---
  useEffect(() => {
    if (isDbInitialized && stores.length > 0) saveStores(stores);
  }, [stores, isDbInitialized]);

  useEffect(() => {
      if (isDbInitialized) saveAISettings(aiSettings);
  }, [aiSettings, isDbInitialized]);

  useEffect(() => {
      if (isDbInitialized) saveMarketplaceSettings(marketplaceModules);
  }, [marketplaceModules, isDbInitialized]);

  // Persist Builder Assets
  useEffect(() => {
      if (isDbInitialized) {
          saveBuilderAssets(websiteTemplates, websiteBlocks);
      }
  }, [websiteTemplates, websiteBlocks, isDbInitialized]);


  // --- Login Logic ---
  const handleLogin = (username: string, password: string): boolean => {
    if (username === 'superadmin' && password === 'superpassword') {
        setIsSuperAdmin(true);
        return true;
    }
    for (const store of stores) {
        const employee = store.employees.find(e => e.username === username && e.password === password);
        if (employee) {
            if (new Date(store.subscriptionEndDate) < new Date()) {
                alert('عفواً، انتهت صلاحية اشتراك هذا المتجر. يرجى التواصل مع الإدارة.');
                return false;
            }
            setCurrentStore(store);
            setCurrentUser(employee);
            return true;
        }
    }
    return false;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentStore(null);
    setIsSuperAdmin(false);
    setActiveView('dashboard');
  };

  // --- Store Data Updaters ---
  const updateStoreData = (updater: (store: Store) => Store) => {
      if (!currentStore) return;
      const updatedStore = updater(currentStore);
      setCurrentStore(updatedStore); 
      setStores(prevStores => prevStores.map(s => s.id === updatedStore.id ? updatedStore : s));
  };
  
  const updateStorePartial = (updatedData: Partial<Store>) => {
      if (!currentStore) return;
      const updatedStore = { ...currentStore, ...updatedData };
      setCurrentStore(updatedStore);
      setStores(prevStores => prevStores.map(s => s.id === updatedStore.id ? updatedStore : s));
  };
  
  const logActivity = (action: string) => {
      if (!currentStore || !currentUser) return;
      const newLog: ActivityLog = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          userId: currentUser.id,
          username: currentUser.username,
          action
      };
      updateStoreData(s => ({ ...s, activityLogs: [newLog, ...s.activityLogs] }));
  };

  const createAutoJournalEntry = (date: string, description: string, lines: JournalLine[]): JournalEntry => {
      return {
          id: `JE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          date,
          description,
          lines,
          isAutoGenerated: true
      };
  };

  // --- Handlers for Modules ---
  const handleAddSale = (sale: any) => {
      updateStoreData(s => {
          const newInvoiceId = `INV-${Date.now()}`;
          const updatedProducts = s.products.map(p => {
              if (p.id === sale.productId) {
                  return { ...p, initialQuantity: p.initialQuantity };
              }
              return p;
          });
          const movement = {
              id: `MOV-${Date.now()}`,
              date: sale.date,
              productId: sale.productId,
              type: 'sale' as const,
              quantity: -sale.quantity,
              referenceId: newInvoiceId,
              notes: `بيع فاتورة #${newInvoiceId}`
          };
          let newInstallmentPlans = s.installmentPlans;
          if (sale.paymentMethod === 'installment' && sale.installmentDetails && sale.customerId) {
             const plan = {
                 id: `PLAN-${Date.now()}`,
                 sourceId: newInvoiceId,
                 sourceType: 'sale' as const,
                 customerId: sale.customerId,
                 totalFinancedAmount: sale.remainingBalance,
                 totalRepaymentAmount: sale.remainingBalance * (1 + sale.installmentDetails.interestRate/100),
                 interestRate: sale.installmentDetails.interestRate,
                 numberOfInstallments: sale.installmentDetails.numberOfInstallments,
                 installmentAmount: (sale.remainingBalance * (1 + sale.installmentDetails.interestRate/100)) / sale.installmentDetails.numberOfInstallments,
                 startDate: sale.date,
                 payments: Array.from({length: sale.installmentDetails.numberOfInstallments}).map((_, i) => {
                     const dueDate = new Date(sale.date);
                     dueDate.setMonth(dueDate.getMonth() + i + 1);
                     return {
                         id: `INST-${Date.now()}-${i}`,
                         dueDate: dueDate.toISOString(),
                         amountDue: (sale.remainingBalance * (1 + sale.installmentDetails.interestRate/100)) / sale.installmentDetails.numberOfInstallments,
                         paidAmount: 0,
                         paymentDate: null,
                         status: 'due' as const
                     };
                 })
             };
             newInstallmentPlans = [...newInstallmentPlans, plan];
          }
          let updatedCustomers = s.customers;
          if (sale.customerId) {
              updatedCustomers = s.customers.map(c => {
                  if (c.id === sale.customerId) {
                      const newPoints = c.loyaltyPoints + Math.floor(sale.totalAmount / 10);
                      const newTransactions = [...c.transactions];
                      if (sale.remainingBalance > 0) {
                           newTransactions.push({
                               id: `TRX-${Date.now()}`,
                               date: sale.date,
                               type: 'debt',
                               amount: sale.remainingBalance,
                               description: `متبقي فاتورة #${newInvoiceId}`
                           });
                      }
                      return { ...c, loyaltyPoints: newPoints, transactions: newTransactions };
                  }
                  return c;
              });
          }
          const product = s.products.find(p => p.id === sale.productId);
          const costAmount = (product?.costPrice || 0) * sale.quantity;
          const debitAccount = ['card', 'bank_transfer'].includes(sale.paymentMethod) ? '102' : '101';
          const glEntry = createAutoJournalEntry(sale.date, `بيع فاتورة #${newInvoiceId}`, [
               { accountId: debitAccount, debit: sale.totalAmount, credit: 0 },
               { accountId: '401', debit: 0, credit: sale.totalAmount },
               { accountId: '501', debit: costAmount, credit: 0 },
               { accountId: '103', debit: 0, credit: costAmount }
          ]);
          return {
              ...s,
              sales: [...s.sales, { ...sale, invoiceId: newInvoiceId }],
              inventoryMovements: [...s.inventoryMovements, movement],
              installmentPlans: newInstallmentPlans,
              customers: updatedCustomers,
              journalEntries: [...s.journalEntries, glEntry]
          };
      });
      logActivity(`إضافة عملية بيع جديدة (منتج: ${sale.productId})`);
  };

  const handleAddProduct = (product: any) => {
      updateStoreData(s => ({
          ...s,
          products: [...s.products, { ...product, id: (Date.now()).toString() }],
          inventoryMovements: [...s.inventoryMovements, {
              id: `MOV-${Date.now()}`,
              date: new Date().toISOString(),
              productId: (Date.now()).toString(), 
              type: 'initial',
              quantity: product.initialQuantity,
              notes: 'رصيد افتتاحي'
          }]
      }));
      logActivity(`إضافة منتج جديد: ${product.name}`);
  };

  const handleAddCustomer = (customer: any) => {
      const newCustomer = { ...customer, id: (Date.now()).toString(), joinDate: new Date().toISOString(), loyaltyPoints: 0, transactions: [] };
      updateStoreData(s => ({ ...s, customers: [...s.customers, newCustomer] }));
      logActivity(`إضافة عميل جديد: ${customer.name}`);
      return newCustomer;
  };

  const handleEnableModule = (moduleId: string) => {
      updateStoreData(s => ({ ...s, enabledModules: [...s.enabledModules, moduleId] }));
      logActivity(`تفعيل مديول: ${moduleId}`);
  };

  const handlePublicOrder = (storeId: string, order: OnlineOrder) => {
      setStores(prev => prev.map(store => {
          if (store.id === storeId) {
              // Add notification for store owner
              const notification = {
                  id: `NOTIF-${Date.now()}`,
                  type: 'online_order' as const,
                  title: 'طلب أونلاين جديد',
                  message: `طلب جديد من ${order.customerName} بقيمة ${order.totalAmount.toLocaleString()}`,
                  timestamp: new Date().toISOString(),
                  read: false,
                  priority: 'high' as const,
                  actionLink: 'website-builder'
              };
              return {
                  ...store,
                  onlineOrders: [...(store.onlineOrders || []), order],
                  notifications: [notification, ...(store.notifications || [])]
              };
          }
          return store;
      }));
  };


  // --- View Selection ---
  if (viewingPublicSite) {
      const store = stores.find(s => s.id === viewingPublicSite.storeId);
      if (!store) return <div className="p-10 text-center">المتجر غير موجود.</div>;
      return (
          <PublicSiteRenderer 
              store={store} 
              onBack={() => { window.location.hash = ''; }} 
              onNewOrder={(order) => handlePublicOrder(store.id, order)}
          />
      );
  }

  if (isSuperAdmin) {
      return (
          <SuperAdminDashboard 
              stores={stores} 
              setStores={setStores} 
              onLogout={handleLogout} 
              aiSettings={aiSettings}
              onUpdateAISettings={setAiSettings}
              marketplaceModules={marketplaceModules}
              onUpdateMarketplaceModule={(updatedMod) => setMarketplaceModules(prev => prev.map(m => m.id === updatedMod.id ? updatedMod : m))}
              initialTemplates={websiteTemplates}
              initialBlocks={websiteBlocks}
              onUpdateTemplates={setWebsiteTemplates}
              onUpdateBlocks={setWebsiteBlocks}
          />
      );
  }

  if (!currentUser || !currentStore) {
    return <Login onLogin={handleLogin} />;
  }

  const enabledModuleDefs = marketplaceModules.filter(m => currentStore.enabledModules.includes(m.id) || m.isCore);
  const userRole = currentStore.roles.find(r => r.id === currentUser.roleId);
  const navItems = enabledModuleDefs.filter(m => 
      userRole?.permissions.includes(m.id) || 
      userRole?.permissions.includes('all') || 
      m.id === 'dashboard' ||
      (m.isCore && currentUser.roleId === 'admin')
  ); 
  
  const unreadMessagesCount = currentStore.aiMessages.filter(m => !m.read).length;
  const unreadNotificationsCount = currentStore.notifications?.filter(n => !n.read).length || 0;

  return (
    <div className="flex h-screen bg-gray-100 font-sans" dir="rtl">
      <Sidebar 
        user={{ ...currentUser, role: userRole?.name || '', permissions: userRole?.permissions || [] }} 
        activeView={activeView} 
        setActiveView={setActiveView} 
        onLogout={handleLogout}
        navItems={navItems}
        unreadMessagesCount={unreadMessagesCount}
        unreadNotificationsCount={unreadNotificationsCount}
      />
      
      <main className="flex-1 overflow-y-auto p-6 relative">
        {activeView === 'dashboard' && (
            <Dashboard 
                store={currentStore}
                products={currentStore.products.map(p => ({
                    ...p,
                    quantitySold: currentStore.sales.filter(s => s.productId === p.id).reduce((acc, s) => acc + s.quantity, 0),
                    quantityAvailable: p.initialQuantity - currentStore.sales.filter(s => s.productId === p.id).reduce((acc, s) => acc + s.quantity, 0) + currentStore.purchaseOrders.filter(po => po.status === 'received').reduce((acc, po) => acc + (po.items.find(i => i.productId === p.id)?.quantity || 0), 0)
                }))}
                sales={currentStore.sales}
                services={currentStore.services}
                expenses={currentStore.expenses}
                purchaseOrders={currentStore.purchaseOrders}
                aiSettings={aiSettings}
            />
        )}
        {activeView === 'inventory' && (
            <Inventory 
                store={currentStore}
                products={currentStore.products.map(p => ({
                    ...p, 
                    quantitySold: currentStore.sales.filter(s => s.productId === p.id).reduce((acc, s) => acc + s.quantity, 0),
                    quantityAvailable: p.initialQuantity - currentStore.sales.filter(s => s.productId === p.id).reduce((acc, s) => acc + s.quantity, 0)
                }))}
                addProduct={handleAddProduct}
                suppliers={currentStore.suppliers}
                logActivity={logActivity}
                inventoryMovements={currentStore.inventoryMovements}
            />
        )}
        {activeView === 'pos' && (
            <POS 
                store={currentStore}
                products={currentStore.products.map(p => ({
                    ...p,
                    quantityAvailable: p.initialQuantity - currentStore.sales.filter(s => s.productId === p.id).reduce((acc, s) => acc + s.quantity, 0)
                }))}
                sales={currentStore.sales}
                addSale={handleAddSale}
                customers={currentStore.customers}
                addCustomer={handleAddCustomer}
                saleReturns={currentStore.saleReturns}
                addSaleReturn={(ret) => updateStoreData(s => ({ ...s, saleReturns: [...s.saleReturns, { ...ret, id: `RET-${Date.now()}`, date: new Date().toISOString(), status: 'pending' }] }))}
                createTaxInvoice={(id, type) => { /* ... */ }}
                logActivity={logActivity}
                taxRate={currentStore.billingSettings.taxRate}
                invoices={currentStore.invoices}
            />
        )}
        {activeView === 'expenses' && (
            <Expenses 
                expenses={currentStore.expenses}
                addExpense={(exp) => {
                    updateStoreData(s => {
                        const glEntry = createAutoJournalEntry(exp.date, `مصروف: ${exp.description}`, [
                             { accountId: '503', debit: exp.amount, credit: 0 },
                             { accountId: '101', debit: 0, credit: exp.amount }
                        ]);
                        return { 
                            ...s, 
                            expenses: [...s.expenses, { ...exp, id: (Date.now()).toString() }],
                            journalEntries: [...s.journalEntries, glEntry]
                        };
                    });
                    logActivity(`تسجيل مصروف: ${exp.description}`);
                }}
                logActivity={logActivity}
            />
        )}
        {activeView === 'invoicing' && (
             <InvoicingModule 
                store={currentStore}
                addQuotation={(q) => updateStoreData(s => ({ ...s, quotations: [...s.quotations, { ...q, id: `QT-${Date.now()}`, date: new Date().toISOString(), status: 'pending' }] }))}
                updateQuotationStatus={(id, status) => updateStoreData(s => ({ ...s, quotations: s.quotations.map(q => q.id === id ? { ...q, status } : q) }))}
                convertQuotationToInvoice={(id) => { /* Logic */ }}
             />
        )}
        {activeView === 'notifications-center' && (
            <NotificationsCenter 
                notifications={currentStore.notifications || []}
                markAsRead={(id) => updateStoreData(s => ({ ...s, notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n) }))}
                markAllAsRead={() => updateStoreData(s => ({ ...s, notifications: s.notifications.map(n => ({ ...n, read: true })) }))}
                deleteNotification={(id) => updateStoreData(s => ({ ...s, notifications: s.notifications.filter(n => n.id !== id) }))}
            />
        )}
        {activeView === 'hr-management' && (
            <HRManagement 
                store={currentStore}
                employees={currentStore.employees}
                roles={currentStore.roles}
                attendance={currentStore.attendance}
                payrolls={currentStore.payrolls}
                leaves={currentStore.leaves}
                advances={currentStore.advances}
                addEmployee={(e) => updateStoreData(s => ({...s, employees: [...s.employees, {...e, id: `EMP-${Date.now()}`}]}))}
                updateEmployee={(e) => updateStoreData(s => ({...s, employees: s.employees.map(emp => emp.id === e.id ? e : emp)}))}
                deleteEmployee={(id) => updateStoreData(s => ({...s, employees: s.employees.filter(e => e.id !== id)}))}
                addRole={(r) => updateStoreData(s => ({...s, roles: [...s.roles, {...r, id: `ROLE-${Date.now()}`}]}))}
                updateRole={(r) => updateStoreData(s => ({...s, roles: s.roles.map(role => role.id === r.id ? r : role)}))}
                deleteRole={(id) => updateStoreData(s => ({...s, roles: s.roles.filter(r => r.id !== id)}))}
                logActivity={logActivity}
                allModules={marketplaceModules}
                addOrUpdateDailyAttendance={(date, records) => {
                     updateStoreData(s => {
                         const newAttendance = s.attendance.filter(a => a.date !== date);
                         records.forEach(r => {
                             newAttendance.push({ 
                                 id: `ATT-${Date.now()}-${r.employeeId}`, 
                                 date, 
                                 employeeId: r.employeeId,
                                 status: r.status,
                                 deductionAmount: r.deductionAmount || 0,
                                 notes: r.notes || '' 
                             });
                         });
                         return { ...s, attendance: newAttendance };
                     });
                }}
                generatePayrolls={() => { /* ... */ }}
                updatePayroll={(id, updates) => updateStoreData(s => ({...s, payrolls: s.payrolls.map(p => p.id === id ? { ...p, ...updates } : p)}))}
                markPayrollAsPaid={(id) => updateStoreData(s => {
                    const payroll = s.payrolls.find(p => p.id === id);
                    if (!payroll) return s;
                    const glEntry = createAutoJournalEntry(new Date().toISOString(), `دفع رواتب (ID: ${id})`, [
                         { accountId: '502', debit: payroll.netSalary, credit: 0 },
                         { accountId: '101', debit: 0, credit: payroll.netSalary }
                    ]);
                    return {
                        ...s, 
                        payrolls: s.payrolls.map(p => p.id === id ? { ...p, status: 'paid', paymentDate: new Date().toISOString() } : p),
                        journalEntries: [...s.journalEntries, glEntry]
                    };
                })}
                addLeaveRequest={(l) => updateStoreData(s => ({...s, leaves: [...s.leaves, {...l, id: `LEAVE-${Date.now()}`, status: 'pending'}]}))}
                updateLeaveRequestStatus={(id, status) => updateStoreData(s => ({...s, leaves: s.leaves.map(l => l.id === id ? { ...l, status } : l)}))}
                addAdvance={(a) => updateStoreData(s => ({...s, advances: [...s.advances, {...a, id: `ADV-${Date.now()}`, status: 'unpaid'}]}))}
                updateHRSettings={(settings) => updateStoreData(s => ({ ...s, hrSettings: settings }))}
            />
        )}
         {activeView === 'customer-management' && (
            <CustomerManagement 
                customers={currentStore.customers}
                sales={currentStore.sales}
                products={currentStore.products}
                leads={currentStore.leads || []}
                aiSettings={aiSettings}
                addCustomer={handleAddCustomer}
                updateCustomer={(c) => updateStoreData(s => ({ ...s, customers: s.customers.map(cust => cust.id === c.id ? c : cust) }))}
                deleteCustomer={(id) => updateStoreData(s => ({ ...s, customers: s.customers.filter(c => c.id !== id) }))}
                addCustomerTransaction={(id, t) => updateStoreData(s => ({ ...s, customers: s.customers.map(c => c.id === id ? { ...c, transactions: [...c.transactions, { ...t, id: `TRX-${Date.now()}`, date: new Date().toISOString() }] } : c) }))}
                logActivity={logActivity}
                addLead={(l) => updateStoreData(s => ({ ...s, leads: [...(s.leads || []), { ...l, id: `LEAD-${Date.now()}`, createdAt: new Date().toISOString(), interactions: [], tasks: [] }] }))}
                updateLeadStatus={(id, status) => updateStoreData(s => ({ ...s, leads: (s.leads || []).map(l => l.id === id ? { ...l, status } : l) }))}
                addCRMInteraction={(id, interaction) => updateStoreData(s => ({ ...s, leads: (s.leads || []).map(l => l.id === id ? { ...l, interactions: [...l.interactions, { ...interaction, id: `INT-${Date.now()}` }] } : l) }))}
                addCRMTask={(id, task) => updateStoreData(s => ({ ...s, leads: (s.leads || []).map(l => l.id === id ? { ...l, tasks: [...l.tasks, { ...task, id: `TASK-${Date.now()}` }] } : l) }))}
                updateLeadAI={(id, data) => updateStoreData(s => ({ ...s, leads: (s.leads || []).map(l => l.id === id ? { ...l, ...data } : l) }))}
            />
        )}
        {activeView === 'services' && (
             <ServiceLog 
                services={currentStore.services}
                addService={(service) => {
                    updateStoreData(s => ({ ...s, services: [...s.services, { ...service, orderId: `SRV-${Date.now()}` }] }));
                    logActivity('إضافة طلب صيانة');
                }}
                createTaxInvoice={(id, type) => { /* ... */ }}
                logActivity={logActivity}
                customers={currentStore.customers}
                taxRate={currentStore.billingSettings.taxRate}
                invoices={currentStore.invoices}
             />
        )}
        {activeView === 'financial-reports' && (
             <FinancialDashboard store={currentStore} />
        )}
         {activeView === 'general-reports' && (
             <GeneralReports 
                products={currentStore.products}
                sales={currentStore.sales}
                services={currentStore.services}
                expenses={currentStore.expenses}
                aiSettings={aiSettings}
             />
        )}
         {activeView === 'suppliers-management' && (
             <SuppliersManagement 
                suppliers={currentStore.suppliers}
                products={currentStore.products}
                sales={currentStore.sales}
                purchaseOrders={currentStore.purchaseOrders}
                purchaseReturns={currentStore.purchaseReturns}
                addSupplier={(sup) => updateStoreData(s => ({ ...s, suppliers: [...s.suppliers, { ...sup, id: `SUP-${Date.now()}` }] }))}
                updateSupplier={(sup) => updateStoreData(s => ({ ...s, suppliers: s.suppliers.map(s => s.id === sup.id ? sup : s) }))}
                addPurchaseOrder={(po) => updateStoreData(s => ({ ...s, purchaseOrders: [...s.purchaseOrders, { ...po, id: `PO-${Date.now()}`, status: 'pending', payments: [] }] }))}
                addPurchaseOrderPayment={(poId, payment) => updateStoreData(s => {
                    const glEntry = createAutoJournalEntry(payment.date, `دفعة لمورد (أمر شراء #${poId})`, [
                         { accountId: '201', debit: payment.amount, credit: 0 },
                         { accountId: '101', debit: 0, credit: payment.amount }
                    ]);
                    return { 
                        ...s, 
                        purchaseOrders: s.purchaseOrders.map(po => po.id === poId ? { ...po, payments: [...po.payments, { ...payment, id: `PAY-${Date.now()}` }] } : po),
                        journalEntries: [...s.journalEntries, glEntry]
                    };
                })}
                updatePurchaseOrderStatus={(id, status) => updateStoreData(s => ({ ...s, purchaseOrders: s.purchaseOrders.map(po => po.id === id ? { ...po, status } : po) }))}
                logActivity={logActivity}
             />
        )}
        {activeView === 'ai-assistant' && (
             <AIMessages messages={currentStore.aiMessages} markAllAsRead={() => updateStoreData(s => ({ ...s, aiMessages: s.aiMessages.map(m => ({ ...m, read: true })) }))} />
        )}
        {activeView === 'user-guide' && (
             <UserGuide enabledModules={currentStore.enabledModules} />
        )}
        {activeView === 'installments' && (
             <Installments 
                store={currentStore}
                addInstallmentPayment={(planId, payId, amount) => {
                    updateStoreData(s => ({
                        ...s,
                        installmentPlans: s.installmentPlans.map(plan => {
                            if (plan.id === planId) {
                                return {
                                    ...plan,
                                    payments: plan.payments.map(p => p.id === payId ? { ...p, paidAmount: p.paidAmount + amount, status: (p.paidAmount + amount) >= p.amountDue ? 'paid' : 'due', paymentDate: new Date().toISOString() } : p)
                                };
                            }
                            return plan;
                        })
                    }));
                }}
             />
        )}
        {activeView === 'activity-log' && (
             <ActivityLogComponent logs={currentStore.activityLogs} employees={currentStore.employees} />
        )}
        {activeView === 'returns-refunds' && (
             <ReturnsRefunds 
                store={currentStore}
                addPurchaseReturn={(pr) => updateStoreData(s => ({ ...s, purchaseReturns: [...s.purchaseReturns, { ...pr, id: `PR-${Date.now()}`, date: new Date().toISOString(), status: 'pending' }] }))}
                updateSaleReturnStatus={(id, status) => updateStoreData(s => ({ ...s, saleReturns: s.saleReturns.map(r => r.id === id ? { ...r, status } : r) }))}
                updatePurchaseReturnStatus={(id, status) => updateStoreData(s => ({ ...s, purchaseReturns: s.purchaseReturns.map(r => r.id === id ? { ...r, status } : r) }))}
                logActivity={logActivity}
             />
        )}
        {activeView === 'support-ticketing' && (
             <SupportTicketing 
                store={currentStore}
                currentUser={currentUser}
                tickets={currentStore.supportTickets || []}
                employees={currentStore.employees}
                addTicket={(t) => updateStoreData(s => ({ ...s, supportTickets: [...(s.supportTickets || []), { ...t, id: `TCK-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), messages: [] }] }))}
                updateTicketStatus={(id, status) => updateStoreData(s => ({ ...s, supportTickets: (s.supportTickets || []).map(t => t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t) }))}
                assignTicket={(id, empId) => updateStoreData(s => ({ ...s, supportTickets: (s.supportTickets || []).map(t => t.id === id ? { ...t, assignedTo: empId, updatedAt: new Date().toISOString() } : t) }))}
                addTicketMessage={(id, msg) => updateStoreData(s => ({ ...s, supportTickets: (s.supportTickets || []).map(t => t.id === id ? { ...t, messages: [...t.messages, { ...msg, id: `MSG-${Date.now()}`, timestamp: new Date().toISOString() }], updatedAt: new Date().toISOString() } : t) }))}
             />
        )}
        {activeView === 'treasury-banking' && (
             <TreasuryBanking 
                store={currentStore}
                addTreasury={(t) => updateStoreData(s => ({ ...s, treasuries: [...(s.treasuries || []), { ...t, id: `TRS-${Date.now()}`, balance: t.initialBalance }] }))}
                addBankAccount={(b) => updateStoreData(s => ({ ...s, bankAccounts: [...(s.bankAccounts || []), { ...b, id: `BNK-${Date.now()}`, balance: b.initialBalance }] }))}
                addFinancialTransaction={(tx) => {
                    updateStoreData(s => {
                        let newTreasuries = [...(s.treasuries || [])];
                        let newBanks = [...(s.bankAccounts || [])];

                        const updateBalance = (type: 'treasury' | 'bank' | undefined, id: string | undefined, amount: number) => {
                            if (type === 'treasury') newTreasuries = newTreasuries.map(t => t.id === id ? { ...t, balance: t.balance + amount } : t);
                            if (type === 'bank') newBanks = newBanks.map(b => b.id === id ? { ...b, balance: b.balance + amount } : b);
                        };

                        if (tx.type === 'transfer') {
                            updateBalance(tx.sourceType, tx.sourceId, -tx.amount);
                            updateBalance(tx.destinationType, tx.destinationId, tx.amount);
                        } 

                        return {
                            ...s,
                            treasuries: newTreasuries,
                            bankAccounts: newBanks,
                            financialTransactions: [...(s.financialTransactions || []), { ...tx, id: `FTX-${Date.now()}`, status: 'pending' }]
                        };
                    });
                }}
                updateTransactionStatus={(id, status) => updateStoreData(s => ({ ...s, financialTransactions: (s.financialTransactions || []).map(t => t.id === id ? { ...t, status } : t) }))}
             />
        )}
        {activeView === 'general-ledger' && (
             <GeneralLedger 
                store={currentStore}
                addJournalEntry={(entry) => updateStoreData(s => ({ ...s, journalEntries: [...s.journalEntries, { ...entry, id: `JE-${Date.now()}` }] }))}
                addAccount={(acc) => updateStoreData(s => ({ ...s, accounts: [...s.accounts, { ...acc, id: `ACC-${Date.now()}` }] }))}
                updateAccount={(acc) => updateStoreData(s => ({ ...s, accounts: s.accounts.map(a => a.id === acc.id ? acc : a) }))}
                addCostCenter={(cc) => updateStoreData(s => ({ ...s, costCenters: [...s.costCenters, { ...cc, id: `CC-${Date.now()}` }] }))}
                addBudget={(budget) => updateStoreData(s => ({ ...s, budgets: [...s.budgets, { ...budget, id: `BDG-${Date.now()}` }] }))}
                aiSettings={aiSettings}
             />
        )}
        {activeView === 'customer-service-ai' && (
            <CustomerServiceAI
                store={currentStore}
                updateStore={updateStorePartial}
                aiSettings={aiSettings}
            />
        )}
        {activeView === 'marketplace' && (
            <ModuleMarketplace 
                availableModules={marketplaceModules}
                userStore={currentStore}
                onEnableModule={handleEnableModule}
            />
        )}
        {activeView === 'system-support' && (
            <StoreSystemSupport 
                store={currentStore}
                currentUser={currentUser}
                onUpdateStore={updateStoreData}
            />
        )}
        {activeView === 'website-builder' && (
            <WebsiteBuilder 
                store={currentStore}
                updateStore={updateStorePartial}
                availableTemplates={websiteTemplates}
                availableBlocks={websiteBlocks}
            />
        )}
      </main>

       <AIAssistant 
        messages={currentStore.aiMessages} 
        onAvatarClick={() => setActiveView('ai-assistant')}
        onFeedback={(id, feedback) => updateStoreData(s => ({ ...s, aiMessages: s.aiMessages.map(m => m.id === id ? { ...m, feedback } : m) }))}
      />
    </div>
  );
};

export default App;
