import { Github, GitBranch, Lock, ExternalLink } from 'lucide-react';

const GitConnect = () => {

    const handleConnectGitHub = () => {
        // Placeholder: redirect to GitHub OAuth when backend is ready
        const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
        if (clientId) {
            const params = new URLSearchParams({
                client_id: clientId,
                scope: 'repo,read:user',
                redirect_uri: `${window.location.origin}/git-connect/callback`,
            });
            window.location.href = `https://github.com/login/oauth/authorize?${params}`;
        } else {
            alert('GitHub OAuth is not configured yet. Set VITE_GITHUB_CLIENT_ID in your .env file.');
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                {/* Card */}
                <div className="bg-card/40 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl relative overflow-hidden text-center">
                    {/* Top gradient line */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

                    {/* Background glow */}
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

                    {/* Icon */}
                    <div className="relative z-10 flex flex-col items-center gap-6">
                        <div className="w-20 h-20 bg-card border border-white/10 rounded-2xl flex items-center justify-center shadow-xl">
                            <Github size={40} className="text-white" />
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Connect GitHub</h1>
                            <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                                Link your GitHub account to let monSmith scan your repositories for vulnerabilities.
                            </p>
                        </div>

                        {/* Feature list */}
                        <ul className="w-full text-left space-y-3">
                            {[
                                { icon: GitBranch, text: 'Scan public & private repositories' },
                                { icon: Lock,      text: 'Secure OAuth — we never store your token' },
                                { icon: ExternalLink, text: 'View results directly in your dashboard' },
                            ].map(({ icon: Icon, text }) => (
                                <li key={text} className="flex items-center gap-3 bg-muted/40 rounded-xl px-4 py-3">
                                    <Icon size={16} className="text-primary shrink-0" />
                                    <span className="text-sm text-slate-300">{text}</span>
                                </li>
                            ))}
                        </ul>

                        {/* CTA Button */}
                        <button
                            onClick={handleConnectGitHub}
                            className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-bold py-3.5 rounded-xl transition-all hover:bg-gray-100 active:scale-95 shadow-lg hover:shadow-xl mt-2"
                        >
                            <Github size={20} />
                            Connect with GitHub
                        </button>

                        <p className="text-xs text-slate-500">
                            By connecting, you agree to GitHub's{' '}
                            <a href="https://docs.github.com/en/site-policy/github-terms/github-terms-of-service" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-300">
                                Terms of Service
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
