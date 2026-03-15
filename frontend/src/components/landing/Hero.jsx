import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero = () => {
    const containerRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from('.hero-element', {
                y: 30,
                opacity: 0,
                duration: 1,
                stagger: 0.15,
                ease: 'power3.out',
            });
        }, containerRef);
        return () => ctx.revert();
    }, []);

    return (
        <section ref={containerRef} className="relative pt-32 pb-20 md:pt-48 md:pb-32 flex flex-col items-center text-center px-4 min-h-[90vh]">
            <div className="hero-element inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary mb-8 text-sm font-medium">
                <ShieldAlert size={16} />
                <span>Next-Gen Cloud Security Scanner</span>
            </div>

            <h1 className="hero-element text-5xl md:text-7xl font-bold tracking-tighter mb-6 max-w-4xl text-foreground">
                Secure your infrastructure with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-400">monSmith</span>
            </h1>

            <p className="hero-element text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl">
                Advanced threat detection, misconfiguration scanning, and compliance monitoring—all from a single futuristic dashboard. Stay one step ahead of adversaries.
            </p>

            <div className="hero-element flex flex-col sm:flex-row gap-4 w-full justify-center">
                <Link to="/signup" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-md font-semibold text-lg flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(0,156,0,0.5)] hover:shadow-[0_0_25px_rgba(0,156,0,0.7)] group">
                    Start Scanning
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <button className="bg-background hover:bg-muted border border-border text-foreground px-8 py-3 rounded-md font-semibold text-lg transition-colors">
                    View Documentation
                </button>
            </div>
        </section>
    );
};

export default Hero;
