import React, { Component } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/home/home';
import Login from './pages/Auth/login';
import Signup from './pages/Auth/signup';
import NewProject from './pages/Dashboard/newProject';
import UrlMon from './pages/Dashboard/UrlMon';
import Dashboard from './pages/Dashboard/Dashboard';
import ForgotPassword from './pages/Auth/ForgotPassword';
import Settings from './pages/Dashboard/Settings';
import Scans from './pages/Dashboard/Scans';
import Logs from './pages/Dashboard/Logs';
import Reports from './pages/Dashboard/Reports';
import { AuthProvider, useAuth } from './context/authContext';
import { RepoProvider } from './context/repoContext';
import ApiEndpoints from './pages/Dashboard/api-endpoints';
import Analytics from './pages/Dashboard/Analytics';
import Repo from './pages/Dashboard/repo';
import Alerts from './pages/Dashboard/Alerts';
import RepoGraph from './pages/Dashboard/repo-graph';
import CodeEndpoints from './pages/Dashboard/code-endpoints';
import NotFound from './pages/Dashboard/PageNotFound';

// Per-route error boundary — prevents one crashed page from blocking the whole app
class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('[RouteErrorBoundary]', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', background: '#0a0b14', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, color: '#e2e8f0', fontFamily: 'Inter, sans-serif' }}>
          <div style={{ fontSize: 40 }}>⚠️</div>
          <h2 style={{ margin: 0, fontWeight: 800 }}>Page Error</h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>{this.state.error?.message || 'Something went wrong on this page.'}</p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.history.back(); }}
            style={{ marginTop: 8, padding: '10px 24px', borderRadius: 10, background: '#6366f1', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}
          >
            Go Back
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const E = ({ children }) => <RouteErrorBoundary>{children}</RouteErrorBoundary>;


const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-primary font-bold">Loading monSmith...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<E><Home /></E>} />
          <Route path="/login" element={<PublicRoute><E><Login /></E></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><E><Signup /></E></PublicRoute>} />
          <Route path="/forgot-password" element={<E><ForgotPassword /></E>} />
          <Route path="/forget-password" element={<Navigate to="/forgot-password" />} />
          <Route path="/dashboard" element={<ProtectedRoute><E><Dashboard /></E></ProtectedRoute>} />
          <Route path="/newProject" element={<ProtectedRoute><E><NewProject /></E></ProtectedRoute>} />
          <Route path="/url-mon" element={<ProtectedRoute><E><UrlMon /></E></ProtectedRoute>} />
          <Route path="/scans" element={<ProtectedRoute><E><Scans /></E></ProtectedRoute>} />
          <Route path="/logs" element={<ProtectedRoute><E><Logs /></E></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><E><Reports /></E></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><E><Settings /></E></ProtectedRoute>} />
          <Route path="/git-connect" element={<Navigate to="/repo" />} />
          <Route path="/api-endpoints" element={<ProtectedRoute><E><ApiEndpoints /></E></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><E><Analytics /></E></ProtectedRoute>} />
          <Route path="/repo" element={<ProtectedRoute><E><RepoProvider><Repo /></RepoProvider></E></ProtectedRoute>} />
          <Route path="/repo-graph/:jobId?" element={<ProtectedRoute><E><RepoProvider><RepoGraph /></RepoProvider></E></ProtectedRoute>} />
          <Route path="/code-endpoints" element={<ProtectedRoute><E><RepoProvider><CodeEndpoints /></RepoProvider></E></ProtectedRoute>} />
          <Route path="/alerts" element={<ProtectedRoute><E><Alerts /></E></ProtectedRoute>} />
          <Route path="*" element={<E><NotFound /></E>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
