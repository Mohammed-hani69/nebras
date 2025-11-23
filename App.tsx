
import React, { useState, useEffect } from 'react';
import { 
  initDB, 
  loadStores, 
  saveStores, 
  loadAISettings, 
  saveAISettings, 
  loadMarketplaceSettings, 
  saveMarketplaceSettings, 
  loadBuilderAssets, 
  saveBuilderAssets, 
  loadWebsitePlans, 
  saveWebsitePlans 
} from './services/db';
import { getAiSuggestions } from './services/geminiService';
import type { Store, Employee, AISettings, ModuleDefinition, CostCenter, ActivityLog, SupportTicket, TicketMessage, TicketStatus, JournalEntry, JournalLine, OnlineOrder, WebTemplate, BlockDefinition, BuilderPlan } from './types';

// Component Imports
import Login from './components/Login';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import Inventory from './components/Inventory';
import POS from './components/POS';
import Expenses from './components/Expenses';
import InvoicingModule from './components/InvoicingModule';
import NotificationsCenter from './components/NotificationsCenter';
import HRManagement from './components/HRManagement';
import CustomerManagement from './components/CustomerManagement';
import ServiceLog from './components/ServiceLog';
import FinancialDashboard from './components/FinancialDashboard';
import GeneralReports from './components/GeneralReports';
import SuppliersManagement from './components/SuppliersManagement';
import AIMessages from './components/AIMessages';
import UserGuide from './components/UserGuide';
import Installments from './components/Installments';
import ActivityLogComponent from './components/ActivityLog';
import ReturnsRefunds from './components/ReturnsRefunds';
import SupportTicketing from './components/SupportTicketing';
import TreasuryBanking from './components/TreasuryBanking';
import GeneralLedger from './components/GeneralLedger';
import CustomerServiceAI from './components/CustomerServiceAI';
import ModuleMarketplace from './components/ModuleMarketplace';
import StoreSystemSupport from './components/StoreSystemSupport';
import WebsiteBuilder from './components/WebsiteBuilder/WebsiteBuilder';
import AIAssistant from './components/AIAssistant';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import PublicSiteRenderer from './components/WebsiteBuilder/PublicSiteRenderer';

// Static Pages
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsAndConditions from './components/TermsAndConditions';
import AboutUs from './components/AboutUs';

// Constants
const DEFAULT_MODULES: ModuleDefinition[] = [
    { id: 'dashboard', label: 'لوحة التحكم', category: 'basic', isCore: true, price: 0, description: 'ملخص أداء المتجر' },
    { id: 'inventory', label: 'المخزون', category: 'basic', isCore: true, price: 0, description: 'إدارة المنتجات والمخزون' },
    { id: 'pos', label: 'نقطة البيع', category: 'basic', isCore: true, price: 0, description: 'بيع مباشر' },
    { id: 'invoicing', label: 'الفواتير', category: 'basic', isCore: true, price: 0, description: 'إدارة الفواتير' },
    { id: 'services', label: 'الصيانة', category: 'basic', isCore: false, price: 0, description: 'سجل الصيانة' },
    { id: 'expenses', label: 'المصروفات', category: 'basic', isCore: true, price: 0, description: 'تتبع المصروفات' },
    { id: 'financial-reports', label: 'التقارير المالية', category: 'advanced', isCore: false, price: 100, description: 'تقارير مالية متقدمة' },
    { id: 'general-reports', label: 'التقارير العامة', category: 'basic', isCore: true, price: 0, description: 'تقارير عامة' },
    { id: 'hr-management', label: 'الموارد البشرية', category: 'advanced', isCore: false, price: 150, description: 'إدارة الموظفين' },
    { id: 'customer-management', label: 'إدارة العملاء', category: 'basic', isCore: true, price: 0, description: 'إدارة العملاء' },
    { id: 'suppliers-management', label: 'الموردين', category: 'basic', isCore: true, price: 0, description: 'إدارة الموردين' },
    { id: 'ai-assistant', label: 'المساعد الذكي', category: 'premium', isCore: false, price: 200, description: 'مساعد ذكي' },
    { id: 'user-guide', label: 'دليل المستخدم', category: 'basic', isCore: true, price: 0, description: 'دليل الاستخدام' },
    { id: 'installments', label: 'التقسيط', category: 'advanced', isCore: false, price: 100, description: 'إدارة الأقساط' },
    { id: 'activity-log', label: 'سجل الحركات', category: 'advanced', isCore: false, price: 50, description: 'سجل حركات النظام' },
    { id: 'returns-refunds', label: 'المرتجع', category: 'basic', isCore: true, price: 0, description: 'إدارة المرتجعات' },
    { id: 'notifications-center', label: 'مركز الإشعارات', category: 'basic', isCore: true, price: 0, description: 'الإشعارات' },
    { id: 'support-ticketing', label: 'الدعم الفني', category: 'basic', isCore: true, price: 0, description: 'نظام تذاكر الدعم' },
    { id: 'treasury-banking', label: 'الخزينة والبنوك', category: 'advanced', isCore: true, price: 0, description: 'إدارة السيولة' },
    { id: 'general-ledger', label: 'دفتر الأستاذ', category: 'premium', isCore: false, price: 300, description: 'المحاسبة العامة' },
    { id: 'customer-service-ai', label: 'خدمة العملاء الذكية', category: 'premium', isCore: false, price: 250, description: 'ذكاء اصطناعي لخدمة العملاء' },
    { id: 'website-builder', label: 'منشئ المواقع', category: 'premium', isCore: false, price: 400, description: 'إنشاء متجر إلكتروني' },
];

