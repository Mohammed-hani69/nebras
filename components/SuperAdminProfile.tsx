
import React, { useState, useEffect } from 'react';
import { UserCircleIcon, CheckCircleIcon } from './icons/Icons';

interface SuperAdminProfileProps {
    account: {
        username: string;
        password?: string;
        fullName: string;
        phone: string;
    };
    onSave: (data: any) => void;
}

const SuperAdminProfile: React.FC<SuperAdminProfileProps> = ({ account, onSave }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        username: '',
        password: '',
        confirmPassword: ''
    });
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setFormData({
            fullName: account.fullName || '',
            phone: account.phone || '',
            username: account.username || '',
            password: account.password || '',
            confirmPassword: account.password || ''
        });
    }, [account]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (formData.password !== formData.confirmPassword) {
            setError('كلمتا المرور غير متطابقتين');
            return;
        }

        if (!formData.username || !formData.password) {
             setError('اسم المستخدم وكلمة المرور حقول مطلوبة');
             return;
        }

        onSave({
            fullName: formData.fullName,
            phone: formData.phone,
            username: formData.username,
            password: formData.password
        });

        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <UserCircleIcon /> الملف الشخصي للمدير العام
                </h1>
            </div>

            {showSuccess && (
                <div className="bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded relative animate-fade-in-up">
                    <span className="flex items-center gap-2"><CheckCircleIcon /> تم تحديث البيانات بنجاح.</span>
                </div>
            )}
            
            {error && (
                <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded relative">
                    {error}
                </div>
            )}

            <div className="bg-white p-8 rounded-xl shadow-lg max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">الاسم الكامل</label>
                            <input 
                                type="text" 
                                name="fullName"
                                value={formData.fullName} 
                                onChange={handleChange}
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                placeholder="الاسم الظاهر"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">رقم الهاتف</label>
                            <input 
                                type="text" 
                                name="phone"
                                value={formData.phone} 
                                onChange={handleChange}
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                placeholder="رقم التواصل"
                            />
                        </div>
                    </div>

                    <div className="border-t pt-6 mt-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">بيانات الدخول</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">اسم المستخدم (لتسجيل الدخول)</label>
                                <input 
                                    type="text" 
                                    name="username"
                                    value={formData.username} 
                                    onChange={handleChange}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">يستخدم هذا الاسم للدخول إلى لوحة التحكم.</p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">كلمة المرور الجديدة</label>
                                    <input 
                                        type="password" 
                                        name="password"
                                        value={formData.password} 
                                        onChange={handleChange}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">تأكيد كلمة المرور</label>
                                    <input 
                                        type="password" 
                                        name="confirmPassword"
                                        value={formData.confirmPassword} 
                                        onChange={handleChange}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button 
                            type="submit" 
                            className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 font-bold shadow-lg transition transform hover:scale-105"
                        >
                            حفظ التغييرات
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SuperAdminProfile;
