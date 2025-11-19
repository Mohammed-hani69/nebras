import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { Product, Sale, Service, Expense, Employee, Store, AIMessage, Customer, CustomerTransaction, Supplier, PurchaseOrder, PurchaseOrderPayment, PaymentMethod, CustomRole, AISettings, SaleReturn, PurchaseReturn, InventoryMovement, Invoice, InvoiceItem, BillingSettings, ModuleDefinition, InstallmentPlan, InstallmentPayment, ActivityLog, AttendanceRecord, Payroll, LeaveRequest, Advance, LeaveRequestStatus, HRSettings, PayrollDeduction, AttendanceStatus, Quotation, QuotationStatus } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import POS from './components/POS';
import ServiceLog from './components/ServiceLog';
import Expenses from './components/Expenses';
import Login from './components/Login';
import HRManagement from './components/HRManagement';
import FinancialDashboard from './components/FinancialDashboard';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import AIMessages from './components/AIMessages';
import GeneralReports from './components/GeneralReports';
import CustomerManagement from './components/CustomerManagement';
import SuppliersManagement from './components/SuppliersManagement';
import UserGuide from './components/UserGuide';
import ModuleMarketplace from './components/ModuleMarketplace';
import Installments from './components/Installments';
import ActivityLogComponent from './components/ActivityLog';
import InvoicingModule from './components/InvoicingModule';
import ReturnsRefunds from './components/ReturnsRefunds';
import ProgressBar from './components/ProgressBar';
import { NebrasLogo } from './components/icons/Icons';
import { initDB, loadStores, saveStores, loadAISettings, saveAISettings, loadMarketplaceSettings, saveMarketplaceSettings } from './services/db';

const INITIAL_MODULES: ModuleDefinition[] = [
    { id: 'dashboard', label: 'لوحة التحكم', description: 'نظرة عامة على أداء المتجر', price: 0, category: 'basic', isCore: true, icon: 'ChartBarIcon' },
    { id: 'inventory', label: 'المخزون', description: 'إدارة المنتجات والكميات', price: 0, category: 'basic', isCore: true, icon: 'CubeIcon' },
    { id: 'pos', label: 'نقطة البيع', description: 'تسجيل المبيعات وإصدار الفواتير', price: 0, category: 'basic', isCore: true, icon: 'ShoppingCartIcon' },
    { id: 'invoicing', label: 'إدارة الفواتير', description: 'فواتير البيع والشراء وعروض الأسعار', price: 90, category: 'advanced', icon: 'DocumentDuplicateIcon' },
    { id: 'returns-refunds', label: 'إدارة المرتجعات', description: 'مرتجعات البيع والشراء وتحليل الأسباب', price: 60, category: 'advanced', icon: 'ArrowPathRoundedSquareIcon' },
    { id: 'customer-management', label: 'إدارة العملاء', description: 'قاعدة بيانات العملاء والديون', price: 50, category: 'advanced', icon: 'IdentificationIcon' },
    { id: 'suppliers-management', label: 'إدارة الموردين والمشتريات', description: 'أوامر الشراء وحسابات الموردين', price: 100, category: 'advanced', icon: 'TruckIcon' },
    { id: 'services', label: 'سجل الصيانة', description: 'تتبع طلبات الصيانة والإصلاح', price: 75, category: 'advanced', icon: 'WrenchScrewdriverIcon' },
    { id: 'installments', label: 'التقسيط والتمويل', description: 'إدارة خطط التقسيط وتتبع الدفعات', price: 120, category: 'premium', icon: 'CalendarDaysIcon' },
    { id: 'expenses', label: 'المصروفات', description: 'تتبع المصروفات التشغيلية', price: 30, category: 'basic', icon: 'BanknotesIcon' },
    { id: 'financial-reports', label: 'لوحة تحكم مالية', description: 'تحليلات مرئية للأرباح، المصروفات، والتدفق النقدي.', price: 150, category: 'premium', icon: 'PresentationChartLineIcon' },
    { id: 'general-reports', label: 'التقارير العامة', description: 'تقارير المبيعات والمنتجات', price: 50, category: 'basic', icon: 'DocumentChartBarIcon' },
    { id: 'hr-management', label: 'الموارد البشرية (HR)', description: 'إدارة الموظفين، الحضور، الرواتب، الإجازات والسلف.', price: 180, category: 'premium', icon: 'BriefcaseIcon' },
    { id: 'activity-log', label: 'سجل الحركات', description: 'مراقبة جميع أنشطة المستخدمين في النظام', price: 80, category: 'advanced', icon: 'ClipboardListIcon'},
    { id: 'ai-assistant', label: 'المساعد الذكي', description: 'نصائح وتنبيهات بالذكاء الاصطناعي', price: 200, category: 'premium', icon: 'BrainIcon' },
    { id: 'user-guide', label: 'دليل المستخدم', description: 'شرح شامل للنظام', price: 0, category: 'basic', isCore: true, icon: 'QuestionMarkCircleIcon' },
];

