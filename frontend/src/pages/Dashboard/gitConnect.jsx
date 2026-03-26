import React, { useState, useEffect } from 'react';
import { Github, GitBranch, Lock, ExternalLink, RefreshCw, Play, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { useNavigate } from 'react-router-dom';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "../../components/ui/select";

const GitConnect = () => {
    const { user, token, fetchProfile } = useAuth();
    const navigate = useNavigate();
    const [repos, setRepos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchingRepos, setFetchingRepos] = useState(false);
    const [selectedRepo, setSelectedRepo] = useState('');
    const [error, setError] = useState('');

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

        if (user?.github_token || user?.has_github_connected) {
            fetchRepos();
        }
    }, [user, fetchProfile]);

    const fetchRepos = async () => {
        setFetchingRepos(true);
        setError('');
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/github/repos`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setRepos(data);
            } else {
                const errData = await response.json();
                setError(errData.detail || 'Failed to fetch repositories');
            }
        } catch (err) {
            setError('Network error while fetching repositories');
        } finally {
            setFetchingRepos(false);
        }
    };

    const handleConnectGitHub = () => {
        const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
        console.log('GitHub Client ID:', clientId);
        console.log('User Profile:', user);

        if (!clientId) {
            alert('GitHub Client ID (VITE_GITHUB_CLIENT_ID) is not configured in your .env file.');
            return;
        }
        if (!user?.email) {
            alert('You must be logged in to connect with GitHub. No user email found.');
            return;
        }

        const params = new URLSearchParams({
            client_id: clientId,
            scope: 'repo,read:user',
            state: btoa(user.email), // Encode email to base64
            redirect_uri: `http://localhost:8000/auth/callback`,
        });
        window.location.href = `https://github.com/login/oauth/authorize?${params}`;
    };

    const handleStartScan = async () => {
        if (!selectedRepo) return;
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/scanner/scan-repo`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ repo_url: selectedRepo })
            });

            if (response.ok) {
                const data = await response.json();
                navigate(`/url-mon?job_id=${data.job_id}`);
            } else {
                const errData = await response.json();
                setError(errData.detail || 'Failed to start scan');
            }
        } catch (err) {
            setError('Network error while starting scan');
        } finally {
            setLoading(false);
        }
    };

    const isConnected = user?.github_token || user?.has_github_connected || repos.length > 0;

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="w-full max-w-xl">
                <div className="bg-card/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

                    <div className="relative z-10 flex flex-col items-center gap-6">
                        <div className="w-16 h-16 bg-card border border-white/10 rounded-2xl flex items-center justify-center shadow-xl">
                            <Github size={32} className="text-white" />
                        </div>

                        <div className="text-center">
                            <h1 className="text-2xl font-bold text-white tracking-tight">
                                {isConnected ? 'GitHub Connected' : 'Connect GitHub'}
                            </h1>
                            <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                                {isConnected 
                                    ? 'Select a repository to start a security analysis.' 
                                    : 'Link your GitHub account to let monSmith scan your repositories for vulnerabilities.'}
                            </p>
                        </div>

                        {error && (
                            <div className="w-full bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3 rounded-xl flex items-center gap-3">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        {!isConnected ? (
                            <>
                                <ul className="w-full text-left space-y-3">
                                    {[
                                        { icon: GitBranch, text: 'Scan public & private repositories' },
                                        { icon: Lock, text: 'Secure OAuth access' },
                                        { icon: ExternalLink, text: 'Real-time vulnerability reports' },
                                    ].map(({ icon: Icon, text }) => (
                                        <li key={text} className="flex items-center gap-3 bg-muted/40 rounded-xl px-4 py-3">
                                            <Icon size={16} className="text-primary shrink-0" />
                                            <span className="text-sm text-slate-300">{text}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={handleConnectGitHub}
                                    className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-bold py-3.5 rounded-xl transition-all hover:bg-gray-100 active:scale-95 shadow-lg mt-2"
                                >
                                    <Github size={20} />
                                    Connect with GitHub
                                </button>
                            </>
                        ) : (
                            <div className="w-full space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-400 ml-1">Select Repository</label>
                                    <Select 
                                        value={selectedRepo} 
                                        onValueChange={setSelectedRepo}
                                        disabled={fetchingRepos || loading}
                                    >
                                        <SelectTrigger className="w-full bg-muted/40 border-white/10 text-white focus:ring-primary/50 h-12 rounded-xl">
                                            <SelectValue placeholder="Choose a repository..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-white/10 text-white">
                                            {repos.map((repo) => (
                                                <SelectItem key={repo.url} value={repo.url} className="focus:bg-primary/20 focus:text-white">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{repo.name.split('/').pop()}</span>
                                                        <span className="text-xs text-slate-500">{repo.name} {repo.private ? '🔒' : ''}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={fetchRepos}
                                        disabled={fetchingRepos || loading}
                                        className="flex-1 flex items-center justify-center gap-2 bg-muted/40 hover:bg-muted/60 text-white font-medium py-3 px-4 rounded-xl transition-all border border-white/5"
                                    >
                                        <RefreshCw size={18} className={fetchingRepos ? 'animate-spin' : ''} />
                                        Refresh
                                    </button>
                                    <button
                                        onClick={handleStartScan}
                                        disabled={!selectedRepo || loading || fetchingRepos}
                                        className="flex-[2] flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-3 px-4 rounded-xl transition-all hover:opacity-90 active:scale-95 shadow-lg disabled:opacity-50 disabled:scale-100"
                                    >
                                        {loading ? <RefreshCw className="animate-spin" size={18} /> : <Play size={18} fill="currentColor" />}
                                        Start Scan
                                    </button>
                                </div>

                                <div className="flex items-center justify-center gap-2 mt-4 text-xs text-slate-500">
                                    <CheckCircle2 size={14} className="text-primary" />
                                    GitHub account linked successfully
                                    <button 
                                        onClick={handleConnectGitHub}
                                        className="ml-2 text-primary hover:underline"
                                    >
                                        Reconnect
                                    </button>
                                </div>
                            </div>
                        )}

                        <p className="text-xs text-slate-500 text-center">
                            By using this feature, you agree to our security scanning{' '}
                            <a href="#" className="underline hover:text-slate-300">
                                terms
                            </a>
                            .
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GitConnect;
