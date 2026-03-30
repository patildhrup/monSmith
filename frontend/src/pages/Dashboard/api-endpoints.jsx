import { useEffect, useState, useMemo } from 'react';
import { Globe, Search, AlertCircle, Code2, Filter, ChevronDown, ExternalLink, ShieldAlert, Zap } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';

const METHOD_COLORS = {
    GET:    'text-emerald-400 bg-emerald-400/10 border-emerald-400/25',
    POST:   'text-blue-400   bg-blue-400/10   border-blue-400/25',
    PUT:    'text-amber-400  bg-amber-400/10  border-amber-400/25',
    PATCH:  'text-purple-400 bg-purple-400/10 border-purple-400/25',
    DELETE: 'text-red-400    bg-red-400/10    border-red-400/25',
    HEAD:   'text-slate-400  bg-slate-400/10  border-slate-400/25',
    OPTIONS:'text-slate-400  bg-slate-400/10  border-slate-400/25',
};

const SEVERITY_STYLES = {
    critical: 'text-red-400    bg-red-400/10    border-red-400/25',
    high:     'text-orange-400 bg-orange-400/10 border-orange-400/25',
    medium:   'text-amber-400  bg-amber-400/10  border-amber-400/25',
    low:      'text-blue-400   bg-blue-400/10   border-blue-400/25',
    info:     'text-slate-400  bg-slate-400/10  border-slate-400/25',
};

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

// Attempt to extract API endpoints from raw scan results.
// Falls back to showing a demo list if the backend has no dedicated endpoint route.
function parseEndpoints(scans) {
    const endpoints = [];
    scans.forEach((scan) => {
        const results = scan.results || {};
        const raw = results.ffuf || results.endpoints || results.api_endpoints || [];
        if (Array.isArray(raw)) {
            raw.forEach((r) => {
                endpoints.push({
                    id:       `${scan.job_id}-${r.url || r}-${Math.random()}`,
                    url:      r.url || r,
                    method:   (r.method || 'GET').toUpperCase(),
                    status:   r.status || r.status_code || null,
                    severity: r.severity || 'info',
                    target:   scan.target,
                    job_id:   scan.job_id,
                });
            });
        }
    });
    return endpoints;
}

