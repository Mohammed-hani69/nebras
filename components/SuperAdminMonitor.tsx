
import React, { useState, useEffect, useRef } from 'react';
import type { Store } from '../types';
import { ServerStackIcon, CpuChipIcon, SignalIcon, UsersIcon, GlobeAltIcon, ExclamationTriangleIcon, CheckCircleIcon } from './icons/Icons';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ProgressBar from './ProgressBar';

interface SuperAdminMonitorProps {
    stores: Store[];
}

interface SystemLog {
    id: string;
    timestamp: string;
    type: 'info' | 'warning' | 'error' | 'success';
    source: string;
    message: string;
}

const SuperAdminMonitor: React.FC<SuperAdminMonitorProps> = ({ stores }) => {
    const [activeUsers, setActiveUsers] = useState(124);
    const [requestsPerSecond, setRequestsPerSecond] = useState(45);
    const [serverStats, setServerStats] = useState({
        cpu: 24,
        ram: 42,
        disk: 68
    });
    const [trafficHistory, setTrafficHistory] = useState<{time: string, value: number}[]>([]);
    const [logs, setLogs] = useState<SystemLog[]>([]);
    
    // Simulate API Status
    const apiStatus = {
        core: true,
        database: true,
        payments: true,
        webhooks: true
    };

    // Helper to generate random data within range
    const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);

    // Effect to simulate real-time data stream
    useEffect(() => {
        // Initial history data
        const initialData = [];
        const now = new Date();
        for(let i = 20; i >= 0; i--) {
            const t = new Date(now.getTime() - i * 3000);
            initialData.push({
                time: t.toLocaleTimeString('en-US', {hour12:false, hour:'2-digit', minute:'2-digit', second:'2-digit'}),
                value: randomInt(30, 60)
            });
        }
        setTrafficHistory(initialData);

        const interval = setInterval(() => {
            // 1. Update Metrics
            const newRPS = randomInt(30, 80);
            setRequestsPerSecond(newRPS);
            setActiveUsers(prev => Math.max(50, prev + randomInt(-3, 5))); // Slight jitter
            
            // 2. Update Server Stats
            setServerStats({
                cpu: Math.min(100, Math.max(10, 25 + randomInt(-5, 15))), // Base 25%, fluctuates
                ram: Math.min(100, Math.max(20, 40 + randomInt(-2, 5))),
                disk: 68 // Relatively static
            });

            // 3. Update Traffic Chart
            setTrafficHistory(prev => {
                const nextTime = new Date();
                const newData = {
                    time: nextTime.toLocaleTimeString('en-US', {hour12:false, hour:'2-digit', minute:'2-digit', second:'2-digit'}),
                    value: newRPS
                };
                const newHistory = [...prev, newData];
                if(newHistory.length > 20) newHistory.shift();
                return newHistory;
            });

            // 4. Simulate Random Logs/Alerts (Low probability)
            if(Math.random() > 0.85) {
                const logTypes: SystemLog['type'][] = ['info', 'warning', 'error', 'success'];
                const sources = ['Payment Gateway', 'API Gateway', 'Database', 'Background Worker'];
                const messages = [
                    'Latency spiked to 300ms',
                    'Payment webhook received',
                    'Backup completed successfully',
                    'Connection timeout retry',
                    'Cache cleared',
                    'New Store Registered'
                ];
                
                const type = Math.random() > 0.9 ? 'error' : Math.random() > 0.7 ? 'warning' : 'info';
                const newLog: SystemLog = {
                    id: Date.now().toString(),
                    timestamp: new Date().toLocaleTimeString(),
                    type: type as any,
                    source: sources[randomInt(0, sources.length-1)],
                    message: messages[randomInt(0, messages.length-1)]
                };
                setLogs(prev => [newLog, ...prev].slice(0, 10));
            }

        }, 3000); // Update every 3 seconds

        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (val: number) => {
        if (val < 60) return 'bg-green-500';
        if (val < 85) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <SignalIcon />
                    مراقبة النظام الحية (System Monitor)
                </h1>
                <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span className="text-sm text-gray-500 font-mono">Live Connected</span>
                </div>
            </div>

            {/* Top Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 mb-1">المستخدمين النشطين (Real-Time)</p>
                        <p className="text-3xl font-bold text-indigo-600">{activeUsers}</p>
                    </div>
                    <div className="p-3 bg-indigo-50 rounded-full text-indigo-600"><UsersIcon /></div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 mb-1">الطلبات الحالية (Requests/Sec)</p>
                        <p className="text-3xl font-bold text-teal-600">{requestsPerSecond}</p>
                    </div>
                    <div className="p-3 bg-teal-50 rounded-full text-teal-600"><GlobeAltIcon /></div> // Replaced specific icon with Globe for generic request
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 mb-1">المتاجر النشطة</p>
                        <p className="text-3xl font-bold text-blue-600">{stores.length}</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-full text-blue-600"><ServerStackIcon /></div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 mb-1">حالة السيرفر</p>
                        <p className="text-3xl font-bold text-green-600">Stable</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-full text-green-600"><CheckCircleIcon /></div>
                </div>
            </div>

            {/* Charts & Server Health */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Traffic Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <h3 className="font-bold text-gray-700 mb-4">ضغط الطلبات (Live Requests Load)</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trafficHistory}>
                                <defs>
                                    <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis dataKey="time" tick={{fontSize: 10}} />
                                <YAxis tick={{fontSize: 10}} />
                                <Tooltip contentStyle={{backgroundColor: '#1f2937', color: '#fff', border: 'none', borderRadius: '8px'}} />
                                <Area type="monotone" dataKey="value" stroke="#4f46e5" fillOpacity={1} fill="url(#colorTraffic)" isAnimationActive={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Server Resources */}
                <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-6">
                        <CpuChipIcon />
                        <h3 className="font-bold text-lg">موارد السيرفر (Ubuntu 22.04)</h3>
                    </div>
                    
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-sm mb-2 text-slate-300">
                                <span>CPU Usage (4 Cores)</span>
                                <span>{serverStats.cpu}%</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                                <div className={`h-full transition-all duration-500 ${getStatusColor(serverStats.cpu)}`} style={{width: `${serverStats.cpu}%`}}></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-2 text-slate-300">
                                <span>RAM Usage (16GB)</span>
                                <span>{serverStats.ram}%</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                                <div className={`h-full transition-all duration-500 ${getStatusColor(serverStats.ram)}`} style={{width: `${serverStats.ram}%`}}></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-2 text-slate-300">
                                <span>SSD Disk (NVMe)</span>
                                <span>{serverStats.disk}%</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                                <div className={`h-full bg-blue-500`} style={{width: `${serverStats.disk}%`}}></div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-700 grid grid-cols-2 gap-4 text-center">
                        <div className="bg-slate-800 p-2 rounded-lg">
                            <p className="text-xs text-slate-400">Uptime</p>
                            <p className="font-mono font-bold">14d 2h</p>
                        </div>
                         <div className="bg-slate-800 p-2 rounded-lg">
                            <p className="text-xs text-slate-400">Load Avg</p>
                            <p className="font-mono font-bold">0.45</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Status & Logs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* API Status Grid */}
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                    <h3 className="font-bold text-gray-800 mb-4">حالة الخدمات (Services Status)</h3>
                    <div className="space-y-4">
                        {Object.entries(apiStatus).map(([key, active]) => (
                            <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="font-medium text-gray-700 capitalize">{key} Service</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">{active ? '99.9% uptime' : 'Down'}</span>
                                    <span className={`w-3 h-3 rounded-full ${active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Live Logs */}
                <div className="lg:col-span-2 bg-black text-green-400 p-6 rounded-xl shadow-md font-mono text-sm overflow-hidden flex flex-col h-80">
                    <div className="flex justify-between items-center mb-2 border-b border-gray-800 pb-2">
                        <h3 className="font-bold text-gray-300">System Logs / Alerts</h3>
                        <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400">Auto-scrolling</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                        {logs.map(log => (
                            <div key={log.id} className="flex gap-3 opacity-90 hover:opacity-100 transition-opacity">
                                <span className="text-gray-500">[{log.timestamp}]</span>
                                <span className={`${log.type === 'error' ? 'text-red-500' : log.type === 'warning' ? 'text-yellow-500' : 'text-blue-400'}`}>{log.type.toUpperCase()}</span>
                                <span className="text-purple-400">{log.source}:</span>
                                <span className="text-white">{log.message}</span>
                            </div>
                        ))}
                        {logs.length === 0 && <p className="text-gray-600 text-center mt-10">Waiting for system events...</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminMonitor;
