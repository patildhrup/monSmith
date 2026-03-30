import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Globe, History, ScrollText, BarChart3, Webhook, Settings, ShieldAlert, Plus, LogOut, Github, ClipboardPen, GitBranch, ChevronLeft, ChevronRight, GitGraph, CircleAlert, Code } from 'lucide-react';
import { useAuth } from '../context/authContext';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();

    const menuGroups = [
        {
            title: 'Main',
            items: [
                { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
                { name: 'Scan URL', icon: <Globe size={20} />, path: '/url-mon' },
                { name: 'API Endpoints', icon: <Webhook size={20} />, path: '/api-endpoints' },
                { name: 'Analytics', icon: <BarChart3 size={20} />, path: '/analytics' },
            ]
        },
        {
            title: 'GitHub',
            items: [
                { name: 'Repositories', icon: <GitBranch size={20} />, path: '/repo' },
                { name: 'Repo Graph', icon: <GitGraph size={20} />, path: '/repo-graph' },
                { name: 'Code Endpoints', icon: <Code size={20} />, path: '/code-endpoints' },
            ]
        },
        {
            title: 'System',
            items: [
                { name: 'Reports', icon: <ClipboardPen size={20} />, path: '/reports' },
                { name: 'History', icon: <History size={20} />, path: '/scans' },
                { name: 'Alerts', icon: <CircleAlert size={20} />, path: '/alerts' },
                { name: 'Logs', icon: <ScrollText size={20} />, path: '/logs' },
                { name: 'Settings', icon: <Settings size={20} />, path: '/settings' },
            ]
        }
    ];

    return (
        <aside
            className={`fixed top-0 left-0 h-screen transition-all duration-300 ease-in-out bg-background border-r border-border py-8 flex flex-col z-[100] shadow-sm ${isCollapsed ? 'w-20 px-3' : 'w-64 px-6'}`}
        >
            <div className={`flex items-center gap-3 mb-10 px-2 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                {!isCollapsed && (
                    <span className="text-xl font-bold tracking-tight text-foreground transition-opacity duration-300">
                        monSmith
                    </span>
                )}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                >
                    {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>

            <div className="mb-4">
                <button
                    onClick={() => navigate('/newProject')}
                    className={`bg-primary text-primary-foreground py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(0,156,0,0.3)] hover:shadow-[0_6px_20px_rgba(0,156,0,0.4)] transition-all active:scale-95 group overflow-hidden ${isCollapsed ? 'w-12 h-12' : 'w-full px-4'}`}
                >
                    <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300 shrink-0" />
                    {!isCollapsed && <span className="whitespace-nowrap">New Scan</span>}
                </button>
            </div>

            <nav className="flex-1 min-h-0 space-y-6 overflow-y-auto overflow-x-hidden pt-4 pr-1 scrollbar-thin scrollbar-thumb-muted">
                {menuGroups.map((group) => (
                    <div key={group.title} className="space-y-2">
                        {!isCollapsed && (
                            <h4 className="px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2 whitespace-nowrap overflow-hidden">
                                {group.title}
                            </h4>
                        )}
                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.path}
                                        title={isCollapsed ? item.name : ''}
                                        className={`flex items-center gap-3 rounded-xl transition-all duration-300 group ${isCollapsed ? 'justify-center p-3' : 'px-4 py-2.5'} ${isActive
                                            ? 'bg-primary text-primary-foreground shadow-[0_4px_12px_rgba(0,156,0,0.2)]'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                            }`}
                                    >
                                        <span className={`${isActive ? 'scale-110' : 'group-hover:scale-110 transition-transform duration-300'} shrink-0`}>
                                            {item.icon}
                                        </span>
                                        {!isCollapsed && <span className="font-medium text-sm whitespace-nowrap">{item.name}</span>}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="mt-auto pt-4 border-t border-border">
                <button
                    onClick={() => {
                        logout();
                        navigate('/login');
                    }}
                    title={isCollapsed ? 'Logout' : ''}
                    className={`w-full flex items-center rounded-xl text-red-500 hover:bg-red-500/10 transition-all duration-300 font-medium group ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-2.5'}`}
                >
                    <LogOut size={20} className="group-hover:-translate-x-1 transition-transform duration-300 shrink-0" />
                    {!isCollapsed && <span className="text-sm">Logout</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
