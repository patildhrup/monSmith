import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/authContext';
import {
  Terminal, Shield, Zap, AlertTriangle, Search,
  ChevronRight, Brain, Share2, Maximize2, RefreshCw,
  MessageSquare, Settings, Filter, Download,
  ArrowLeft, Info, FileCode, Radio
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { gsap } from 'gsap';
import ForceGraph2D from 'react-force-graph-2d';

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000") + "/api/v1";

// --- Components ---

const NODE_COLORS = {
  API: '#6366f1',
  File: '#94a3b8',
  Function: '#10b981',
  Vulnerability: '#ef4444',
  Frontend: '#8b5cf6'
};

const NodeIndicator = ({ type }) => {
  return <div style={{ width: 8, height: 8, borderRadius: '50%', background: NODE_COLORS[type] || '#ccc' }} />;
};

export default function RepoGraph() {
  const { jobId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [analysis, setAnalysis] = useState(null);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState(null);
  const [activeNode, setActiveNode] = useState(null);

  const containerRef = useRef(null);
  const dashboardRef = useRef(null);
  const fgRef = useRef();

  // --- Fetch Data ---

  useEffect(() => {
    if (!jobId) {
      setError("No job ID provided. Please start a scan first.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const authToken = token || localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${authToken}` };

        const dataRes = await fetch(`${API_BASE}/scanner/graph-data/${jobId}`, { headers });
        const data = await dataRes.json();
        setGraphData(data);

        // 2. Fetch Initial Analysis
        const analysisRes = await fetch(`${API_BASE}/scanner/graph-analysis/${jobId}`, { headers });
        const analysisData = await analysisRes.json();
        setAnalysis(analysisData);

        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Failed to connect to graph engine.");
        setLoading(false);
      }
    };

    fetchData();
  }, [jobId, token]);

  // Handle Entrance Animations after loading
  useEffect(() => {
    if (!loading) {
      const g = setTimeout(() => {
        gsap.from(".animate-card", {
          y: 20,
          opacity: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out"
        });
      }, 100);
      return () => clearTimeout(g);
    }
  }, [loading]);

  const handleAsk = async (e) => {
    if (e) e.preventDefault();
    if (!question || asking) return;

    setAsking(true);
    try {
      const authToken = token || localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/scanner/graph-analysis/${jobId}?question=${encodeURIComponent(question)}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      setAnalysis(data);
    } catch (err) {
      console.error(err);
    } finally {
      setAsking(false);
    }
  };

  // --- Render Helpers ---

  if (loading) return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-[80vh] text-slate-400">
        <RefreshCw className="w-12 h-12 mb-4 animate-spin text-indigo-500" />
        <h2 className="text-xl font-bold text-slate-200">Initializing Knowledge Graph...</h2>
        <p className="mt-2 text-sm opacity-60">Architecting repository nodes and security vectors</p>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div ref={dashboardRef} className="p-8 text-slate-200 font-inter min-h-screen bg-[#0a0b14]">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div onClick={() => navigate(-1)} className="p-2 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </div>
              <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                {location.state?.repoName || "Architecture Security Graph"}
              </h1>
              <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                AI Powered
              </span>
            </div>
            <p className="text-slate-400 text-sm">Semantic analysis of API dependencies and security relationships</p>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 rounded-xl transition-all border border-slate-700/50 text-xs font-semibold">
              <Download className="w-3.5 h-3.5" /> Export Graph
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-lg shadow-indigo-500/20 text-xs font-bold">
              <Share2 className="w-3.5 h-3.5" /> Share Findings
            </button>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-6">

          {/* Left Column: Visualization */}
          <div className="col-span-8 space-y-6">

            {/* Graph Visualizer Card */}
            <div className="animate-card bg-slate-900/40 border border-slate-800/50 rounded-2xl relative overflow-hidden h-[500px] backdrop-blur-xl group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-50" />

              {/* Toolbar */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md border border-white/5 rounded-full text-[11px] font-medium text-slate-400">
                  <NodeIndicator type="API" /> API
                  <NodeIndicator type="File" /> File
                  <NodeIndicator type="Function" /> Function
                  <NodeIndicator type="Vulnerability" severity="CRITICAL" /> Risk
                </div>
              </div>

              <div className="absolute top-4 right-4 z-10 flex gap-2">
                <button className="p-2 bg-black/40 backdrop-blur-md border border-white/5 rounded-lg hover:bg-slate-800 transition-colors">
                  <Maximize2 className="w-4 h-4 text-slate-400" />
                </button>
                <button className="p-2 bg-black/40 backdrop-blur-md border border-white/5 rounded-lg hover:bg-slate-800 transition-colors">
                  <RefreshCw className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Interactive Graph Integration */}
              <div className="absolute inset-0">
                {graphData.nodes.length > 0 ? (
                  <ForceGraph2D
                    ref={fgRef}
                    graphData={graphData}
                    nodeLabel="name"
                    nodeAutoColorBy="label"
                    nodeRelSize={6}
                    linkColor={() => 'rgba(255, 255, 255, 0.15)'}
                    linkWidth={1.5}
                    backgroundColor="transparent"
                    width={800}
                    height={500}
                    onNodeClick={(node) => setActiveNode(node)}
                    cooldownTicks={100}
                    nodeCanvasObject={(node, ctx, globalScale) => {
                      const label = node.name;
                      const fontSize = 12/globalScale;
                      ctx.font = `${fontSize}px Inter`;
                      const textWidth = ctx.measureText(label).width;
                      
                      const color = NODE_COLORS[node.label] || '#fff';

                      // Draw circle
                      ctx.fillStyle = color;
                      ctx.beginPath(); 
                      ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI, false); 
                      ctx.fill();

                      // Glow effect for vulnerabilities
                      if (node.label === 'Vulnerability') {
                        ctx.shadowColor = '#ef4444';
                        ctx.shadowBlur = 15;
                        ctx.stroke();
                        ctx.shadowBlur = 0;
                      }

                      // Label
                      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                      ctx.textAlign = 'center';
                      ctx.textBaseline = 'middle';
                      ctx.fillText(label, node.x, node.y + 12);
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="p-8 rounded-full bg-indigo-500/5 border border-indigo-500/10 animate-pulse">
                      <Radio className="w-16 h-16 text-indigo-500/40" />
                    </div>
                    <p className="mt-4 font-bold text-slate-500 italic">No graph data discovered for this job.</p>
                  </div>
                )}
              </div>

              {/* HUD / Signals */}
              <div className="absolute top-20 right-6 flex flex-col gap-4 pointer-events-none z-10">
                <div className="p-4 bg-black/60 backdrop-blur-xl border border-white/5 rounded-2xl pointer-events-auto shadow-2xl">
                  <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Total Signals</div>
                  <div className="text-xl font-black">{graphData.links.length}</div>
                </div>
                <div className="p-4 bg-black/60 backdrop-blur-xl border border-white/5 rounded-2xl pointer-events-auto shadow-2xl">
                  <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Risk Level</div>
                  <div className="text-xl font-black text-rose-500">{analysis?.risk_summary?.overall_risk || "MED"}</div>
                </div>
              </div>

              {/* Floating Chatbot - Bottom Center */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xl px-6 z-20 pointer-events-none">
                <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 p-2 rounded-2xl shadow-2xl pointer-events-auto">
                  <form onSubmit={handleAsk} className="relative flex items-center gap-2">
                    <div className="p-2 bg-indigo-500/10 rounded-xl shrink-0">
                      <Brain className="w-5 h-5 text-indigo-400" />
                    </div>
                    <input
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="Ask AI about this architecture..."
                      className="flex-1 bg-transparent border-none py-2 text-xs focus:ring-0 outline-none text-slate-200 placeholder:text-slate-500"
                    />
                    <button
                      disabled={asking}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 disabled:opacity-50"
                    >
                      {asking ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                      {asking ? "Thinking..." : "Analyze"}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Analysis Tabs / Summary */}
            <div className="grid grid-cols-2 gap-6">
              <div className="animate-card bg-slate-900/40 border border-slate-800/50 p-6 rounded-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" /> 🧟 Zombie Points
                  </h3>
                  <span className="text-lg font-black text-slate-400">{analysis?.risk_summary?.zombie_count || 0}</span>
                </div>
                <div className="space-y-3">
                  {(analysis?.analysis?.zombie_apis || []).slice(0, 3).map((ep, i) => (
                    <div key={i} className="flex items-center justify-between group">
                      <span className="text-xs font-medium text-slate-400 truncate w-40 font-mono italic">{ep.endpoint || ep}</span>
                      <ChevronRight className="w-3 h-3 text-slate-700 group-hover:text-amber-400 transition-colors" />
                    </div>
                  ))}
                  {(!analysis?.analysis?.zombie_apis?.length) && <div className="text-xs text-slate-600">No orphaned endpoints.</div>}
                </div>
              </div>

              <div className="animate-card bg-slate-900/40 border border-slate-800/50 p-6 rounded-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500" /> 🔥 Critical Paths
                  </h3>
                  <span className="text-lg font-black text-slate-400">{analysis?.risk_summary?.high_risk_count || 0}</span>
                </div>
                <div className="space-y-3">
                  {(analysis?.analysis?.high_risk_apis || []).slice(0, 3).map((ep, i) => (
                    <div key={i} className="flex items-center justify-between group">
                      <span className="text-xs font-medium text-slate-400 truncate w-40 font-mono italic">{ep.endpoint || ep}</span>
                      <div className="px-1.5 py-0.5 rounded bg-rose-500/10 text-[9px] font-bold text-rose-500 uppercase">HIGH</div>
                    </div>
                  ))}
                  {(!analysis?.analysis?.high_risk_apis?.length) && <div className="text-xs text-slate-600">No critical paths detected.</div>}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Node Inventory */}
          <div className="col-span-4 space-y-6">
            <div className="animate-card bg-slate-900/60 border border-slate-800/50 h-[700px] flex flex-col rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
              <div className="p-6 border-b border-slate-800/50 bg-slate-900/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/20">
                      <Share2 className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">Node Inventory</h3>
                      <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">{graphData.nodes.length} Components</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {Object.entries(NODE_COLORS).map(([type, color]) => (
                      <div key={type} className="w-2 h-2 rounded-full" style={{ background: color }} title={type} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {/* AI Explanation Summary */}
                {analysis?.explanation && (
                  <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl mb-6">
                    <div className="flex items-center gap-2 mb-2">
                       <Brain className="w-3.5 h-3.5 text-indigo-400" />
                       <span className="text-[10px] font-bold text-indigo-400 uppercase">AI Summary</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-400">{analysis.explanation}</p>
                  </div>
                )}

                {/* Grouped Nodes */}
                {['API', 'Vulnerability', 'Function', 'File'].map(type => {
                  const nodes = graphData.nodes.filter(n => n.label === type);
                  if (nodes.length === 0) return null;
                  return (
                    <div key={type} className="space-y-3">
                      <div className="flex items-center gap-2 sticky top-0 bg-[#0d0e1a] py-1 z-10">
                        <NodeIndicator type={type} />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{type}s ({nodes.length})</span>
                      </div>
                      <div className="grid gap-2">
                        {nodes.slice(0, 50).map((node, i) => (
                          <div 
                            key={i} 
                            onClick={() => {
                              setActiveNode(node);
                              if (fgRef.current) {
                                fgRef.current.centerAt(node.x, node.y, 1000);
                                fgRef.current.zoom(2, 1000);
                              }
                            }}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group
                              ${activeNode?.id === node.id ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-slate-800/30 border-slate-700/30 hover:bg-slate-800/50'}`}
                          >
                            <div className="flex flex-col min-w-0">
                               <span className="text-xs font-semibold text-slate-200 truncate">{node.name}</span>
                               <span className="text-[10px] text-slate-500 font-mono truncate">{node.path || node.label}</span>
                            </div>
                            {node.severity && (
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase
                                ${node.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-500' : 'bg-amber-500/20 text-amber-500'}`}>
                                {node.severity}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* CSS for custom scrollbar */}
        <style>{`
          .custom-scrollbar::-webkit-scrollbar {{ width: 5px; }}
          .custom-scrollbar::-webkit-scrollbar-track {{ background: transparent; }}
          .custom-scrollbar::-webkit-scrollbar-thumb {{ background: #1e293b; border-radius: 10px; }}
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {{ background: #334155; }}
        `}</style>
      </div>
    </DashboardLayout>
  );
}
