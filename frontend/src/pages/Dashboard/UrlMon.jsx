import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import {
    Search, Globe, ShieldCheck, ArrowRight, Activity, Zap,
    CheckCircle2, Circle, AlertCircle, Loader2, Server,
    Network, ShieldAlert, Cpu, FileText, ChevronRight,
    Terminal, Lock, ExternalLink
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';

const STAGES = [
    { id: 'init', label: 'Initializing Environment', icon: Cpu },
    { id: 'subdomains', label: 'Subdomain Enumeration', icon: Network },
    { id: 'live_domains', label: 'Live Host Discovery', icon: Globe },
    { id: 'endpoints', label: 'Endpoint Fuzzing', icon: Search },
    { id: 'ports', label: 'Port Scanning', icon: Server },
    { id: 'vulnerabilities', label: 'Vulnerability Assessment', icon: ShieldAlert },
    { id: 'report', label: 'AI Report Generation', icon: FileText },
];

const UrlMon = () => {
    const containerRef = useRef(null);
    const [url, setUrl] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [currentJobId, setCurrentJobId] = useState(null);
    const [scanData, setScanData] = useState(null);
    const [error, setError] = useState(null);
    const wsRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from('.anim-fade-up', {
                y: 30,
                opacity: 0,
                duration: 0.8,
                stagger: 0.1,
                ease: 'power3.out',
            });

            gsap.to('.glow-pulse', {
                boxShadow: '0 0 20px rgba(0, 156, 0, 0.4)',
                repeat: -1,
                yoyo: true,
                duration: 2,
            });
        }, containerRef);
        return () => ctx.revert();
    }, []);

    const connectWebSocket = useCallback((jobId) => {
        const wsUrl = `ws://localhost:8000/api/v1/scanner/ws/${jobId}`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('WebSocket Connected');
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setScanData(data);
            if (data.status === 'completed' || data.status === 'failed') {
                setIsScanning(false);
                ws.close();
            }
        };

        ws.onerror = (err) => {
            console.error('WebSocket Error:', err);
            setError('Connection lost. Please check your connection.');
        };

        ws.onclose = () => {
            console.log('WebSocket Closed');
        };

        wsRef.current = ws;
    }, []);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!url) return;

        setIsScanning(true);
        setError(null);
        setScanData(null);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8000/api/v1/scanner/scan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ target: url }),
            });

            if (!response.ok) throw new Error('Failed to start scan');

            const data = await response.json();
            setCurrentJobId(data.job_id);
            setScanData(data);
            connectWebSocket(data.job_id);
        } catch (err) {
            setError(err.message);
            setIsScanning(false);
        }
    };

    const getStageStatus = (stageId) => {
        if (!scanData) return 'pending';

        const stageIndex = STAGES.findIndex(s => s.id === stageId);
        const currentIndex = STAGES.findIndex(s => s.id === scanData.current_stage);

        if (scanData.status === 'completed') return 'completed';
        if (scanData.status === 'failed' && stageId === scanData.current_stage) return 'error';

        if (stageId === scanData.current_stage) return 'active';
        if (stageIndex < currentIndex) return 'completed';

        return 'pending';
    };

    return (
        <DashboardLayout>
            <div ref={containerRef} className="py-10">
                <div className="z-10 w-full">
                    {!isScanning && !scanData?.results && (
                        <div className="text-center">
                            <div className="anim-fade-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary mb-8 text-sm font-semibold tracking-wide backdrop-blur-md">
                                <Activity size={16} />
                                <span>Real-time URL Pulse Monitor</span>
                            </div>

                            <h1 className="anim-fade-up text-5xl font-bold tracking-tight mb-6 text-foreground">
                                Protect Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-400">Digital Perimeter</span>
                            </h1>

                            <p className="anim-fade-up text-lg text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
                                Instantly analyze any URL for vulnerabilities, misconfigurations, and threats. Our premium scanner provides detailed security insights in seconds.
                            </p>

                            <form onSubmit={handleSearch} className="anim-fade-up relative max-w-2xl mx-auto mb-16 group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-green-400/50 rounded-[40px] blur opacity-25 group-focus-within:opacity-50 transition duration-1000"></div>
                                <div className="relative flex items-center bg-card/80 backdrop-blur-xl border border-white/10 p-2 rounded-[40px] shadow-2xl overflow-hidden glow-pulse">
                                    <div className="pl-6 text-primary/70">
                                        <Globe size={24} />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="https://example.com"
                                        className="w-full bg-transparent border-none focus:ring-0 text-lg px-4 py-4 text-foreground placeholder-muted-foreground/50 underline-offset-4"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                    />
                                    <button
                                        type="submit"
                                        disabled={isScanning}
                                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-[32px] font-bold text-lg flex items-center gap-2 transition-all group/btn disabled:opacity-50"
                                    >
                                        {isScanning ? <Loader2 className="animate-spin" /> : 'Monitor'}
                                        <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {error && (
                        <div className="max-w-2xl mx-auto mb-8 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-3 anim-fade-up">
                            <AlertCircle size={20} />
                            <span>{error}</span>
                        </div>
                    )}

                    {(isScanning || (scanData && scanData.status !== 'completed' && scanData.status !== 'failed')) && (
                        <div className="max-w-4xl mx-auto space-y-8 anim-fade-up">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold flex items-center gap-2">
                                        Scan in Progress: <span className="text-primary">{url}</span>
                                    </h2>
                                    <p className="text-muted-foreground">Orchestrating security tools and AI analysis...</p>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20 text-primary font-mono text-sm">
                                    <Loader2 size={14} className="animate-spin" />
                                    <span>{scanData?.current_stage || 'Preparing'}</span>
                                </div>
                            </div>

                            {/* CI/CD style progress */}
                            <div className="space-y-4">
                                {STAGES.map((stage, index) => {
                                    const status = getStageStatus(stage.id);
                                    return (
                                        <div
                                            key={stage.id}
                                            className={`relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${status === 'active'
                                                    ? 'bg-primary/5 border-primary/30 shadow-lg shadow-primary/5'
                                                    : status === 'completed'
                                                        ? 'bg-secondary/5 border-white/5 opacity-80'
                                                        : 'bg-transparent border-white/5 opacity-40'
                                                }`}
                                        >
                                            <div className={`p-2 rounded-xl border ${status === 'active' ? 'bg-primary text-primary-foreground border-primary shadow-glow' :
                                                    status === 'completed' ? 'bg-primary/20 text-primary border-primary/20' :
                                                        status === 'error' ? 'bg-destructive/20 text-destructive border-destructive/20' :
                                                            'bg-white/5 text-muted-foreground border-white/5'
                                                }`}>
                                                <stage.icon size={20} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className={`font-semibold ${status === 'active' ? 'text-primary' : 'text-foreground'}`}>
                                                        {stage.label}
                                                    </span>
                                                    {status === 'active' && <span className="text-xs text-primary animate-pulse font-mono">EXECUTING...</span>}
                                                    {status === 'completed' && <CheckCircle2 size={16} className="text-primary" />}
                                                </div>
                                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                    {status === 'active' && (
                                                        <div className="h-full bg-primary animate-progress duration-[5000ms] ease-in-out" style={{ width: '60%' }}></div>
                                                    )}
                                                    {status === 'completed' && (
                                                        <div className="h-full bg-primary" style={{ width: '100%' }}></div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {scanData?.results?.ai_report && (
                        <div className="max-w-5xl mx-auto space-y-10 anim-fade-up py-10">
                            {/* Report Header */}
                            <div className="text-center space-y-4">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-semibold mb-2">
                                    <ShieldCheck size={16} />
                                    <span>Security Audit Completed</span>
                                </div>
                                <h2 className="text-4xl font-bold">Vulnerability Scan Report</h2>
                                <p className="text-xl text-muted-foreground">Target: <span className="text-foreground underline decoration-primary/50 underline-offset-8">{url}</span></p>
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
                                                strokeDashoffset={2 * Math.PI * 58 * (1 - scanData.results.ai_report.risk_score / 10)}
                                                strokeLinecap="round"
                                                className={`transition-all duration-1000 ${scanData.results.ai_report.risk_score > 7 ? 'text-destructive' :
                                                        scanData.results.ai_report.risk_score > 4 ? 'text-orange-400' : 'text-primary'
                                                    }`}
                                            />
                                        </svg>
                                        <span className="absolute text-3xl font-bold">{scanData.results.ai_report.risk_score}</span>
                                    </div>
                                    <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">Risk Score</p>
                                </div>
                                <div className="md:col-span-2 bg-card/50 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 flex flex-col justify-center">
                                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                        <FileText size={20} className="text-primary" />
                                        Executive Summary
                                    </h3>
                                    <p className="text-lg text-muted-foreground italic leading-relaxed">
                                        "{scanData.results.ai_report.summary}"
                                    </p>
                                </div>
                            </div>

                            {/* Vulnerabilities List */}
                            <div className="space-y-6">
                                <h3 className="text-2xl font-bold flex items-center gap-2 px-4 text-green-400">
                                    <Zap size={24} />
                                    Detected Vulnerabilities
                                </h3>

                                {scanData.results.ai_report.vulnerabilities?.length > 0 ? (
                                    scanData.results.ai_report.vulnerabilities.map((vuln, idx) => (
                                        <div key={idx} className="group relative">
                                            <div className="absolute -inset-0.5 bg-gradient-to-r from-white/10 to-white/5 rounded-[32px] blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                                            <div className="relative bg-[#0A0A0A] border border-white/5 rounded-[32px] overflow-hidden">
                                                <div className="p-8">
                                                    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-3">
                                                                <h4 className="text-2xl font-bold text-foreground">{vuln.name}</h4>
                                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tighter ${vuln.severity === 'Critical' ? 'bg-destructive/20 text-destructive' :
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
                                                                <p className="text-muted-foreground leading-relaxed">{vuln.description}</p>
                                                            </div>
                                                            <div>
                                                                <h5 className="text-xs font-bold text-destructive uppercase tracking-widest mb-2">Risk Impact</h5>
                                                                <p className="text-muted-foreground leading-relaxed">{vuln.impact}</p>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-6">
                                                            <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                                                                <h5 className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                                    <Terminal size={14} />
                                                                    Attack Scenario
                                                                </h5>
                                                                <p className="text-sm text-muted-foreground leading-relaxed font-mono">{vuln.attack_scenario}</p>
                                                            </div>
                                                            <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
                                                                <h5 className="text-xs font-bold text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                                                                    <Lock size={14} />
                                                                    Remediation / Fix
                                                                </h5>
                                                                <p className="text-sm text-muted-foreground leading-relaxed">{vuln.fix}</p>
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

                                <div className="text-center pt-10">
                                    <button
                                        onClick={() => {
                                            setScanData(null);
                                            setUrl('');
                                        }}
                                        className="bg-white/5 hover:bg-white/10 text-foreground px-8 py-4 rounded-full font-bold border border-white/10 transition-all"
                                    >
                                        Run New Scan
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default UrlMon;