const DEFAULT_AI_SETTINGS: AISettings = {
    model: 'gemini-2.5-flash',
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    enableSuggestions: true,
    enableDashboardInsights: true,
    enableReportAnalysis: true,
    systemInstructions: 'أنت مساعد ذكي لنظام إدارة المتاجر مزاد بلس.'
};

const DEFAULT_TEMPLATES: WebTemplate[] = [
    {
        id: 'temp-1',
        name: 'المتجر العصري',
        type: 'store',
        isPremium: false,
        thumbnail: 'https://placehold.co/600x400/indigo/white?text=Modern+Store',
        defaultTheme: { primaryColor: '#4f46e5', secondaryColor: '#ffffff', fontFamily: 'Tajawal' },
        defaultPages: [
            { 
                id: 'home', slug: 'home', title: 'الرئيسية', isHome: true, 
                blocks: [
                    { id: 'b1', type: 'hero', category: 'marketing', isPremium: false, content: { title: 'أهلاً بك في متجرنا', subtitle: 'أفضل المنتجات بأفضل الأسعار', buttonText: 'تسوق الآن' }, style: {} },
                    { id: 'b2', type: 'product_grid', category: 'commerce', isPremium: false, content: { title: 'أحدث المنتجات', limit: 4 }, style: {} }
                ]
            }
        ]
    }
];

const DEFAULT_BLOCK_DEFINITIONS: BlockDefinition[] = [
    { id: 'hero', type: 'hero', label: 'واجهة ترحيبية', icon: '👋', category: 'marketing', isPremium: false, defaultContent: { title: 'عنوان رئيسي', subtitle: 'وصف فرعي', buttonText: 'زر إجراء' }, defaultStyle: {} },
    { id: 'text', type: 'text', label: 'نص', icon: '📝', category: 'basic', isPremium: false, defaultContent: { text: 'أدخل النص هنا...' }, defaultStyle: {} },
    { id: 'product_grid', type: 'product_grid', label: 'شبكة منتجات', icon: '🛍️', category: 'commerce', isPremium: false, defaultContent: { title: 'منتجاتنا', limit: 4 }, defaultStyle: {} },
    { id: 'features', type: 'features', label: 'الميزات', icon: '✨', category: 'marketing', isPremium: false, defaultContent: { title: 'لماذا نحن؟' }, defaultStyle: {} },
    { id: 'contact_form', type: 'contact_form', label: 'نموذج تواصل', icon: '✉️', category: 'basic', isPremium: false, defaultContent: { title: 'تواصل معنا' }, defaultStyle: {} },
    { id: 'footer', type: 'footer', label: 'تذييل الصفحة', icon: '🔻', category: 'basic', isPremium: false, defaultContent: { copyright: 'جميع الحقوق محفوظة © 2024' }, defaultStyle: {} }
];

