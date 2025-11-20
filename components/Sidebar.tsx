




import React, { useState } from 'react';
import { ChartBarIcon, CubeIcon, ShoppingCartIcon, WrenchScrewdriverIcon, BanknotesIcon, UsersIcon, LogoutIcon, PresentationChartLineIcon, BrainIcon, DocumentChartBarIcon, NebrasLogo, IdentificationIcon, TruckIcon, QuestionMarkCircleIcon, StoreIcon, ChevronDownIcon, CalendarDaysIcon, ClipboardListIcon, BriefcaseIcon, DocumentDuplicateIcon, ArrowPathRoundedSquareIcon, BellIcon, TicketIcon, BuildingLibraryIcon, BookOpenIcon, ChatBubbleLeftRightIcon, LifebuoyIcon, GlobeAltIcon } from './icons/Icons';

interface UserWithPermissions {
  id: string;
  username: string;
  role: string;
  permissions: string[];
}

interface SidebarProps {
  user: UserWithPermissions;
  activeView: string;
  setActiveView: (view: string) => void;
  onLogout: () => void;
  navItems: {id: string, label: string}[];
  unreadMessagesCount: number;
  unreadNotificationsCount?: number; // Added prop
}

const ICONS: { [key: string]: React.ReactNode } = {
    'dashboard': <ChartBarIcon />,
    'inventory': <CubeIcon />,
    'pos': <ShoppingCartIcon />,
    'invoicing': <DocumentDuplicateIcon />,
    'services': <WrenchScrewdriverIcon />,
    'expenses': <BanknotesIcon />,
    'financial-reports': <PresentationChartLineIcon />,
    'general-reports': <DocumentChartBarIcon />,
    'hr-management': <BriefcaseIcon />,
    'customer-management': <IdentificationIcon />,
    'suppliers-management': <TruckIcon />,
    'ai-assistant': <BrainIcon />,
    'user-guide': <QuestionMarkCircleIcon />,
    'installments': <CalendarDaysIcon />,
    'activity-log': <ClipboardListIcon />,
    'returns-refunds': <ArrowPathRoundedSquareIcon />,
    'notifications-center': <BellIcon />, // Icon for notifications
    'support-ticketing': <TicketIcon />, // Icon for ticketing
    'treasury-banking': <BuildingLibraryIcon />, // Icon for Treasury
    'general-ledger': <BookOpenIcon />, // Icon for General Ledger
    'customer-service-ai': <ChatBubbleLeftRightIcon />, // Icon for Customer Service AI
    'website-builder': <GlobeAltIcon />, // Icon for Website Builder
};

