import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';

export default function Hero() {
    return (
        <div className="relative h-[85vh] w-full overflow-hidden bg-background flex flex-col items-center justify-center">
            {/* Background Image/Video Overlay */}
            <div className="absolute inset-0 z-0 select-none">
                <Image
                    src="/hero-bg-new.jpg"
                    alt="Arena Background"
                    fill
                    priority
                    quality={90}
                    /* MOBILE BACKGROUND POSITION: Change '50% 60%' (x y) below to move image on mobile. Keep md:object-[...] for desktop. */
                    className="object-cover object-center md:object-[50%_60%] origin-[50%_50%] scale-[1.15] md:origin-center md:scale-100 opacity-100"
                    sizes="100vw"
                />
                {/* Cinematic Vignette */}
                {/* Cinematic Vignette & Border Blending */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent z-20" />
                <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-transparent z-20" /> {/* Top fade */}
                <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background z-10" />
                {/* Radial mask for perfect corner blending */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--background)_100%)] z-20 opacity-80" />
            </div>

            {/* MOBILE & TABLET LOGO POSITION: Added md:translate-y-[-240px] to perfectly center on iPad */}
            <div className="relative z-30 flex flex-col items-center justify-center translate-y-[-240px] md:translate-y-[-280px] lg:translate-y-0 pointer-events-none lg:hidden">
                <div className="relative w-[300px] aspect-square flex items-center justify-center">
                    {/* Ambient Glows - Optimized */}
                    <div className="absolute inset-0 rounded-full bg-primary/20 blur-[60px] animate-pulse-slow will-change-[opacity]" />
                    <div className="absolute inset-0 rounded-full bg-accent/10 blur-[50px] animate-pulse-slow [animation-delay:1s] will-change-[opacity]" />

                    <div className="relative z-10 w-full h-full animate-scale-in">
                        <Image
                            src="/logo-main.png"
                            alt="Arena 360 Logo"
                            fill
                            className="object-contain drop-shadow-[0_0_60px_rgba(34,197,94,0.4)]"
                            sizes="(max-width: 1024px) 300px, 1px"
                            priority
                        />
                    </div>
                </div>
            </div>

            {/* Content & Desktop Logo Side-by-Side */}
            <div className="absolute bottom-0 lg:inset-0 left-0 right-0 z-40 flex flex-col lg:flex-row justify-end lg:justify-center md:items-center px-6 pb-24 lg:pb-0 text-foreground max-w-7xl mx-auto w-full lg:gap-12">

                {/* Text Content (Left on Desktop) */}
                <div className="flex flex-col items-center lg:items-start text-center lg:text-left w-full lg:w-1/2">
                    {/* Badge - Balanced for Symmetry */}
                    <div className="mb-6 lg:mb-8 md:translate-y-[-20px] lg:translate-y-0 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md w-fit animate-fade-up [animation-delay:200ms] will-change-transform">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        <span className="text-xs font-bold uppercase tracking-widest text-white shadow-black drop-shadow-md">Open 24/7</span>
                    </div>

                    {/* Headline */}
                    <h1 className="text-5xl md:text-6xl md:-mt-4 lg:mt-0 lg:text-8xl font-black uppercase tracking-tighter leading-[0.85] lg:leading-[0.8] text-white drop-shadow-2xl animate-fade-up [animation-delay:400ms] will-change-transform">
                        Level <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary animate-shine bg-[length:200%_auto]">Up</span><br />
                        Your <span className="text-white">Game</span>
                    </h1>

                    {/* Subtext */}
                    <p className="mt-6 text-lg md:text-xl lg:text-2xl font-medium text-gray-300 max-w-xs md:max-w-md lg:max-w-xl leading-relaxed animate-fade-up [animation-delay:600ms] will-change-transform">
                        Lahore’s Premium <span className="text-white">Indoor Arena</span> for Cricket, Futsal & Padel.
                    </p>

                    {/* CTAs */}
                    <div className="mt-8 flex flex-col md:flex-row gap-4 w-full md:w-auto md:justify-center lg:justify-start items-center animate-fade-up [animation-delay:800ms] will-change-transform">
                        <Link href="/book" className="w-full md:w-auto group">
                            <Button className="w-full md:w-56 h-16 text-xl font-bold bg-primary text-black hover:bg-primary/90 shadow-[0_0_30px_rgba(34,197,94,0.3)] hover:shadow-[0_0_50px_rgba(34,197,94,0.5)] transition-all border-none relative overflow-hidden" size="lg">
                                <span className="relative z-10">BOOK NOW</span>
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                            </Button>
                        </Link>

                        <Link href="https://wa.me/923235192477" target="_blank" className="w-full md:w-auto group">
                            <Button variant="ghost" className="w-full md:w-auto h-16 text-gray-300 hover:text-white border border-white/10 hover:border-white/30 hover:bg-white/5 backdrop-blur-sm transition-all" size="sm">
                                <svg className="w-5 h-5 mr-2 text-[#25D366] group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.248-.57-.397m-5.474 7.613h-.009c-1.97 0-3.903-.531-5.59-1.543l-.401-.24-4.156 1.09 1.109-4.053-.261-.415c-1.097-1.748-1.677-3.77-1.677-5.856 0-6.085 4.937-11.033 10.993-11.033 2.924 0 5.688 1.144 7.768 3.228 2.083 2.088 3.226 4.86 3.226 7.804-.004 6.084-4.943 11.018-11.002 11.018" /></svg>
                                WhatsApp Availability
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Desktop Logo (Right Side) */}
                <div className="hidden lg:flex w-1/2 justify-start items-center pointer-events-none translate-y-[-40px] pl-10 lg:pl-20">
                    <div className="relative w-[550px] lg:w-[600px] aspect-square flex items-center justify-center">
                        {/* Ambient Glows - Optimized */}
                        <div className="absolute inset-0 rounded-full bg-primary/20 blur-[80px] animate-pulse-slow will-change-[opacity]" />
                        <div className="absolute inset-0 rounded-full bg-accent/10 blur-[60px] animate-pulse-slow [animation-delay:1s] will-change-[opacity]" />

                        <div className="relative z-10 w-full h-full animate-scale-in">
                            <Image
                                src="/logo-main.png"
                                alt="Arena 360 Logo"
                                fill
                                className="object-contain drop-shadow-[0_0_80px_rgba(34,197,94,0.5)]"
                                sizes="(min-width: 769px) 600px, 1px"
                                priority
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
