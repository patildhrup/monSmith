import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Search, Globe, ShieldCheck, ArrowRight, Activity, Zap } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';

const UrlMon = () => {
    const containerRef = useRef(null);
    const [url, setUrl] = useState('');

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from('.anim-fade-up', {
                y: 30,
                opacity: 0,
                duration: 0.8,
                stagger: 0.1,
                ease: 'power3.out',
            });

            gsap.to('.glow-pulse', {
                boxShadow: '0 0 20px rgba(0, 156, 0, 0.4)',
                repeat: -1,
                yoyo: true,
                duration: 2,
            });
        }, containerRef);
        return () => ctx.revert();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        console.log('Monitoring URL:', url);
    };

    return (
        <DashboardLayout>
            <div ref={containerRef} className="py-10">
                <div className="z-10 w-full text-center">
                    <div className="anim-fade-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary mb-8 text-sm font-semibold tracking-wide backdrop-blur-md">
                        <Activity size={16} />
                        <span>Real-time URL Pulse Monitor</span>
                    </div>

                    <h1 className="anim-fade-up text-5xl font-bold tracking-tight mb-6 text-foreground">
                        Protect Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-400">Digital Perimeter</span>
                    </h1>

                    <p className="anim-fade-up text-lg text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
                        Instantly analyze any URL for vulnerabilities, misconfigurations, and threats. Our premium scanner provides detailed security insights in seconds.
                    </p>

                    {/* Centered Search Bar */}
                    <form
                        onSubmit={handleSearch}
                        className="anim-fade-up relative max-w-2xl mx-auto mb-16 group"
                    >
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-green-400/50 rounded-[40px] blur opacity-25 group-focus-within:opacity-50 transition duration-1000"></div>
                        <div className="relative flex items-center bg-card/80 backdrop-blur-xl border border-white/10 p-2 rounded-[40px] shadow-2xl overflow-hidden glow-pulse">
                            <div className="pl-6 text-primary/70">
                                <Globe size={24} />
                            </div>
                            <input
                                type="text"
                                placeholder="https://example.com"
                                className="w-full bg-transparent border-none focus:ring-0 text-lg px-4 py-4 text-foreground placeholder-muted-foreground/50 underline-offset-4"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                            />
                            <button
                                type="submit"
                                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-[32px] font-bold text-lg flex items-center gap-2 transition-all group/btn"
                            >
                                Monitor
                                <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </form>

                    {/* Feature Tags */}
                    <div className="anim-fade-up flex flex-wrap justify-center gap-8 text-muted-foreground font-medium">
                        <div className="flex items-center gap-2">
                            <ShieldCheck size={20} className="text-primary" />
                            <span>SSL Validation</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Zap size={20} className="text-primary" />
                            <span>Instant Scan</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Search size={20} className="text-primary" />
                            <span>Deep Analysis</span>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default UrlMon;
