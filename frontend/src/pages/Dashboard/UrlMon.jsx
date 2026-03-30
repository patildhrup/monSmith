import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { Link, useNavigate } from 'react-router-dom';
import {
    Search, Globe, ShieldCheck, ArrowRight, Activity, Zap,
    CheckCircle2, Circle, AlertCircle, Loader2, Server,
    Network, ShieldAlert, Cpu, FileText, ChevronRight,
    Terminal, Lock, ExternalLink
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { api } from '../../services/api';
import { useUrl } from '../../context/urlContext';

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
    const navigate = useNavigate();
    const { 
        url, setUrl, 
        isScanning, setIsScanning, 
        currentJobId, setCurrentJobId, 
        scanData, setScanData, 
        error, setError,
        resetScanState 
    } = useUrl();
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
        const backendUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || "http://localhost:8000";
        const wsProtocol = backendUrl.startsWith("https") ? "wss" : "ws";
        const wsUrl = `${wsProtocol}://${backendUrl.replace(/^https?:\/\//, "")}/api/v1/scanner/ws/${jobId}`;
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
            const response = await api.scanUrl({ target: url });

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
                                    const hasResults = scanData?.results?.[stage.id === 'live_domains' ? 'live_domains' : stage.id === 'vulnerabilities' ? 'vulnerabilities' : stage.id === 'init' ? 'message' : stage.id];
                                    
                                    // Special mapping for results since some keys might differ slightly or be nested
                                    const getResultData = () => {
                                        if (!scanData?.results) return null;
                                        if (stage.id === 'subdomains') return scanData.results.subdomains;
                                        if (stage.id === 'live_domains') return scanData.results.live_domains;
                                        if (stage.id === 'endpoints') return scanData.results.endpoints;
                                        if (stage.id === 'ports') return scanData.results.ports;
                                        if (stage.id === 'vulnerabilities') return scanData.results.vulnerabilities;
                                        return null;
                                    };

                                    const resultData = getResultData();

                                    return (
                                        <div key={stage.id} className="space-y-2">
                                            <div
                                                className={`relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${status === 'active'
                                                        ? 'bg-primary/5 border-primary/30 shadow-lg shadow-primary/5'
                                                        : status === 'completed'
                                                            ? 'bg-secondary/5 border-white/5 opacity-100'
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

                                            {/* Result Box */}
                                            {resultData && (status === 'active' || status === 'completed') && (
                                                <div className="ml-14 anim-fade-up">
                                                    <div className="bg-card/30 backdrop-blur-sm border border-white/5 rounded-xl p-4 overflow-hidden">
                                                        <div className="flex items-center gap-2 mb-3 text-xs font-bold text-primary/70 uppercase tracking-widest">
                                                            <Terminal size={12} />
                                                            <span>{stage.label} Findings</span>
                                                        </div>
                                                        
                                                        {Array.isArray(resultData) ? (
                                                            <div className="flex flex-wrap gap-2">
                                                                {resultData.length > 0 ? (
                                                                    resultData.map((item, i) => (
                                                                        <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-sm font-mono text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
                                                                            {item}
                                                                        </span>
                                                                    ))
                                                                ) : (
                                                                    <span className="text-sm text-muted-foreground/50 italic">No entries found yet...</span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <pre className="text-sm font-mono text-muted-foreground bg-black/20 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto custom-scrollbar">
                                                                {resultData}
                                                            </pre>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {scanData && scanData.status === 'completed' && scanData.results && scanData.results.ai_report && (
                        <div className="max-w-4xl mx-auto space-y-10 anim-fade-up py-10 mt-6 text-center">
                            <div className="bg-gradient-to-br from-primary/10 to-green-500/5 backdrop-blur-xl border border-primary/20 rounded-[32px] p-12 text-center shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
                                
                                <ShieldCheck size={64} className="mx-auto text-primary mb-6 drop-shadow-[0_0_15px_rgba(0,156,0,0.5)]" />
                                <h3 className="text-3xl font-bold mb-4 text-foreground">Scan Successfully Completed</h3>
                                <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                                    Our AI has compiled a comprehensive security report for <strong className="text-white">{url}</strong>, identifying vulnerabilities, endpoints, and actionable fixes.
                                </p>
                                
                                <button
                                    onClick={() => navigate('/security-hub')}
                                    className="inline-flex items-center gap-3 bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-5 rounded-full font-bold text-lg shadow-[0_5px_20px_rgba(0,156,0,0.4)] hover:shadow-[0_8px_30px_rgba(0,156,0,0.6)] transition-all transform hover:-translate-y-1"
                                >
                                    View Detailed Security Report
                                    <ArrowRight size={24} />
                                </button>
                                
                                <div className="mt-8 pt-6 border-t border-white/10">
                                    <button
                                        onClick={() => {
                                            resetScanState();
                                        }}
                                        className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
                                    >
                                        Start a new scan instead
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
