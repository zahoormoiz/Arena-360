import Image from 'next/image';

const testimonials = [
    {
        id: 1,
        name: 'Ahmed Khan',
        role: 'Cricket Enthusiast',
        avatar: '/avatar-1.png',
        quote: "The indoor cricket courts are top-notch! Best lighting I've seen in Lahore.",
        rating: 5,
    },
    {
        id: 2,
        name: 'Sarah Ali',
        role: 'Padel Player',
        avatar: '/avatar-2.png',
        quote: "Finally a good Padel court nearby. The facilities are clean and booking is super easy.",
        rating: 5,
    },
    {
        id: 3,
        name: 'Coach Malik',
        role: 'Football Coach',
        avatar: '/avatar-3.png',
        quote: "Great turf for Futsal. My team loves training here every weekend. Highly recommended!",
        rating: 5,
    },
];

export default function Testimonials() {
    return (
        <section className="py-12 md:py-24 relative z-20">
            <div className="px-6 md:px-12 lg:px-24 max-w-[1440px] mx-auto">
                <h2 className="text-sm font-bold uppercase tracking-widest mb-6 text-gray-400 md:text-center md:mb-10">What Players Say</h2>

                {/* Unified Continuous Marquee Scroll */}
                <div className="relative w-full overflow-hidden">
                    {/* Left fade mask */}
                    <div className="absolute left-0 top-0 bottom-0 w-12 md:w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
                    {/* Right fade mask */}
                    <div className="absolute right-0 top-0 bottom-0 w-12 md:w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

                    <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
                        {/* Duplicate testimonials to create seamless loop */}
                        {[...testimonials, ...testimonials].map((t, index) => (
                            <div
                                key={`${t.id}-${index}`}
                                className="shrink-0 w-[280px] md:w-[380px] p-6 md:p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-white/5 shadow-2xl flex flex-col gap-5 mr-4 md:mr-6 hover:border-primary/30 transition-all duration-300"
                            >
                                <div className="flex items-center gap-3 md:gap-4">
                                    <div className="relative w-11 h-11 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-primary/20 p-0.5 shrink-0">
                                        <div className="relative w-full h-full rounded-full overflow-hidden">
                                            <Image
                                                src={t.avatar}
                                                alt={t.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-base md:text-lg tracking-wide">{t.name}</h3>
                                        <p className="text-[10px] md:text-xs text-primary font-semibold uppercase tracking-widest">{t.role}</p>
                                    </div>
                                </div>

                                <div className="flex gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <svg key={i} className={`w-3.5 h-3.5 md:w-4 md:h-4 ${i < t.rating ? 'text-primary drop-shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'text-gray-700'}`} fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                </div>

                                <p className="text-gray-400 text-sm leading-relaxed italic md:text-base border-l-2 border-white/10 pl-4">
                                    &ldquo;{t.quote}&rdquo;
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
