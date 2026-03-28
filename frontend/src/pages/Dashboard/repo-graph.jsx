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

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000") + "/api/v1";

// --- Components ---

const NodeIndicator = ({ type, severity }) => {
  const colors = {
    API: '#6366f1',
    File: '#94a3b8',
    Function: '#10b981',
    Vulnerability: severity === 'CRITICAL' ? '#ef4444' : '#f59e0b',
    Frontend: '#8b5cf6'
  };
  return <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors[type] || '#ccc' }} />;
};

export default function RepoGraph() {
  const { jobId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [analysis, setAnalysis] = useState(null);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState(null);
  const [activeNode, setActiveNode] = useState(null);

  const containerRef = useRef(null);
  const dashboardRef = useRef(null);

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
                Architecture Security Graph
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

              {/* Placeholder for Graph - In reality we'd use a canvas/svg lib */}
              <div className="flex items-center justify-center h-full relative">
                <div className="absolute inset-0 opacity-20 pointer-events-none" 
                  style={{ backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                
                {graphData.nodes.length > 0 ? (
                  <div className="flex flex-col items-center">
                    <div className="p-8 rounded-full bg-indigo-500/5 border border-indigo-500/10 animate-pulse">
                      <Radio className="w-16 h-16 text-indigo-500/40" />
                    </div>
                    <p className="mt-4 font-bold text-slate-500">
                      Network Visualizer: {graphData.nodes.length} Nodes Discovered
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center mt-6 max-w-lg px-4">
                      {graphData.nodes.slice(0, 15).map((node, i) => (
                        <div 
                          key={i}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold border cursor-pointer hover:scale-110 transition-transform
                            ${node.label === 'API' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 
                              node.label === 'Vulnerability' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                              'bg-slate-800 border-slate-700 text-slate-400'}`}
                          title={node.name || node.path}
                        >
                          {node.name || node.path || node.label}
                        </div>
                      ))}
                      {graphData.nodes.length > 15 && <div className="text-[10px] text-slate-600 pt-1.5">+{graphData.nodes.length - 15} more...</div>}
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-500 italic">No graph data discovered for this job.</div>
                )}
              </div>

              {/* HUD / Node Info */}
              <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between pointer-events-none">
                <div className="p-4 bg-black/60 backdrop-blur-xl border border-white/5 rounded-2xl w-64 pointer-events-auto shadow-2xl">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-indigo-500/20 rounded-lg">
                      <Info className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <span className="text-xs font-bold tracking-tight">Node Inspector</span>
                  </div>
                  <div className="space-y-2">
                    <div className="text-[10px] uppercase text-slate-500 font-bold">Active Selection</div>
                    <div className="text-sm font-semibold truncate text-slate-200">
                      {activeNode?.name || "Select a node..."}
                    </div>
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 w-1/3" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Total Signals</div>
                    <div className="text-xl font-black">{graphData.links.length}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Risk Score</div>
                    <div className="text-xl font-black text-rose-500">{analysis?.risk_summary?.overall_risk || "MED"}</div>
                  </div>
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

          {/* Right Column: AI Insights */}
          <div className="col-span-4 space-y-6">
            
            {/* AI Assistant Card */}
            <div className="animate-card bg-slate-900/60 border border-slate-800/50 h-[700px] flex flex-col rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-slate-800/50 bg-slate-900/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/20">
                    <Brain className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">Graph Security Advisor</h3>
                    <p className="text-[10px] text-indigo-400 font-bold tracking-widest uppercase">Groq AI Enabled</p>
                  </div>
                </div>
              </div>

              {/* Chat / Findings Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                
                {/* AI Explanation */}
                <div className="space-y-4">
                   <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                     <MessageSquare className="w-3 h-3" /> System Analysis
                   </div>
                   <div className="p-5 bg-slate-800/30 rounded-2xl border border-slate-700/30 text-xs leading-relaxed text-slate-300">
                     {analysis?.explanation || "Graph analysis complete. Ask me anything about the repository architecture or security vectors."}
                   </div>
                </div>

                {/* Structured Findings */}
                {analysis?.analysis && (
                  <div className="space-y-6 pt-4 border-t border-slate-800/50">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Architectural Insights</div>
                    
                    {/* Dependencies */}
                    {analysis.analysis.dependencies?.length > 0 && (
                      <div className="group">
                        <div className="text-[11px] font-bold text-indigo-400 mb-3 flex items-center gap-2">
                          <Share2 className="w-3 h-3" /> Interaction Chains
                        </div>
                        <div className="space-y-2">
                           {analysis.analysis.dependencies.map((dep, i) => (
                             <div key={i} className="p-3 bg-slate-800/20 rounded-xl border border-slate-700/20 text-[10px] text-slate-400 font-mono">
                               {dep}
                             </div>
                           ))}
                        </div>
                      </div>
                    )}

                    {/* Vulnerabilities */}
                    {analysis.analysis.vulnerabilities?.length > 0 && (
                      <div>
                        <div className="text-[11px] font-bold text-rose-400 mb-3 flex items-center gap-2">
                          <AlertTriangle className="w-3 h-3" /> Identified Threats
                        </div>
                        <div className="space-y-2">
                           {analysis.analysis.vulnerabilities.map((v, i) => (
                             <div key={i} className="flex items-center gap-3 p-3 bg-rose-500/5 rounded-xl border border-rose-500/10 transition-colors hover:bg-rose-500/10">
                               <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                               <div className="text-[10px] font-bold text-slate-300">{v.issue || v}</div>
                             </div>
                           ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-6 bg-slate-900/60 backdrop-blur-3xl border-t border-slate-800/50">
                <form onSubmit={handleAsk} className="relative">
                  <input 
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask about your API graph..."
                    className="w-100% bg-slate-800/50 border border-slate-700/50 rounded-2xl py-3.5 pl-5 pr-14 text-xs focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-slate-600 font-medium"
                  />
                  <button 
                    disabled={asking}
                    className="absolute right-2.5 top-2 p-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                  >
                    {asking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                </form>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["Zombie APIs", "High Risk Paths", "Data Leaks"].map(q => (
                    <button 
                      key={q}
                      onClick={() => setQuestion(`Identify any ${q.toLowerCase()} in the system.`)}
                      className="px-2.5 py-1 rounded-full bg-slate-800/50 border border-slate-700/50 text-[9px] font-bold text-slate-500 hover:text-slate-300 hover:border-slate-600 transition-all uppercase tracking-wide"
                    >
                      {q}
                    </button>
                  ))}
                </div>
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
