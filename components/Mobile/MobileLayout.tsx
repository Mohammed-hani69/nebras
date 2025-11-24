
import React from 'react';
import { 
    ChartBarIcon, 
    ShoppingCartIcon, 
    CubeIcon, 
    UsersIcon, 
    NebrasLogo 
} from '../icons/Icons';
import { MobileDashboard, MobilePOS, MobileInventory, MobileGenericList, MobileMenu, MobileNotifications } from './MobileViews';
import type { Store, Employee, AISettings, ModuleDefinition } from '../../types';
import AIAssistant from '../AIAssistant';

// Import desktop components for reuse (wrapped for mobile)
import Expenses from '../Expenses';
import InvoicingModule from '../InvoicingModule';
import ServiceLog from '../ServiceLog';
import FinancialDashboard from '../FinancialDashboard';
import GeneralReports from '../GeneralReports';
import SuppliersManagement from '../SuppliersManagement';
import AIMessages from '../AIMessages';
import UserGuide from '../UserGuide';
import Installments from '../Installments';
import ActivityLogComponent from '../ActivityLog';
import ReturnsRefunds from '../ReturnsRefunds';
import SupportTicketing from '../SupportTicketing';
import TreasuryBanking from '../TreasuryBanking';
import GeneralLedger from '../GeneralLedger';
import CustomerServiceAI from '../CustomerServiceAI';
import ModuleMarketplace from '../ModuleMarketplace';
import StoreSystemSupport from '../StoreSystemSupport';
import WebsiteBuilder from '../WebsiteBuilder/WebsiteBuilder';

// Import Full Components for HR and Customers
import HRManagement from '../HRManagement';
import CustomerManagement from '../CustomerManagement';

const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const DesktopWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="p-2 pb-24 overflow-x-hidden bg-gray-50 min-h-screen">
        <div className="overflow-x-auto">{children}</div>
    </div>
);

