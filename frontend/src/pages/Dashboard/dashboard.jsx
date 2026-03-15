import DashboardLayout from '../../components/DashboardLayout';
import StatCard from '../../components/StatCard';
import { ShieldAlert, Zap, Search, ArrowUpRight, Activity, ExternalLink } from 'lucide-react';
import { useEffect, useRef } from 'react';

const Dashboard = () => {
    const tableRef = useRef(null);

    const stats = [
        { title: 'Total Scans', value: '1,284', icon: <Search size={24} />, trend: '+12.5%', status: 'primary' },
        { title: 'Vulnerabilities Found', value: '42', icon: <ShieldAlert size={24} />, trend: '-5.2%', status: 'danger' },
        { title: 'Critical Issues', value: '08', icon: <Zap size={24} />, trend: '+2', status: 'danger' },
        { title: 'Active Monitors', value: '15', icon: <Activity size={24} />, status: 'primary' },
    ];

    const recentScans = [
        { url: 'https://api.monsmith.com', status: 'Completed', vulnerabilities: '03', date: 'Mar 14, 2026', severity: 'Medium' },
        { url: 'https://app.dev-secure.net', status: 'Completed', vulnerabilities: '00', date: 'Mar 13, 2026', severity: 'Safe' },
        { url: 'https://staging-v6.internal', status: 'Failed', vulnerabilities: '12', date: 'Mar 13, 2026', severity: 'Critical' },
        { url: 'https://beta.security.io', status: 'Completed', vulnerabilities: '01', date: 'Mar 12, 2026', severity: 'Low' },
    ];

    return (
        <DashboardLayout>
            <div className="mb-10">
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-950 mb-3">Overview</h1>
                <p className="text-slate-500 text-lg">Monitor your infrastructure's health and security status in real-time.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </div>

            <div className="bg-card rounded-[32px] border border-border/80 shadow-sm overflow-hidden">
                <div className="px-8 py-7 border-b border-border/60 flex justify-between items-center bg-slate-50/30">
                    <h2 className="text-xl font-bold text-slate-900">Recent Scans</h2>
                    <button className="text-sm font-bold text-primary hover:underline flex items-center gap-1 group">
                        View All Scans
                        <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50">
                                <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Target URL</th>
                                <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Vulnerabilities</th>
                                <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                                <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {recentScans.map((scan, index) => (
                                <tr key={index} className="hover:bg-muted/20 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                                                <ExternalLink size={14} />
                                            </div>
                                            <span className="font-semibold text-slate-900 truncate max-w-[200px]">{scan.url}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${scan.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {scan.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={`font-bold ${scan.vulnerabilities !== '00' ? 'text-destructive' : 'text-green-600'}`}>
                                            {scan.vulnerabilities} Identified
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-muted-foreground text-sm">
                                        {scan.date}
                                    </td>
                                    <td className="px-8 py-5">
                                        <button className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                                            Manage
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Dashboard;