const DEFAULT_HR_SETTINGS: HRSettings = {
    workingDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
    absenceDeductionMethod: 'daily_rate',
    officialCheckInTime: '09:00',
};

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
      { invoiceId: 'INV001', date: '2024-05-01T10:00:00Z', productId: 'P001', quantity: 1, unitPrice: 4500, customerId: 'CUST002', paymentMethod: 'card', subtotal: 4500, taxRate: 15, taxAmount: 675, totalAmount: 5175, amountPaid: 5175, remainingBalance: 0, isFullyPaid: true },
      { invoiceId: 'INV002', date: '2024-05-03T14:30:00Z', productId: 'P003', quantity: 2, unitPrice: 120, customerId: null, paymentMethod: 'cash', subtotal: 240, taxRate: 15, taxAmount: 36, totalAmount: 276, amountPaid: 276, remainingBalance: 0, isFullyPaid: true },
    ],
    services: [
      { orderId: 'SRV001', date: '2024-05-05T09:00:00Z', description: 'تغيير شاشة iPhone 13', revenue: 500, partsCost: 250, paymentMethod: 'cash', taxRate: 15, taxAmount: 75, totalAmount: 575, amountPaid: 575, remainingBalance: 0, isFullyPaid: true },
    ],
    expenses: [
      { id: 'EXP001', date: '2024-05-01T00:00:00Z', description: 'إيجار المحل', amount: 3000, paymentMethod: 'bank_transfer' },
    ],
    employees: [
      { id: 'u001', username: 'admin', password: 'password', roleId: 'admin', fullName: 'المدير العام', phone: '0500000000', hireDate: '2024-01-01T00:00:00Z', baseSalary: 10000 },
      { id: 'u002', username: 'cashier', password: '123', roleId: 'cashier', fullName: 'أحمد الكاشير', phone: '0511111111', hireDate: '2024-02-01T00:00:00Z', baseSalary: 4000 },
      { id: 'u003', username: 'stock', password: '123', roleId: 'inventory_manager', fullName: 'خالد المخزن', phone: '0522222222', hireDate: '2024-03-01T00:00:00Z', baseSalary: 3500 },
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
    installmentPlans: [],
    quotations: [],
    attendance: [],
    payrolls: [],
    leaves: [],
    advances: [],
    hrSettings: DEFAULT_HR_SETTINGS,
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

const LOYALTY_RATE = 100;
const SUPER_ADMIN_USER = { username: 'superadmin', password: 'superpassword' };

interface CurrentUserWithPermissions extends Employee {
    permissions: string[];
    role: string;
}

const App: React.FC = () => {
  const [isSuperAdminLoggedIn, setIsSuperAdminLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUserWithPermissions | null>(null);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [aiSettings, setAiSettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);
  const [marketplaceModules, setMarketplaceModules] = useState<ModuleDefinition[]>(INITIAL_MODULES);
  const initialLoadComplete = useRef(false);
  const prevUser = useRef<CurrentUserWithPermissions | null>(null);
  
  const [activeView, setActiveView] = useState('dashboard');

  // Update Store Helper - Modified to ensure synchronous-like feel for local state
  const updateStoreData = useCallback((storeId: string, updater: (store: Store) => Store) => {
    setStores(prevStores => {
        const newStores = prevStores.map(store => store.id === storeId ? updater(store) : store);
        
        // If we are updating the currently active store, update it immediately in state
        // to avoid waiting for the effect loop, making UI snappier
        if (currentStore && currentStore.id === storeId) {
             const updated = newStores.find(s => s.id === storeId);
             if (updated) setCurrentStore(updated);
        }
        
        return newStores;
    });
  }, [currentStore]);

  // Backup Sync currentStore with stores state if changed externally
  useEffect(() => {
    if (currentStore) {
        const updatedStore = stores.find(s => s.id === currentStore.id);
        if (updatedStore && updatedStore !== currentStore) {
            setCurrentStore(updatedStore);
        }
    }
  }, [stores]);

  const logActivity = useCallback((action: string) => {
    if (!currentStore || !currentUser) return;

    const newLog: ActivityLog = {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      username: currentUser.username,
      action,
    };
    
    updateStoreData(currentStore.id, store => ({
        ...store,
        activityLogs: [newLog, ...(store.activityLogs || [])]
    }));
  }, [currentUser, currentStore, updateStoreData]);

  useEffect(() => {
    const setupDatabase = async () => {
      try {
        setLoadingProgress(10);
        await initDB();
        setLoadingProgress(30);
        
        const [loadedStores, loadedAiSettings, loadedModules] = await Promise.all([loadStores(), loadAISettings(), loadMarketplaceSettings()]);
        setLoadingProgress(60);

        if (loadedStores && loadedStores.length > 0) {
          setStores(loadedStores);
        } else {
          setStores(defaultStores);
          await saveStores(defaultStores);
        }
        setLoadingProgress(80);

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
        setLoadingProgress(100);

      } catch (error) {
        console.error("Database setup failed:", error);
        alert("فشل في إعداد قاعدة البيانات. سيتم استخدام البيانات الافتراضية.");
        setStores(defaultStores);
      } finally {
        setTimeout(() => {
            setIsLoading(false);
            initialLoadComplete.current = true;
        }, 500);
      }
    };
    setupDatabase();
  }, []);

  useEffect(() => {
     if (initialLoadComplete.current && stores.length > 0) {
         saveStores(stores).catch(console.error);
     }
  }, [stores]);

  // --- Business Logic Functions ---

    const addSale = useCallback((saleData: Omit<Sale, 'invoiceId'>) => {
        if (!currentStore) return;

        const invoiceId = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const newSale: Sale = { ...saleData, invoiceId };

        // Create Inventory Movement (Sale = Out)
        const newMovement: InventoryMovement = {
            id: `MOV-${Date.now()}`,
            date: newSale.date,
            productId: newSale.productId,
            type: 'sale',
            quantity: -newSale.quantity, // Negative quantity for sales
            referenceId: invoiceId,
            notes: `بيع فاتورة #${invoiceId}`
        };

        // Create Auto Invoice
        const product = currentStore.products.find(p => p.id === newSale.productId);
        const newInvoice: Invoice = {
            id: invoiceId,
            sourceId: invoiceId,
            sourceType: 'sale',
            date: newSale.date,
            customerName: currentStore.customers.find(c => c.id === newSale.customerId)?.name || 'عميل عام',
            items: [{
                description: product?.name || 'منتج',
                quantity: newSale.quantity,
                unitPrice: newSale.unitPrice,
                total: newSale.subtotal
            }],
            subtotal: newSale.subtotal,
            taxRate: newSale.taxRate,
            taxAmount: newSale.taxAmount,
            total: newSale.totalAmount,
            amountPaid: newSale.amountPaid,
            remainingBalance: newSale.remainingBalance
        };

        // Handle Installments
        let newInstallmentPlan: InstallmentPlan | null = null;
        if (newSale.paymentMethod === 'installment' && newSale.customerId && newSale.installmentDetails) {
            const { downPayment, numberOfInstallments, interestRate } = newSale.installmentDetails;
            const financedAmount = newSale.totalAmount - downPayment;
            const totalRepayment = financedAmount * (1 + interestRate / 100);
            const installmentAmount = totalRepayment / numberOfInstallments;
            
            const payments: InstallmentPayment[] = [];
            for (let i = 1; i <= numberOfInstallments; i++) {
                const dueDate = new Date(newSale.date);
                dueDate.setMonth(dueDate.getMonth() + i);
                payments.push({
                    id: `INST-${invoiceId}-${i}`,
                    dueDate: dueDate.toISOString(),
                    amountDue: installmentAmount,
                    paidAmount: 0,
                    paymentDate: null,
                    status: 'due'
                });
            }

            newInstallmentPlan = {
                id: `PLAN-${invoiceId}`,
                sourceId: invoiceId,
                sourceType: 'sale',
                customerId: newSale.customerId,
                totalFinancedAmount: financedAmount,
                totalRepaymentAmount: totalRepayment,
                interestRate,
                numberOfInstallments,
                installmentAmount,
                startDate: newSale.date,
                payments
            };
        }

        updateStoreData(currentStore.id, (store) => {
            const updatedCustomers = store.customers.map(c => {
                if (c.id === newSale.customerId) {
                     // Add points
                    const pointsEarned = Math.floor(newSale.totalAmount / LOYALTY_RATE);
                    // Add debt transaction if not fully paid (and not installment plan tracked separately)
                    let newTransactions = c.transactions;
                    if (newSale.remainingBalance > 0 && newSale.paymentMethod !== 'installment') {
                        newTransactions = [...c.transactions, {
                            id: `TRN-${Date.now()}`,
                            date: newSale.date,
                            type: 'debt',
                            amount: newSale.remainingBalance,
                            description: `متبقي فاتورة #${invoiceId}`
                        }];
                    }
                    return { ...c, loyaltyPoints: c.loyaltyPoints + pointsEarned, transactions: newTransactions };
                }
                return c;
            });

            return {
                ...store,
                sales: [...store.sales, newSale],
                invoices: [...store.invoices, newInvoice],
                inventoryMovements: [...store.inventoryMovements, newMovement],
                installmentPlans: newInstallmentPlan ? [...store.installmentPlans, newInstallmentPlan] : store.installmentPlans,
                customers: updatedCustomers
            };
        });
        logActivity(`إضافة عملية بيع جديدة #${invoiceId}`);
    }, [currentStore, updateStoreData, logActivity]);

    const addService = useCallback((serviceData: Omit<Service, 'orderId'>) => {
        if (!currentStore) return;
        const orderId = `SRV-${Date.now()}`;
        const newService: Service = { ...serviceData, orderId };

         // Create Auto Invoice for Service
        const newInvoice: Invoice = {
            id: orderId, // Use orderId as invoice ID for services
            sourceId: orderId,
            sourceType: 'service',
            date: newService.date,
            customerName: currentStore.customers.find(c => c.id === newService.customerId)?.name || 'عميل عام',
            items: [{
                description: newService.description,
                quantity: 1,
                unitPrice: newService.revenue,
                total: newService.revenue
            }],
            subtotal: newService.revenue,
            taxRate: newService.taxRate,
            taxAmount: newService.taxAmount,
            total: newService.totalAmount,
            amountPaid: newService.amountPaid,
            remainingBalance: newService.remainingBalance
        };

        let newInstallmentPlan: InstallmentPlan | null = null;
        if (newService.paymentMethod === 'installment' && newService.customerId && newService.installmentDetails) {
             const { downPayment, numberOfInstallments, interestRate } = newService.installmentDetails;
             const financedAmount = newService.totalAmount - downPayment;
             const totalRepayment = financedAmount * (1 + interestRate / 100);
             const installmentAmount = totalRepayment / numberOfInstallments;
             const payments: InstallmentPayment[] = [];
             for (let i = 1; i <= numberOfInstallments; i++) {
                const dueDate = new Date(newService.date);
                dueDate.setMonth(dueDate.getMonth() + i);
                payments.push({ id: `INST-${orderId}-${i}`, dueDate: dueDate.toISOString(), amountDue: installmentAmount, paidAmount: 0, paymentDate: null, status: 'due' });
            }
            newInstallmentPlan = { id: `PLAN-${orderId}`, sourceId: orderId, sourceType: 'service', customerId: newService.customerId, totalFinancedAmount: financedAmount, totalRepaymentAmount: totalRepayment, interestRate, numberOfInstallments, installmentAmount, startDate: newService.date, payments };
        }

        updateStoreData(currentStore.id, store => ({
            ...store,
            services: [...store.services, newService],
            invoices: [...store.invoices, newInvoice],
            installmentPlans: newInstallmentPlan ? [...store.installmentPlans, newInstallmentPlan] : store.installmentPlans
        }));
        logActivity(`إضافة خدمة صيانة #${orderId}`);
    }, [currentStore, updateStoreData, logActivity]);

    const addPurchaseReturn = useCallback((pr: Omit<PurchaseReturn, 'id'|'date'>) => {
        if (!currentStore) return;
        const newPR: PurchaseReturn = { ...pr, id: `PR-${Date.now()}`, date: new Date().toISOString() };
        
        // Inventory Movement (Return to Supplier = OUT = Negative Quantity relative to stock)
        const newMovement: InventoryMovement = {
            id: `MOV-RET-${Date.now()}`,
            date: newPR.date,
            productId: newPR.productId,
            type: 'purchase_return',
            quantity: -newPR.quantity, 
            notes: `مرتجع شراء للمورد: ${newPR.reason}`
        };

        updateStoreData(currentStore.id, store => ({
            ...store,
            purchaseReturns: [...store.purchaseReturns, newPR],
            inventoryMovements: [...store.inventoryMovements, newMovement]
        }));
        logActivity(`تسجيل مرتجع شراء للمنتج ${newPR.productId}`);
    }, [currentStore, updateStoreData, logActivity]);

    const addSaleReturn = useCallback((sr: Omit<SaleReturn, 'id' | 'date'>) => {
        if (!currentStore) return;
        const newReturn = { ...sr, id: `SR-${Date.now()}`, date: new Date().toISOString() };
        
        // Inventory Movement: Sale Return = IN (positive quantity) - Returning items to stock
        const newMovement: InventoryMovement = {
            id: `MOV-RET-SALE-${Date.now()}`,
            date: newReturn.date,
            productId: newReturn.productId,
            type: 'sale_return',
            quantity: newReturn.quantity, // Positive to add back to inventory
            referenceId: newReturn.originalSaleInvoiceId,
            notes: `مرتجع مبيعات: ${newReturn.reason}`
        };

        updateStoreData(currentStore.id, store => ({
            ...store,
            saleReturns: [...store.saleReturns, newReturn],
            inventoryMovements: [...store.inventoryMovements, newMovement]
        }));
        logActivity('مرتجع مبيعات');
    }, [currentStore, updateStoreData, logActivity]);

    const addInstallmentPayment = useCallback((planId: string, paymentId: string, amount: number) => {
        if (!currentStore) return;
        
        updateStoreData(currentStore.id, s => {
            const updatedPlans = s.installmentPlans.map(p => {
                if (p.id === planId) {
                    const updatedPayments = p.payments.map(pay => {
                        if (pay.id === paymentId) {
                            const isPaid = amount >= pay.amountDue;
                            return {
                                ...pay,
                                paidAmount: amount,
                                paymentDate: new Date().toISOString(),
                                status: (isPaid ? 'paid' : 'due') as 'due' | 'paid' | 'overdue'
                            };
                        }
                        return pay;
                    });
                    return { ...p, payments: updatedPayments };
                }
                return p;
            });
            return { ...s, installmentPlans: updatedPlans };
        });
        logActivity(`تسجيل دفعة قسط للخطة #${planId}`);
    }, [currentStore, updateStoreData, logActivity]);

    // --- View Rendering ---
    const renderContent = () => {
        if (isSuperAdminLoggedIn) {
             return <SuperAdminDashboard stores={stores} setStores={setStores} onLogout={() => setIsSuperAdminLoggedIn(false)} aiSettings={aiSettings} onUpdateAISettings={async (newSettings) => { setAiSettings(newSettings); await saveAISettings(newSettings); }} marketplaceModules={marketplaceModules} onUpdateMarketplaceModule={async (mod) => { const newModules = marketplaceModules.map(m => m.id === mod.id ? mod : m); setMarketplaceModules(newModules); await saveMarketplaceSettings(newModules); }} />;
        }

        if (!currentUser || !currentStore) return <Login onLogin={(u, p) => {
            if(u === SUPER_ADMIN_USER.username && p === SUPER_ADMIN_USER.password) { setIsSuperAdminLoggedIn(true); return true; }
            const store = stores.find(s => s.employees.some(e => e.username === u && e.password === p));
            if(store) {
                const user = store.employees.find(e => e.username === u)!;
                const role = store.roles.find(r => r.id === user.roleId);
                setCurrentUser({ ...user, permissions: role?.permissions || [], role: role?.name || '' });
                setCurrentStore(store);
                return true;
            }
            return false;
        }} />;

        switch (activeView) {
            case 'dashboard': return <Dashboard store={currentStore} products={currentStore.products.map(p => { const sold = currentStore.sales.filter(s => s.productId === p.id).reduce((sum, s) => sum + s.quantity, 0); const returned = currentStore.purchaseReturns.filter(pr => pr.productId === p.id).reduce((sum, r) => sum + r.quantity, 0); const salesReturned = currentStore.saleReturns.filter(sr => sr.productId === p.id).reduce((sum, r) => sum + r.quantity, 0); return { ...p, quantitySold: sold, quantityAvailable: p.initialQuantity - sold - returned + salesReturned }; })} sales={currentStore.sales} services={currentStore.services} expenses={currentStore.expenses} purchaseOrders={currentStore.purchaseOrders} aiSettings={aiSettings} />;
            case 'inventory': return <Inventory products={currentStore.products.map(p => { const sold = currentStore.sales.filter(s => s.productId === p.id).reduce((sum, s) => sum + s.quantity, 0); const returned = currentStore.purchaseReturns.filter(pr => pr.productId === p.id).reduce((sum, r) => sum + r.quantity, 0); const salesReturned = currentStore.saleReturns.filter(sr => sr.productId === p.id).reduce((sum, r) => sum + r.quantity, 0); return { ...p, quantitySold: sold, quantityAvailable: p.initialQuantity - sold - returned + salesReturned }; })} addProduct={(p) => { updateStoreData(currentStore.id, s => ({...s, products: [...s.products, {...p, id: `P-${Date.now()}`}]})); logActivity(`إضافة منتج: ${p.name}`); }} suppliers={currentStore.suppliers} logActivity={logActivity} inventoryMovements={currentStore.inventoryMovements} />;
            case 'pos': return <POS store={currentStore} products={currentStore.products.map(p => { const sold = currentStore.sales.filter(s => s.productId === p.id).reduce((sum, s) => sum + s.quantity, 0); const returned = currentStore.purchaseReturns.filter(pr => pr.productId === p.id).reduce((sum, r) => sum + r.quantity, 0); const salesReturned = currentStore.saleReturns.filter(sr => sr.productId === p.id).reduce((sum, r) => sum + r.quantity, 0); return { ...p, quantityAvailable: p.initialQuantity - sold - returned + salesReturned }; })} addSale={addSale} sales={currentStore.sales} customers={currentStore.customers} addCustomer={(c) => { const newC = { ...c, id: `CUST-${Date.now()}`, joinDate: new Date().toISOString(), loyaltyPoints: 0, transactions: [] }; updateStoreData(currentStore.id, s => ({...s, customers: [...s.customers, newC]})); return newC; }} createTaxInvoice={() => {}} saleReturns={currentStore.saleReturns} addSaleReturn={addSaleReturn} logActivity={logActivity} taxRate={currentStore.billingSettings.taxRate} invoices={currentStore.invoices} />;
            case 'invoicing': return <InvoicingModule store={currentStore} addQuotation={(q) => { updateStoreData(currentStore.id, s => ({...s, quotations: [...s.quotations, {...q, id: `QT-${Date.now()}`, date: new Date().toISOString(), status: 'pending'}]})); }} updateQuotationStatus={(id, st) => updateStoreData(currentStore.id, s => ({...s, quotations: s.quotations.map(q => q.id === id ? {...q, status: st} : q)}))} convertQuotationToInvoice={(id) => { const q = currentStore.quotations.find(q => q.id === id); if(q) { q.items.forEach(i => addSale({ date: new Date().toISOString(), productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice, customerId: q.customerId, paymentMethod: 'cash', subtotal: i.quantity * i.unitPrice, taxRate: currentStore.billingSettings.taxRate, taxAmount: (i.quantity * i.unitPrice * currentStore.billingSettings.taxRate)/100, totalAmount: (i.quantity * i.unitPrice * (1 + currentStore.billingSettings.taxRate/100)), amountPaid: (i.quantity * i.unitPrice * (1 + currentStore.billingSettings.taxRate/100)), remainingBalance: 0, isFullyPaid: true, quotationId: q.id })); updateStoreData(currentStore.id, s => ({...s, quotations: s.quotations.map(q => q.id === id ? {...q, status: 'invoiced'} : q)})); } }} />;
            case 'returns-refunds': return <ReturnsRefunds store={currentStore} addPurchaseReturn={addPurchaseReturn} logActivity={logActivity} />;
            case 'customer-management': return <CustomerManagement customers={currentStore.customers} sales={currentStore.sales} products={currentStore.products} addCustomer={(c) => { const newC = { ...c, id: `CUST-${Date.now()}`, joinDate: new Date().toISOString(), loyaltyPoints: 0, transactions: [] }; updateStoreData(currentStore.id, s => ({...s, customers: [...s.customers, newC]})); return newC; }} updateCustomer={(c) => updateStoreData(currentStore.id, s => ({...s, customers: s.customers.map(cust => cust.id === c.id ? c : cust)}))} deleteCustomer={(id) => updateStoreData(currentStore.id, s => ({...s, customers: s.customers.filter(c => c.id !== id)}))} addCustomerTransaction={(cid, t) => updateStoreData(currentStore.id, s => ({...s, customers: s.customers.map(c => c.id === cid ? {...c, transactions: [...c.transactions, {...t, id: `TRN-${Date.now()}`, date: new Date().toISOString()}]} : c)}))} logActivity={logActivity} />;
            case 'suppliers-management': return <SuppliersManagement suppliers={currentStore.suppliers} products={currentStore.products} sales={currentStore.sales} purchaseOrders={currentStore.purchaseOrders} purchaseReturns={currentStore.purchaseReturns} addSupplier={(sup) => { updateStoreData(currentStore.id, s => ({...s, suppliers: [...s.suppliers, {...sup, id: `SUP-${Date.now()}`}]})); logActivity(`إضافة مورد: ${sup.name}`); }} updateSupplier={(sup) => updateStoreData(currentStore.id, s => ({...s, suppliers: s.suppliers.map(su => su.id === sup.id ? sup : su)}))} addPurchaseOrder={(po) => updateStoreData(currentStore.id, s => ({...s, purchaseOrders: [...s.purchaseOrders, {...po, id: `PO-${Date.now()}`, payments: [], status: 'pending'}]}))} addPurchaseOrderPayment={(poid, pay) => updateStoreData(currentStore.id, s => ({...s, purchaseOrders: s.purchaseOrders.map(po => po.id === poid ? {...po, payments: [...po.payments, {...pay, id: `PAY-${Date.now()}`}]} : po)}))} updatePurchaseOrderStatus={(id, st) => updateStoreData(currentStore.id, s => ({...s, purchaseOrders: s.purchaseOrders.map(po => po.id === id ? {...po, status: st} : po)}))} logActivity={logActivity} />;
            case 'services': return <ServiceLog services={currentStore.services} addService={addService} createTaxInvoice={() => {}} logActivity={logActivity} customers={currentStore.customers} taxRate={currentStore.billingSettings.taxRate} invoices={currentStore.invoices} />;
            case 'installments': return <Installments store={currentStore} addInstallmentPayment={addInstallmentPayment} />;
            case 'expenses': return <Expenses expenses={currentStore.expenses} addExpense={(e) => { updateStoreData(currentStore.id, s => ({ ...s, expenses: [...s.expenses, { ...e, id: `EXP-${Date.now()}` }] })); logActivity('إضافة مصروف'); }} logActivity={logActivity} />;
            case 'financial-reports': return <FinancialDashboard store={currentStore} />;
            case 'general-reports': return <GeneralReports products={currentStore.products} sales={currentStore.sales} services={currentStore.services} expenses={currentStore.expenses} aiSettings={aiSettings} />;
            case 'hr-management': return <HRManagement store={currentStore} employees={currentStore.employees} roles={currentStore.roles} attendance={currentStore.attendance} payrolls={currentStore.payrolls} leaves={currentStore.leaves} advances={currentStore.advances} allModules={marketplaceModules} logActivity={logActivity} addEmployee={(e) => updateStoreData(currentStore.id, s => ({...s, employees: [...s.employees, {...e, id: `EMP-${Date.now()}`}]}))} updateEmployee={(e) => updateStoreData(currentStore.id, s => ({...s, employees: s.employees.map(emp => emp.id === e.id ? e : emp)}))} deleteEmployee={(id) => updateStoreData(currentStore.id, s => ({...s, employees: s.employees.filter(e => e.id !== id)}))} addRole={(r) => updateStoreData(currentStore.id, s => ({...s, roles: [...s.roles, {...r, id: `ROLE-${Date.now()}`}]}))} updateRole={(r) => updateStoreData(currentStore.id, s => ({...s, roles: s.roles.map(ro => ro.id === r.id ? r : ro)}))} deleteRole={(id) => updateStoreData(currentStore.id, s => ({...s, roles: s.roles.filter(r => r.id !== id)}))} addOrUpdateDailyAttendance={(d, recs) => updateStoreData(currentStore.id, s => ({...s, attendance: [...s.attendance.filter(a => a.date !== d), ...recs.map(r => ({...r, id: `ATT-${d}-${r.employeeId}`, date: d, deductionAmount: r.deductionAmount || 0, notes: r.notes || ''}))]}))} generatePayrolls={() => { /* Simplified generation logic */ alert("تم توليد الرواتب (محاكاة)"); }} updatePayroll={() => {}} markPayrollAsPaid={(pid) => updateStoreData(currentStore.id, s => ({...s, payrolls: s.payrolls.map(p => p.id === pid ? {...p, status: 'paid', paymentDate: new Date().toISOString()} : p)}))} addLeaveRequest={(l) => updateStoreData(currentStore.id, s => ({...s, leaves: [...s.leaves, {...l, id: `LEAVE-${Date.now()}`, status: 'pending'}]}))} updateLeaveRequestStatus={(lid, st) => updateStoreData(currentStore.id, s => ({...s, leaves: s.leaves.map(l => l.id === lid ? {...l, status: st} : l)}))} addAdvance={(a) => updateStoreData(currentStore.id, s => ({...s, advances: [...s.advances, {...a, id: `ADV-${Date.now()}`, status: 'unpaid'}]}))} updateHRSettings={(newSettings) => updateStoreData(currentStore.id, s => ({...s, hrSettings: newSettings}))} />;
            case 'activity-log': return <ActivityLogComponent logs={currentStore.activityLogs} employees={currentStore.employees} />;
            case 'ai-assistant': return <AIMessages messages={currentStore.aiMessages} markAllAsRead={() => updateStoreData(currentStore.id, s => ({...s, aiMessages: s.aiMessages.map(m => ({...m, read: true}))}))} />;
            case 'user-guide': return <UserGuide enabledModules={currentStore.enabledModules} />;
            case 'marketplace': return <ModuleMarketplace availableModules={marketplaceModules} userStore={currentStore} onEnableModule={(mid) => { updateStoreData(currentStore.id, s => ({...s, enabledModules: [...s.enabledModules, mid]})); logActivity(`تفعيل مديول: ${mid}`); }} />;
            default: return <div>Page not found</div>;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="w-full max-w-md p-6 text-center">
                    <NebrasLogo />
                    <h2 className="text-xl font-bold mt-4 text-gray-700">جاري تحميل النظام...</h2>
                    <div className="mt-4">
                         <ProgressBar progress={loadingProgress} heightClass="h-2" />
                    </div>
                </div>
            </div>
        );
    }

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans text-right" dir="rtl">
      {currentUser && currentStore && (
        <Sidebar 
            user={{ id: currentUser.id, username: currentUser.username, role: currentUser.role, permissions: currentUser.permissions }} 
            activeView={activeView} 
            setActiveView={setActiveView} 
            onLogout={() => { setCurrentUser(null); setCurrentStore(null); setIsSuperAdminLoggedIn(false); }}
            navItems={INITIAL_MODULES.filter(m => currentStore.enabledModules.includes(m.id))}
            unreadMessagesCount={currentStore.aiMessages.filter(m => !m.read).length}
        />
      )}
      <main className="flex-1 p-6 overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;