const INITIAL_PLANS: BuilderPlan[] = [
    {
        id: 'free', name: 'مجاني', price: 0,
        limits: { products: 10, storage: 100, visits: 1000, pages: 1 },
        features: { customDomain: false, ssl: false, builderAccess: true, htmlCssAccess: false },
        allowedTemplates: 'all', allowedBlocks: 'all'
    },
    {
        id: 'basic', name: 'أساسي', price: 200,
        limits: { products: 100, storage: 1024, visits: 10000, pages: 5 },
        features: { customDomain: true, ssl: true, builderAccess: true, htmlCssAccess: false },
        allowedTemplates: 'all', allowedBlocks: 'all'
    },
    {
        id: 'pro', name: 'محترف', price: 500,
        limits: { products: 1000, storage: 5120, visits: 50000, pages: 10 },
        features: { customDomain: true, ssl: true, builderAccess: true, htmlCssAccess: true },
        allowedTemplates: 'all', allowedBlocks: 'all'
    }
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
  
  // View State
  // 'landing' | 'login' | 'privacy' | 'terms' | 'about'
  const [publicView, setPublicView] = useState<string>('landing');

  // Builder Assets State
  const [websiteTemplates, setWebsiteTemplates] = useState<WebTemplate[]>(DEFAULT_TEMPLATES);
  const [websiteBlocks, setWebsiteBlocks] = useState<BlockDefinition[]>(DEFAULT_BLOCK_DEFINITIONS);
  const [websitePlans, setWebsitePlans] = useState<BuilderPlan[]>(INITIAL_PLANS);

  // Public view state
  const [viewingPublicSite, setViewingPublicSite] = useState<{identifier: string} | null>(null);

  // --- Initialization ---
  useEffect(() => {
    const init = async () => {
      try {
        await initDB();
        
        const loadedStores = await loadStores();
        const loadedAiSettings = await loadAISettings();
        const loadedMarketplace = await loadMarketplaceSettings();
        const loadedBuilderAssets = await loadBuilderAssets();
        const loadedPlans = await loadWebsitePlans();
        
        let storesToSet = loadedStores || [];

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

            storesToSet = patchedStores;
            setStores(patchedStores);
            saveStores(patchedStores);
        } else {
            // --- SEED DEFAULT DEMO STORE ---
            const defaultStore: Store = {
                id: 'demo-store-001',
                name: 'متجر مزاد بلس النموذجي',
                ownerName: 'مدير النظام',
                ownerPhone: '0500000000',
                ownerEmail: 'admin@mazad-plus.com',
                subscriptionStartDate: new Date().toISOString(),
                subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
                subscriptionMonthlyPrice: 0,
                storeType: 'متجر شامل',
                plan: 'free', // Give demo store Free plan
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
                billingSettings: { storeName: 'متجر مزاد بلس النموذجي', taxNumber: '300123456700003', taxRate: 15, address: 'الرياض، المملكة العربية السعودية', phone: '920000000' },
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
            storesToSet = [defaultStore];
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
        
        if (loadedPlans && loadedPlans.length > 0) {
            setWebsitePlans(loadedPlans);
        }
        
        // --- RESTORE SESSION ---
        const sessionSuperAdmin = localStorage.getItem('nebras_session_superadmin');
        if (sessionSuperAdmin === 'true') {
            setIsSuperAdmin(true);
        } else {
            const sessionStoreId = localStorage.getItem('nebras_session_store_id');
            const sessionUsername = localStorage.getItem('nebras_session_username');
            
            if (sessionStoreId && sessionUsername && storesToSet.length > 0) {
                const foundStore = storesToSet.find(s => s.id === sessionStoreId);
                if (foundStore) {
                    const foundUser = foundStore.employees.find(e => e.username === sessionUsername);
                    if (foundUser) {
                        setCurrentStore(foundStore);
                        setCurrentUser(foundUser);
                    }
                }
            }
        }
        
        setIsDbInitialized(true); // Set this LAST after everything is loaded

      } catch (error) {
        console.error("DB Initialization Failed:", error);
      }
    };
    init();

    // Check for "Public View" simulated route hash: #site/{storeIdOrSlug}
    const checkHash = () => {
        const hash = window.location.hash;
        if (hash.startsWith('#site/')) {
            const identifier = decodeURIComponent(hash.split('/')[1]); // Support Store ID or Slug
            if (identifier) setViewingPublicSite({ identifier });
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
  
  // Persist Plans
  useEffect(() => {
      if (isDbInitialized) {
          saveWebsitePlans(websitePlans);
      }
  }, [websitePlans, isDbInitialized]);


  // --- Login Logic ---
  const handleLogin = (username: string, password: string): boolean => {
    if (username === 'superadmin' && password === 'superpassword') {
        setIsSuperAdmin(true);
        localStorage.setItem('nebras_session_superadmin', 'true');
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
            // Save Session
            localStorage.setItem('nebras_session_store_id', store.id);
            localStorage.setItem('nebras_session_username', employee.username);
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
    setPublicView('landing'); // Reset to landing on logout
    // Clear Session
    localStorage.removeItem('nebras_session_superadmin');
    localStorage.removeItem('nebras_session_store_id');
    localStorage.removeItem('nebras_session_username');
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

  // --- AI Suggestions Effect ---
  useEffect(() => {
    const generateSuggestions = async () => {
      if (!currentStore || !aiSettings.enableSuggestions || !process.env.API_KEY) return;

      // Rate limiting: Check cooldown (e.g., 1 hour) to avoid spamming API
      const lastGenKey = `lastAiGen_${currentStore.id}`;
      const lastGenTime = parseInt(localStorage.getItem(lastGenKey) || '0');
      const now = Date.now();
      const COOLDOWN = 60 * 60 * 1000; // 1 hour

      if (now - lastGenTime < COOLDOWN) return;

      try {
        const suggestions = await getAiSuggestions(currentStore, marketplaceModules, aiSettings);
        
        if (suggestions && suggestions.length > 0) {
            const newMessages = suggestions.map(content => ({
                id: `AIM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                content,
                timestamp: new Date().toISOString(),
                read: false
            }));

            // We use functional update to ensure we have latest state if multiple updates occur
            setStores(prevStores => prevStores.map(s => {
                if (s.id === currentStore.id) {
                    const updated = { ...s, aiMessages: [...newMessages, ...s.aiMessages] };
                    // Also update currentStore reference if it matches
                    setCurrentStore(updated);
                    return updated;
                }
                return s;
            }));
            
            localStorage.setItem(lastGenKey, now.toString());
        }
      } catch (error) {
        console.error("Failed to fetch AI suggestions", error);
      }
    };

    // Debounce the check to avoid running on every keystroke/update immediately
    const timer = setTimeout(generateSuggestions, 3000);
    return () => clearTimeout(timer);

  }, [currentStore, aiSettings, marketplaceModules]); // Dependencies: run when store data changes
  
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

  // --- Initial Loading State ---
  if (!isDbInitialized) {
      return (
          <div className="flex items-center justify-center h-screen bg-gray-100">
              <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">جاري تحميل نظام مزاد بلس...</p>
              </div>
          </div>
      );
  }

  // --- View Selection ---
  if (viewingPublicSite) {
      // Find store by ID OR subdomain (slug)
      const identifier = viewingPublicSite.identifier;
      const store = stores.find(s => s.id === identifier || s.website?.subdomain === identifier);
      
      if (!store) {
          // Fallback: Try to find a store by simple name match if store not found (optional, but good for UX if typing)
          const fallbackStore = stores.find(s => s.name.toLowerCase().replace(/[\s\.]+/g, '-') === identifier);
          if (fallbackStore) {
              // If found by name, maybe we should use that
              return (
                  <PublicSiteRenderer 
                      store={fallbackStore} 
                      onBack={() => { window.location.hash = ''; }} 
                      onNewOrder={(order) => handlePublicOrder(fallbackStore.id, order)}
                  />
              );
          }
          return <div className="p-10 text-center flex flex-col items-center justify-center h-screen bg-gray-50"><h1 className="text-2xl font-bold text-gray-800 mb-2">المتجر غير موجود</h1><p className="text-gray-600">تأكد من الرابط وحاول مرة أخرى.</p></div>;
      }
      
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
              websitePlans={websitePlans}
              setWebsitePlans={setWebsitePlans}
          />
      );
  }

  // Handle Non-Authenticated Views
  if (!currentUser || !currentStore) {
    switch (publicView) {
        case 'login':
            return <Login onLogin={handleLogin} />;
        case 'privacy':
            return <PrivacyPolicy onBack={() => setPublicView('landing')} />;
        case 'terms':
            return <TermsAndConditions onBack={() => setPublicView('landing')} />;
        case 'about':
            return <AboutUs onBack={() => setPublicView('landing')} />;
        default:
            return <LandingPage onNavigateToLogin={() => setPublicView('login')} onNavigate={(page) => setPublicView(page)} />;
    }
  }

  // --- Authenticated App Logic ---
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
                availablePlans={websitePlans}
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
