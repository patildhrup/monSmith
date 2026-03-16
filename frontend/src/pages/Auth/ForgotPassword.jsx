import { ArrowLeft, ShieldAlert, Mail, Lock, KeyRound, CheckCircle, Terminal, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/authContext';

// ── Step indicators ────────────────────────────────────────────
const steps = ['Email', 'Verify OTP', 'New Password'];

const StepBar = ({ current }) => (
    <div className="flex items-center justify-center gap-2 mb-8">
        {steps.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
                <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold border transition-all
                    ${i < current ? 'bg-primary border-primary text-black' :
                      i === current ? 'bg-primary/20 border-primary text-primary' :
                      'bg-transparent border-white/10 text-slate-600'}`}>
                    {i < current ? <CheckCircle size={14} /> : i + 1}
                </div>
                <span className={`text-xs font-semibold uppercase tracking-wider hidden sm:block
                    ${i === current ? 'text-primary' : 'text-slate-600'}`}>
                    {label}
                </span>
                {i < steps.length - 1 && (
                    <div className={`w-8 h-px ${i < current ? 'bg-primary' : 'bg-white/10'}`} />
                )}
            </div>
        ))}
    </div>
);

// ── OTP input grid ────────────────────────────────────────────
const OtpGrid = ({ otp, setOtp }) => {
    const refs = useRef([]);

    useEffect(() => { refs.current[0]?.focus(); }, []);

    const handleChange = (val, i) => {
        if (!/^\d*$/.test(val)) return;
        const arr = otp.split('');
        arr[i] = val.slice(-1);
        setOtp(arr.join(''));
        if (val && i < 5) refs.current[i + 1]?.focus();
    };

    const handleKeyDown = (e, i) => {
        if (e.key === 'Backspace' && !otp[i] && i > 0) refs.current[i - 1]?.focus();
    };

    const handlePaste = (e) => {
        const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        setOtp(text.padEnd(6, '').slice(0, 6));
        refs.current[Math.min(text.length, 5)]?.focus();
        e.preventDefault();
    };

    return (
        <div className="flex justify-center gap-3 my-6" onPaste={handlePaste}>
            {Array.from({ length: 6 }).map((_, i) => (
                <input
                    key={i}
                    ref={el => refs.current[i] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={otp[i] || ''}
                    onChange={e => handleChange(e.target.value, i)}
                    onKeyDown={e => handleKeyDown(e, i)}
                    className="w-11 h-14 text-center text-xl font-bold bg-slate-900/50 border border-white/10 rounded-xl
                               text-white focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary
                               transition-all caret-primary"
                />
            ))}
        </div>
    );
};

// ── Main component ────────────────────────────────────────────
const ForgotPassword = () => {
    const [step, setStep] = useState(0);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);

    const passwordRequirements = [
        { label: 'At least 8 characters', test: (p) => p.length >= 8 },
        { label: 'At least one uppercase letter (A–Z)', test: (p) => /[A-Z]/.test(p) },
        { label: 'At least one lowercase letter (a–z)', test: (p) => /[a-z]/.test(p) },
        { label: 'At least one number (0–9)', test: (p) => /\d/.test(p) },
        { label: 'At least one special character (!@#$%^&*)', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
    ];

    const { forgotPassword, resetPassword } = useAuth();
    const navigate = useNavigate();

    // Countdown timer for resend
    useEffect(() => {
        if (resendTimer <= 0) return;
        const id = setTimeout(() => setResendTimer(t => t - 1), 1000);
        return () => clearTimeout(id);
    }, [resendTimer]);

    // ── Step 1: Request OTP ──────────────────────────────────
    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await forgotPassword(email);
            setStep(1);
            setResendTimer(60);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setError('');
        setLoading(true);
        try {
            await forgotPassword(email);
            setOtp('');
            setResendTimer(60);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // ── Step 2: Verify OTP (just advance; actual verify on reset) ──
    const handleVerifyOtp = (e) => {
        e.preventDefault();
        if (otp.length < 6) { setError('Please enter the full 6-digit code'); return; }
        setError('');
        setStep(2);
    };

    // ── Step 3: Reset password ───────────────────────────────
    const handleReset = async (e) => {
        e.preventDefault();
        setError('');
        if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
        setLoading(true);
        try {
            await resetPassword(email, otp, newPassword);
            setStep(3);
        } catch (err) {
            setError(err.message || 'Reset failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center relative p-4 font-sans">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

            <Link to="/login" className="absolute top-8 left-8 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group">
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium">Back to Login</span>
            </Link>

            <div className="w-full max-w-md bg-card/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

                {/* Header */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4 border border-primary/20">
                        {step === 3 ? <CheckCircle size={32} /> : <KeyRound size={32} />}
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">
                        {step === 0 && 'Forgot Password'}
                        {step === 1 && 'Check your email'}
                        {step === 2 && 'Set new password'}
                        {step === 3 && 'Password reset!'}
                    </h1>
                    <p className="text-slate-400 text-sm mt-2 text-center">
                        {step === 0 && "Enter your email and we'll send a verification code"}
                        {step === 1 && `We sent a 6-digit code to ${email}`}
                        {step === 2 && 'Choose a strong new password'}
                        {step === 3 && 'Your password has been updated successfully'}
                    </p>
                </div>

                {/* Step bar — only show on steps 0–2 */}
                {step < 3 && <StepBar current={step} />}

                {/* Error */}
                {error && (
                    <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl flex items-center gap-2">
                        <Terminal size={14} />
                        {error}
                    </div>
                )}

                {/* ── STEP 0: Email ── */}
                {step === 0 && (
                    <form onSubmit={handleSendOtp} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1" htmlFor="fp-email">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    id="fp-email"
                                    type="email"
                                    required
                                    placeholder="admin@company.com"
                                    className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-white placeholder:text-slate-600"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_4px_20px_rgba(0,156,0,0.25)] hover:shadow-[0_8px_30px_rgba(0,156,0,0.4)] disabled:opacity-50"
                        >
                            {loading ? 'Sending code...' : 'Send OTP'}
                        </button>
                    </form>
                )}

                {/* ── STEP 1: OTP ── */}
                {step === 1 && (
                    <form onSubmit={handleVerifyOtp}>
                        <OtpGrid otp={otp} setOtp={setOtp} />
                        <button
                            type="submit"
                            disabled={otp.length < 6}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_4px_20px_rgba(0,156,0,0.25)] hover:shadow-[0_8px_30px_rgba(0,156,0,0.4)] disabled:opacity-50"
                        >
                            Verify Code
                        </button>
                        <div className="flex items-center justify-center mt-5 gap-2 text-sm">
                            {resendTimer > 0 ? (
                                <span className="text-slate-500 flex items-center gap-1">
                                    <RefreshCw size={13} className="animate-spin-slow" />
                                    Resend in <span className="text-primary font-bold">{resendTimer}s</span>
                                </span>
                            ) : (
                                <button type="button" onClick={handleResend} disabled={loading}
                                    className="text-primary hover:underline font-bold transition-colors disabled:opacity-50">
                                    Resend code
                                </button>
                            )}
                        </div>
                    </form>
                )}

                {/* ── STEP 2: New password ── */}
                {step === 2 && (
                    <form onSubmit={handleReset} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1" htmlFor="new-pass">New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    id="new-pass"
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-white placeholder:text-slate-600"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                />
                            </div>
                            
                            {/* Password Requirements Checklist */}
                            <div className="mt-3 p-3 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2">
                                {passwordRequirements.map((req, i) => {
                                    const isMet = req.test(newPassword);
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
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1" htmlFor="conf-pass">Confirm Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    id="conf-pass"
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-white placeholder:text-slate-600"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_4px_20px_rgba(0,156,0,0.25)] hover:shadow-[0_8px_30px_rgba(0,156,0,0.4)] disabled:opacity-50"
                        >
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                )}

                {/* ── STEP 3: Success ── */}
                {step === 3 && (
                    <div className="text-center space-y-6">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto border border-primary/20">
                            <CheckCircle size={32} className="text-primary" />
                        </div>
                        <p className="text-slate-400 text-sm">You can now sign in with your new password.</p>
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_4px_20px_rgba(0,156,0,0.25)] hover:shadow-[0_8px_30px_rgba(0,156,0,0.4)]"
                        >
                            Go to Login
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
