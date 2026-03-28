import { useEffect, useState, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
    Terminal, Copy, Download, Search, AlertCircle,
    Loader2, ChevronLeft, Hash, ShieldCheck, Clock
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';

const Logs = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const jobId = queryParams.get('job_id');

    const [scanDetails, setScanDetails] = useState(null);
    const [loading, setLoading] = useState(!!jobId);
    const [error, setError] = useState(null);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (jobId) {
            fetchDetails();
        }
    }, [jobId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [scanDetails]);

    const fetchDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8000/api/v1/scanner/details/${jobId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch scan details');
            const data = await response.json();
            setScanDetails(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="py-10 px-4 max-w-7xl mx-auto">
                <div className="flex flex-wrap items-center justify-between gap-6 mb-10">
                    <div className="space-y-2">
                        <Link
                            to="/scans"
                            className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors mb-4 group"
                        >
                            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            Back to History
                        </Link>
                        <h1 className="text-4xl font-bold flex items-center gap-4 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                            <Terminal className="text-primary" size={36} />
                            Raw Execution Trace
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-2xl font-medium">
                            Review step-by-step tool outputs and cryptographic proof of scan integrity.
                        </p>
                    </div>
                    {scanDetails && (
                        <div className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
                            <div className={`w-2 h-2 rounded-full ${scanDetails.status === 'completed' ? 'bg-primary' : 'bg-destructive'} animate-pulse`} />
                            <span className="text-sm font-bold uppercase tracking-widest">{scanDetails.status}</span>
                        </div>
                    )}
                </div>

                {!jobId ? (
                    <div className="text-center py-32 bg-card/30 rounded-[32px] border border-dashed border-white/10">
                        <Search size={48} className="text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-bold">Select a Scan</h3>
                        <p className="text-muted-foreground mt-2">Go to the Scans History page to select a scan and view its detailed logs.</p>
                        <Link to="/scans" className="inline-flex items-center gap-2 mt-2 text-primary font-bold hover:underline">
                            <ChevronLeft size={18} />
                            Go to History
                        </Link>
                    </div>
                ) : loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <Loader2 className="w-12 h-12 text-primary animate-spin" />
                        <p className="text-muted-foreground font-medium">Loading raw logs...</p>
                    </div>
                ) : error ? (
                    <div className="bg-destructive/10 border border-destructive/20 p-6 rounded-2xl flex items-center gap-4 text-destructive">
                        <AlertCircle size={24} />
                        <p className="font-semibold">{error}</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                            {[
                                { label: 'Audit Target', value: scanDetails.target, icon: <Search size={16} /> },
                                { label: 'Signature ID', value: (scanDetails.job_id || "").substring(0, 12) + "...", icon: <Hash size={16} /> },
                                { label: 'Security Status', value: scanDetails.status, icon: <ShieldCheck size={16} /> },
                                { label: 'Timestamp', value: new Date(scanDetails.created_at).toLocaleString(), icon: <Clock size={16} /> }
                            ].map((stat, i) => (
                                <div key={i} className="bg-card/40 backdrop-blur-xl border border-white/10 p-6 rounded-[32px] group hover:border-primary/30 transition-all">
                                    <div className="flex items-center gap-3 mb-2 text-primary/70">
                                        {stat.icon}
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{stat.label}</p>
                                    </div>
                                    <p className="font-mono text-sm font-bold truncate group-hover:text-primary transition-colors capitalize">
                                        {stat.value}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-b from-primary/20 to-transparent rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
                            <div className="relative bg-black/90 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                                <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                                            <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                                            <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                                        </div>
                                        <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">monsmith-scanner.log</span>
                                    </div>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(scanDetails.raw_output || "")}
                                        className="text-muted-foreground hover:text-primary transition-colors p-1.5 hover:bg-white/5 rounded-lg"
                                        title="Copy to clipboard"
                                    >
                                        <Copy size={16} />
                                    </button>
                                </div>
                                <div
                                    ref={scrollRef}
                                    className="p-8 h-[600px] overflow-y-auto font-mono text-sm leading-relaxed scrollbar-thin scrollbar-thumb-white/10"
                                >
                                    {scanDetails.raw_output ? (
                                        <pre className="text-primary-foreground/90 whitespace-pre-wrap break-all">
                                            {scanDetails.raw_output.split('\n').map((line, i) => (
                                                <div key={i} className="flex gap-4 group/line">
                                                    <span className="text-muted-foreground/30 select-none w-8 text-right inline-block">{i + 1}</span>
                                                    <span className={`${line.includes('ERROR') ? 'text-destructive' :
                                                        line.includes('---') ? 'text-primary font-bold mt-4' :
                                                            line.includes('INFO') ? 'text-blue-400' : ''
                                                        }`}>
                                                        {line}
                                                    </span>
                                                </div>
                                            ))}
                                        </pre>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                            <Hash size={32} className="mb-2 opacity-20" />
                                            <p>No output data available for this scan.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Logs;
