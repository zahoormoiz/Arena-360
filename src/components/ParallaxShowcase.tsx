'use client';

import { useRef, useState, useEffect, MouseEvent } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring, useInView } from 'framer-motion';
import { Zap, Target, Trophy, ArrowRight } from 'lucide-react';
import Link from 'next/link';

/* ─── 3D Tilt Card ─── */
interface TiltCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    gradient: string;
    glowColor: string;
    delay: number;
}

function TiltCard({ icon, title, description, gradient, glowColor, delay }: TiltCardProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [12, -12]), { stiffness: 200, damping: 20 });
    const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-12, 12]), { stiffness: 200, damping: 20 });

    const handleMouse = (e: MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        x.set((e.clientX - rect.left) / rect.width - 0.5);
        y.set((e.clientY - rect.top) / rect.height - 0.5);
    };

    const handleLeave = () => {
        setIsHovered(false);
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
            style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
            onMouseMove={handleMouse}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleLeave}
            className="relative group cursor-pointer"
        >
            {/* Glow effect behind card */}
            <div
                className="absolute -inset-1 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
                style={{ background: glowColor }}
            />

            <div className="relative h-full rounded-2xl border border-white/[0.08] bg-[#0A0A0A]/80 backdrop-blur-xl overflow-hidden p-8 md:p-10">
                {/* Holographic shine overlay */}
                <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                        background: `linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 55%, transparent 60%)`,
                        backgroundSize: '200% 200%',
                        animation: isHovered ? 'shimmer 2s ease-in-out infinite' : 'none',
                    }}
                />

                {/* Gradient accent top border */}
                <div
                    className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: gradient }}
                />

                {/* Icon */}
                <div
                    className="relative w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border border-white/10 group-hover:border-white/20 transition-colors duration-300"
                    style={{
                        background: `linear-gradient(135deg, rgba(255,255,255,0.05), transparent)`,
                        transform: 'translateZ(40px)',
                    }}
                >
                    <div className="text-primary group-hover:scale-110 transition-transform duration-300">
                        {icon}
                    </div>
                </div>

                {/* Content */}
                <div style={{ transform: 'translateZ(30px)' }}>
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-3 tracking-tight">{title}</h3>
                    <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-6">{description}</p>
                </div>

                {/* CTA */}
                <div style={{ transform: 'translateZ(20px)' }}>
                    <Link
                        href="/book"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-primary group-hover:gap-3 transition-all duration-300"
                    >
                        Book Now
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}

/* ─── Floating Particles (client-only to avoid hydration mismatch) ─── */
function Particles() {
    const [particles, setParticles] = useState<Array<{
        id: number; left: string; size: number; delay: number;
        duration: number; opacity: number; color: string;
    }>>([]);

    useEffect(() => {
        setParticles(
            Array.from({ length: 30 }, (_, i) => ({
                id: i,
                left: `${Math.random() * 100}%`,
                size: Math.random() * 4 + 1,
                delay: Math.random() * 8,
                duration: Math.random() * 6 + 6,
                opacity: Math.random() * 0.4 + 0.1,
                color: i % 3 === 0 ? 'rgba(34,197,94,' : i % 3 === 1 ? 'rgba(6,182,212,' : 'rgba(255,255,255,',
            }))
        );
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="absolute rounded-full"
                    style={{
                        left: p.left,
                        bottom: '-10px',
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        background: `${p.color}${p.opacity})`,
                        boxShadow: `0 0 ${p.size * 3}px ${p.color}${p.opacity * 0.6})`,
                        animation: `float-particle ${p.duration}s ease-in-out ${p.delay}s infinite`,
                    }}
                />
            ))}
        </div>
    );
}

/* ─── Cinematic Text Reveal ─── */
function RevealText({ children, className = '' }: { children: string; className?: string }) {
    const ref = useRef<HTMLHeadingElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });
    const words = children.split(' ');

    return (
        <h2 ref={ref} className={className}>
            {words.map((word, i) => (
                <span key={i} className="inline-block overflow-hidden mr-[0.3em]">
                    <motion.span
                        className="inline-block"
                        initial={{ y: '100%', opacity: 0 }}
                        animate={isInView ? { y: 0, opacity: 1 } : {}}
                        transition={{
                            duration: 0.6,
                            delay: i * 0.08,
                            ease: [0.16, 1, 0.3, 1],
                        }}
                    >
                        {word}
                    </motion.span>
                </span>
            ))}
        </h2>
    );
}

