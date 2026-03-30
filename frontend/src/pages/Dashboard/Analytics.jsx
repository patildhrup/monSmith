import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { api } from '../../services/api';
import StatCard from '../../components/StatCard';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import {
    Activity, ShieldAlert, Zap, Search, Calendar, Filter,
    ChevronDown, ArrowUpRight, ArrowDownRight, Info, BarChart3, AlertCircle
} from 'lucide-react';

const Analytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [groupBy, setGroupBy] = useState('Daily');

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.getAnalytics();
            if (response.ok) {
                const result = await response.json();
                setData(result);
            } else {
                throw new Error(`Error ${response.status}: Failed to fetch analytics data`);
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 mb-6">
                        <AlertCircle size={48} className="mx-auto mb-4" />
                        <h2 className="text-xl font-bold mb-2">Failed to load analytics</h2>
                        <p className="text-sm opacity-80">{error}</p>
                    </div>
                    <button
                        onClick={fetchAnalytics}
                        className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-all"
                    >
                        Try Again
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e'];
    const pieData = [
        { name: 'Critical', value: data?.severity_distribution?.critical || 0 },
        { name: 'High', value: data?.severity_distribution?.high || 0 },
        { name: 'Medium', value: data?.severity_distribution?.medium || 0 },
        { name: 'Low', value: data?.severity_distribution?.low || 0 },
    ];

    return (
        <DashboardLayout>
            {/* Header section matching the screenshot */}
            <div className="flex items-start gap-4 mb-10">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                    <BarChart3 size={32} />
                </div>
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-1">Analytics Dashboard</h1>
                    <p className="text-muted-foreground text-lg">Visualize your API testing metrics and performance</p>
                </div>
            </div>

            {/* Date Range & Grouping Filter Card */}
            <div className="bg-card border border-border/60 rounded-[32px] p-8 mb-10 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

                <div className="flex items-center gap-2 mb-8 text-foreground font-semibold text-lg">
                    <Calendar className="text-primary" size={20} />
                    <h2>Date Range & Grouping</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground ml-1">Start Date</label>
                        <div className="relative">
                            <input
                                type="date"
                                className="w-full bg-background border border-border/60 rounded-xl px-4 py-3 outline-none focus:border-primary/50 transition-colors appearance-none"
                                value={dateRange.start}
                                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground ml-1">End Date</label>
                        <div className="relative">
                            <input
                                type="date"
                                className="w-full bg-background border border-border/60 rounded-xl px-4 py-3 outline-none focus:border-primary/50 transition-colors appearance-none"
                                value={dateRange.end}
                                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground ml-1">Group By</label>
                        <div className="relative group/select">
                            <select
                                className="w-full bg-background border border-green-500 rounded-xl px-4 py-3 outline-none appearance-none cursor-pointer font-medium"
                                value={groupBy}
                                onChange={(e) => setGroupBy(e.target.value)}
                            >
                                <option>Daily</option>
                                <option>Weekly</option>
                                <option>Monthly</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none group-hover/select:text-primary transition-colors" size={18} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Stat Cards matching screenshot layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <div className="bg-[#f0f7ff] p-8 rounded-[28px] border border-blue-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-white rounded-2xl text-blue-600 shadow-sm">
                            <Activity size={24} />
                        </div>
                    </div>
                    <p className="text-sm font-semibold text-blue-400 mb-1">Total Requests</p>
                    <p className="text-4xl font-bold text-slate-800">{data?.performance?.total_requests?.toLocaleString() || '0'}</p>
                </div>

                <div className="bg-[#f0fdf4] p-8 rounded-[28px] border border-green-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-white rounded-2xl text-green-600 shadow-sm">
                            <ArrowUpRight size={24} />
                        </div>
                    </div>
                    <p className="text-sm font-semibold text-green-500 mb-1">Success Rate</p>
                    <p className="text-4xl font-bold text-slate-800">{data?.performance?.success_rate || '0.0'}%</p>
                </div>

                <div className="bg-[#f8f5ff] p-8 rounded-[28px] border border-purple-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-white rounded-2xl text-purple-600 shadow-sm">
                            <Zap size={24} />
                        </div>
                    </div>
                    <p className="text-sm font-semibold text-purple-400 mb-1">Avg Response Time</p>
                    <p className="text-4xl font-bold text-slate-800">{data?.performance?.avg_response_time || '0'}ms</p>
                </div>

                <div className="bg-[#fff7ed] p-8 rounded-[28px] border border-orange-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-white rounded-2xl text-orange-600 shadow-sm">
                            <BarChart3 size={24} />
                        </div>
                    </div>
                    <p className="text-sm font-semibold text-orange-400 mb-1">Failed Requests</p>
                    <p className="text-4xl font-bold text-slate-800">{data?.performance?.failed_requests || '0'}</p>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                {/* Main Scans/Performance Chart */}
                <div className="lg:col-span-2 bg-card border border-border/60 rounded-[32px] p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-foreground">Scans Over Time</h3>
                            <p className="text-sm text-muted-foreground">Historical view of security audit frequency</p>
                        </div>
                    </div>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data?.history || []}>
                                <defs>
                                    <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '14px' }}
                                    itemStyle={{ color: '#22c55e' }}
                                />
                                <Area type="monotone" dataKey="scans" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorScans)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Severity Distribution Chart */}
                <div className="bg-card border border-border/60 rounded-[32px] p-8 shadow-sm">
                    <div className="mb-8">
                        <h3 className="text-xl font-bold text-foreground">Issue Severity</h3>
                        <p className="text-sm text-muted-foreground">Distribution of discovered vulnerabilities</p>
                    </div>
                    <div className="h-[300px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                            <p className="text-3xl font-bold text-foreground">{data?.total_scans || '0'}</p>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Total Scans</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-8">
                        {pieData.map((item, index) => (
                            <div key={item.name} className="flex items-center gap-3 bg-muted/30 p-3 rounded-2xl border border-border/40">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                                <div className="flex-1">
                                    <p className="text-xs text-muted-foreground font-medium">{item.name}</p>
                                    <p className="text-sm font-bold text-foreground">{item.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Security Score Trend */}
            <div className="bg-card border border-border/60 rounded-[32px] p-8 shadow-sm mb-12">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-yellow-500/10 rounded-xl text-yellow-500">
                        <ShieldAlert size={20} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-foreground">Security Score Trend</h3>
                        <p className="text-sm text-muted-foreground">Average score progression over the selected period</p>
                    </div>
                </div>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data?.history || []}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                            <YAxis domain={[0, 100]} stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                            />
                            <Line
                                type="stepAfter"
                                dataKey="score"
                                stroke="#eab308"
                                strokeWidth={3}
                                dot={{ fill: '#eab308', strokeWidth: 2, r: 4, strokeWidth: 2 }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </DashboardLayout>
    );
};

export default Analytics;
