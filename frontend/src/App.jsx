import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/home/home';
import Login from './pages/Auth/login';
import Signup from './pages/Auth/signup';
import UrlMon from './pages/Dashboard/UrlMon';
import Dashboard from './pages/Dashboard/Dashboard';
import ForgotPassword from './pages/Auth/ForgotPassword';
import Settings from './pages/Dashboard/Settings';
import Scans from './pages/Dashboard/Scans';
import Logs from './pages/Dashboard/Logs';
import Reports from './pages/Dashboard/Reports';
import { AuthProvider, useAuth } from './context/authContext';
import GitConnect from './pages/Dashboard/gitConnect';
import ApiEndpoints from './pages/Dashboard/apiEndpoints';
import Analytics from './pages/Dashboard/Analytics';
import Repo from './pages/Dashboard/repo';
import Alerts from './pages/Dashboard/Alerts';
import RepoGraph from './pages/Dashboard/repo-graph';

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
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/forget-password" element={<Navigate to="/forgot-password" />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/url-mon" element={<ProtectedRoute><UrlMon /></ProtectedRoute>} />
          <Route path="/scans" element={<ProtectedRoute><Scans /></ProtectedRoute>} />
          <Route path="/logs" element={<ProtectedRoute><Logs /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/git-connect" element={<ProtectedRoute><GitConnect /></ProtectedRoute>} />
          <Route path="/api-endpoints" element={<ProtectedRoute><ApiEndpoints /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/repo" element={<ProtectedRoute><Repo /></ProtectedRoute>} />
          <Route path="/repo-graph/:jobId?" element={<ProtectedRoute><RepoGraph /></ProtectedRoute>} />
          <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
