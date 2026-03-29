import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';

const NotFound = () => {
    const textRef = useRef(null);
    const visualRef = useRef(null);

    useEffect(() => {
        // GSAP Floating Animation for the "404" text
        gsap.to(textRef.current, {
            y: -20,
            duration: 2,
            repeat: -1,
            yoyo: true,
            ease: "power1.inOut"
        });

        // GSAP subtle rotation for the background element
        gsap.to(visualRef.current, {
            rotation: 360,
            duration: 20,
            repeat: -1,
            ease: "none"
        });
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4 overflow-hidden relative">

            {/* Background Decorative Element (GSAP Animated) */}
            <div
                ref={visualRef}
                className="absolute w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -z-10"
            />

            {/* Main 404 Number (GSAP + Framer Motion) */}
            <motion.h1
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                ref={textRef}
                className="text-[12rem] md:text-[18rem] font-black tracking-tighter leading-none select-none text-transparent bg-clip-text bg-gradient-to-b from-blue-400 to-purple-600"
            >
                404
            </motion.h1>

            {/* Text Content (Framer Motion) */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-center z-10"
            >
                <h2 className="text-3xl md:text-5xl font-bold mb-4">
                    Lost in Space?
                </h2>
                <p className="text-slate-400 max-w-md mx-auto mb-8">
                    The page you're looking for has drifted into deep space.
                    Let's get you back to the home base.
                </p>

                {/* Button (Framer Motion Hover) */}
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Link
                        to="/"
                        className="px-8 py-3 bg-white text-black font-semibold rounded-full shadow-lg shadow-white/10 hover:bg-blue-400 hover:text-white transition-colors duration-300"
                    >
                        Go Back Home
                    </Link>
                </motion.div>
            </motion.div>

            {/* Subtle floating particles (Optional Extra) */}
            <motion.div
                animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
                transition={{ duration: 10, repeat: Infinity }}
                className="absolute top-20 left-20 w-2 h-2 bg-white rounded-full opacity-20"
            />
        </div>
    );
};

export default NotFound;