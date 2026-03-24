import { useEffect, useState } from 'react';
import { History, Search, ExternalLink, ShieldCheck, AlertCircle, Clock, Globe, ArrowRight } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { Link } from 'react-router-dom';

const Scans = () => {
    const [scans, setScans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8000/api/v1/scanner/history', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch history');
            const data = await response.json();
            setScans(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'text-primary bg-primary/10 border-primary/20';
            case 'failed': return 'text-destructive bg-destructive/10 border-destructive/20';
            case 'in_progress': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
            default: return 'text-muted-foreground bg-muted/10 border-muted/20';
        }
    };

    return (
        <DashboardLayout>
            <div className="py-10">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <History className="text-primary" />
                            Scan History
                        </h1>
                        <p className="text-muted-foreground mt-1 text-lg">Review and manage your security audits.</p>
                    </div>
                    <Link 
                        to="/url-mon"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-primary/20"
                    >
                        Start New Scan
                        <ArrowRight size={18} />
                    </Link>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                        <p className="text-muted-foreground font-medium">Retrieving scan records...</p>
                    </div>
                ) : error ? (
                    <div className="bg-destructive/10 border border-destructive/20 p-6 rounded-2xl flex items-center gap-4 text-destructive">
                        <AlertCircle size={24} />
                        <p className="font-semibold">{error}</p>
                    </div>
                ) : scans.length === 0 ? (
                    <div className="text-center py-32 bg-card/30 rounded-[32px] border border-dashed border-white/10">
                        <History size={48} className="text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-bold">No Scans Found</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto mt-2">You haven't performed any security scans yet. Start your first audit to see results here.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {scans.map((scan) => (
                            <div 
                                key={scan.job_id}
                                className="group relative bg-card/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 transition-all hover:bg-card/80 hover:border-primary/30"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl border ${getStatusColor(scan.status)}`}>
                                            <Globe size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                                                {scan.target}
                                                <ExternalLink size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </h3>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground font-medium">
                                                <span className="flex items-center gap-1.5">
                                                    <Clock size={14} />
                                                    {scan.job_id.substring(0, 8)}...
                                                </span>
                                                <span className="flex items-center gap-1.5 capitalize">
                                                    <div className={`w-2 h-2 rounded-full ${
                                                        scan.status === 'completed' ? 'bg-primary' : 
                                                        scan.status === 'failed' ? 'bg-destructive' : 'bg-orange-400 animate-pulse'
                                                    }`} />
                                                    {scan.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Link 
                                            to={`/reports?job_id=${scan.job_id}`}
                                            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-bold border border-white/5 transition-all"
                                        >
                                            View Report
                                        </Link>
                                        <Link 
                                            to={`/logs?job_id=${scan.job_id}`}
                                            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-bold border border-white/5 transition-all"
                                        >
                                            View Logs
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Scans;
