
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
// Fix: Resolve duplicate identifier by aliasing the component import.
import type { Product, Sale, Service, Expense, User, Store, AIMessage, Customer, CustomerTransaction, Supplier, PurchaseOrder, PurchaseOrderPayment, PaymentMethod, CustomRole, AISettings, SaleReturn, PurchaseReturn, InventoryMovement, Invoice, BillingSettings, ModuleDefinition } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import POS from './components/POS';
import ServiceLog from './components/ServiceLog';
import Expenses from './components/Expenses';
import Login from './components/Login';
import UserManagement from './components/UserManagement';
import FinancialReports from './components/FinancialReports';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import AIAssistant from './components/AIAssistant';
import AIMessages from './components/AIMessages';
import GeneralReports from './components/GeneralReports';
import CustomerManagement from './components/CustomerManagement';
import SuppliersManagement from './components/SuppliersManagement';
import UserGuide from './components/UserGuide';
import ModuleMarketplace from './components/ModuleMarketplace';
import { getAiSuggestions } from './services/geminiService';
import { initDB, loadStores, saveStores, loadAISettings, saveAISettings, loadMarketplaceSettings, saveMarketplaceSettings } from './services/db';

const SUPER_ADMIN_USER = { username: 'superadmin', password: 'superpassword' };

const INITIAL_MODULES: ModuleDefinition[] = [
    { id: 'dashboard', label: 'لوحة التحكم', description: 'نظرة عامة على أداء المتجر', price: 0, category: 'basic', isCore: true },
    { id: 'inventory', label: 'المخزون', description: 'إدارة المنتجات والكميات', price: 0, category: 'basic', isCore: true },
    { id: 'pos', label: 'نقطة البيع', description: 'تسجيل المبيعات وإصدار الفواتير', price: 0, category: 'basic', isCore: true },
    { id: 'customer-management', label: 'إدارة العملاء', description: 'قاعدة بيانات العملاء والديون', price: 50, category: 'advanced' },
    { id: 'suppliers-management', label: 'إدارة الموردين والمشتريات', description: 'أوامر الشراء وحسابات الموردين', price: 100, category: 'advanced' },
    { id: 'services', label: 'سجل الصيانة', description: 'تتبع طلبات الصيانة والإصلاح', price: 75, category: 'advanced' },
    { id: 'expenses', label: 'المصروفات', description: 'تتبع المصروفات التشغيلية', price: 30, category: 'basic' },
    { id: 'financial-reports', label: 'التقارير المالية', description: 'تحليل الأرباح والخسائر', price: 150, category: 'premium' },
    { id: 'general-reports', label: 'التقارير العامة', description: 'تقارير المبيعات والمنتجات', price: 50, category: 'basic' },
    { id: 'user-management', label: 'إدارة المستخدمين', description: 'صلاحيات الموظفين والأدوار', price: 0, category: 'basic', isCore: true },
    { id: 'ai-assistant', label: 'المساعد الذكي', description: 'نصائح وتنبيهات بالذكاء الاصطناعي', price: 200, category: 'premium' },
    { id: 'user-guide', label: 'دليل المستخدم', description: 'شرح شامل للنظام', price: 0, category: 'basic', isCore: true },
];