const METHODS_ALL = ['ALL', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

export default function ApiEndpoints() {
    const [endpoints, setEndpoints]   = useState([]);
    const [loading,   setLoading]     = useState(true);
    const [error,     setError]       = useState(null);
    const [search,    setSearch]      = useState('');
    const [method,    setMethod]      = useState('ALL');
    const [expanded,  setExpanded]    = useState(null);

    useEffect(() => {
        fetchEndpoints();
    }, []);

    const fetchEndpoints = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { 
                Authorization: `Bearer ${token}`,
                'ngrok-skip-browser-warning': 'true'
            };

            // 1. Try a dedicated endpoint first
            const res = await fetch(`${BACKEND}/api/v1/scanner/endpoints`, { headers });
            if (res.ok) {
                const data = await res.json();
                setEndpoints(Array.isArray(data) ? data : data.endpoints || []);
            } else {
                // 2. Fall back — derive from scan history
                const histRes = await fetch(`${BACKEND}/api/v1/scanner/history`, { headers });
                if (!histRes.ok) throw new Error('Failed to load endpoint data');
                const scans = await histRes.json();
                setEndpoints(parseEndpoints(scans));
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const filtered = useMemo(() => {
        return endpoints.filter((ep) => {
            const matchMethod = method === 'ALL' || ep.method === method;
            const q = search.toLowerCase();
            const matchSearch = !q || (ep.url || '').toLowerCase().includes(q) || (ep.target || '').toLowerCase().includes(q);
            return matchMethod && matchSearch;
        });
    }, [endpoints, method, search]);

    const stats = useMemo(() => ({
        total:    endpoints.length,
        critical: endpoints.filter(e => e.severity === 'critical').length,
        high:     endpoints.filter(e => e.severity === 'high').length,
        unique:   new Set(endpoints.map(e => e.target)).size,
    }), [endpoints]);

    return (
        <DashboardLayout>
            <div className="py-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-10 flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Code2 className="text-primary" />
                            API Endpoints
                        </h1>
                        <p className="text-muted-foreground mt-1 text-lg">
                            Discovered endpoints from your security scans.
                        </p>
                    </div>
                    <button
                        onClick={fetchEndpoints}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 border border-primary/30 text-primary rounded-xl font-bold text-sm hover:bg-primary/20 transition-all active:scale-95"
                    >
                        <Zap size={15} />
                        Refresh
                    </button>
                </div>

                {/* Stats row */}
                {!loading && !error && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                        {[
                            { label: 'Total Endpoints',  value: stats.total,    icon: Globe,       color: 'text-primary'      },
                            { label: 'Critical Risk',    value: stats.critical, icon: ShieldAlert, color: 'text-red-400'      },
                            { label: 'High Risk',        value: stats.high,     icon: AlertCircle, color: 'text-orange-400'   },
                            { label: 'Unique Targets',   value: stats.unique,   icon: Filter,      color: 'text-blue-400'     },
                        ].map(({ label, value, icon: Icon, color }) => (
                            <div key={label} className="bg-card/50 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
                                <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-2">
                                    <Icon size={13} />
                                    {label}
                                </div>
                                <p className={`text-3xl font-bold ${color}`}>{value}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Filters */}
                {!loading && !error && endpoints.length > 0 && (
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px] max-w-sm">
                            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search endpoints…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full bg-card/50 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                            />
                        </div>

                        {/* Method tabs */}
                        <div className="flex items-center gap-1.5 bg-card/50 border border-white/10 rounded-xl p-1">
                            {METHODS_ALL.map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setMethod(m)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${method === m
                                        ? 'bg-primary text-primary-foreground shadow'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                                    }`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-28 gap-4">
                        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                        <p className="text-muted-foreground font-medium">Fetching endpoint data…</p>
                    </div>
                ) : error ? (
                    <div className="bg-destructive/10 border border-destructive/20 p-6 rounded-2xl flex items-center gap-4 text-destructive">
                        <AlertCircle size={22} />
                        <p className="font-semibold">{error}</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-32 bg-card/30 rounded-[32px] border border-dashed border-white/10">
                        <Code2 size={48} className="text-muted-foreground mx-auto mb-4 opacity-40" />
                        <h3 className="text-xl font-bold">
                            {endpoints.length === 0 ? 'No Endpoints Found' : 'No matches'}
                        </h3>
                        <p className="text-muted-foreground max-w-sm mx-auto mt-2 text-sm leading-relaxed">
                            {endpoints.length === 0
                                ? 'Run a scan with ffuf or a similar tool and endpoints discovered will appear here.'
                                : 'Try adjusting your search or method filter.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filtered.map((ep) => {
                            const isOpen = expanded === ep.id;
                            return (
                                <div
                                    key={ep.id}
                                    className="group bg-card/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden transition-all hover:border-primary/20"
                                >
                                    <button
                                        className="w-full flex flex-wrap items-center gap-3 px-5 py-4 text-left"
                                        onClick={() => setExpanded(isOpen ? null : ep.id)}
                                    >
                                        {/* Method badge */}
                                        <span className={`shrink-0 text-xs font-black px-2.5 py-1 rounded-lg border ${METHOD_COLORS[ep.method] || METHOD_COLORS.GET}`}>
                                            {ep.method}
                                        </span>

                                        {/* URL */}
                                        <span className="flex-1 font-mono text-sm text-foreground break-all">
                                            {ep.url}
                                        </span>

                                        {/* Status code */}
                                        {ep.status && (
                                            <span className="shrink-0 text-xs font-bold text-muted-foreground bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                                                {ep.status}
                                            </span>
                                        )}

                                        {/* Severity */}
                                        <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-lg border capitalize ${SEVERITY_STYLES[ep.severity] || SEVERITY_STYLES.info}`}>
                                            {ep.severity}
                                        </span>

                                        <ChevronDown
                                            size={16}
                                            className={`text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                                        />
                                    </button>

                                    {/* Expanded detail */}
                                    {isOpen && (
                                        <div className="border-t border-white/10 px-5 py-4 bg-black/10 flex flex-wrap gap-4 text-sm">
                                            <div>
                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Target</p>
                                                <p className="font-medium text-foreground">{ep.target || '—'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Job ID</p>
                                                <p className="font-mono text-foreground text-xs">{ep.job_id || '—'}</p>
                                            </div>
                                            {ep.url && (
                                                <a
                                                    href={ep.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="ml-auto flex items-center gap-1.5 text-primary text-xs font-bold hover:underline"
                                                >
                                                    Open URL <ExternalLink size={12} />
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
