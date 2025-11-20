


import React, { useState } from 'react';
import type { Store, ModuleDefinition } from '../types';
import { ShieldCheckIcon, CubeIcon, BeakerIcon, UsersIcon, CheckCircleIcon, SparklesIcon } from './icons/Icons';

interface SuperAdminPermissionsProps {
    stores: Store[];
    setStores: React.Dispatch<React.SetStateAction<Store[]>>;
    marketplaceModules: ModuleDefinition[];
}

const BETA_FEATURES = [
    { id: 'new-ui', label: 'واجهة المستخدم الجديدة (Beta)', description: 'تجربة تصميم جديد ومحسن للنظام.' },
    { id: 'ai-reasoning', label: 'تحليل الذكاء الاصطناعي المتقدم', description: 'نماذج ذكاء اصطناعي أكثر قدرة على الاستنتاج.' },
    { id: 'whatsapp-v2', label: 'تكامل واتساب المباشر', description: 'ربط مباشر بدون وسطاء (تجريبي).' },
];

const SuperAdminPermissions: React.FC<SuperAdminPermissionsProps> = ({ stores, setStores, marketplaceModules }) => {
    const [selectedStoreId, setSelectedStoreId] = useState<string>(stores.length > 0 ? stores[0].id : '');
    const [activeTab, setActiveTab] = useState<'modules' | 'roles' | 'beta'>('modules');

    const currentStore = stores.find(s => s.id === selectedStoreId);

    const handleUpdateStore = (updater: (store: Store) => Store) => {
        setStores(prev => prev.map(s => s.id === selectedStoreId ? updater(s) : s));
    };

    const toggleModule = (moduleId: string) => {
        handleUpdateStore(store => {
            const isEnabled = store.enabledModules.includes(moduleId);
            return {
                ...store,
                enabledModules: isEnabled 
                    ? store.enabledModules.filter(m => m !== moduleId) 
                    : [...store.enabledModules, moduleId]
            };
        });
    };

    const toggleBetaFeature = (featureId: string) => {
        handleUpdateStore(store => {
            const features = store.betaFeatures || [];
            const isEnabled = features.includes(featureId);
            return {
                ...store,
                betaFeatures: isEnabled 
                    ? features.filter(f => f !== featureId)
                    : [...features, featureId]
            };
        });
    };

    const toggleRolePermission = (roleId: string, permissionId: string) => {
        handleUpdateStore(store => ({
            ...store,
            roles: store.roles.map(role => {
                if (role.id === roleId) {
                    const hasPerm = role.permissions.includes(permissionId);
                    return {
                        ...role,
                        permissions: hasPerm 
                            ? role.permissions.filter(p => p !== permissionId) 
                            : [...role.permissions, permissionId]
                    };
                }
                return role;
            })
        }));
    };

    if (!currentStore) return <div className="p-8 text-center text-gray-500">لا توجد متاجر لعرضها.</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                        <ShieldCheckIcon />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800">إدارة الصلاحيات العالمية</h1>
                </div>
                
                <div className="flex items-center gap-2">
                    <label className="font-bold text-gray-700">المتجر المحدد:</label>
                    <select 
                        value={selectedStoreId} 
                        onChange={e => setSelectedStoreId(e.target.value)}
                        className="p-2 border rounded-lg bg-white shadow-sm min-w-[200px]"
                    >
                        {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b bg-white rounded-t-xl shadow-sm overflow-x-auto">
                <button onClick={() => setActiveTab('modules')} className={`flex items-center gap-2 px-6 py-4 font-medium transition ${activeTab === 'modules' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <CubeIcon /> وحدات النظام (Modules)
                </button>
                <button onClick={() => setActiveTab('roles')} className={`flex items-center gap-2 px-6 py-4 font-medium transition ${activeTab === 'roles' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <UsersIcon /> الرتب والأدوار
                </button>
                <button onClick={() => setActiveTab('beta')} className={`flex items-center gap-2 px-6 py-4 font-medium transition ${activeTab === 'beta' ? 'border-b-2 border-purple-600 text-purple-600 bg-purple-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <BeakerIcon /> الميزات التجريبية (Beta)
                </button>
            </div>

            <div className="bg-white rounded-b-xl shadow-lg p-6 min-h-[400px]">
                
                {activeTab === 'modules' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {marketplaceModules.map(mod => {
                            const isEnabled = currentStore.enabledModules.includes(mod.id);
                            return (
                                <div key={mod.id} className={`p-4 border rounded-xl flex justify-between items-center transition ${isEnabled ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
                                    <div>
                                        <h4 className="font-bold text-gray-800">{mod.label}</h4>
                                        <p className="text-xs text-gray-500">{mod.category}</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={isEnabled} 
                                            onChange={() => toggleModule(mod.id)} 
                                            className="sr-only peer"
                                            disabled={mod.isCore} 
                                        />
                                        <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${mod.isCore ? 'opacity-50 cursor-not-allowed peer-checked:bg-gray-400' : 'peer-checked:bg-green-600'}`}></div>
                                    </label>
                                </div>
                            );
                        })}
                    </div>
                )}

                {activeTab === 'roles' && (
                    <div className="space-y-6">
                        {currentStore.roles.map(role => (
                            <div key={role.id} className="border rounded-xl overflow-hidden">
                                <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                                    <h3 className="font-bold text-lg text-gray-800">{role.name}</h3>
                                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">{role.permissions.length} صلاحيات</span>
                                </div>
                                <div className="p-4">
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                        {marketplaceModules.map(mod => {
                                            const hasPerm = role.permissions.includes(mod.id) || role.permissions.includes('all');
                                            return (
                                                <label key={mod.id} className={`flex items-center gap-2 p-2 rounded border cursor-pointer hover:bg-gray-50 ${hasPerm ? 'border-indigo-200 bg-indigo-50' : ''}`}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={hasPerm} 
                                                        onChange={() => toggleRolePermission(role.id, mod.id)}
                                                        disabled={role.id === 'admin'} // Prevent removing admin permissions easily here to avoid lockout
                                                        className="text-indigo-600 rounded focus:ring-indigo-500"
                                                    />
                                                    <span className="text-sm">{mod.label}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'beta' && (
                    <div className="space-y-4">
                        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-xl mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-2 mb-2">
                                <BeakerIcon /> منطقة الميزات التجريبية
                            </h3>
                            <p className="opacity-90 text-sm">
                                هذه الميزات لا تزال قيد التطوير. تفعيلها قد يمنح المتجر إمكانيات متقدمة ولكنها قد تكون غير مستقرة تماماً.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {BETA_FEATURES.map(feat => {
                                const isEnabled = (currentStore.betaFeatures || []).includes(feat.id);
                                return (
                                    <div key={feat.id} className="flex items-center justify-between p-5 border rounded-xl shadow-sm hover:shadow-md transition bg-white">
                                        <div className="flex items-start gap-3">
                                            <div className={`p-2 rounded-lg ${isEnabled ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'}`}>
                                                <SparklesIcon />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-800">{feat.label}</h4>
                                                <p className="text-sm text-gray-500">{feat.description}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => toggleBetaFeature(feat.id)}
                                            className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-2 ${isEnabled ? 'bg-purple-600 text-white shadow' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                                        >
                                            {isEnabled ? <><CheckCircleIcon /> مفعل</> : 'تفعيل'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default SuperAdminPermissions;