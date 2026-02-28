import Link from 'next/link';
import { CalendarDays, Clock, Shield, Zap, ArrowRight } from 'lucide-react';

const highlights = [
    { icon: Zap, label: 'Instant Slot Booking' },
    { icon: Clock, label: 'Prime Time Availability' },
    { icon: Shield, label: 'Professional Indoor Courts' },
    { icon: CalendarDays, label: 'Secure & Simple Reservations' },
];

export default function SportsHighlight() {
    return (
        <section className="relative w-full overflow-hidden -mt-12 lg:mt-24 z-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[400px] md:min-h-[500px] lg:min-h-[700px]">

                {/* ── Left Column: Image ── */}
                <div className="relative w-full h-auto aspect-auto lg:h-full lg:aspect-auto overflow-hidden group shadow-glow ring-1 ring-primary/20 z-10">
                    <img
                        src="/sports-highlight.png"
                        alt="5 Sports Under One Roof — Cricket, Futsal, Padel, Badminton & Volleyball at Arena360"
                        className="w-full h-auto md:max-h-[450px] lg:max-h-none lg:h-full object-cover object-[center_30%] transition-transform duration-[8000ms] ease-out group-hover:scale-105"
                        loading="lazy"
                    />
                    {/* Consistent overlay for text contrast if needed */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                </div>

                {/* ── Right Column: Content ── */}
                <div className="relative flex flex-col justify-center px-6 py-12 md:px-12 lg:px-16 md:py-16 z-0">
                    {/* Decorative background vibe (using primary token) */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-3xl rounded-full pointer-events-none" />

                    <div className="max-w-xl mx-auto lg:mx-0 relative z-10 space-y-8 text-center lg:text-left items-center lg:items-start flex flex-col">
                        {/* Badge */}
                        <div className="animate-fade-up">
                            <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold uppercase tracking-[0.2em] text-primary shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                Premium Facility
                            </span>
                        </div>

                        {/* Headline */}
                        <h2
                            className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-text-primary leading-[1.1] tracking-tight animate-fade-up [animation-delay:100ms]"
                        >
                            <span className="text-text-secondary block text-xl sm:text-2xl mb-2 font-medium tracking-normal">Experience the Best</span>
                            Multiple Sports.
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-500 to-emerald-700">
                                One Arena.
                            </span>
                        </h2>

                        {/* Subheading */}
                        <p
                            className="text-text-secondary text-base sm:text-lg leading-relaxed max-w-md mx-auto lg:mx-0 animate-fade-up [animation-delay:200ms]"
                        >
                            Book <strong>futsal</strong>, <strong>indoor cricket</strong>, <strong>padel</strong>, <strong>badminton</strong>, and <strong>volleyball</strong> — all under one roof. Professional courts, seamless booking, and a premium environment for athletes.
                        </p>

                        {/* Highlights Grid */}
                        <div
                            className="grid grid-cols-2 gap-x-6 gap-y-5 text-left w-full animate-fade-up [animation-delay:300ms]"
                        >
                            {highlights.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <div
                                        key={item.label}
                                        className="flex items-center gap-3 group"
                                    >
                                        <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0 border border-primary/20 text-primary group-hover:bg-primary/15 transition-colors duration-200">
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <span className="text-text-secondary text-sm font-medium leading-snug">
                                            {item.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* CTA */}
                        <div className="animate-fade-up [animation-delay:400ms]">
                            <Link
                                href="/book"
                                className="inline-flex items-center justify-center gap-2 bg-surface hover:bg-surface-elevated text-text-primary border border-border hover:border-text-secondary font-bold px-8 py-4 rounded-full text-sm uppercase tracking-widest transition-all duration-300"
                            >
                                View Sports
                            </Link>
                        </div>

                        {/* Stats */}
                        <div
                            className="hidden lg:flex flex-row gap-4 animate-fade-up [animation-delay:500ms]"
                        >
                            {[
                                { number: '5', label: 'Sports' },
                                { number: '24/7', label: 'Booking' },
                                { number: '5★', label: 'Rated' },
                            ].map((stat) => (
                                <div
                                    key={stat.label}
                                    className="flex flex-col items-center py-3 px-8 rounded-2xl bg-white/5 border border-border hover:border-primary min-w-[110px] transition-all duration-300 hover:-translate-y-1"
                                >
                                    <span className="text-2xl font-heading font-bold text-primary">{stat.number}</span>
                                    <span className="text-xs text-text-secondary uppercase tracking-wider font-semibold">{stat.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
