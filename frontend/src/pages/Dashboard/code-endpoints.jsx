import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Code, Search, Filter, GitBranch, Shield, AlertTriangle,
  ChevronDown, ChevronUp, RefreshCw, ExternalLink, Copy,
  CheckCircle2, Zap, FileCode, Globe, Lock, ArrowRight,
  Info, ShieldAlert, Activity, Hash, Clock
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { useRepo } from '../../context/repoContext';

// ── constants ────────────────────────────────────────────────────────────────
const METHOD_STYLES = {
  GET:    { bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', text: 'text-emerald-400', dot: '#10b981' },
  POST:   { bg: 'bg-blue-500/15',    border: 'border-blue-500/30',    text: 'text-blue-400',    dot: '#3b82f6' },
  PUT:    { bg: 'bg-amber-500/15',   border: 'border-amber-500/30',   text: 'text-amber-400',   dot: '#f59e0b' },
  PATCH:  { bg: 'bg-purple-500/15',  border: 'border-purple-500/30',  text: 'text-purple-400',  dot: '#a855f7' },
  DELETE: { bg: 'bg-red-500/15',     border: 'border-red-500/30',     text: 'text-red-400',     dot: '#ef4444' },
  HEAD:   { bg: 'bg-slate-500/15',   border: 'border-slate-500/30',   text: 'text-slate-400',   dot: '#64748b' },
  OPTIONS:{ bg: 'bg-slate-500/15',   border: 'border-slate-500/30',   text: 'text-slate-400',   dot: '#64748b' },
};

const RISK_STYLES = {
  critical: { bg: 'bg-red-500/10',    border: 'border-red-500/25',    text: 'text-red-400' },
  high:     { bg: 'bg-orange-500/10', border: 'border-orange-500/25', text: 'text-orange-400' },
  medium:   { bg: 'bg-amber-500/10',  border: 'border-amber-500/25',  text: 'text-amber-400' },
  low:      { bg: 'bg-green-500/10',  border: 'border-green-500/25',  text: 'text-green-400' },
  safe:     { bg: 'bg-slate-500/10',  border: 'border-slate-500/25',  text: 'text-slate-400' },
};

const METHODS_FILTER = ['ALL', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

// ── endpoint extractor ────────────────────────────────────────────────────────
function extractEndpoints(scanResults) {
  if (!scanResults) return [];

  const items = [];

  // 1. From all_endpoints (zombie scanner output)
  (scanResults.all_endpoints || []).forEach((ep, i) => {
    if (!ep) return;
    const method = (ep.method || 'GET').toUpperCase();
    const endpoint = ep.endpoint || ep.url || ep;
    const isZombie = (scanResults.zombie_apis || []).some(z => z.endpoint === endpoint);
    const risk = ep.risk || (isZombie ? 'high' : 'safe');

    items.push({
      id: `ep-all-${i}`,
      method,
      endpoint: typeof endpoint === 'string' ? endpoint : String(endpoint),
      file: ep.file || ep.source || null,
      line: ep.line || null,
      status: ep.live_status || ep.status_code || null,
      risk: risk.toLowerCase(),
      authenticated: ep.authenticated ?? null,
      params: ep.params || [],
      description: ep.description || '',
      isZombie,
      tag: ep.tag || ep.type || null,
    });
  });

  // 2. From zombie_apis (deduplicate)
  const seenEndpoints = new Set(items.map(i => `${i.method}:${i.endpoint}`));
  (scanResults.zombie_apis || []).forEach((z, i) => {
    const method = (z.method || 'GET').toUpperCase();
    const endpoint = z.endpoint || '';
    const key = `${method}:${endpoint}`;
    if (seenEndpoints.has(key)) return;
    seenEndpoints.add(key);
    items.push({
      id: `ep-zombie-${i}`,
      method,
      endpoint,
      file: z.file || null,
      line: z.line || null,
      status: null,
      risk: (z.risk || 'high').toLowerCase(),
      authenticated: null,
      params: [],
      description: z.reason || '',
      isZombie: true,
      tag: z.type || 'zombie',
    });
  });

  // 3. From ai_report vulnerabilities that mention endpoints
  (scanResults.ai_report?.vulnerabilities || scanResults.vulnerabilities || []).forEach(v => {
    const ep = v.endpoint || v.target || v.file;
    if (!ep || seenEndpoints.has(`VULN:${ep}`)) return;
    seenEndpoints.add(`VULN:${ep}`);
    const method = v.method ? v.method.toUpperCase() : null;
    if (!method) return;
    const key = `${method}:${ep}`;
    if (seenEndpoints.has(key)) return;
    seenEndpoints.add(key);
    items.push({
      id: `ep-vuln-${ep}`,
      method,
      endpoint: ep,
      file: v.file || null,
      line: v.line || null,
      status: null,
      risk: (v.severity || 'medium').toLowerCase(),
      authenticated: null,
      params: [],
      description: v.description || v.issue || '',
      isZombie: false,
      tag: 'vulnerability',
    });
  });

  return items;
}

// ── method badge ──────────────────────────────────────────────────────────────
function MethodBadge({ method }) {
  const s = METHOD_STYLES[method] || METHOD_STYLES.GET;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-black tracking-wider border ${s.bg} ${s.border} ${s.text} font-mono`}>
      {method}
    </span>
  );
}

// ── risk badge ────────────────────────────────────────────────────────────────
function RiskBadge({ risk }) {
  const s = RISK_STYLES[risk] || RISK_STYLES.safe;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${s.bg} ${s.border} ${s.text}`}>
      {risk}
    </span>
  );
}

// ── stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color = 'text-primary', sub }) {
  return (
    <div className="bg-slate-900/60 border border-white/8 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group hover:border-white/15 transition-all">
      <div className="absolute inset-0 bg-gradient-to-br from-white/2 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-start justify-between mb-3">
        <div className="p-2.5 bg-white/5 rounded-xl border border-white/8">
          <Icon size={16} className="text-slate-400" />
        </div>
      </div>
      <div className={`text-3xl font-black mb-1 ${color}`}>{value}</div>
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</div>
      {sub && <div className="text-[10px] text-slate-600 mt-1">{sub}</div>}
    </div>
  );
}

// ── endpoint row ──────────────────────────────────────────────────────────────
function EndpointRow({ ep, isOpen, onToggle }) {
  const ms = METHOD_STYLES[ep.method] || METHOD_STYLES.GET;
  const rs = RISK_STYLES[ep.risk] || RISK_STYLES.safe;
  const [copied, setCopied] = useState(false);

  const copyPath = useCallback((e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ep.endpoint).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [ep.endpoint]);

  return (
    <div className={`rounded-2xl border transition-all duration-200 overflow-hidden
      ${isOpen ? 'border-white/15 shadow-lg shadow-black/20' : 'border-white/6 hover:border-white/12'}
      ${ep.isZombie ? 'bg-red-500/3' : 'bg-slate-900/40'} backdrop-blur-xl`}>

      {/* Row header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-3.5 text-left group"
      >
        {/* Method */}
        <MethodBadge method={ep.method} />

        {/* Endpoint path */}
        <span className="flex-1 font-mono text-sm text-slate-200 break-all min-w-0">
          {ep.endpoint}
        </span>

        {/* Zombie badge */}
        {ep.isZombie && (
          <span className="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-red-500/15 border border-red-500/25 text-red-400 tracking-widest">
            🧟 ZOMBIE
          </span>
        )}

        {/* Status code */}
        {ep.status && (
          <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-lg border font-mono
            ${ep.status < 300 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
              ep.status < 400 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
              'text-red-400 bg-red-500/10 border-red-500/20'}`}>
            {ep.status}
          </span>
        )}

        {/* Risk */}
        <RiskBadge risk={ep.risk} />

        {/* Copy */}
        <button
          onClick={copyPath}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 text-slate-500 hover:text-slate-300 transition-all opacity-0 group-hover:opacity-100 shrink-0"
        >
          {copied ? <CheckCircle2 size={12} className="text-emerald-400" /> : <Copy size={12} />}
        </button>

        {/* Expand toggle */}
        {isOpen
          ? <ChevronUp size={14} className="text-slate-500 shrink-0" />
          : <ChevronDown size={14} className="text-slate-500 shrink-0" />}
      </button>

      {/* Expanded detail */}
      {isOpen && (
        <div className="border-t border-white/6 px-5 py-4 bg-black/20 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {ep.file && (
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <FileCode size={10} /> Source File
              </p>
              <p className="font-mono text-xs text-slate-300 break-all bg-white/5 rounded-lg px-3 py-2 border border-white/6">
                {ep.file}
                {ep.line && <span className="text-slate-500 ml-1">:{ep.line}</span>}
              </p>
            </div>
          )}
          {ep.description && (
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Info size={10} /> Details
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">{ep.description}</p>
            </div>
          )}
          {ep.tag && (
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Hash size={10} /> Tag
              </p>
              <span className="text-xs bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-slate-400 font-mono">
                {ep.tag}
              </span>
            </div>
          )}
          {ep.authenticated !== null && (
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Lock size={10} /> Auth Required
              </p>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border inline-block
                ${ep.authenticated
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                  : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>
                {ep.authenticated ? '🔒 Yes' : '🔓 No'}
              </span>
            </div>
          )}
          {ep.params?.length > 0 && (
            <div className="sm:col-span-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Parameters</p>
              <div className="flex flex-wrap gap-1.5">
                {ep.params.map((p, i) => (
                  <span key={i} className="text-[10px] font-mono bg-white/5 border border-white/8 rounded px-2 py-0.5 text-slate-400">
                    {typeof p === 'object' ? `${p.name}:${p.type || '?'}` : p}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function CodeEndpoints() {
  const navigate = useNavigate();
  const { selectedRepo, scanResults, scanJobId } = useRepo();

  const [search, setSearch]       = useState('');
  const [methodFilter, setMethod] = useState('ALL');
  const [riskFilter, setRisk]     = useState('ALL');
  const [expandedId, setExpanded] = useState(null);
  const [showZombieOnly, setZombieOnly] = useState(false);
  const [sortBy, setSortBy]       = useState('risk'); // 'risk' | 'method' | 'path'

  const endpoints = useMemo(() => extractEndpoints(scanResults), [scanResults]);

  const RISK_ORDER = { critical: 0, high: 1, medium: 2, low: 3, safe: 4 };

  const filtered = useMemo(() => {
    let list = endpoints;
    if (methodFilter !== 'ALL') list = list.filter(e => e.method === methodFilter);
    if (riskFilter !== 'ALL')   list = list.filter(e => e.risk === riskFilter.toLowerCase());
    if (showZombieOnly)          list = list.filter(e => e.isZombie);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.endpoint.toLowerCase().includes(q) ||
        (e.file || '').toLowerCase().includes(q) ||
        (e.description || '').toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      if (sortBy === 'risk')   return (RISK_ORDER[a.risk] ?? 5) - (RISK_ORDER[b.risk] ?? 5);
      if (sortBy === 'method') return a.method.localeCompare(b.method);
      return a.endpoint.localeCompare(b.endpoint);
    });
  }, [endpoints, methodFilter, riskFilter, showZombieOnly, search, sortBy]);

  const stats = useMemo(() => ({
    total: endpoints.length,
    get:    endpoints.filter(e => e.method === 'GET').length,
    post:   endpoints.filter(e => e.method === 'POST').length,
    put:    endpoints.filter(e => e.method === 'PUT').length,
    patch:  endpoints.filter(e => e.method === 'PATCH').length,
    delete: endpoints.filter(e => e.method === 'DELETE').length,
    zombie: endpoints.filter(e => e.isZombie).length,
    critical: endpoints.filter(e => e.risk === 'critical').length,
    high: endpoints.filter(e => e.risk === 'high').length,
    unauthed: endpoints.filter(e => e.authenticated === false).length,
  }), [endpoints]);

  // ── no repo selected ──────────────────────────────────────────────────────
  if (!selectedRepo) {
    return (
      <DashboardLayout>
        <div className="py-16 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-full max-w-md text-center">
            <div className="w-20 h-20 rounded-3xl bg-slate-800/60 border border-white/8 flex items-center justify-center mx-auto mb-6">
              <Code size={36} className="text-indigo-400 opacity-70" />
            </div>
            <h2 className="text-2xl font-black text-white mb-3">No Repository Selected</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              Go to the <strong className="text-white">Repositories</strong> tab, connect your GitHub, select a repo, and run a scan. Code endpoints will appear here automatically.
            </p>
            <button
              onClick={() => navigate('/repo')}
              className="inline-flex items-center gap-2.5 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/25 active:scale-95"
            >
              <GitBranch size={16} /> Go to Repositories <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── no scan results yet ──────────────────────────────────────────────────
  if (!scanResults) {
    return (
      <DashboardLayout>
        <div className="py-16 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-20 h-20 rounded-3xl bg-slate-800/60 border border-white/8 flex items-center justify-center mx-auto mb-6">
            <Activity size={36} className="text-amber-400 opacity-70" />
          </div>
          <h2 className="text-2xl font-black text-white mb-3">Scan Required</h2>
          <p className="text-slate-400 text-sm mb-2">
            Repository: <span className="text-indigo-400 font-mono">{selectedRepo.name}</span>
          </p>
          <p className="text-slate-500 text-sm leading-relaxed mb-8 max-w-sm text-center">
            Run a security scan on this repository to discover all code endpoints.
          </p>
          <button
            onClick={() => navigate('/repo')}
            className="inline-flex items-center gap-2.5 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/25 active:scale-95"
          >
            <Zap size={16} /> Run Scan <ArrowRight size={14} />
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="py-8">

        {/* ── Header ── */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black flex items-center gap-3 mb-1">
              <span className="p-2.5 bg-indigo-500/15 border border-indigo-500/25 rounded-xl">
                <Code size={22} className="text-indigo-400" />
              </span>
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Code Endpoints
              </span>
            </h1>
            <div className="flex items-center gap-2 text-sm text-slate-400 mt-1.5 ml-1">
              <GitBranch size={13} className="text-indigo-400 shrink-0" />
              <span className="font-mono text-indigo-300">{selectedRepo.name?.split('/').pop() || selectedRepo.name}</span>
              <span className="text-slate-600">·</span>
              <span>{endpoints.length} endpoints discovered</span>
              {scanJobId && (
                <>
                  <span className="text-slate-600">·</span>
                  <button
                    onClick={() => navigate(`/repo-graph/${scanJobId}`, { state: { repoName: selectedRepo.name } })}
                    className="text-indigo-400 hover:text-indigo-300 underline decoration-indigo-400/30 flex items-center gap-1 transition-colors"
                  >
                    View Graph <ExternalLink size={10} />
                  </button>
                </>
              )}
            </div>
          </div>

          <button
            onClick={() => navigate('/repo')}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/70 border border-white/8 text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-700/70 transition-all"
          >
            <RefreshCw size={14} /> Rescan
          </button>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <StatCard icon={Globe}      label="Total"    value={stats.total}    color="text-indigo-400" />
          <StatCard icon={Activity}   label="GET"      value={stats.get}      color="text-emerald-400" />
          <StatCard icon={Zap}        label="POST"     value={stats.post}     color="text-blue-400" />
          <StatCard icon={Shield}     label="PUT/PATCH" value={stats.put + stats.patch} color="text-amber-400" />
          <StatCard icon={ShieldAlert} label="DELETE"  value={stats.delete}   color="text-red-400" />
          <StatCard icon={AlertTriangle} label="Zombie" value={stats.zombie}  color="text-orange-400" sub={`${stats.critical} critical`} />
        </div>

        {/* ── Risk summary bar ── */}
        {endpoints.length > 0 && (
          <div className="bg-slate-900/50 border border-white/6 rounded-2xl p-4 mb-6 flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Risk Breakdown</span>
            {['critical','high','medium','low','safe'].map(r => {
              const count = endpoints.filter(e => e.risk === r).length;
              if (!count) return null;
              const s = RISK_STYLES[r];
              const pct = Math.round((count / endpoints.length) * 100);
              return (
                <button
                  key={r}
                  onClick={() => setRisk(riskFilter === r.toUpperCase() ? 'ALL' : r.toUpperCase())}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all hover:scale-105 active:scale-95
                    ${riskFilter === r.toUpperCase() ? `ring-2 ring-offset-1 ring-offset-slate-900 ${s.text.replace('text-','ring-')}` : ''}
                    ${s.bg} ${s.border} ${s.text}`}
                >
                  {r} <span className="opacity-70">({count})</span>
                  <span className="opacity-40 text-[9px]">{pct}%</span>
                </button>
              );
            })}
            {stats.unauthed > 0 && (
              <span className="ml-auto flex items-center gap-1.5 text-xs text-red-400 font-semibold">
                <Lock size={11} /> {stats.unauthed} unauthenticated
              </span>
            )}
          </div>
        )}

        {/* ── Filters ── */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search endpoints, files…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-900/60 border border-white/8 rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors backdrop-blur-xl"
            />
          </div>

          {/* Method filter */}
          <div className="flex items-center gap-1 bg-slate-900/60 border border-white/8 rounded-xl p-1 backdrop-blur-xl">
            {METHODS_FILTER.map(m => {
              const s = METHOD_STYLES[m];
              return (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black tracking-wider transition-all ${
                    methodFilter === m
                      ? (s ? `${s.bg} ${s.text} border ${s.border}` : 'bg-white/10 text-white')
                      : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>

          {/* Zombie toggle */}
          <button
            onClick={() => setZombieOnly(!showZombieOnly)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all
              ${showZombieOnly
                ? 'bg-red-500/15 border-red-500/30 text-red-400 shadow-lg shadow-red-500/10'
                : 'bg-slate-900/60 border-white/8 text-slate-400 hover:text-slate-200'}`}
          >
            🧟 Zombie Only
          </button>

          {/* Sort */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-slate-600 font-medium">Sort:</span>
            {['risk','method','path'].map(s => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize
                  ${sortBy === s ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* ── Results count ── */}
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs text-slate-500 font-medium">
            Showing <span className="text-slate-300 font-bold">{filtered.length}</span> of {endpoints.length} endpoints
          </span>
          {(methodFilter !== 'ALL' || riskFilter !== 'ALL' || showZombieOnly || search) && (
            <button
              onClick={() => { setMethod('ALL'); setRisk('ALL'); setZombieOnly(false); setSearch(''); }}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* ── Endpoint list ── */}
        {filtered.length === 0 ? (
          <div className="text-center py-32 bg-slate-900/30 rounded-3xl border border-dashed border-white/8">
            <Code size={48} className="text-slate-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-300">
              {endpoints.length === 0 ? 'No Endpoints Extracted' : 'No Matches'}
            </h3>
            <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto">
              {endpoints.length === 0
                ? 'The scan did not extract any API endpoints from this repository. Try running a fresh scan.'
                : 'Adjust your filters to see more results.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map(ep => (
              <EndpointRow
                key={ep.id}
                ep={ep}
                isOpen={expandedId === ep.id}
                onToggle={() => setExpanded(expandedId === ep.id ? null : ep.id)}
              />
            ))}
          </div>
        )}

        {/* ── Bottom quick-nav ── */}
        {endpoints.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-3 items-center justify-center">
            <button
              onClick={() => navigate('/repo')}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl text-sm font-semibold hover:bg-indigo-500/20 transition-all"
            >
              <GitBranch size={14} /> Repositories
            </button>
            {scanJobId && (
              <button
                onClick={() => navigate(`/repo-graph/${scanJobId}`, { state: { repoName: selectedRepo?.name } })}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl text-sm font-semibold hover:bg-purple-500/20 transition-all"
              >
                <Activity size={14} /> Repo Graph
              </button>
            )}
            <button
              onClick={() => navigate('/alerts')}
              className="flex items-center gap-2 px-5 py-2.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-xl text-sm font-semibold hover:bg-orange-500/20 transition-all"
            >
              <ShieldAlert size={14} /> Security Alerts
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