const defaultStores: Store[] = [
  {
    id: 'store001',
    name: 'المحل الرئيسي',
    ownerName: 'محمد علي',
    ownerPhone: '0501234567',
    ownerEmail: 'mohamed.ali@example.com',
    subscriptionStartDate: '2024-01-01T00:00:00Z',
    subscriptionEndDate: '2025-12-31T23:59:59Z',
    subscriptionMonthlyPrice: 250,
    storeType: 'محل موبايلات',
    enabledModules: INITIAL_MODULES.map(m => m.id),
    aiInstructions: 'هذا المتجر يركز على بيع الإكسسوارات الفاخرة. قدم نصائح لزيادة مبيعات السماعات.',
    products: [
      { id: 'P001', name: 'iPhone 15 Pro', category: 'موبايل', costPrice: 4000, sellPrice: 4500, initialQuantity: 20, supplierId: 'SUP001' },
      { id: 'P002', name: 'Samsung Galaxy S24 Ultra', category: 'موبايل', costPrice: 4200, sellPrice: 4800, initialQuantity: 15, supplierId: 'SUP001' },
      { id: 'P003', name: 'شاحن سريع Anker 45W', category: 'إكسسوار', costPrice: 80, sellPrice: 120, initialQuantity: 50, supplierId: 'SUP002' },
      { id: 'P004', name: 'سماعات Sony WH-1000XM5', category: 'إكسسوار', costPrice: 1200, sellPrice: 1500, initialQuantity: 25, supplierId: 'SUP002' },
      { id: 'P005', name: 'Google Pixel 8', category: 'موبايل', costPrice: 2800, sellPrice: 3200, initialQuantity: 10, supplierId: 'SUP001' },
    ],
    suppliers: [
        { id: 'SUP001', name: 'المورد التقني الأول', contactPerson: 'أحمد خالد', phone: '0512345678', email: 'ahmed@supplier1.com', address: 'الرياض, السعودية' },
        { id: 'SUP002', name: 'شركة اكسسوارات العصر', contactPerson: 'سارة عبدالله', phone: '0587654321', email: 'sara@accessories.com', address: 'جدة, السعودية' }
    ],
    purchaseOrders: [
        { id: 'PO001', supplierId: 'SUP001', date: '2024-06-25T00:00:00Z', status: 'received', items: [{ productId: 'P001', quantity: 10, costPrice: 3950 }], payments: [{id: 'PAY001', date: '2024-06-25T00:00:00Z', amount: 39500, paymentMethod: 'bank_transfer'}] },
        { id: 'PO002', supplierId: 'SUP002', date: '2024-07-05T00:00:00Z', status: 'pending', items: [{ productId: 'P003', quantity: 100, costPrice: 75 }], payments: [{id: 'PAY002', date: '2024-07-06T00:00:00Z', amount: 4000, paymentMethod: 'cash'}] }
    ],
    customers: [
      { id: 'CUST001', name: 'علي حسن', phone: '0551112222', joinDate: '2024-04-15T10:00:00Z', loyaltyPoints: 120, transactions: [] },
      { id: 'CUST002', name: 'فاطمة الزهراء', phone: '0553334444', joinDate: '2024-05-01T12:30:00Z', loyaltyPoints: 50, transactions: [
          { id: 'TRN001', date: '2024-06-20T10:00:00Z', type: 'debt', amount: 500, description: 'متبقي من فاتورة INV003' },
          { id: 'TRN002', date: '2024-07-10T15:00:00Z', type: 'payment', amount: 250, description: 'دفعة من الحساب' },
      ]},
    ],
    sales: [
      { invoiceId: 'INV001', date: '2024-05-01T10:00:00Z', productId: 'P001', quantity: 1, unitPrice: 4500, customerId: 'CUST002', paymentMethod: 'card' },
      { invoiceId: 'INV002', date: '2024-05-03T14:30:00Z', productId: 'P003', quantity: 2, unitPrice: 120, customerId: null, paymentMethod: 'cash' },
    ],
    services: [
      { orderId: 'SRV001', date: '2024-05-05T09:00:00Z', description: 'تغيير شاشة iPhone 13', revenue: 500, partsCost: 250, paymentMethod: 'cash' },
    ],
    expenses: [
      { id: 'EXP001', date: '2024-05-01T00:00:00Z', description: 'إيجار المحل', amount: 3000, paymentMethod: 'bank_transfer' },
    ],
    users: [
      { id: 'u001', username: 'admin', password: 'password', roleId: 'admin' },
      { id: 'u002', username: 'cashier', password: '123', roleId: 'cashier' },
      { id: 'u003', username: 'stock', password: '123', roleId: 'inventory_manager' },
    ],
    roles: [
        { id: 'admin', name: 'مدير النظام', permissions: INITIAL_MODULES.map(m => m.id) },
        { id: 'cashier', name: 'كاشير', permissions: ['dashboard', 'pos', 'customer-management', 'expenses'] },
        { id: 'inventory_manager', name: 'مسؤول مخزون', permissions: ['dashboard', 'inventory', 'suppliers-management'] },
    ],
    paymentHistory: [
      { date: '2024-01-01T10:00:00Z', amount: 250 },
    ],
    aiMessages: [],
    billingSettings: { storeName: 'المحل الرئيسي', taxNumber: '', taxRate: 15, address: '', phone: '' },
    invoices: [],
    inventoryMovements: [],
    saleReturns: [],
    purchaseReturns: [],
    activityLogs: [],
  }
];

