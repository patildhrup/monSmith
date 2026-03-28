import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Share2, Github, GitBranch, Lock, ExternalLink, 
  RefreshCw, Play, CheckCircle2, AlertCircle 
} from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import { useAuth } from "../../context/authContext";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "../../components/ui/select";

// ── tiny helpers ──────────────────────────────────────────────────────────────
const riskColor = (r = "") => {
  const v = r.toLowerCase();
  if (v === "critical") return "#ff3b3b";
  if (v === "high")     return "#ff7043";
  if (v === "medium")   return "#ffb300";
  return "#4caf50";
};

const riskBg = (r = "") => {
  const v = r.toLowerCase();
  if (v === "critical") return "rgba(255,59,59,.15)";
  if (v === "high")     return "rgba(255,112,67,.12)";
  if (v === "medium")   return "rgba(255,179,0,.12)";
  return "rgba(76,175,80,.12)";
};

const Badge = ({ label, color }) => (
  <span style={{
    background: `${color}22`,
    color,
    border: `1px solid ${color}55`,
    borderRadius: 6,
    padding: "2px 10px",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: ".5px",
    textTransform: "uppercase",
  }}>{label}</span>
);

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000") + "/api/v1";

// ── main component ────────────────────────────────────────────────────────────
export default function Repo() {
  const { user, token, fetchProfile } = useAuth();
  const navigate = useNavigate();
  const [repos, setRepos]           = useState([]);
  const [selectedRepo, setSelected] = useState(null);
  const [scanning, setScanning]     = useState(false);
  const [stage, setStage]           = useState("");
  const [results, setResults]       = useState(null);
  const [error, setError]           = useState("");
  const [activeTab, setActiveTab]   = useState("zombie");
  const [connected, setConnected]   = useState(false);
  const [fetchingRepos, setFetchingRepos] = useState(false);
  const wsRef = useRef(null);

  // ── fetch connected repos ────────────────────────────────────────────────
  // ── fetch connected repos ────────────────────────────────────────────────
  const loadRepos = useCallback(async () => {
    if (!token) return;
    setFetchingRepos(true);
    try {
      const res = await fetch(`${API_BASE}/github/repos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRepos(data);
        setConnected(true);
      } else {
        setConnected(false);
      }
    } catch {
      setConnected(false);
    } finally {
      setFetchingRepos(false);
    }
  }, [token]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const err = urlParams.get('error');

    if (status === 'connected') {
        fetchProfile();
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (err) {
        setError(err.replace(/_/g, ' '));
    }

    if (user?.github_token || user?.has_github_connected || token) {
        loadRepos();
    }
  }, [user, fetchProfile, token, loadRepos]);

  // ── start scan ───────────────────────────────────────────────────────────
  const startScan = async () => {
    if (!selectedRepo) return;
    setScanning(true);
    setResults(null);
    setError("");
    setStage("Initializing...");

    try {
      const res = await fetch(`${API_BASE}/scanner/scan-repo`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repo_url: selectedRepo.url }),
      });

      if (!res.ok) throw new Error("Failed to start scan");
      const job = await res.json();

      // Open WebSocket for live updates
      const wsUrl = `ws://localhost:8000/api/v1/scanner/ws/${job.job_id}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (e) => {
        const data = JSON.parse(e.data);
        setStage(data.message || data.current_stage || "");
        if (data.status === "completed" && data.results) {
          setResults(data.results);
          setScanning(false);
          setStage("Scan complete!");
          ws.close();
        }
        if (data.status === "failed") {
          setError(data.message || "Scan failed");
          setScanning(false);
          ws.close();
        }
      };

      ws.onerror = () => {
        setError("WebSocket connection failed");
        setScanning(false);
      };
    } catch (err) {
      setError(err.message);
      setScanning(false);
    }
  };

  const connectGitHub = () => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    if (!clientId) {
        alert('GitHub Client ID is not configured.');
        return;
    }
    const state = btoa(user?.email || "");
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo,read:user&state=${state}&redirect_uri=http://localhost:8000/auth/callback`;
  };

  // ── derive counts ────────────────────────────────────────────────────────
  const zombies   = results?.zombie_apis   || [];
  const vulns     = results?.vulnerabilities || results?.ai_report?.vulnerabilities || [];
  const bugs      = results?.bugs          || [];
  const zSum      = results?.zombie_summary || results?.summary || {};
  const secScore  = results?.summary?.security_score ?? null;

  // ── styles ────────────────────────────────────────────────────────────────
  const card = {
    background: "rgba(255,255,255,.04)",
    border: "1px solid rgba(255,255,255,.09)",
    borderRadius: 14,
    padding: "20px 24px",
  };

  const tabs = ["zombie", "vulnerabilities", "bugs", "all_endpoints"];
  const tabLabel = { zombie: "🧟 Zombie APIs", vulnerabilities: "🔐 Vulnerabilities", bugs: "🐞 Bugs", all_endpoints: "📡 All Endpoints" };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
    <div style={{ padding: "28px 32px", color: "#e2e8f0", fontFamily: "Inter, sans-serif" }}>

      {/* ── header ── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, background: "linear-gradient(135deg,#a78bfa,#60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Repository Security Scanner
        </h1>
        <p style={{ margin: "6px 0 0", color: "#94a3b8", fontSize: 14 }}>
          Connect a GitHub repository and run a full Zombie API + SAST analysis.
        </p>
      </div>

      {/* ── not connected ── */}
      {!connected && (
        <div className="flex items-center justify-center py-12">
            <div className="w-full max-w-xl bg-card/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
                
                <div className="relative z-10 flex flex-col items-center gap-6 text-center">
                    <div className="w-16 h-16 bg-card border border-white/10 rounded-2xl flex items-center justify-center shadow-xl">
                        <Github size={32} className="text-white" />
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Connect GitHub</h2>
                        <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                            Link your GitHub account to let monSmith scan your repositories for vulnerabilities.
                        </p>
                    </div>

                    <ul className="w-full text-left space-y-3">
                        {[
                            { icon: GitBranch, text: 'Scan public & private repositories' },
                            { icon: Lock, text: 'Secure OAuth access' },
                            { icon: ExternalLink, text: 'Real-time vulnerability reports' },
                        ].map(({ icon: Icon, text }) => (
                            <li key={text} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/5">
                                <Icon size={16} className="text-indigo-400 shrink-0" />
                                <span className="text-sm text-slate-300">{text}</span>
                            </li>
                        ))}
                    </ul>

                    <button
                        onClick={connectGitHub}
                        className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-bold py-3.5 rounded-xl transition-all hover:bg-gray-100 active:scale-95 shadow-lg"
                    >
                        <Github size={20} />
                        Connect with GitHub
                    </button>
                    
                    <p className="text-[10px] text-slate-500">
                        By connecting, you agree to our security scanning terms.
                    </p>
                </div>
            </div>
        </div>
      )}

      {/* ── connected UI ── */}
      {connected && (
        <>
          {/* repo selector + scan trigger */}
          <div style={{ ...card, marginBottom: 22, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", position: "relative" }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: "#94a3b8", display: "block", marginBottom: 6, marginLeft: 4 }}>SELECT REPOSITORY</label>
              <Select
                value={selectedRepo?.url || ""}
                onValueChange={(val) => setSelected(repos.find(r => r.url === val) || null)}
                disabled={fetchingRepos || scanning}
              >
                <SelectTrigger className="w-full bg-white/5 border-white/10 text-white focus:ring-indigo-500/50 h-11 rounded-xl">
                    <SelectValue placeholder="Choose a repository..." />
                </SelectTrigger>
                <SelectContent className="bg-[#0f172a] border-white/10 text-white max-h-[300px]">
                    {repos.map((repo) => (
                        <SelectItem key={repo.url} value={repo.url} className="focus:bg-indigo-500/20 focus:text-white cursor-pointer py-2.5">
                            <div className="flex flex-col text-left">
                                <span className="font-bold text-sm">{repo.name.split('/').pop()}</span>
                                <span className="text-[10px] text-slate-500 font-mono tracking-tight">{repo.name} {repo.private ? '🔒' : ''}</span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2" style={{ marginTop: 20 }}>
                <button
                    onClick={loadRepos}
                    disabled={fetchingRepos || scanning}
                    className="p-3 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl transition-all border border-white/5 disabled:opacity-50"
                    title="Refresh Repositories"
                >
                    <RefreshCw size={18} className={fetchingRepos ? 'animate-spin' : ''} />
                </button>

                <button
                    onClick={startScan}
                    disabled={!selectedRepo || scanning}
                    style={{
                        background: scanning
                        ? "rgba(255,255,255,.07)"
                        : "linear-gradient(135deg,#a78bfa,#60a5fa)",
                        border: "none", borderRadius: 10,
                        color: scanning ? "#64748b" : "#fff",
                        padding: "12px 28px", fontWeight: 700, fontSize: 14,
                        cursor: scanning ? "not-allowed" : "pointer",
                        whiteSpace: "nowrap",
                        transition: "all .2s",
                        boxShadow: scanning ? "none" : "0 10px 20px -5px rgba(99,102,241,0.3)"
                    }}
                >
                    {scanning ? "⏳ Scanning…" : "🚀 Start Scan"}
                </button>
            </div>
            
            <div className="absolute -bottom-6 left-1 flex items-center gap-1.5 text-[10px] text-slate-500">
                <CheckCircle2 size={10} className="text-indigo-400" />
                GitHub connected &middot; 
                <button onClick={connectGitHub} className="hover:text-indigo-400 underline decoration-indigo-400/30">Reconnect account</button>
            </div>
          </div>

          {/* progress */}
          {scanning && (
            <div style={{ ...card, marginBottom: 22, display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid transparent", borderTopColor: "#a78bfa", animation: "spin 1s linear infinite" }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>Scan in progress</div>
                <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 2 }}>{stage}</div>
              </div>
            </div>
          )}

          {/* error */}
          {error && (
            <div style={{ ...card, marginBottom: 22, borderColor: "#ff3b3b55", background: "rgba(255,59,59,.08)", display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ fontSize: 22 }}>⚠️</span>
              <div>
                <div style={{ fontWeight: 700, color: "#ff6b6b" }}>Scan Failed</div>
                <div style={{ color: "#94a3b8", fontSize: 13 }}>{error}</div>
              </div>
            </div>
          )}

          {/* ── results ── */}
          {results && (
            <>
              {/* summary cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14, marginBottom: 24 }}>
                {[
                  { label: "Total Endpoints", value: zSum.total_endpoints ?? "—", icon: "📡" },
                  { label: "Zombie APIs",      value: zombies.length,             icon: "🧟", color: riskColor(zombies.length > 5 ? "high" : "medium") },
                  { label: "High Risk Issues", value: zSum.high_risk_issues ?? "—", icon: "🔥", color: "#ff7043" },
                  { label: "Security Score",   value: secScore !== null ? `${secScore}/100` : "—", icon: "🛡️", color: secScore < 50 ? "#ff3b3b" : secScore < 75 ? "#ffb300" : "#4caf50" },
                  { label: "Overall Risk",     value: zSum.overall_risk ?? "—",   icon: "⚡", color: riskColor(zSum.overall_risk) },
                ].map(s => (
                  <div key={s.label} style={{ ...card, textAlign: "center" }}>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>{s.icon}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: s.color || "#e2e8f0" }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Graph Trigger */}
              <div style={{ marginBottom: 24, display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={() => navigate(`/repo-graph/${results.job_id}`, { state: { repoName: selectedRepo?.name } })}
                  style={{
                    background: "rgba(99,102,241,.1)",
                    border: "1px solid rgba(99,102,241,.25)",
                    borderRadius: 12, padding: "12px 24px",
                    color: "#818cf8", fontWeight: 700, fontSize: 13,
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                    transition: "all .2s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(99,102,241,.2)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(99,102,241,.1)"}
                >
                  <Share2 size={16} /> Explore Architecture Graph →
                </button>
              </div>

              {/* tabs */}
              <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
                {tabs.map(t => (
                  <button key={t} onClick={() => setActiveTab(t)} style={{
                    background: activeTab === t ? "rgba(167,139,250,.22)" : "rgba(255,255,255,.04)",
                    border: `1px solid ${activeTab === t ? "#a78bfa66" : "rgba(255,255,255,.09)"}`,
                    borderRadius: 8, color: activeTab === t ? "#c4b5fd" : "#94a3b8",
                    padding: "8px 18px", fontWeight: 600, fontSize: 13, cursor: "pointer",
                  }}>
                    {tabLabel[t]}
                  </button>
                ))}
              </div>

              {/* ── zombie APIs tab ── */}
              {activeTab === "zombie" && (
                <div style={card}>
                  <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>🧟 Zombie APIs ({zombies.length})</h3>
                  {zombies.length === 0
                    ? <p style={{ color: "#4caf50", margin: 0 }}>✅ No zombie APIs detected.</p>
                    : (
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                          <thead>
                            <tr style={{ borderBottom: "1px solid rgba(255,255,255,.1)", color: "#64748b", textAlign: "left" }}>
                              {["Method", "Endpoint", "Type", "Risk", "Reason"].map(h => (
                                <th key={h} style={{ padding: "8px 12px", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: ".5px" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {zombies.map((z, i) => (
                              <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,.05)", transition: "background .15s" }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.03)"}
                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                              >
                                <td style={{ padding: "10px 12px" }}>
                                  <Badge label={z.method || "GET"} color="#60a5fa" />
                                </td>
                                <td style={{ padding: "10px 12px", fontFamily: "monospace", color: "#c4b5fd", wordBreak: "break-all" }}>{z.endpoint}</td>
                                <td style={{ padding: "10px 12px", color: "#94a3b8" }}>{z.type}</td>
                                <td style={{ padding: "10px 12px" }}>
                                  <Badge label={z.risk} color={riskColor(z.risk)} />
                                </td>
                                <td style={{ padding: "10px 12px", color: "#94a3b8", fontSize: 12 }}>{z.reason}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  }
                </div>
              )}

              {/* ── vulnerabilities tab ── */}
              {activeTab === "vulnerabilities" && (
                <div style={card}>
                  <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>🔐 Vulnerabilities ({vulns.length})</h3>
                  {vulns.length === 0
                    ? <p style={{ color: "#4caf50", margin: 0 }}>✅ No vulnerabilities found.</p>
                    : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {vulns.map((v, i) => {
                          const sev = v.severity || v.issue;
                          const sevKey = (typeof sev === "string" ? sev : "medium").toLowerCase();
                          return (
                            <div key={i} style={{
                              background: riskBg(sevKey),
                              border: `1px solid ${riskColor(sevKey)}44`,
                              borderRadius: 10, padding: "14px 18px",
                            }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
                                <div style={{ fontWeight: 700, fontSize: 14 }}>{v.name || v.issue || v.title || "Unknown Issue"}</div>
                                <Badge label={sevKey} color={riskColor(sevKey)} />
                              </div>
                              {v.description && <div style={{ color: "#94a3b8", fontSize: 13, marginBottom: 6 }}>{v.description}</div>}
                              {v.fix && (
                                <div style={{ background: "rgba(255,255,255,.04)", borderRadius: 6, padding: "8px 12px", fontSize: 12, color: "#86efac" }}>
                                  💡 <strong>Fix:</strong> {v.fix}
                                </div>
                              )}
                              {(v.target || v.endpoint) && (
                                <div style={{ fontSize: 11, color: "#475569", marginTop: 6, fontFamily: "monospace" }}>
                                  {v.target || v.endpoint}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )
                  }
                </div>
              )}

              {/* ── bugs tab ── */}
              {activeTab === "bugs" && (
                <div style={card}>
                  <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>🐞 Bugs & Issues ({bugs.length})</h3>
                  {bugs.length === 0
                    ? <p style={{ color: "#94a3b8", margin: 0 }}>No bugs reported.</p>
                    : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {bugs.map((b, i) => (
                          <div key={i} style={{
                            display: "flex", gap: 14, alignItems: "flex-start",
                            background: "rgba(255,255,255,.03)", borderRadius: 10, padding: "12px 16px",
                            border: "1px solid rgba(255,255,255,.07)",
                          }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: riskColor(b.severity), marginTop: 5, flexShrink: 0 }} />
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{b.issue}</div>
                              {b.location && <div style={{ color: "#64748b", fontSize: 12, fontFamily: "monospace" }}>{b.location}</div>}
                            </div>
                            <div style={{ marginLeft: "auto", flexShrink: 0 }}>
                              <Badge label={b.severity || "low"} color={riskColor(b.severity)} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  }
                </div>
              )}

              {/* ── all endpoints tab ── */}
              {activeTab === "all_endpoints" && (
                <div style={card}>
                  <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>
                    📡 All Discovered Endpoints ({(results.all_endpoints || []).length})
                  </h3>
                  {(results.all_endpoints || []).length === 0
                    ? <p style={{ color: "#94a3b8", margin: 0 }}>No endpoints extracted from codebase.</p>
                    : (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {(results.all_endpoints || []).map((ep, i) => (
                          <div key={i} style={{
                            background: "rgba(96,165,250,.1)", border: "1px solid rgba(96,165,250,.25)",
                            borderRadius: 6, padding: "6px 12px", fontSize: 12,
                            display: "flex", alignItems: "center", gap: 8,
                          }}>
                            <span style={{ color: "#60a5fa", fontWeight: 700, fontSize: 10 }}>
                              {ep.method || "?"}
                            </span>
                            <span style={{ fontFamily: "monospace", color: "#c4b5fd" }}>{ep.endpoint}</span>
                            {ep.live_status && (
                              <span style={{ color: ep.live_status === 200 ? "#4caf50" : "#ff7043", fontSize: 10, fontWeight: 700 }}>
                                {ep.live_status}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )
                  }
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* spinner keyframes */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        select option { background: #1e293b; color: #e2e8f0; }
      `}</style>
    </div>
    </DashboardLayout>
  );
}
