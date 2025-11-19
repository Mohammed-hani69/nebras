import React, { useState, useEffect } from 'react';
import type { User, CustomRole } from '../types';

interface UserManagementProps {
  users: User[];
  roles: CustomRole[];
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (user: User) => void;
  deleteUser: (userId: string) => void;
  addRole: (role: Omit<CustomRole, 'id'>) => void;
  updateRole: (role: CustomRole) => void;
  deleteRole: (roleId: string) => void;
  logActivity: (action: string) => void;
  allModules: { id: string, label: string }[];
}


const UserManagement: React.FC<UserManagementProps> = ({ users, roles, addUser, updateUser, deleteUser, addRole, updateRole, deleteRole, logActivity, allModules }) => {
    const [showUserForm, setShowUserForm] = useState(false);
    const [isEditingUser, setIsEditingUser] = useState<User | null>(null);
    const [userFormData, setUserFormData] = useState<{ username: string, password: string, roleId: string }>({
        username: '',
        password: '',
        roleId: roles.find(r => r.id === 'cashier')?.id || roles.filter(r => r.id !== 'admin')[0]?.id || '',
    });

    const [showRoleForm, setShowRoleForm] = useState(false);
    const [isEditingRole, setIsEditingRole] = useState<CustomRole | null>(null);
    const [roleFormData, setRoleFormData] = useState<{ name: string, permissions: string[] }>({
        name: '',
        permissions: [],
    });

    useEffect(() => {
        if (isEditingUser) {
            setUserFormData({
                username: isEditingUser.username,
                password: isEditingUser.password,
                roleId: isEditingUser.roleId,
            });
            setShowUserForm(true);
        } else {
            resetUserForm();
        }
    }, [isEditingUser]);
    
    useEffect(() => {
        if (isEditingRole) {
            setRoleFormData({
                name: isEditingRole.name,
                permissions: isEditingRole.permissions,
            });
            setShowRoleForm(true);
        } else {
            resetRoleForm();
        }
    }, [isEditingRole]);


    const resetUserForm = () => {
        setUserFormData({ username: '', password: '', roleId: roles.find(r => r.id === 'cashier')?.id || roles.filter(r => r.id !== 'admin')[0]?.id || '' });
        setIsEditingUser(null);
        setShowUserForm(false);
    };

    const resetRoleForm = () => {
        setRoleFormData({ name: '', permissions: [] });
        setIsEditingRole(null);
        setShowRoleForm(false);
    };

    const handleUserFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setUserFormData(prev => ({...prev, [name]: value}));
    };

    const handleUserSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!userFormData.username || !userFormData.password || !userFormData.roleId) {
            alert('اسم المستخدم وكلمة المرور والدور الوظيفي مطلوب.');
            return;
        }

        if (isEditingUser) {
            updateUser({ ...isEditingUser, ...userFormData });
        } else {
            addUser(userFormData);
        }
        resetUserForm();
    };
    
    const handleRoleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setRoleFormData(prev => ({ ...prev, name: e.target.value }));
    };

    const handlePermissionChange = (moduleId: string) => {
        setRoleFormData(prev => {
            const currentPermissions = prev.permissions;
            const newPermissions = currentPermissions.includes(moduleId)
                ? currentPermissions.filter(id => id !== moduleId)
                : [...currentPermissions, moduleId];
            return { ...prev, permissions: newPermissions };
        });
    };

    const handleRoleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!roleFormData.name) {
            alert('الرجاء إدخال اسم للدور.');
            return;
        }

        if (isEditingRole) {
            updateRole({ ...isEditingRole, ...roleFormData });
        } else {
            addRole(roleFormData);
        }
        resetRoleForm();
    };


    const handleEditUser = (user: User) => {
        if (user.roleId === 'admin') {
            alert('لا يمكن تعديل بيانات مدير النظام الرئيسي.');
            return;
        }
        setIsEditingUser(user);
    };
    
    const handleDeleteUser = (userId: string) => {
        const user = users.find(u => u.id === userId);
        if (user?.roleId === 'admin') {
            alert('لا يمكن حذف مدير النظام الرئيسي.');
            return;
        }
        if (window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
            deleteUser(userId);
        }
    };
    
    const handleDeleteRole = (roleId: string) => {
        if (roleId === 'admin') {
            alert('لا يمكن حذف دور مدير النظام.');
            return;
        }
         if (window.confirm('هل أنت متأكد من حذف هذا الدور؟')) {
            deleteRole(roleId);
        }
    };

    const renderRoleFormModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b">
                    <h2 className="text-xl font-bold">{isEditingRole ? 'تعديل دور' : 'إضافة دور جديد'}</h2>
                </div>
                <form onSubmit={handleRoleSubmit} className="flex-grow overflow-y-auto p-6 space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">اسم الدور</label>
                        <input type="text" value={roleFormData.name} onChange={handleRoleFormChange} placeholder="مثال: محاسب، مدير مبيعات" className="w-full p-2 border rounded" required />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-3">الصلاحيات</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {allModules.map(module => (
                                <label key={module.id} className="flex items-center space-x-2 p-3 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition">
                                    <input
                                        type="checkbox"
                                        checked={roleFormData.permissions.includes(module.id)}
                                        onChange={() => handlePermissionChange(module.id)}
                                        className="form-checkbox h-5 w-5 text-indigo-600 rounded"
                                    />
                                    <span>{module.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </form>
                 <div className="p-4 border-t bg-gray-50 flex gap-4">
                    <button onClick={handleRoleSubmit} type="submit" form="role-form" className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition">
                        {isEditingRole ? 'حفظ التغييرات' : 'حفظ الدور'}
                    </button>
                    <button type="button" onClick={resetRoleForm} className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition">
                        إلغاء
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">إدارة المستخدمين والأدوار</h1>
            </div>

            {/* Users Section */}
            <div id="user-management" className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">قائمة المستخدمين</h2>
                    <button id="user-management-add-btn" onClick={() => { isEditingUser ? resetUserForm() : setShowUserForm(!showUserForm) }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
                        {showUserForm ? 'إلغاء' : 'إضافة مستخدم جديد'}
                    </button>
                </div>
                {showUserForm && (
                     <div id="user-management-form" className="p-4 border-t mt-4">
                        <h3 className="text-xl font-bold mb-4">{isEditingUser ? 'تعديل مستخدم' : 'مستخدم جديد'}</h3>
                        <form onSubmit={handleUserSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">اسم المستخدم</label>
                                    <input type="text" name="username" value={userFormData.username} onChange={handleUserFormChange} placeholder="اسم المستخدم" className="w-full p-2 border rounded" required disabled={!!isEditingUser} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور</label>
                                    <input type="password" name="password" value={userFormData.password} onChange={handleUserFormChange} placeholder="كلمة المرور" className="w-full p-2 border rounded" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">الدور الوظيفي</label>
                                    <select name="roleId" value={userFormData.roleId} onChange={handleUserFormChange} className="w-full p-2 border rounded bg-gray-50">
                                        {roles.filter(r => r.id !== 'admin').map(role => (
                                            <option key={role.id} value={role.id}>{role.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button type="submit" className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition">
                                    {isEditingUser ? 'حفظ التغييرات' : 'حفظ المستخدم'}
                                </button>
                                 <button type="button" onClick={resetUserForm} className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition">
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                )}
                <div className="overflow-x-auto mt-4">
                    <table className="w-full text-right">
                        <thead className="border-b-2 border-gray-200">
                            <tr><th className="p-3">اسم المستخدم</th><th className="p-3">الدور الوظيفي</th><th className="p-3">الإجراءات</th></tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="p-3 font-medium">{user.username}</td>
                                    <td className="p-3"><span className="bg-indigo-100 text-indigo-700 text-sm font-semibold px-3 py-1 rounded-full">{roles.find(r => r.id === user.roleId)?.name || 'غير معروف'}</span></td>
                                    <td className="p-3">
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEditUser(user)} className="text-blue-500 hover:underline" disabled={user.roleId === 'admin'}>تعديل</button>
                                            <button onClick={() => handleDeleteUser(user.id)} className="text-red-500 hover:underline" disabled={user.roleId === 'admin'}>حذف</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* Roles Section */}
            <div id="role-management" className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">إدارة الأدوار</h2>
                    <button onClick={() => { setIsEditingRole(null); setShowRoleForm(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">إضافة دور جديد</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="border-b-2 border-gray-200">
                            <tr><th className="p-3">اسم الدور</th><th className="p-3">عدد الصلاحيات</th><th className="p-3">الإجراءات</th></tr>
                        </thead>
                        <tbody>
                            {roles.map(role => (
                                <tr key={role.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="p-3 font-medium">{role.name}</td>
                                    <td className="p-3">{role.permissions.length} صلاحية</td>
                                    <td className="p-3">
                                        <div className="flex gap-2">
                                            <button onClick={() => setIsEditingRole(role)} className="text-blue-500 hover:underline" disabled={role.id === 'admin'}>تعديل</button>
                                            <button onClick={() => handleDeleteRole(role.id)} className="text-red-500 hover:underline" disabled={role.id === 'admin'}>حذف</button>
                                        {/* Fix: Corrected typo in closing div tag. */}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showRoleForm && renderRoleFormModal()}
        </div>
    );
};

export default UserManagement;