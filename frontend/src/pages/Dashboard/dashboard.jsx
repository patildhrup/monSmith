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



    return (
        <DashboardLayout>
            <div className="mb-10">
                <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-3">Overview</h1>
                <p className="text-muted-foreground text-lg">Monitor your infrastructure's health and security status in real-time.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </div>


        </DashboardLayout>
    );
};

export default Dashboard;
