
import React from 'react';
import { CheckCircleIcon, SparklesIcon } from './icons/Icons';
import { SUBSCRIPTION_PLANS } from '../data/subscriptionPlans';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message?: string;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, title = 'ميزة مدفوعة (Premium)', message = 'هذه الميزة متاحة فقط في الباقات المتقدمة. قم بالترقية الآن للاستمتاع بكافة الخصائص.' }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[100] flex justify-center items-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white text-center relative">
                    <button onClick={onClose} className="absolute top-4 left-4 text-white/80 hover:text-white text-2xl">&times;</button>
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                        💎
                    </div>
                    <h2 className="text-2xl font-bold">{title}</h2>
                    <p className="text-indigo-100 mt-2 text-sm">{message}</p>
                </div>
                
                <div className="p-6">
                    <div className="space-y-4 mb-6">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="text-green-500"><CheckCircleIcon /></div>
                            <div className="text-sm font-medium text-gray-700">قوالب ووحدات احترافية</div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="text-green-500"><CheckCircleIcon /></div>
                            <div className="text-sm font-medium text-gray-700">عدد منتجات ومساحة أكبر</div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="text-green-500"><CheckCircleIcon /></div>
                            <div className="text-sm font-medium text-gray-700">ربط دومين خاص (com.)</div>
                        </div>
                    </div>

                    <button 
                        onClick={() => { alert('سيتم توجيهك لصفحة الدفع...'); onClose(); }}
                        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg flex items-center justify-center gap-2"
                    >
                        <SparklesIcon /> ترقية الباقة الآن
                    </button>
                    <button 
                        onClick={onClose}
                        className="w-full mt-3 text-gray-500 text-sm hover:text-gray-700"
                    >
                        لا شكراً، سأكتفي بالباقة الحالية
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UpgradeModal;
