import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/authContext';

const CTASection = () => {
    const { user } = useAuth();

    return (
        <section className="py-24 px-4 relative overflow-hidden">
            {/* Background gradients */}
            <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/30 blur-[100px] rounded-full pointer-events-none"></div>

            <div className="container mx-auto max-w-4xl relative z-10">
                <div className="bg-card/90 backdrop-blur-md border border-primary/20 rounded-3xl p-8 md:p-16 text-center shadow-[0_0_40px_rgba(0,156,0,0.1)]">
                    <div className="mx-auto bg-primary/10 w-16 h-16 flex items-center justify-center rounded-2xl mb-8">
                        <ShieldCheck className="text-primary w-8 h-8" />
                    </div>

                    <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Ready to secure your cloud?</h2>
                    <p className="text-muted-foreground text-lg md:text-xl mb-10 max-w-2xl mx-auto">
                        Join thousands of developers using monSmith to detect and remediate infrastructure vulnerabilities automatically.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        {user ? (
                            <Link to="/dashboard" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-md font-semibold text-lg flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(0,156,0,0.5)] hover:shadow-[0_0_25px_rgba(0,156,0,0.7)] group">
                                Go to Dashboard
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        ) : (
                            <Link to="/signup" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-md font-semibold text-lg flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(0,156,0,0.5)] hover:shadow-[0_0_25px_rgba(0,156,0,0.7)] group">
                                Start Free Trial
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        )}
                        <button className="bg-background hover:bg-muted border border-border text-foreground px-8 py-4 rounded-md font-semibold text-lg transition-colors">
                            Talk to Sales
                        </button>
                    </div>

                    <p className="mt-8 text-sm text-muted-foreground">
                        14-day free trial. No credit card required.
                    </p>
                </div>
            </div>
        </section>
    );
};

export default CTASection;
