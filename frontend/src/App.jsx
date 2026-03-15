import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/home/home';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import UrlMon from './pages/Dashboard/UrlMon';
import Dashboard from './pages/Dashboard/Dashboard';
import { AuthProvider, useAuth } from './context/authContext';

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
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/url-mon" element={<ProtectedRoute><UrlMon /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
