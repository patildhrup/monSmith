import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
    ShieldCheck, AlertCircle, Loader2, FileText,
    Globe, Zap, Terminal, Lock, ChevronLeft, ArrowRight,
    Radio, Info
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';

const Reports = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const jobId = queryParams.get('job_id');

    const [scanDetails, setScanDetails] = useState(null);
    const [loading, setLoading] = useState(!!jobId);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (jobId) {
            fetchDetails();
        }
    }, [jobId]);

    const fetchDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8000/api/v1/scanner/details/${jobId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch report details');
            const data = await response.json();
            setScanDetails(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!jobId) {
        return (
            <DashboardLayout>
                <div className="py-20 text-center">
                    <FileText size={48} className="text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-bold">No Report Selected</h3>
                    <p className="text-muted-foreground mt-2 max-w-sm mx-auto">Please select a scan from the History page to view its security report.</p>
                    <Link to="/scans" className="inline-flex items-center gap-2 mt-8 text-primary font-bold hover:underline">
                        <ChevronLeft size={18} />
                        Go to History
                    </Link>
                </div>
            </DashboardLayout>
        );
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center py-40 gap-4">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <p className="text-muted-foreground font-medium">Generating report view...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="py-20 px-6">
                    <div className="bg-destructive/10 border border-destructive/20 p-6 rounded-2xl flex items-center gap-4 text-destructive max-w-2xl mx-auto">
                        <AlertCircle size={24} />
                        <p className="font-semibold">{error}</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const report = scanDetails?.ai_report;

    if (!report || report.error) {
        return (
            <DashboardLayout>
                <div className="py-20 text-center">
                    <AlertCircle size={48} className="text-orange-400 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-bold">Report Not Available</h3>
                    <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                        {report?.error || "This scan doesn't have an AI report associated with it. This usually happens if the scan failed or AI reporting was disabled."}
                    </p>
                    <div className="flex items-center justify-center gap-4 mt-8">
                        <Link to="/scans" className="text-sm font-bold hover:underline italic">Back to History</Link>
                        <Link to={`/logs?job_id=${jobId}`} className="text-sm font-bold text-primary hover:underline">View Raw Logs</Link>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="py-10">
                <div className="flex items-center justify-between mb-10">
                    <Link to="/scans" className="text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors">
                        <ChevronLeft size={18} />
                        Back to History
                    </Link>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-muted-foreground">SCAN ID: {jobId}</span>
                        <div className="w-px h-4 bg-white/10 mx-2"></div>
                        <span className="text-xs font-mono text-muted-foreground">{new Date(scanDetails.created_at).toLocaleDateString()}</span>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto space-y-10">
                    {/* Report Header */}
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-semibold mb-2">
                            <ShieldCheck size={16} />
                            <span>Security Audit Completed</span>
                        </div>
                        <h1 className="text-4xl font-bold">Vulnerability Scan Report</h1>
                        <p className="text-xl text-muted-foreground">Target: <span className="text-foreground underline decoration-primary/50 underline-offset-8">{scanDetails.target}</span></p>
                    </div>

                    {/* Risk Score & Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1 bg-card/50 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 text-center flex flex-col justify-center items-center">
                            <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                        cx="64" cy="64" r="58"
                                        fill="transparent"
                                        stroke="currentColor"
                                        strokeWidth="12"
                                        className="text-white/5"
                                    />
                                    <circle
                                        cx="64" cy="64" r="58"
                                        fill="transparent"
                                        stroke="currentColor"
                                        strokeWidth="12"
                                        strokeDasharray={2 * Math.PI * 58}
                                        strokeDashoffset={2 * Math.PI * 58 * (1 - report.risk_score / 10)}
                                        strokeLinecap="round"
                                        className={`transition-all duration-1000 ${report.risk_score > 7 ? 'text-destructive' :
                                                report.risk_score > 4 ? 'text-orange-400' : 'text-primary'
                                            }`}
                                    />
                                </svg>
                                <span className="absolute text-3xl font-bold">{report.risk_score}</span>
                            </div>
                            <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">Risk Score</p>
                        </div>
                        <div className="md:col-span-2 bg-card/50 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 flex flex-col justify-center">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <FileText size={20} className="text-primary" />
                                Executive Summary
                            </h3>
                            <p className="text-lg text-muted-foreground italic leading-relaxed">
                                "{report.summary}"
                            </p>
                        </div>
                    </div>

                    {/* Vulnerabilities List */}
                    <div className="space-y-6">
                        <h3 className="text-2xl font-bold flex items-center gap-2 px-4 text-primary">
                            <Zap size={24} />
                            Detected Vulnerabilities
                        </h3>

                        {report.vulnerabilities?.length > 0 ? (
                            report.vulnerabilities.map((vuln, idx) => (
                                <div key={idx} className="group relative">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-white/10 to-white/5 rounded-[32px] blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                                    <div className="relative bg-card/60 backdrop-blur-xl border border-white/5 rounded-[32px] overflow-hidden">
                                        <div className="p-8">
                                            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-3">
                                                        <h4 className="text-2xl font-bold text-foreground">{vuln.name}</h4>
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tighter ${
                                                            vuln.severity === 'Critical' ? 'bg-destructive/20 text-destructive' :
                                                            vuln.severity === 'High' ? 'bg-orange-500/20 text-orange-400' :
                                                            vuln.severity === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                            'bg-primary/20 text-primary'
                                                        }`}>
                                                            {vuln.severity}
                                                        </span>
                                                    </div>
                                                    <p className="font-mono text-sm text-muted-foreground flex items-center gap-2">
                                                        <Globe size={14} />
                                                        {vuln.target}
                                                    </p>
                                                </div>
                                                <div className="bg-white/5 px-4 py-2 rounded-2xl border border-white/5 text-xs font-mono text-muted-foreground">
                                                    CVE: {vuln.cve || 'N/A'}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                <div className="space-y-6">
                                                    <div>
                                                        <h5 className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Description</h5>
                                                        <p className="text-muted-foreground leading-relaxed text-sm">{vuln.description}</p>
                                                    </div>
                                                    <div>
                                                        <h5 className="text-xs font-bold text-destructive uppercase tracking-widest mb-2">Risk Impact</h5>
                                                        <p className="text-muted-foreground leading-relaxed text-sm">{vuln.impact}</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-6">
                                                    <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                                                        <h5 className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                            <Terminal size={14} />
                                                            Attack Scenario
                                                        </h5>
                                                        <p className="text-xs text-muted-foreground leading-relaxed font-mono">{vuln.attack_scenario}</p>
                                                    </div>
                                                    <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
                                                        <h5 className="text-xs font-bold text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                                                            <Lock size={14} />
                                                            Remediation / Fix
                                                        </h5>
                                                        <p className="text-xs text-muted-foreground leading-relaxed">{vuln.fix}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center p-20 bg-card/30 rounded-[32px] border border-dashed border-white/10">
                                <ShieldCheck size={48} className="text-primary mx-auto mb-4 opacity-50" />
                                <h4 className="text-xl font-bold">No High-Risk Vulnerabilities Found</h4>
                                <p className="text-muted-foreground">The digital perimeter appears to be well-protected.</p>
                            </div>
                        )}
                    </div>

                    {/* Zombie Endpoints Section */}
                    {scanDetails.zombie_apis?.length > 0 && (
                        <div className="space-y-6">
                            <h3 className="text-2xl font-bold flex items-center gap-2 px-4 text-indigo-400">
                                <Radio size={24} />
                                Discovered Endpoints & Zombie APIs
                            </h3>
                            <div className="bg-card/40 backdrop-blur-xl border border-white/10 rounded-[40px] p-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {scanDetails.zombie_apis.map((api, idx) => (
                                        <div key={idx} className="flex flex-col p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all group">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                                        api.method === 'GET' ? 'bg-blue-500/20 text-blue-400' :
                                                        api.method === 'POST' ? 'bg-green-500/20 text-green-400' :
                                                        'bg-amber-500/20 text-amber-400'
                                                    }`}>
                                                        {api.method || 'GET'}
                                                    </span>
                                                    <span className="text-sm font-mono text-indigo-300 truncate max-w-[200px]">{api.endpoint}</span>
                                                </div>
                                                <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                    api.risk === 'high' ? 'text-destructive' : 'text-amber-500'
                                                }`}>
                                                    {api.risk?.toUpperCase()} RISK
                                                </div>
                                            </div>
                                            <p className="text-xs text-muted-foreground leading-relaxed mb-1">
                                                <span className="text-indigo-500/70 font-bold uppercase tracking-tighter mr-1">Discovery:</span> 
                                                {api.reason || api.type || "Identified as a potentially exposed endpoint."}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex items-center gap-3">
                                    <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                                        <Info size={16} />
                                    </div>
                                    <p className="text-[11px] text-indigo-300 leading-relaxed italic">
                                        <strong>Pro Tip:</strong> These endpoints were discovered across your codebase. "High Risk" indicates endpoints that are active but lack clear documentation or proper security guards.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Reports;
