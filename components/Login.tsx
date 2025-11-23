


import React, { useState } from 'react';
import { NebrasLogo } from './icons/Icons';

interface LoginProps {
  onLogin: (username: string, password: string) => boolean;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = onLogin(username, password);
    if (!success) {
      setError('اسم المستخدم أو كلمة المرور غير صحيحة.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-xl">
        <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
                <NebrasLogo />
                <h1 className="text-3xl font-bold text-gray-800">مزاد بلس</h1>
            </div>
            <p className="text-gray-600">دليلك الذكي لإدارة متجرك</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label 
                htmlFor="username" 
                className="text-sm font-bold text-gray-600 block mb-2"
            >
                اسم المستخدم
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition"
              required
              autoComplete="username"
            />
          </div>
          <div>
            <label 
                htmlFor="password" 
                className="text-sm font-bold text-gray-600 block mb-2"
            >
                كلمة المرور
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition"
              required
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-sm text-center text-red-500">{error}</p>}
          <div>
            <button 
                type="submit" 
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-bold transition"
            >
              تسجيل الدخول
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;