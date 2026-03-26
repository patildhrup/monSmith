import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Globe, History, ScrollText, BarChart3, Webhook, Settings, ShieldAlert, Plus, LogOut, Github } from 'lucide-react';
import { useAuth } from '../context/authContext';

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();

    const menuItems = [
        { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
        { name: 'Scan URL', icon: <Globe size={20} />, path: '/url-mon' },
        { name: 'API Endpoints', icon: <Webhook size={20} />, path: '/api-endpoints' },
        { name: 'Scans', icon: <History size={20} />, path: '/scans' },



        { name: 'GitHub', icon: <Github size={20} />, path: '/git-connect' },
        { name: 'Logs', icon: <ScrollText size={20} />, path: '/logs' },
        { name: 'Reports', icon: <BarChart3 size={20} />, path: '/reports' },
        { name: 'Settings', icon: <Settings size={20} />, path: '/settings' },
    ];

    return (
        <aside
            className=" fixed top-0 left-0 h-screen w-64 bg-background border-r border-border py-8 px-6 flex flex-col z-[100] shadow-sm"
        >
            <div className="flex justify-center items-center gap-3 mb-12 px-2">
                <span className="text-xl font-bold tracking-tight text-foreground ">
                    monSmith
                </span>
            </div>

            <div className="mb-8">
                <button
                    onClick={() => navigate('/url-mon')}
                    className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(0,156,0,0.3)] hover:shadow-[0_6px_20px_rgba(0,156,0,0.4)] transition-all active:scale-95 group"
                >
                    <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                    New Scan
                </button>
            </div>

            <nav className="flex-1 min-h-0 space-y-1 overflow-y-auto overflow-x-hidden pt-2">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${isActive
                                ? 'bg-primary text-primary-foreground shadow-[0_4px_12px_rgba(0,156,0,0.2)]'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                        >
                            <span className={`${isActive ? 'scale-110' : 'group-hover:scale-110 transition-transform duration-300'}`}>
                                {item.icon}
                            </span>
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto pt-6 border-t border-border">
                <button
                    onClick={() => {
                        logout();
                        navigate('/login');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-all duration-300 font-medium group"
                >
                    <LogOut size={20} className="group-hover:-translate-x-1 transition-transform duration-300" />
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
