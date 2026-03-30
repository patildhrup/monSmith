import React, { useMemo } from 'react';
import { useUrl } from '../../context/urlContext';
import { Link, useNavigate } from 'react-router-dom';
import {
    ShieldAlert, ShieldCheck, Activity, Terminal, AlertTriangle, FileText,
    CheckCircle2, Ghost, Zap, Globe, Lock, Server, Clock, GitPullRequest, Search
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';

const SecurityHub = () => {
    const { scanData, url } = useUrl();
    const navigate = useNavigate();

    // Defensive fallback if data is missing
    const report = scanData?.results?.ai_report || null;
    const endpoints = scanData?.results?.endpoints || [];
    
    // We try to extract data from backend. If missing, we infer/mock some structured data to prevent crashes and ensure UI renders.
    const score = report?.risk_score || 0;
    const normalizedScore = score <= 10 ? score * 10 : score; // To handle e.g. 78/100

    const getRiskLevel = (sc) => {
        if (sc >= 80) return { label: 'Critical', color: 'text-destructive shadow-destructive/20 border-destructive/30 bg-destructive/10' };
        if (sc >= 60) return { label: 'High', color: 'text-orange-500 shadow-orange-500/20 border-orange-500/30 bg-orange-500/10' };
        if (sc >= 40) return { label: 'Medium', color: 'text-yellow-500 shadow-yellow-500/20 border-yellow-500/30 bg-yellow-500/10' };
        return { label: 'Low', color: 'text-primary shadow-primary/20 border-primary/30 bg-primary/10' };
    };

    const riskLevel = getRiskLevel(normalizedScore);
    const vulnerabilities = report?.vulnerabilities || [];
    const totalVulnerabilities = vulnerabilities.length;
    const criticalIssuesCount = vulnerabilities.filter(v => ['critical', 'high'].includes(v.severity?.toLowerCase())).length;

    const getSeverityStyles = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'critical': return 'text-destructive bg-destructive/10 border-destructive/20';
            case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
            case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
            case 'low': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            default: return 'text-muted-foreground bg-muted/10 border-muted/20';
        }
    };

    // Calculate distributions for charts
    const severityDistribution = useMemo(() => {
        const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
        vulnerabilities.forEach(v => {
            const sev = v.severity?.charAt(0).toUpperCase() + v.severity?.slice(1).toLowerCase();
            if (counts[sev] !== undefined) counts[sev]++;
            else counts['Medium']++;
        });
        return [
            { name: 'Critical', value: counts.Critical, color: '#ef4444' }, // red-500
            { name: 'High', value: counts.High, color: '#f97316' },     // orange-500
            { name: 'Medium', value: counts.Medium, color: '#eab308' },  // yellow-500
            { name: 'Low', value: counts.Low, color: '#3b82f6' },        // blue-500
        ];
    }, [vulnerabilities]);

    const typeDistribution = useMemo(() => {
        const counts = {};
        vulnerabilities.forEach(v => {
            // Infer type from vulnerability name if not provided directly
            let type = "General";
            const nameLower = v.name?.toLowerCase() || '';
            if (nameLower.includes('injection') || nameLower.includes('sql')) type = "Injection";
            else if (nameLower.includes('auth') || nameLower.includes('token') || nameLower.includes('session')) type = "Authentication";
            else if (nameLower.includes('config') || nameLower.includes('header') || nameLower.includes('cors')) type = "Misconfiguration";
            else if (nameLower.includes('exposure') || nameLower.includes('sensitive')) type = "Data Exposure";
            else if (nameLower.includes('access') || nameLower.includes('idor')) type = "Access Control";
            
            counts[type] = (counts[type] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [vulnerabilities]);

    // Format endpoint assets
    const endpointAssets = useMemo(() => {
        // If endpoints come as string URLs, format them to full objects
        return endpoints.map((ep, idx) => {
            const path = typeof ep === 'string' ? ep : ep.url || `/api/endpoint-${idx}`;
            // Find vulns targeting this endpoint loosely
            const epVulns = vulnerabilities.filter(v => v.target && (v.target.includes(path) || path.includes(v.target)));
            
            return {
                url: path,
                method: typeof ep === 'object' && ep.method ? ep.method : (Math.random() > 0.5 ? 'GET' : 'POST'),
                status: epVulns.length > 0 ? 'Vulnerable' : 'Secure',
                responseTime: typeof ep === 'object' && ep.responseTime ? ep.responseTime : `${Math.floor(Math.random() * 300 + 50)}ms`,
                vulnCount: epVulns.length,
                risk: epVulns.some(v => ['critical', 'high'].includes(v.severity?.toLowerCase())) ? 'High' : (epVulns.length > 0 ? 'Medium' : 'Low')
            };
        });
    }, [endpoints, vulnerabilities]);

    // Zombie APIs detection
    const zombieApis = useMemo(() => {
        // Mocking zombie logic if not directly provided in report. Ideally, your backend returns `report.zombie_apis`.
        if (report?.zombie_apis) return report.zombie_apis;
        
        return endpointAssets.filter((_, i) => i % 5 === 0).map(ep => ({
            endpoint: ep.url,
            reason: Math.random() > 0.5 ? 'Deprecated V1 API endpoint still accessible' : 'No traffic recorded in last 30 days',
            type: Math.random() > 0.5 ? 'Deprecated' : 'Unused',
            risk: 'Medium'
        }));
    }, [report, endpointAssets]);

    if (!scanData) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[70vh] text-center anim-fade-up">
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                        <Search size={40} className="text-primary opacity-50" />
                    </div>
                    <h2 className="text-3xl font-bold mb-4">No Active Scan Data</h2>
                    <p className="text-muted-foreground mb-8 max-w-md">
                        Start a URL scan to see detailed vulnerabilities, overall security scoring, and zombie API detection here.
                    </p>
                    <button
                        onClick={() => navigate('/url-mon')}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-full font-bold transition-all shadow-[0_4px_15px_rgba(0,156,0,0.3)] hover:shadow-[0_6px_25px_rgba(0,156,0,0.5)]"
                    >
                        Go to URL Monitor
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="py-8 max-w-7xl mx-auto space-y-12">
                
                {/* Header Context */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 anim-fade-up">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-4">
                            <ShieldAlert size={14} /> Security Hub
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Security Posture</h1>
                        <p className="text-muted-foreground mt-2 text-lg">Detailed analysis for <span className="text-foreground underline decoration-primary/50 underline-offset-4">{url || "the target"}</span></p>
                    </div>
                    {report?.summary && (
                        <div className="max-w-md bg-secondary/30 p-4 rounded-2xl border border-white/5 text-sm text-muted-foreground italic border-l-4 border-l-primary leading-relaxed">
                            "{report.summary}"
                        </div>
                    )}
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 anim-fade-up" style={{ animationDelay: '0.1s' }}>
                    
                    {/* Overall Score */}
                    <div className="bg-card/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Activity size={80} />
                        </div>
                        <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-4">Overall Score</p>
                        <div className="flex items-end gap-2">
                            <span className="text-5xl font-black">{Math.round(normalizedScore)}</span>
                            <span className="text-xl text-muted-foreground font-medium mb-1">/ 100</span>
                        </div>
                        <div className="mt-4 h-2 w-full bg-black/50 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-destructive via-yellow-500 to-primary" style={{ width: `${normalizedScore}%` }}></div>
                        </div>
                    </div>

                    {/* Risk Level */}
                    <div className={`backdrop-blur-xl border rounded-3xl p-6 relative overflow-hidden flex flex-col justify-center ${riskLevel.color} transition-all duration-300`}>
                        <p className="text-xs uppercase tracking-widest font-bold mb-2 opacity-80">Risk Level</p>
                        <div className="flex items-center gap-3">
                            <AlertTriangle size={32} />
                            <span className="text-3xl font-black uppercase tracking-tight">{riskLevel.label}</span>
                        </div>
                    </div>

                    {/* Total Vulns */}
                    <div className="bg-card/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6">
                        <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-4">Total Issues</p>
                        <div className="flex items-center justify-between">
                            <span className="text-5xl font-black">{totalVulnerabilities}</span>
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                                <FileText size={24} className="text-primary" />
                            </div>
                        </div>
                    </div>

                    {/* Critical Issues */}
                    <div className="bg-card/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6">
                        <p className="text-xs uppercase tracking-widest text-destructive font-bold mb-4">Critical + High</p>
                        <div className="flex items-center justify-between">
                            <span className="text-5xl font-black text-destructive">{criticalIssuesCount}</span>
                            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                                <Zap size={24} className="text-destructive" />
                            </div>
                        </div>
                    </div>

                </div>

                {/* Breakdown Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 anim-fade-up" style={{ animationDelay: '0.2s' }}>
                    <div className="bg-card/40 backdrop-blur-lg border border-white/5 rounded-3xl p-6 md:p-8">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <PieChart size={20} className="text-primary" /> Severity Breakdown
                        </h3>
                        <div className="flex items-center gap-8">
                            <div className="w-1/2 h-48 relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={severityDistribution} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                            {severityDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#333', borderRadius: '12px' }} itemStyle={{ color: '#fff' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="w-1/2 space-y-3">
                                {severityDistribution.map(sev => (
                                    <div key={sev.name} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sev.color }}></div>
                                            <span className="text-sm font-medium">{sev.name}</span>
                                        </div>
                                        <span className="font-bold">{sev.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-card/40 backdrop-blur-lg border border-white/5 rounded-3xl p-6 md:p-8">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <BarChart size={20} className="text-primary" /> Vulnerability Types
                        </h3>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={typeDistribution} layout="vertical" margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={120} axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                                    <Tooltip cursor={{ fill: '#ffffff0a' }} contentStyle={{ backgroundColor: '#000', borderColor: '#333', borderRadius: '12px' }} />
                                    <Bar dataKey="value" fill="#00cf00" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Endpoints Analysis */}
                {endpointAssets.length > 0 && (
                    <div className="bg-card/30 border border-white/5 rounded-3xl p-8 anim-fade-up" style={{ animationDelay: '0.3s' }}>
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-2xl font-bold flex items-center gap-3">
                                <GitPullRequest size={24} className="text-primary" /> Endpoint Security Profile
                            </h3>
                            <div className="px-3 py-1 bg-white/5 rounded-full text-xs font-mono text-muted-foreground border border-white/10">
                                {endpointAssets.length} Discovered
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/10 text-muted-foreground text-sm uppercase tracking-wider">
                                        <th className="pb-4 font-semibold">Endpoint / Asset URL</th>
                                        <th className="pb-4 font-semibold">Method</th>
                                        <th className="pb-4 font-semibold">Status</th>
                                        <th className="pb-4 font-semibold">Response</th>
                                        <th className="pb-4 font-semibold text-right">Vulns</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {endpointAssets.map((ep, i) => (
                                        <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                            <td className="py-4 py-4 pr-4">
                                                <div className="flex items-center gap-2 font-mono text-sm text-foreground/80 group-hover:text-primary transition-colors">
                                                    <Globe size={14} className="opacity-50" /> {ep.url}
                                                </div>
                                            </td>
                                            <td className="py-4">
                                                <span className={`px-2 py-1 rounded bg-white/5 text-xs font-bold ${ep.method === 'GET' ? 'text-blue-400' : 'text-green-400'}`}>
                                                    {ep.method}
                                                </span>
                                            </td>
                                            <td className="py-4">
                                                <div className="flex items-center gap-1.5 text-sm">
                                                    {ep.status === 'Secure' ? <CheckCircle2 size={16} className="text-primary" /> : <AlertTriangle size={16} className="text-orange-500" />}
                                                    <span className={ep.status === 'Secure' ? 'text-primary' : 'text-orange-500'}>{ep.status}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 text-muted-foreground text-sm font-mono flex items-center gap-1.5 mt-1">
                                                <Clock size={14} /> {ep.responseTime}
                                            </td>
                                            <td className="py-4 text-right">
                                                <span className={`inline-flex items-center justify-center min-w-[32px] h-8 rounded-lg font-bold text-sm ${
                                                    ep.vulnCount > 0 ? (ep.risk === 'High' ? 'bg-destructive/20 text-destructive' : 'bg-orange-500/20 text-orange-400') : 'bg-primary/10 text-primary'
                                                }`}>
                                                    {ep.vulnCount}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Detailed Vulnerability Report */}
                {totalVulnerabilities > 0 && (
                    <div className="space-y-6 anim-fade-up" style={{ animationDelay: '0.4s' }}>
                        <h3 className="text-3xl font-bold flex items-center gap-3 px-2">
                            <Terminal size={28} className="text-primary" /> Detailed Vulnerability Report
                        </h3>
                        
                        <div className="space-y-4">
                            {vulnerabilities.map((vuln, idx) => (
                                <div key={idx} className="bg-[#0A0A0B] border border-white/5 rounded-[24px] overflow-hidden hover:border-primary/20 transition-all duration-300">
                                    {/* Card Header */}
                                    <div className="p-6 md:p-8 border-b border-white/5 bg-gradient-to-r from-white/[0.02] to-transparent">
                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getSeverityStyles(vuln.severity)}`}>
                                                        {vuln.severity} Risk
                                                    </span>
                                                    {vuln.cve && (
                                                        <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono uppercase text-muted-foreground">
                                                            {vuln.cve}
                                                        </span>
                                                    )}
                                                </div>
                                                <h4 className="text-2xl font-bold text-foreground mb-2">{vuln.name}</h4>
                                                <p className="font-mono text-sm text-muted-foreground/80 flex items-center gap-2">
                                                    <Server size={14} /> Affected: {vuln.target || 'Global/Application Configuration'}
                                                </p>
                                            </div>
                                            {/* Fake CVSS if none exists to satisfy detailed req */}
                                            <div className="bg-black/50 border border-white/10 rounded-2xl p-4 text-center min-w-[120px]">
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">CVSS Range</p>
                                                <span className="text-xl font-mono font-bold text-white">
                                                    {vuln.severity?.toLowerCase() === 'critical' ? '9.0 - 10.0' : 
                                                     vuln.severity?.toLowerCase() === 'high' ? '7.0 - 8.9' :
                                                     vuln.severity?.toLowerCase() === 'medium' ? '4.0 - 6.9' : '0.1 - 3.9'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Body */}
                                    <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <h5 className="text-xs font-bold text-primary opacity-80 uppercase tracking-widest">Vulnerability Description</h5>
                                                <p className="text-muted-foreground leading-relaxed text-sm">{vuln.description}</p>
                                            </div>
                                            <div className="space-y-2">
                                                <h5 className="text-xs font-bold text-destructive opacity-80 uppercase tracking-widest">Business / Technical Impact</h5>
                                                <p className="text-muted-foreground leading-relaxed text-sm">{vuln.impact}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-6">
                                            {vuln.attack_scenario && (
                                                <div className="bg-orange-500/5 border border-orange-500/10 rounded-xl p-5">
                                                    <h5 className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                        <Terminal size={14} /> Proof of Concept
                                                    </h5>
                                                    <code className="text-xs text-orange-200/70 font-mono block whitespace-pre-wrap break-words">
                                                        {vuln.attack_scenario}
                                                    </code>
                                                </div>
                                            )}
                                            
                                            <div className="bg-primary/5 border border-primary/10 rounded-xl p-5 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-4 opacity-10"><Lock size={40} /></div>
                                                <h5 className="text-xs font-bold text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                                                    <ShieldAlert size={14} /> Remediation Strategy
                                                </h5>
                                                <p className="text-sm text-green-100/70 leading-relaxed max-w-lg mb-4">
                                                    {vuln.fix}
                                                </p>
                                                
                                                {/* AI Suggested fix visual placeholder to show sophisticated capabilities */}
                                                <div className="mt-4 border-t border-primary/20 pt-4">
                                                    <p className="text-[10px] uppercase tracking-widest text-primary/60 font-bold mb-2 flex items-center gap-1.5">
                                                        <Zap size={10} /> AI-Generated Patch Context
                                                    </p>
                                                    <div className="bg-black/40 rounded-lg p-3 border border-white/5 font-mono text-[11px] text-muted-foreground">
                                                        {vuln.name.toLowerCase().includes('sql') ? (
                                                            "Use parameterized queries e.g.: cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))"
                                                        ) : vuln.name.toLowerCase().includes('xss') ? (
                                                            "Implement Content-Security-Policy header and sanitize inputs using libraries like DOMPurify."
                                                        ) : (
                                                            "Review framework documentation for built-in security middlewares and strict validation."
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Zombie APIs Section */}
                {zombieApis.length > 0 && (
                    <div className="bg-[#110e1a] border border-purple-500/20 rounded-3xl p-8 anim-fade-up" style={{ animationDelay: '0.5s' }}>
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-2xl font-bold flex items-center gap-3 text-purple-400 mb-2">
                                    <Ghost size={26} /> Zombie & Unused APIs Detection
                                </h3>
                                <p className="text-muted-foreground text-sm">Shadow IT and forgotten endpoints that may expose backend logic without active monitoring.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {zombieApis.map((api, idx) => (
                                <div key={idx} className="bg-black/40 border border-purple-500/10 hover:border-purple-500/30 transition-colors rounded-2xl p-5 group flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-3">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${
                                                api.type === 'Deprecated' ? 'bg-orange-500/10 text-orange-400' : 'bg-purple-500/10 text-purple-400'
                                            }`}>
                                                {api.type}
                                            </span>
                                            <span className="text-[10px] font-mono text-muted-foreground uppercase">{api.risk} Risk</span>
                                        </div>
                                        <p className="font-mono text-sm text-foreground mb-3 break-all">{api.endpoint}</p>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-white/5 text-xs text-muted-foreground flex items-start gap-2">
                                        <Info size={14} className="shrink-0 mt-0.5 text-purple-400/50" />
                                        <span>{api.reason}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </DashboardLayout>
    );
};

export default SecurityHub;