interface MobileLayoutProps {
    store: Store;
    user: Employee;
    activeView: string;
    setActiveView: (view: string) => void;
    onLogout: () => void;
    handlers: any;
    aiSettings: AISettings;
    modules: ModuleDefinition[];
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ 
    store, user, activeView, setActiveView, onLogout, handlers, aiSettings, modules 
}) => {

    const renderContent = () => {
        switch (activeView) {
            case 'dashboard':
                return <MobileDashboard store={store} aiSettings={aiSettings} />;
            case 'pos':
                return <MobilePOS 
                            store={store} 
                            handlers={handlers} 
                            customers={store.customers}
                            sales={store.sales}
                            taxRate={store.billingSettings.taxRate}
                            saleReturns={store.saleReturns}
                            invoices={store.invoices}
                        />;
            case 'inventory':
                return <MobileInventory store={store} handlers={handlers} />;
            
            // Full HR Management Component
            case 'hr-management':
                return (
                    <DesktopWrapper>
                        <HRManagement store={store} updateStore={handlers.updateStorePartial} />
                    </DesktopWrapper>
                );

            // Full Customer Management Component
            case 'customer-management':
                return (
                    <DesktopWrapper>
                        <CustomerManagement 
                            customers={store.customers} 
                            sales={store.sales}
                            products={store.products}
                            leads={store.leads}
                            aiSettings={aiSettings}
                            addCustomer={handlers.addCustomer}
                            updateCustomer={(c) => handlers.updateStore((s: Store) => ({...s, customers: s.customers.map(x => x.id === c.id ? c : x)}))}
                            deleteCustomer={(id) => handlers.updateStore((s: Store) => ({...s, customers: s.customers.filter(x => x.id !== id)}))}
                            addCustomerTransaction={(id, t) => handlers.updateStore((s: Store) => ({...s, customers: s.customers.map(c => c.id === id ? {...c, transactions: [...c.transactions, {...t, id: `TRX-${Date.now()}`, date: new Date().toISOString()}]} : c)}))}
                            logActivity={handlers.logActivity}
                            addLead={(l) => handlers.updateStore((s: Store) => ({...s, leads: [...s.leads, {...l, id: `LEAD-${Date.now()}`, createdAt: new Date().toISOString(), interactions: [], tasks: []}]}))}
                            updateLeadStatus={(id, st) => handlers.updateStore((s: Store) => ({...s, leads: s.leads.map(l => l.id === id ? {...l, status: st} : l)}))}
                            addCRMInteraction={(id, i) => handlers.updateStore((s: Store) => ({...s, leads: s.leads.map(l => l.id === id ? {...l, interactions: [...l.interactions, {...i, id: `INT-${Date.now()}`}]} : l)}))}
                            addCRMTask={(id, t) => handlers.updateStore((s: Store) => ({...s, leads: s.leads.map(l => l.id === id ? {...l, tasks: [...l.tasks, {...t, id: `TSK-${Date.now()}`}]} : l)}))}
                            updateLeadAI={(id, data) => handlers.updateStore((s: Store) => ({...s, leads: s.leads.map(l => l.id === id ? {...l, ...data} : l)}))}
                        />
                    </DesktopWrapper>
                );

            case 'notifications-center':
                return <MobileNotifications store={store} handlers={handlers} />;
            case 'menu':
                return <MobileMenu modules={modules} activeView={activeView} setActiveView={setActiveView} onLogout={onLogout} user={user} />;
            
            // Reused Desktop Components
            case 'expenses': return <DesktopWrapper><Expenses expenses={store.expenses} addExpense={handlers.addExpense} logActivity={handlers.logActivity} /></DesktopWrapper>;
            case 'invoicing': return <DesktopWrapper><InvoicingModule store={store} addQuotation={handlers.addQuotation} updateQuotationStatus={handlers.updateQuotationStatus} convertQuotationToInvoice={handlers.convertQuotationToInvoice} /></DesktopWrapper>;
            case 'services': return <DesktopWrapper><ServiceLog services={store.services} addService={handlers.addService} createTaxInvoice={handlers.createTaxInvoice} logActivity={handlers.logActivity} customers={store.customers} taxRate={store.billingSettings.taxRate} invoices={store.invoices} /></DesktopWrapper>;
            case 'financial-reports': return <DesktopWrapper><FinancialDashboard store={store} /></DesktopWrapper>;
            case 'general-reports': return <DesktopWrapper><GeneralReports products={store.products} sales={store.sales} services={store.services} expenses={store.expenses} aiSettings={aiSettings} /></DesktopWrapper>;
            case 'suppliers-management': return <DesktopWrapper><SuppliersManagement suppliers={store.suppliers} products={store.products} sales={store.sales} purchaseOrders={store.purchaseOrders} purchaseReturns={store.purchaseReturns} addSupplier={handlers.addSupplier} updateSupplier={handlers.updateSupplier} addPurchaseOrder={handlers.addPurchaseOrder} addPurchaseOrderPayment={handlers.addPurchaseOrderPayment} updatePurchaseOrderStatus={handlers.updatePurchaseOrderStatus} logActivity={handlers.logActivity} /></DesktopWrapper>;
            case 'ai-assistant': return <DesktopWrapper><AIMessages messages={store.aiMessages} markAllAsRead={handlers.markAiMessagesAsRead} /></DesktopWrapper>;
            case 'user-guide': return <DesktopWrapper><UserGuide enabledModules={store.enabledModules} /></DesktopWrapper>;
            case 'installments': return <DesktopWrapper><Installments store={store} addInstallmentPayment={handlers.addInstallmentPayment} /></DesktopWrapper>;
            case 'activity-log': return <DesktopWrapper><ActivityLogComponent logs={store.activityLogs} employees={store.employees} /></DesktopWrapper>;
            case 'returns-refunds': return <DesktopWrapper><ReturnsRefunds store={store} addPurchaseReturn={handlers.addPurchaseReturn} updateSaleReturnStatus={handlers.updateSaleReturnStatus} updatePurchaseReturnStatus={handlers.updatePurchaseReturnStatus} logActivity={handlers.logActivity} /></DesktopWrapper>;
            case 'support-ticketing': return <DesktopWrapper><SupportTicketing store={store} currentUser={user} tickets={store.supportTickets || []} employees={store.employees} addTicket={handlers.addTicket} updateTicketStatus={handlers.updateTicketStatus} assignTicket={handlers.assignTicket} addTicketMessage={handlers.addTicketMessage} /></DesktopWrapper>;
            case 'treasury-banking': return <DesktopWrapper><TreasuryBanking store={store} addTreasury={handlers.addTreasury} addBankAccount={handlers.addBankAccount} addFinancialTransaction={handlers.addFinancialTransaction} updateTransactionStatus={handlers.updateTransactionStatus} /></DesktopWrapper>;
            case 'general-ledger': return <DesktopWrapper><GeneralLedger store={store} addJournalEntry={handlers.addJournalEntry} addAccount={handlers.addAccount} updateAccount={handlers.updateAccount} addCostCenter={handlers.addCostCenter} addBudget={handlers.addBudget} aiSettings={aiSettings} /></DesktopWrapper>;
            case 'customer-service-ai': return <DesktopWrapper><CustomerServiceAI store={store} updateStore={handlers.updateStorePartial} aiSettings={aiSettings} /></DesktopWrapper>;
            case 'marketplace': return <DesktopWrapper><ModuleMarketplace availableModules={modules} userStore={store} onEnableModule={handlers.handleEnableModule || (() => {})} /></DesktopWrapper>;
            case 'system-support': return <DesktopWrapper><StoreSystemSupport store={store} currentUser={user} onUpdateStore={handlers.updateStore} /></DesktopWrapper>;
            case 'website-builder': return <DesktopWrapper><WebsiteBuilder store={store} updateStore={handlers.updateStorePartial} availableTemplates={[]} availableBlocks={[]} availablePlans={[]} /></DesktopWrapper>;

            default: return <div className="p-8 text-center text-gray-500">جاري العمل على هذه الصفحة...</div>;
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 font-sans" dir="rtl">
            <header className="bg-white shadow-sm p-3 flex justify-between items-center sticky top-0 z-40">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8"><NebrasLogo /></div>
                    <h1 className="font-bold text-gray-800 truncate max-w-[150px] text-sm">{store.name}</h1>
                </div>
                <div className="flex items-center gap-3">
                     <button onClick={() => setActiveView('notifications-center')} className="relative p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        {store.notifications && store.notifications.filter(n => !n.read).length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                                {store.notifications.filter(n => !n.read).length}
                            </span>
                        )}
                     </button>
                     <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm border border-indigo-200">
                        {user.username.charAt(0).toUpperCase()}
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto overflow-x-hidden">
                {renderContent()}
            </main>

             <AIAssistant 
                messages={store.aiMessages} 
                onAvatarClick={() => setActiveView('ai-assistant')}
                onFeedback={(id, feedback) => handlers.updateStore((s: Store) => ({ ...s, aiMessages: s.aiMessages.map(m => m.id === id ? { ...m, feedback } : m) }))}
             />

            <nav className="bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <div className="flex justify-around items-center h-16">
                    <button onClick={() => setActiveView('dashboard')} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeView === 'dashboard' ? 'text-indigo-600' : 'text-gray-400'}`}>
                        <ChartBarIcon />
                        <span className="text-[10px] font-medium">الرئيسية</span>
                    </button>
                    
                    <button onClick={() => setActiveView('pos')} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeView === 'pos' ? 'text-indigo-600' : 'text-gray-400'}`}>
                        <ShoppingCartIcon />
                        <span className="text-[10px] font-medium">البيع</span>
                    </button>

                    <div className="relative -top-5">
                        <button onClick={() => setActiveView('inventory')} className="bg-indigo-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-transform transform active:scale-95 border-4 border-gray-50">
                            <CubeIcon />
                        </button>
                    </div>

                    <button onClick={() => setActiveView('customer-management')} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeView === 'customer-management' ? 'text-indigo-600' : 'text-gray-400'}`}>
                        <UsersIcon />
                        <span className="text-[10px] font-medium">العملاء</span>
                    </button>

                    <button onClick={() => setActiveView('menu')} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeView === 'menu' ? 'text-indigo-600' : 'text-gray-400'}`}>
                        <MenuIcon />
                        <span className="text-[10px] font-medium">المزيد</span>
                    </button>
                </div>
            </nav>
        </div>
    );
};

export default MobileLayout;