const DEFAULT_AI_SETTINGS: AISettings = {
    model: 'gemini-2.5-flash',
    temperature: 0.5,
    topK: 40,
    topP: 0.95,
    enableSuggestions: true,
    enableDashboardInsights: true,
    enableReportAnalysis: true,
    systemInstructions: 'أنت مساعد ذكي لنظام "نبراس". قم دائماً بتقديم إجابات مختصرة، مهنية، ومفيدة لأصحاب المتاجر الصغيرة والمتوسطة.',
};

// Loyalty points rule: 1 point for every 100 JOD spent
const LOYALTY_RATE = 100;

interface CurrentUserWithPermissions extends User {
    permissions: string[];
    role: string;
}

const App: React.FC = () => {
  const [isSuperAdminLoggedIn, setIsSuperAdminLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUserWithPermissions | null>(null);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [aiSettings, setAiSettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);
  const [marketplaceModules, setMarketplaceModules] = useState<ModuleDefinition[]>(INITIAL_MODULES);
  const initialLoadComplete = useRef(false);
  
  const [activeView, setActiveView] = useState('dashboard');

  useEffect(() => {
    const setupDatabase = async () => {
      try {
        await initDB();
        const [loadedStores, loadedAiSettings, loadedModules] = await Promise.all([loadStores(), loadAISettings(), loadMarketplaceSettings()]);
        
        if (loadedStores && loadedStores.length > 0) {
          setStores(loadedStores);
        } else {
          setStores(defaultStores);
          await saveStores(defaultStores);
        }

        if (loadedAiSettings) {
            setAiSettings(loadedAiSettings);
        } else {
            setAiSettings(DEFAULT_AI_SETTINGS);
            await saveAISettings(DEFAULT_AI_SETTINGS);
        }

        if (loadedModules) {
            setMarketplaceModules(loadedModules);
        } else {
            await saveMarketplaceSettings(INITIAL_MODULES);
        }

      } catch (error) {
        console.error("Database setup failed:", error);
        alert("فشل في إعداد قاعدة البيانات. سيتم استخدام البيانات الافتراضية.");
        setStores(defaultStores);
      } finally {
        setIsLoading(false);
        setTimeout(() => { initialLoadComplete.current = true; }, 0);
      }
    };
    setupDatabase();
  }, []);

  useEffect(() => {
    if (!initialLoadComplete.current) {
      return;
    }
    const handler = setTimeout(() => {
      saveStores(stores).catch(err => console.error("Failed to save stores to DB:", err));
    }, 500);

    return () => clearTimeout(handler);
  }, [stores]);

  useEffect(() => {
    if (!initialLoadComplete.current) return;
    saveAISettings(aiSettings).catch(err => console.error("Failed to save AI settings:", err));
  }, [aiSettings]);

  useEffect(() => {
      if (!initialLoadComplete.current) return;
      saveMarketplaceSettings(marketplaceModules).catch(err => console.error("Failed to save marketplace:", err));
  }, [marketplaceModules]);


  useEffect(() => {
      const generateSuggestionsForStore = async () => {
          if (!currentStore || isGeneratingSuggestions || !currentStore.enabledModules.includes('ai-assistant') || !aiSettings.enableSuggestions) return;

          const today = new Date().toISOString().split('T')[0];
          const lastGenerated = localStorage.getItem(`suggestionsGenerated_${currentStore.id}`);

          if (lastGenerated === today) {
              return;
          }

          setIsGeneratingSuggestions(true);
          try {
              const suggestions = await getAiSuggestions(currentStore, marketplaceModules, aiSettings);
              if (suggestions && suggestions.length > 0) {
                  const newMessages: AIMessage[] = suggestions.map((content, index) => ({
                      id: `ai_${Date.now()}_${index}`,
                      content,
                      timestamp: new Date().toISOString(),
                      read: false,
                  }));
                  
                  updateStoreData(currentStore.id, store => ({
                      ...store,
                      aiMessages: [...newMessages, ...store.aiMessages]
                  }));

                  localStorage.setItem(`suggestionsGenerated_${currentStore.id}`, today);
              }
          } catch (error) {
              console.error("Failed to generate AI suggestions:", error);
          } finally {
              setIsGeneratingSuggestions(false);
          }
      };

      if (currentStore) {
          generateSuggestionsForStore();
      }
  }, [currentStore, aiSettings, marketplaceModules]);


  const updateStoreData = (storeId: string, updater: (store: Store) => Store) => {
    setStores(prevStores => {
        const newStores = prevStores.map(store => store.id === storeId ? updater(store) : store);
        if (currentStore?.id === storeId) {
            setCurrentStore(updater(currentStore as Store));
        }
        return newStores;
    });
  };
  
  const handleUpdateModuleDefinition = (updatedModule: ModuleDefinition) => {
      setMarketplaceModules(prev => prev.map(m => m.id === updatedModule.id ? updatedModule : m));
  };

  const handleEnableModule = (moduleId: string) => {
      if (!currentStore) return;
      updateStoreData(currentStore.id, store => {
          if (store.enabledModules.includes(moduleId)) return store;
          return { ...store, enabledModules: [...store.enabledModules, moduleId] };
      });
  };
  
  // --- CRUD Operations ---

  const addSale = (saleData: Omit<Sale, 'invoiceId'>) => {
    if (!currentStore) return;
    const newInvoiceId = `INV${(currentStore.sales.length + 1).toString().padStart(3, '0')}`;
    const newSale = { ...saleData, invoiceId: newInvoiceId };
    
    updateStoreData(currentStore.id, store => {
      let updatedCustomers = store.customers;
      
      if (newSale.customerId) {
        const saleTotal = newSale.quantity * newSale.unitPrice;
        const pointsAwarded = Math.floor(saleTotal / LOYALTY_RATE);
        
        updatedCustomers = store.customers.map(c => {
          if (c.id === newSale.customerId) {
            return { ...c, loyaltyPoints: c.loyaltyPoints + pointsAwarded };
          }
          return c;
        });
      }

      return { 
          ...store, 
          sales: [...store.sales, newSale], 
          customers: updatedCustomers 
      };
    });
  };

  const addService = (serviceData: Omit<Service, 'orderId'>) => {
    if (!currentStore) return;
    const newOrderId = `SRV${(currentStore.services.length + 1).toString().padStart(3, '0')}`;
    const newService = { ...serviceData, orderId: newOrderId };
    updateStoreData(currentStore.id, store => {
        return { ...store, services: [...store.services, newService] };
    });
  };

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    if (!currentStore) return;
    const newExpense = { ...expense, id: `EXP${(currentStore.expenses.length + 1).toString().padStart(3, '0')}` };
    updateStoreData(currentStore.id, store => {
        return { ...store, expenses: [...store.expenses, newExpense] };
    });
  };
  
  const addProduct = (product: Omit<Product, 'id'>) => {
    if (!currentStore) return;
    const newProduct = { ...product, id: `P${(currentStore.products.length + 1).toString().padStart(3, '0')}` };
    updateStoreData(currentStore.id, store => {
        return { ...store, products: [...store.products, newProduct] };
    });
  };
  
  // --- User Management ---
  const addUser = (user: Omit<User, 'id'>) => {
    if (!currentStore) return;
    const newUser = { ...user, id: `u${(currentStore.users.length + 1).toString().padStart(3, '0')}`};
    updateStoreData(currentStore.id, store => {
        return { ...store, users: [...store.users, newUser] };
    });
  };
  const updateUser = (updatedUser: User) => {
    if (!currentStore) return;
    updateStoreData(currentStore.id, store => ({ ...store, users: store.users.map(u => u.id === updatedUser.id ? updatedUser : u) }));
  };
  const deleteUser = (userId: string) => {
    if (!currentStore) return;
    updateStoreData(currentStore.id, store => ({ ...store, users: store.users.filter(u => u.id !== userId) }));
  };
  const addRole = (role: Omit<CustomRole, 'id'>) => {
    if (!currentStore) return;
    const newRole: CustomRole = { ...role, id: `role_${Date.now()}` };
    updateStoreData(currentStore.id, store => ({
        ...store,
        roles: [...store.roles, newRole]
    }));
  };
  const updateRole = (updatedRole: CustomRole) => {
      if (!currentStore) return;
      updateStoreData(currentStore.id, store => ({
          ...store,
          roles: store.roles.map(r => r.id === updatedRole.id ? updatedRole : r)
      }));
  };
  const deleteRole = (roleId: string) => {
      if (!currentStore) return;
      const isRoleInUse = currentStore.users.some(u => u.roleId === roleId);
      if (isRoleInUse) {
          alert('لا يمكن حذف هذا الدور لأنه مستخدم من قبل بعض الموظفين. يرجى تغيير دور الموظفين أولاً.');
          return;
      }
      updateStoreData(currentStore.id, store => ({
          ...store,
          roles: store.roles.filter(r => r.id !== roleId)
      }));
  };


  // --- Customer Management ---
  const addCustomer = (customer: Omit<Customer, 'id' | 'joinDate' | 'loyaltyPoints' | 'transactions'>): Customer => {
    if (!currentStore) throw new Error("No current store");
    const newCustomer: Customer = {
      ...customer, id: `CUST${(currentStore.customers.length + 1).toString().padStart(3, '0')}`,
      joinDate: new Date().toISOString(), loyaltyPoints: 0, transactions: [],
    };
    updateStoreData(currentStore.id, store => ({ ...store, customers: [...store.customers, newCustomer] }));
    return newCustomer;
  };
  const updateCustomer = (updatedCustomer: Customer) => {
    if (!currentStore) return;
    updateStoreData(currentStore.id, store => ({ ...store, customers: store.customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c) }));
  };
  const deleteCustomer = (customerId: string) => {
    if (!currentStore) return;
    updateStoreData(currentStore.id, store => ({ ...store, customers: store.customers.filter(c => c.id !== customerId) }));
  };
  const addCustomerTransaction = (customerId: string, transaction: Omit<CustomerTransaction, 'id' | 'date'>) => {
     if (!currentStore) return;
     updateStoreData(currentStore.id, store => {
         const updatedCustomers = store.customers.map(c => {
             if (c.id === customerId) {
                 const newTransaction = { ...transaction, id: `TRN${(c.transactions.length + 1).toString().padStart(3, '0')}`, date: new Date().toISOString() };
                 return { ...c, transactions: [...c.transactions, newTransaction] };
             }
             return c;
         });
         return { ...store, customers: updatedCustomers };
     });
  };
  
  // --- Supplier Management ---
  const addSupplier = (supplier: Omit<Supplier, 'id'>) => {
    if (!currentStore) return;
    const newSupplier = { ...supplier, id: `SUP${(currentStore.suppliers.length + 1).toString().padStart(3, '0')}` };
    updateStoreData(currentStore.id, store => {
        return { ...store, suppliers: [...store.suppliers, newSupplier] };
    });
  };
  const updateSupplier = (updatedSupplier: Supplier) => {
    if (!currentStore) return;
    updateStoreData(currentStore.id, store => ({ ...store, suppliers: store.suppliers.map(s => s.id === updatedSupplier.id ? updatedSupplier : s) }));
  };
  const addPurchaseOrder = (po: Omit<PurchaseOrder, 'id' | 'payments' | 'status'>) => {
    if (!currentStore) return;
    const newPO: PurchaseOrder = { ...po, id: `PO${(currentStore.purchaseOrders.length + 1).toString().padStart(3, '0')}`, payments: [], status: 'pending' };
    updateStoreData(currentStore.id, store => {
        return { ...store, purchaseOrders: [...store.purchaseOrders, newPO] };
    });
  };
  const addPurchaseOrderPayment = (purchaseOrderId: string, payment: Omit<PurchaseOrderPayment, 'id'>) => {
    if (!currentStore) return;
    updateStoreData(currentStore.id, store => ({
      ...store,
      purchaseOrders: store.purchaseOrders.map(po => {
        if (po.id === purchaseOrderId) {
          const newPayment = { ...payment, id: `PAY${(po.payments.length + 1).toString().padStart(3, '0')}`};
          return { ...po, payments: [...po.payments, newPayment] };
        }
        return po;
      })
    }));
  };
  const updatePurchaseOrderStatus = (purchaseOrderId: string, status: 'pending' | 'received') => {
    if (!currentStore) return;
    updateStoreData(currentStore.id, store => {
      let updatedProducts = [...store.products];
      const poToUpdate = store.purchaseOrders.find(p => p.id === purchaseOrderId);

      if (poToUpdate && status === 'received' && poToUpdate.status === 'pending') {
        // Update stock quantities
        poToUpdate.items.forEach(item => {
          const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
          if (productIndex !== -1) {
            updatedProducts[productIndex].initialQuantity += item.quantity;
          }
        });
      }

      const updatedPOs = store.purchaseOrders.map(po => 
        po.id === purchaseOrderId ? { ...po, status } : po
      );

      return { ...store, products: updatedProducts, purchaseOrders: updatedPOs };
    });
  };


  // --- AI & Login/Logout ---
  const handleUpdateAISettings = (newSettings: AISettings) => {
    setAiSettings(newSettings);
  };
  const markAllMessagesAsRead = useCallback(() => {
    if (!currentStore) return;
    updateStoreData(currentStore.id, store => ({ ...store, aiMessages: store.aiMessages.map(msg => ({ ...msg, read: true })) }));
  }, [currentStore]);
  const handleAiMessageFeedback = useCallback((messageId: string, feedback: 'positive' | 'negative') => {
    if (!currentStore) return;
    updateStoreData(currentStore.id, store => ({ ...store, aiMessages: store.aiMessages.map(msg => msg.id === messageId ? { ...msg, feedback } : msg) }));
  }, [currentStore]);
  const handleLogin = (username: string, password: string): boolean => {
    if (username === SUPER_ADMIN_USER.username && password === SUPER_ADMIN_USER.password) {
        setIsSuperAdminLoggedIn(true); setCurrentUser(null); setCurrentStore(null); return true;
    }
    for (const store of stores) {
        const user = store.users.find(u => u.username === username && u.password === password);
        if (user) {
            if (new Date(store.subscriptionEndDate) <= new Date()) {
                alert('اشتراك هذا المتجر منتهي الصلاحية.'); return false;
            }
            const userRole = store.roles.find(r => r.id === user.roleId);
            const permissions = userRole ? userRole.permissions : [];
            const role = userRole ? userRole.name : 'غير محدد';

            setCurrentUser({ ...user, permissions, role });
            setCurrentStore(store);
            setIsSuperAdminLoggedIn(false);
            const firstPermittedView = permissions.find(p => store.enabledModules.includes(p)) || 'dashboard';
            setActiveView(firstPermittedView);
            return true;
        }
    }
    return false;
  };
  const handleLogout = () => { setCurrentUser(null); setCurrentStore(null); setIsSuperAdminLoggedIn(false); };
  const handleSetActiveView = useCallback((view: string) => {
    if (view === 'marketplace') {
        setActiveView(view);
        return;
    }
    if (currentUser?.permissions.includes(view) && currentStore?.enabledModules.includes(view)) { setActiveView(view); }
  }, [currentUser, currentStore]);

  const logActivity = (action: string) => { console.log(`Activity: ${action}`); };

  const createTaxInvoice = (sourceId: string, sourceType: 'sale' | 'service') => {
    if (!currentStore) return;
    updateStoreData(currentStore.id, store => {
        const newInvoiceId = `TAX-${Date.now()}`;
        const newInvoice: Invoice = {
             id: newInvoiceId,
             date: new Date().toISOString(),
             customerName: 'Client', // Should be fetched properly
             items: [],
             subtotal: 0,
             taxRate: store.billingSettings.taxRate,
             taxAmount: 0,
             total: 0,
             amountPaid: 0,
             remainingBalance: 0
        };
        return { ...store, invoices: [...store.invoices, newInvoice] };
    });
  };

  const addSaleReturn = (saleReturn: Omit<SaleReturn, 'id' | 'date'>) => {
    if (!currentStore) return;
    const newReturn: SaleReturn = { ...saleReturn, id: `RET${Date.now()}`, date: new Date().toISOString() };
    updateStoreData(currentStore.id, store => ({
        ...store,
        saleReturns: [...store.saleReturns, newReturn]
    }));
  };

  const addPurchaseReturn = (purchaseReturn: Omit<PurchaseReturn, 'id' | 'date'>) => {
      // Stub implementation
      console.log("Added purchase return", purchaseReturn);
  };


  const productsWithSalesData = useMemo(() => {
    if (!currentStore) return [];
    return currentStore.products.map(product => {
      const quantitySold = currentStore.sales.filter(sale => sale.productId === product.id).reduce((acc, sale) => acc + sale.quantity, 0);
      return { ...product, quantitySold, quantityAvailable: product.initialQuantity - quantitySold };
    });
  }, [currentStore]);

  const renderView = () => {
    if (activeView === 'marketplace' && currentStore) {
        return <ModuleMarketplace availableModules={marketplaceModules} userStore={currentStore} onEnableModule={handleEnableModule} />;
    }

    if (!currentUser || !currentStore || !currentUser.permissions.includes(activeView) || !currentStore.enabledModules.includes(activeView)) {
        // Check if the user is trying to access the marketplace, which is always allowed.
        if (activeView === 'marketplace' && currentStore) {
             return <ModuleMarketplace availableModules={marketplaceModules} userStore={currentStore} onEnableModule={handleEnableModule} />;
        }
        return <div className="text-center p-10"><h2 className="text-2xl font-bold text-red-600">غير مصرح لك بالوصول</h2></div>;
    }

    switch (activeView) {
      case 'dashboard': return <Dashboard store={currentStore} products={productsWithSalesData} sales={currentStore.sales} services={currentStore.services} expenses={currentStore.expenses} aiSettings={aiSettings} purchaseOrders={currentStore.purchaseOrders} />;
      case 'inventory': return <Inventory products={productsWithSalesData} addProduct={addProduct} suppliers={currentStore.suppliers} logActivity={logActivity} inventoryMovements={currentStore.inventoryMovements} />;
      case 'pos': return <POS products={productsWithSalesData} addSale={addSale} sales={currentStore.sales} customers={currentStore.customers} addCustomer={addCustomer} logActivity={logActivity} createTaxInvoice={createTaxInvoice} saleReturns={currentStore.saleReturns} addSaleReturn={addSaleReturn} taxRate={currentStore.billingSettings.taxRate} />;
      case 'services': return <ServiceLog services={currentStore.services} addService={addService} logActivity={logActivity} customers={currentStore.customers} createTaxInvoice={createTaxInvoice} taxRate={currentStore.billingSettings.taxRate} />;
      case 'expenses': return <Expenses expenses={currentStore.expenses} addExpense={addExpense} logActivity={logActivity} />;
      case 'user-management': return <UserManagement users={currentStore.users} roles={currentStore.roles} addUser={addUser} updateUser={updateUser} deleteUser={deleteUser} addRole={addRole} updateRole={updateRole} deleteRole={deleteRole} logActivity={logActivity} allModules={marketplaceModules} />;
      case 'customer-management': return <CustomerManagement customers={currentStore.customers} sales={currentStore.sales} products={currentStore.products} addCustomer={addCustomer} updateCustomer={updateCustomer} deleteCustomer={deleteCustomer} addCustomerTransaction={addCustomerTransaction} logActivity={logActivity} />;
      case 'suppliers-management': return <SuppliersManagement suppliers={currentStore.suppliers} products={currentStore.products} sales={currentStore.sales} purchaseOrders={currentStore.purchaseOrders} addSupplier={addSupplier} updateSupplier={updateSupplier} addPurchaseOrder={addPurchaseOrder} addPurchaseOrderPayment={addPurchaseOrderPayment} updatePurchaseOrderStatus={updatePurchaseOrderStatus} logActivity={logActivity} />;
      case 'financial-reports': return <FinancialReports products={currentStore.products} sales={currentStore.sales} services={currentStore.services} expenses={currentStore.expenses} purchaseOrders={currentStore.purchaseOrders} />;
      case 'general-reports': return <GeneralReports products={currentStore.products} sales={currentStore.sales} services={currentStore.services} expenses={currentStore.expenses} aiSettings={aiSettings} />;
      case 'ai-assistant': return <AIMessages messages={currentStore.aiMessages} markAllAsRead={markAllMessagesAsRead} />;
      case 'user-guide': return <UserGuide enabledModules={currentStore.enabledModules} />;
      default: return <Dashboard store={currentStore} products={productsWithSalesData} sales={currentStore.sales} services={currentStore.services} expenses={currentStore.expenses} aiSettings={aiSettings} purchaseOrders={currentStore.purchaseOrders} />;
    }
  };
  
  if (isLoading) { return <div className="flex items-center justify-center min-h-screen bg-gray-100"><div><h1 className="text-2xl font-bold text-gray-700">جاري تحميل البيانات...</h1></div></div>; }
  if (isSuperAdminLoggedIn) { return <SuperAdminDashboard stores={stores} setStores={setStores} onLogout={handleLogout} aiSettings={aiSettings} onUpdateAISettings={handleUpdateAISettings} marketplaceModules={marketplaceModules} onUpdateMarketplaceModule={handleUpdateModuleDefinition} />; }
  if (!currentUser || !currentStore) { return <Login onLogin={handleLogin} />; }
  
  const availableNavItems = marketplaceModules.filter(item => currentStore.enabledModules.includes(item.id)).map(({ id, label }) => ({ id, label }));
  const unreadMessagesCount = currentStore.aiMessages.filter(msg => !msg.read).length;

  return (
    <div className="bg-gray-100 min-h-screen flex">
      <Sidebar user={currentUser} activeView={activeView} setActiveView={handleSetActiveView} onLogout={handleLogout} navItems={availableNavItems} unreadMessagesCount={unreadMessagesCount} />
      <main className="flex-1 p-6 lg:p-10 relative">
          {renderView()}
      </main>
      {currentStore.enabledModules.includes('ai-assistant') && (
          <AIAssistant messages={currentStore.aiMessages} onAvatarClick={() => handleSetActiveView('ai-assistant')} onFeedback={handleAiMessageFeedback} />
      )}
    </div>
  );
};

export default App;
