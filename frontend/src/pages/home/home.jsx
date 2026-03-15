import { useEffect } from 'react';
import Lenis from '@studio-freight/lenis';
import Navbar from '../../components/landing/Navbar';
import Hero from '../../components/landing/Hero';
import Features from '../../components/landing/Features';
import ScannerPreview from '../../components/landing/ScannerPreview';
import Integrations from '../../components/landing/Integrations';
import CTASection from '../../components/landing/CTASection';
import Footer from '../../components/landing/Footer';

const Home = () => {
    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: 'vertical',
            gestureDirection: 'vertical',
            smooth: true,
            mouseMultiplier: 1,
            smoothTouch: false,
            touchMultiplier: 2,
            infinite: false,
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        return () => lenis.destroy();
    }, []);

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans overflow-x-hidden relative">
            <div className="fixed inset-0 z-[-1] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none"></div>

            <Navbar />
            <main>
                <Hero />
                <Features />
                <ScannerPreview />
                <Integrations />
                <CTASection />
            </main>
            <Footer />
        </div>
    );
};

export default Home;