/* ─── Main Component ─── */
const showcaseCards: Omit<TiltCardProps, 'delay'>[] = [
    {
        icon: <Zap className="w-6 h-6" />,
        title: 'Indoor Cricket',
        description: 'Tournament-grade pitch with professional bowling machines and floodlit courts for day & night play.',
        gradient: 'linear-gradient(90deg, #22c55e, #06b6d4)',
        glowColor: 'rgba(34,197,94,0.15)',
    },
    {
        icon: <Target className="w-6 h-6" />,
        title: 'Premier Futsal',
        description: 'FIFA-quality turf with cushioned underlay, anti-glare lighting, and climate-controlled environment.',
        gradient: 'linear-gradient(90deg, #06b6d4, #8b5cf6)',
        glowColor: 'rgba(6,182,212,0.15)',
    },
    {
        icon: <Trophy className="w-6 h-6" />,
        title: 'Padel Tennis',
        description: 'Glass-walled professional courts with panoramic views and premium equipment rental available.',
        gradient: 'linear-gradient(90deg, #8b5cf6, #22c55e)',
        glowColor: 'rgba(139,92,246,0.15)',
    },
];

export default function ParallaxShowcase() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start end', 'end start'],
    });

    // Parallax transforms at different speeds for depth
    const ring1Y = useTransform(scrollYProgress, [0, 1], [100, -100]);
    const ring2Y = useTransform(scrollYProgress, [0, 1], [60, -60]);
    const ring3Y = useTransform(scrollYProgress, [0, 1], [150, -150]);
    const orbScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1.1, 0.9]);

    return (
        <section
            ref={containerRef}
            className="relative py-24 md:py-40 overflow-hidden"
            style={{ perspective: '1200px' }}
        >
            {/* ── Parallax Background Layers ── */}
            <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                {/* Concentric rings */}
                <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[900px] md:h-[900px] rounded-full border border-white/[0.03]"
                    style={{ y: ring1Y }}
                />
                <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] md:w-[650px] md:h-[650px] rounded-full border border-primary/[0.06]"
                    style={{ y: ring2Y }}
                />
                <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] md:w-[400px] md:h-[400px] rounded-full border border-accent/[0.04]"
                    style={{ y: ring3Y }}
                />

                {/* Floating orbs */}
                <motion.div
                    className="absolute top-[20%] left-[10%] w-[300px] h-[300px] md:w-[500px] md:h-[500px] rounded-full bg-primary/[0.04] blur-[100px]"
                    style={{ y: ring1Y, scale: orbScale }}
                />
                <motion.div
                    className="absolute bottom-[10%] right-[5%] w-[250px] h-[250px] md:w-[400px] md:h-[400px] rounded-full bg-accent/[0.03] blur-[80px]"
                    style={{ y: ring2Y, scale: orbScale }}
                />
                <motion.div
                    className="absolute top-[60%] left-[50%] w-[200px] h-[200px] md:w-[300px] md:h-[300px] rounded-full bg-purple-500/[0.03] blur-[80px]"
                    style={{ y: ring3Y }}
                />
            </div>

            {/* Particles */}
            <Particles />

            {/* ── Content ── */}
            <div className="relative z-10 max-w-[1440px] mx-auto px-6 md:px-12 lg:px-24">
                {/* Section Header */}
                <div className="text-center mb-16 md:mb-24">
                    <motion.span
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold uppercase tracking-[0.2em] text-primary shadow-sm mb-6"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        The Arena Experience
                    </motion.span>

                    <RevealText className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-black text-white tracking-tight leading-[1.05]">
                        Where Champions Train
                    </RevealText>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="mt-6 text-gray-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed"
                    >
                        World-class facilities designed for athletes who demand the best. 
                        Feel the energy the moment you step inside.
                    </motion.p>
                </div>

                {/* ── 3D Tilt Cards Grid ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    {showcaseCards.map((card, i) => (
                        <TiltCard key={card.title} {...card} delay={i * 0.15} />
                    ))}
                </div>

                {/* ── Bottom CTA ── */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="mt-16 md:mt-24 flex justify-center"
                >
                    <Link
                        href="/book"
                        className="group relative inline-flex items-center gap-3 px-10 py-5 rounded-full font-bold text-base uppercase tracking-widest text-black bg-primary overflow-hidden shadow-[0_0_40px_rgba(34,197,94,0.3)] hover:shadow-[0_0_60px_rgba(34,197,94,0.5)] transition-shadow duration-500"
                    >
                        <span className="relative z-10">Explore All Sports</span>
                        <ArrowRight className="relative z-10 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                        {/* Hover sweep */}
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
