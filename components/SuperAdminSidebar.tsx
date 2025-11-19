

import React from 'react';
import { NebrasLogo, CubeIcon, BanknotesIcon, LogoutIcon, ChartPieIcon, CogIcon, StoreIcon } from './icons/Icons';

interface SuperAdminSidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  onLogout: () => void;
}

const SuperAdminSidebar: React.FC<SuperAdminSidebarProps> = ({ activeView, setActiveView, onLogout }) => {
  const navItems = [
    { id: 'management', label: 'إدارة المتاجر', icon: <CubeIcon /> },
    { id: 'marketplace-settings', label: 'إدارة سوق المديولات', icon: <StoreIcon /> },
    { id: 'profits', label: 'الأرباح', icon: <BanknotesIcon /> },
    { id: 'analysis', label: 'تحليل البيانات', icon: <ChartPieIcon /> },
    { id: 'ai-settings', label: 'إعدادات الذكاء الاصطناعي', icon: <CogIcon /> },
  ];

  return (
    <nav className="w-64 bg-gray-800 text-white p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center space-x-3 mb-10 px-2">
          <NebrasLogo />
          <h1 className="text-2xl font-bold">نبراس</h1>
        </div>
        <ul className="space-y-2">
          {navItems.map(item => (
            <li key={item.id}>
              <button
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg text-right transition-colors duration-200 ${
                  activeView === item.id 
                  ? 'bg-indigo-600 text-white' 
                  : 'hover:bg-gray-700'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="border-t border-gray-700 pt-4">
          <p className="px-3 text-sm text-gray-400 mb-2">مرحباً, <span className="font-bold">superadmin</span></p>
          <button
              onClick={onLogout}
              className="w-full flex items-center space-x-3 p-3 rounded-lg text-right transition-colors duration-200 hover:bg-red-500"
            >
              <LogoutIcon />
              <span className="font-medium">تسجيل الخروج</span>
          </button>
      </div>
    </nav>
  );
};

export default SuperAdminSidebar;
