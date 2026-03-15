import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Globe, History, FileText, Settings, ShieldAlert, Plus, LogOut } from 'lucide-react';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useAuth } from '../context/authContext';

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();

    const menuItems = [
        { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
        { name: 'Scan URL', icon: <Globe size={20} />, path: '/url-mon' },
        { name: 'Scans', icon: <History size={20} />, path: '/scans' },
        { name: 'Reports', icon: <FileText size={20} />, path: '/reports' },
        { name: 'Settings', icon: <Settings size={20} />, path: '/settings' },
    ];

    return (
        <aside 
            className="fixed top-0 left-0 h-screen w-64 bg-background border-r border-border py-8 px-6 flex flex-col z-[100] shadow-sm"
        >
            <div className="flex items-center gap-3 mb-12 px-2">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-[0_0_15px_rgba(0,156,0,0.3)]">
                    <ShieldAlert size={24} />
                </div>
                <span className="text-xl font-bold tracking-tight text-foreground">monSmith</span>
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

            <nav className="flex-1 space-y-1">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                                isActive 
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

            <div className="mt-auto pt-6 border-t border-border space-y-2">
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
                
                <div className="bg-muted/50 rounded-2xl p-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Support</p>
                    <p className="text-sm text-foreground mb-3 leading-relaxed">Need help with monSmith?</p>
                    <button className="w-full py-2 bg-background border border-border text-xs font-bold rounded-lg hover:bg-muted transition-colors">
                        Contact Support
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
