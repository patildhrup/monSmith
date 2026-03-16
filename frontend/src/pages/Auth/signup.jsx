import { ArrowLeft, ShieldAlert, Mail, Lock, User, Terminal } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/authContext';

const Signup = () => {
    const [step, setStep] = useState(1); // 1: Signup, 2: OTP
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { signup, verifyOtp } = useAuth();
    const navigate = useNavigate();

    const passwordRequirements = [
        { label: 'At least 8 characters', test: (p) => p.length >= 8 },
        { label: 'At least one uppercase letter (A–Z)', test: (p) => /[A-Z]/.test(p) },
        { label: 'At least one lowercase letter (a–z)', test: (p) => /[a-z]/.test(p) },
        { label: 'At least one number (0–9)', test: (p) => /\d/.test(p) },
        { label: 'At least one special character (!@#$%^&*)', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
    ];

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await signup(formData.email, formData.password, formData.name);
            setStep(2);
        } catch (err) {
            setError(err.message || 'Signup failed. Please check your details.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await verifyOtp(formData.email, otp);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center relative p-4 font-sans">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>

            <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group">
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium">Back to Home</span>
            </Link>

            <div className="w-full max-w-md bg-card/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
                
                <div className="flex flex-col items-center mb-10">
                    <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4 border border-primary/20 shadow-[0_0_20px_rgba(0,156,0,0.15)]">
                        <ShieldAlert size={32} />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">monSmith</h1>
                    <p className="text-slate-400 text-sm mt-2">{step === 1 ? 'Start securing your infrastructure today' : 'Verify your email to continue'}</p>
                </div>

                {error && (
                    <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-xl flex items-center gap-2">
                        <Terminal size={16} />
                        {error}
                    </div>
                )}

                {step === 1 ? (
                    <form onSubmit={handleSignup} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1" htmlFor="name">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    id="name"
                                    type="text"
                                    required
                                    placeholder="Jane Doe"
                                    className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-white placeholder:text-slate-600"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1" htmlFor="email">Work Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    placeholder="jane@company.com"
                                    className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-white placeholder:text-slate-600"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1" htmlFor="password">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    id="password"
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-white placeholder:text-slate-600"
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                />
                            </div>
                            
                            {/* Password Requirements Checklist */}
                            <div className="mt-3 p-3 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2">
                                {passwordRequirements.map((req, i) => {
                                    const isMet = req.test(formData.password);
                                    return (
                                        <div key={i} className="flex items-center gap-2 transition-all duration-300">
                                            <div className={`w-1.5 h-1.5 rounded-full ${isMet ? 'bg-primary shadow-[0_0_8px_rgba(0,156,0,0.6)]' : 'bg-slate-700'}`} />
                                            <span className={`text-[11px] font-medium leading-none ${isMet ? 'text-primary' : 'text-slate-500'}`}>
                                                {req.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl mt-6 transition-all shadow-[0_4px_20px_rgba(0,156,0,0.25)] hover:shadow-[0_8px_30px_rgba(0,156,0,0.4)] disabled:opacity-50 active:scale-[0.98]"
                        >
                            {loading ? 'Processing...' : 'Create Account'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-6 text-center">
                        <p className="text-slate-400 text-sm">
                            We've sent a 6-digit code to <span className="text-primary font-bold">{formData.email}</span>
                        </p>
                        
                        <div className="space-y-2 text-left">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1" htmlFor="otp">Enter code</label>
                            <input
                                id="otp"
                                type="text"
                                required
                                maxLength={6}
                                placeholder="000000"
                                className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-4 text-center text-3xl font-bold tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-white placeholder:text-slate-700"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl mt-2 transition-all shadow-[0_4px_20px_rgba(0,156,0,0.25)] hover:shadow-[0_8px_30px_rgba(0,156,0,0.4)] disabled:opacity-50"
                        >
                            {loading ? 'Verifying...' : 'Verify & Continue'}
                        </button>

                        <button 
                            type="button"
                            onClick={() => setStep(1)}
                            className="text-slate-500 text-sm font-medium hover:text-white transition-colors"
                        >
                            Use different email
                        </button>
                    </form>
                )}

                <div className="mt-10 text-center text-sm text-slate-500 border-t border-white/5 pt-6">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary hover:underline font-bold transition-all">
                        Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Signup;
