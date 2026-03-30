import { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import DashboardLayout from '../../components/DashboardLayout';
import { User, Mail, Shield, Save, X, Edit2, CheckCircle, AlertCircle, Github, Trash2, Unlink } from 'lucide-react';

const Settings = () => {
    const { user, updateProfile, fetchProfile } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [fullName, setFullName] = useState(user?.full_name || '');
    const [loading, setLoading] = useState(false);
    const [disconnectLoading, setDisconnectLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (user) {
            setFullName(user.full_name || '');
        }
    }, [user]);

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            await updateProfile({ full_name: fullName });
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setIsEditing(false);
        } catch (err) {
            setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnectGithub = async () => {
        if (!window.confirm('Are you sure you want to disconnect your GitHub account? This will disable GitHub-related features.')) {
            return;
        }

        setDisconnectLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/github/disconnect`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true'
                }
            });

            if (!response.ok) throw new Error('Failed to disconnect GitHub');

            setMessage({ type: 'success', text: 'GitHub disconnected successfully!' });
            // Refresh profile to update UI
            await fetchProfile();
        } catch (err) {
            setMessage({ type: 'error', text: err.message || 'Failed to disconnect GitHub' });
        } finally {
            setDisconnectLoading(false);
        }
    };

    if (!user) return null;

    return (
        <DashboardLayout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
                    <p className="text-muted-foreground text-lg">Manage your account and profile preferences.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Profile Card */}
                    <div className="lg:col-span-2">
                        <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative">
                            {/* Decorative gradient */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

                            <div className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-6">
                                        <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 relative group">
                                            {user.picture ? (
                                                <img src={user.picture} alt={user.full_name} className="w-full h-full rounded-2xl object-cover" />
                                            ) : (
                                                <User size={40} />
                                            )}
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-foreground">{user.full_name || 'Anonymous User'}</h2>
                                            <p className="text-muted-foreground flex items-center gap-2 mt-1">
                                                <Mail size={14} /> {user.email}
                                            </p>
                                        </div>
                                    </div>
                                    {!isEditing && (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-xl transition-all font-medium border border-white/5 active:scale-95"
                                        >
                                            <Edit2 size={16} /> Edit Profile
                                        </button>
                                    )}
                                </div>

                                {message.text && (
                                    <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 border ${message.type === 'success'
                                            ? 'bg-primary/10 border-primary/20 text-primary'
                                            : 'bg-red-500/10 border-red-500/20 text-red-500'
                                        }`}>
                                        {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                                        <p className="text-sm font-medium">{message.text}</p>
                                    </div>
                                )}

                                <form onSubmit={handleSave} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Full Name</label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                                <input
                                                    type="text"
                                                    disabled={!isEditing}
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-12 py-3.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                    placeholder="Your full name"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Email (Primary)</label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                                <input
                                                    type="email"
                                                    disabled
                                                    value={user.email}
                                                    className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-12 py-3.5 text-foreground opacity-50 cursor-not-allowed"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {isEditing && (
                                        <div className="flex items-center gap-4 pt-4">
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all font-bold shadow-[0_4px_12px_rgba(0,156,0,0.3)] active:scale-95 disabled:opacity-50"
                                            >
                                                <Save size={18} /> {loading ? 'Saving...' : 'Save Changes'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    setFullName(user.full_name || '');
                                                    setMessage({ type: '', text: '' });
                                                }}
                                                className="flex items-center gap-2 px-6 py-3 bg-muted hover:bg-muted/80 text-foreground rounded-xl transition-all font-bold border border-white/5 active:scale-95"
                                            >
                                                <X size={18} /> Cancel
                                            </button>
                                        </div>
                                    )}
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* Meta Info */}
                    <div className="space-y-6">
                        <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
                            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                                <Shield size={18} className="text-blue-500" /> Security Status
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                                    <span className="text-sm font-medium text-muted-foreground">Auth Provider</span>
                                    <span className="text-sm font-bold text-foreground uppercase">{user.auth_provider}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                                    <span className="text-sm font-medium text-muted-foreground">Account Status</span>
                                    <span className="flex items-center gap-1.5 text-sm font-bold text-primary">
                                        <CheckCircle size={14} /> Verified
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                                    <span className="text-sm font-medium text-muted-foreground">Joined monSmith</span>
                                    <span className="text-sm font-bold text-foreground">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Integrations Card */}
                        <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                                <Github size={18} className="text-primary" /> Integrations
                            </h3>
                            <div className="space-y-4">
                                <div className="p-4 bg-muted/30 rounded-2xl border border-white/5">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-black rounded-lg border border-white/10">
                                                <Github size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold">GitHub</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {user.has_github_connected ? 'Connected' : 'Not connected'}
                                                </p>
                                            </div>
                                        </div>
                                        {user.has_github_connected && (
                                            <CheckCircle size={16} className="text-primary" />
                                        )}
                                    </div>

                                    {user.has_github_connected ? (
                                        <button
                                            onClick={handleDisconnectGithub}
                                            disabled={disconnectLoading}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-xl transition-all text-sm font-bold border border-destructive/20 disabled:opacity-50"
                                        >
                                            {disconnectLoading ? (
                                                <div className="w-4 h-4 border-2 border-destructive border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Unlink size={16} />
                                            )}
                                            Disconnect GitHub
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => window.location.href = '/git-connect'}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl transition-all text-sm font-bold border border-primary/20"
                                        >
                                            <Github size={16} /> Connect GitHub
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>


                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Settings;