const Sidebar: React.FC<SidebarProps> = ({ user, activeView, setActiveView, onLogout, navItems, unreadMessagesCount, unreadNotificationsCount = 0 }) => {
  const [openSections, setOpenSections] = useState<string[]>(['main', 'finance', 'management']);

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId) 
        : [...prev, sectionId]
    );
  };
  
  const sections = [
    { id: 'main', title: 'رئيسي', items: navItems.filter(item => ['dashboard', 'inventory', 'pos', 'services'].includes(item.id)) },
    { id: 'online', title: 'المتجر الإلكتروني', items: navItems.filter(item => ['website-builder'].includes(item.id)) },
    { id: 'management', title: 'الإدارة', items: navItems.filter(item => ['customer-management', 'suppliers-management', 'hr-management', 'activity-log', 'support-ticketing', 'customer-service-ai'].includes(item.id)) },
    { id: 'finance', title: 'المالية والتقارير', items: navItems.filter(item => ['treasury-banking', 'general-ledger', 'invoicing', 'expenses', 'installments', 'returns-refunds', 'financial-reports', 'general-reports'].includes(item.id)) },
    { id: 'system', title: 'النظام', items: [...navItems.filter(item => ['ai-assistant', 'user-guide'].includes(item.id))] },
  ].filter(section => section.items.length > 0);

  const renderNavItem = (item: {id: string, label: string}) => (
    <li key={item.id} className="nav-item">
      <button
        onClick={() => setActiveView(item.id)}
        title={item.id === 'dashboard' ? 'لوحة التحكم الرئيسية' : undefined}
        className={`w-full flex items-center space-x-3 p-3 rounded-lg text-right transition-all duration-200 text-sm ${
          activeView === item.id 
          ? 'bg-indigo-600 text-white shadow-md active' 
          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <span className="text-xl">{ICONS[item.id]}</span>
        <span className="font-medium">{item.label}</span>
         {item.id === 'ai-assistant' && unreadMessagesCount > 0 && (
            <span className="mr-auto bg-purple-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                {unreadMessagesCount}
            </span>
        )}
      </button>
    </li>
  );

  return (
    <nav className="w-64 bg-slate-900 text-white h-screen sticky top-0 flex flex-col shadow-xl z-50">
      {/* Header */}
      <div className="p-5 flex items-center justify-center border-b border-slate-700">
        <div className="flex items-center space-x-2">
          <NebrasLogo />
          <h1 className="text-2xl font-bold tracking-wider">نبراس</h1>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
        <ul className="space-y-1 px-3">
           {/* Notifications Center Button */}
            <li className="nav-item">
                <button
                    onClick={() => setActiveView('notifications-center')}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg text-right transition-all duration-200 mb-2 hover:bg-slate-800 hover:text-white ${activeView === 'notifications-center' ? 'bg-indigo-600 text-white active' : 'text-slate-300'}`}
                >
                    <span className="text-xl"><BellIcon /></span>
                    <span className="font-bold text-sm">مركز الإشعارات</span>
                    {unreadNotificationsCount > 0 && (
                        <span className="mr-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                            {unreadNotificationsCount}
                        </span>
                    )}
                </button>
            </li>

            {/* System Support Button (Fixed for Store Owner) */}
            <li className="nav-item">
                <button
                    onClick={() => setActiveView('system-support')}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg text-right transition-all duration-200 mb-2 hover:bg-slate-800 hover:text-white ${activeView === 'system-support' ? 'bg-blue-600 text-white active' : 'text-slate-300'}`}
                >
                    <span className="text-xl"><LifebuoyIcon /></span>
                    <span className="font-bold text-sm">الدعم الفني للنظام</span>
                </button>
            </li>

           {/* Always show Marketplace */}
           <li className="nav-item">
            <button
                onClick={() => setActiveView('marketplace')}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg text-right transition-all duration-200 bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg mb-4 hover:from-purple-700 hover:to-indigo-700 ${activeView === 'marketplace' ? 'ring-2 ring-white active' : ''}`}
              >
                <span className="text-xl"><StoreIcon /></span>
                <span className="font-bold text-sm">سوق التطبيقات</span>
            </button>
          </li>

          {sections.map(section => {
            const isOpen = openSections.includes(section.id);
            return (
              <li key={section.id} className="py-2">
                <button 
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 hover:text-slate-200"
                >
                  {section.title}
                  <ChevronDownIcon />
                </button>
                {/* Increased max-height to prevent cutting off content in large sections like Finance */}
                <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[1200px]' : 'max-h-0'}`}>
                    <ul className="space-y-1 pt-1 border-t border-slate-800">
                      {section.items.map(renderNavItem)}
                    </ul>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Footer: User Info & Logout */}
      <div className="p-4 border-t border-slate-700 bg-slate-800">
          <div className="flex items-center mb-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold mr-3">
                  {user.username.charAt(0).toUpperCase()}
              </div>
              <div>
                  <p className="text-sm font-semibold">{user.username}</p>
                  <p className="text-xs text-slate-400">{user.role}</p>
              </div>
          </div>
          <button
              onClick={onLogout}
              className="w-full flex items-center justify-center space-x-2 p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors duration-200 text-sm font-bold"
            >
              <LogoutIcon />
              <span>تسجيل الخروج</span>
          </button>
      </div>
    </nav>
  );
};

export default Sidebar;