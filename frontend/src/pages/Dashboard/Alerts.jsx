import { useState, useEffect } from 'react';
import { CircleAlert, ShieldAlert, AlertTriangle, Info, CheckCircle2, RefreshCw } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { api } from '../../services/api';

const SEVERITY_CONFIG = {
  critical: { color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/25', icon: <ShieldAlert size={18} />, label: 'Critical' },
  high: { color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/25', icon: <AlertTriangle size={18} />, label: 'High' },
  medium: { color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/25', icon: <CircleAlert size={18} />, label: 'Medium' },
  low: { color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/25', icon: <Info size={18} />, label: 'Low' },
};

const Alerts = () => {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchAlerts(); }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await api.getHistory();
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setScans(data);
    } catch {
      setScans([]);
    } finally {
      setLoading(false);
    }
  };

  // Flatten all vulnerabilities from all completed scans into alert items
  const allAlerts = scans.flatMap(scan => {
    const rawVulns = scan.results?.vulnerabilities
      || scan.results?.ai_report?.vulnerabilities
      || [];
    const rawZombies = scan.results?.zombie_apis
      || scan.results?.zombie_findings
      || [];

    // Defensively ensure both are arrays (backend may return objects or strings)
    const vulns = Array.isArray(rawVulns) ? rawVulns : [];
    const zombies = Array.isArray(rawZombies) ? rawZombies : [];

    const vulnAlerts = vulns.map(v => ({
      id: `${scan.job_id}-v-${v.title || v.name || v.issue || Math.random()}`,
      title: v.title || v.name || v.issue || 'Vulnerability Detected',
      description: v.description || v.impact || '',
      severity: (typeof v.severity === 'string' ? v.severity : 'medium').toLowerCase(),
      source: scan.target,
      type: 'vulnerability',
      fix: v.fix || '',
    }));

    const zombieAlerts = zombies.map(z => ({
      id: `${scan.job_id}-z-${z.endpoint || Math.random()}`,
      title: `Zombie API: ${z.endpoint || 'Unknown'}`,
      description: z.reason || 'Suspicious or deprecated endpoint detected.',
      severity: (typeof z.risk === 'string' ? z.risk : 'medium').toLowerCase(),
      source: scan.target,
      type: 'zombie',
      fix: 'Review and decommission or secure this endpoint.',
    }));

    return [...vulnAlerts, ...zombieAlerts];
  });

  const filtered = filter === 'all' ? allAlerts : allAlerts.filter(a => a.severity === filter);

  const counts = {
    critical: allAlerts.filter(a => a.severity === 'critical').length,
    high: allAlerts.filter(a => a.severity === 'high').length,
    medium: allAlerts.filter(a => a.severity === 'medium').length,
    low: allAlerts.filter(a => a.severity === 'low').length,
  };

  return (
    <DashboardLayout>
      <div className="py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <CircleAlert className="text-primary" />
              Security Alerts
            </h1>
            <p className="text-muted-foreground mt-1 text-base">
              Aggregated vulnerabilities and zombie API findings from all your scans.
            </p>
          </div>
          <button
            onClick={fetchAlerts}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl text-primary font-semibold text-sm transition-all"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Severity summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {Object.entries(SEVERITY_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setFilter(filter === key ? 'all' : key)}
              className={`text-left rounded-2xl border p-5 transition-all hover:scale-[1.02] active:scale-95 ${cfg.bg} ${cfg.border} ${filter === key ? 'ring-2 ring-offset-2 ring-offset-background ring-primary/40' : ''}`}
            >
              <div className={`${cfg.color} mb-2`}>{cfg.icon}</div>
              <div className={`text-2xl font-bold ${cfg.color}`}>{counts[key]}</div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">{cfg.label}</div>
            </button>
          ))}
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['all', 'critical', 'high', 'medium', 'low'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all capitalize ${filter === f
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted/30 text-muted-foreground border-white/10 hover:bg-muted/60'
                }`}
            >
              {f === 'all' ? `All (${allAlerts.length})` : `${f} (${counts[f]})`}
            </button>
          ))}
        </div>

        {/* Alerts list */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-muted-foreground font-medium">Loading alerts...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-32 bg-card/30 rounded-[32px] border border-dashed border-white/10">
            <CheckCircle2 size={48} className="text-green-400 mx-auto mb-4 opacity-60" />
            <h3 className="text-xl font-bold">No Alerts Found</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mt-2 text-sm">
              {filter === 'all'
                ? "Run a scan to start detecting vulnerabilities and zombie APIs."
                : `No ${filter} severity alerts found.`}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(alert => {
              const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.low;
              return (
                <div
                  key={alert.id}
                  className={`rounded-2xl border p-5 transition-all hover:scale-[1.005] ${cfg.bg} ${cfg.border}`}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className={`mt-0.5 shrink-0 ${cfg.color}`}>{cfg.icon}</span>
                      <div className="min-w-0">
                        <div className="font-bold text-foreground text-sm leading-snug break-words">{alert.title}</div>
                        {alert.description && (
                          <p className="text-muted-foreground text-xs mt-1 leading-relaxed line-clamp-2">{alert.description}</p>
                        )}
                        {alert.fix && (
                          <div className="mt-2 text-xs text-green-400 font-medium">
                            💡 {alert.fix}
                          </div>
                        )}
                        <div className="mt-2 text-xs text-muted-foreground/60 font-mono truncate">{alert.source}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                        {alert.severity}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border bg-white/5 border-white/10 text-muted-foreground`}>
                        {alert.type}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Alerts;
