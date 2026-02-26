'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import AnimatedCounter from './AnimatedCounter';

const features = [
    'International Standard Courts',
    '24/7 Power Backup',
    'Secure Parking',
    'Premium Locker Rooms'
];

export default function WhyUsSection() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <section className="px-6 md:px-12 lg:px-24 py-10 md:py-20 max-w-[1440px] mx-auto overflow-hidden">
            <h2 className="text-sm font-bold uppercase tracking-widest mb-8 text-gray-400 md:text-center md:mb-14">Why Arena360?</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-8 mb-10 md:mb-16">
                {features.map((item, i) => {
                    // Mobile: Even = Left (-100), Odd = Right (100)
                    // Desktop: Always 0 (no slide)
                    const initialX = isMobile ? (i % 2 === 0 ? -100 : 100) : 0;

                    return (
                        <motion.div
                            key={`${i}-${isMobile ? 'mobile' : 'desktop'}`}
                            initial={{ opacity: 0, x: initialX }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.1 }}
                            className="flex items-center gap-4 p-6 rounded-3xl bg-[#1A1A1A] border border-white/5 hover:border-accent/20 transition-colors group"
                        >
                            <div className="h-2 w-2 rounded-full bg-primary group-hover:scale-150 transition-transform duration-300 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                            <span className="font-medium text-base text-gray-200">{item}</span>
                        </motion.div>
                    );
                })}
            </div>

            {/* Animated Counters Section */}
            <div className="flex flex-col md:flex-row justify-center items-center gap-12 md:gap-32 w-full">
                <AnimatedCounter
                    end={20}
                    suffix="K+"
                    label="Players Entertained"
                    duration={1.5}
                />

                {/* Vertical Divider for Desktop */}
                <div className="hidden md:block w-px h-24 bg-gradient-to-b from-transparent via-gray-700 to-transparent" />

                <AnimatedCounter
                    end={12}
                    label="Professional Courts"
                    duration={1.5}
                />
            </div>
        </section>
    );
}
