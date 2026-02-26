import Link from 'next/link';
import Image from 'next/image';

export default function LocationContact() {
    return (
        <section className="py-12 md:py-24 relative z-20">
            <div className="px-6 md:px-12 lg:px-24 max-w-[1440px] mx-auto">
                <h2 className="text-sm font-bold uppercase tracking-widest mb-8 text-gray-400 md:text-center md:mb-12">Find Us</h2>

                <div className="grid lg:grid-cols-2 gap-12 lg:items-center">
                    {/* Map Container - Premium Dark Style */}
                    <div className="w-full aspect-square md:aspect-video lg:aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-white/5 relative z-10 bg-card group">
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3403.4253612185344!2d74.2610114!3d31.457483200000002!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x391901b5575bf4f9%3A0xc287c04f93a879dc!2sArena%20360!5e0!3m2!1sen!2s!4v1769207284875!5m2!1sen!2s"
                            width="100%"
                            height="100%"
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Arena 360 Location"
                            className="border-0 filter grayscale-[80%] invert-[90%] contrast-[1.2] opacity-80 group-hover:grayscale-[40%] group-hover:opacity-90 transition-all duration-700 pointer-events-none"
                        />

                        {/* Transparent overlay — locks map so logo stays at exact location */}
                        <div className="absolute inset-0 z-20" />

                        {/* Arena 360 Logo Pin — fixed at the exact location point */}
                        <div className="absolute top-[44%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30 flex flex-col items-center">
                            {/* Pulse ring */}
                            <div className="absolute w-20 h-20 rounded-full bg-primary/15 animate-ping duration-[2500ms]" />
                            {/* Ambient glow */}
                            <div className="absolute w-16 h-16 rounded-full bg-primary/25 blur-lg" />
                            {/* Logo badge */}
                            <div className="relative w-14 h-14 rounded-full bg-black/90 border-2 border-primary shadow-[0_0_24px_rgba(34,197,94,0.45)] flex items-center justify-center overflow-hidden backdrop-blur-sm">
                                <Image
                                    src="/logo-main.png"
                                    alt="Arena 360"
                                    width={40}
                                    height={40}
                                    className="object-contain rounded-full"
                                />
                            </div>
                            {/* Pin needle */}
                            <div className="w-0.5 h-5 bg-gradient-to-b from-primary to-transparent" />
                            {/* Ground shadow */}
                            <div className="w-3 h-1.5 rounded-full bg-black/40 blur-[3px] -mt-0.5" />
                        </div>

                        {/* Open in Google Maps button */}
                        <Link
                            href="https://www.google.com/maps/place/Arena+360/@31.4574832,74.2610114,17z"
                            target="_blank"
                            className="absolute bottom-4 right-4 z-30 bg-black/80 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/10 hover:border-primary/40 hover:bg-black/90 transition-all duration-300 flex items-center gap-2 group/btn"
                        >
                            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            <span className="text-xs font-bold text-white group-hover/btn:text-primary transition-colors">Open in Google Maps</span>
                        </Link>
                    </div>

                    {/* Contact Info */}
                    <div className="flex flex-col justify-center gap-8">
                        <div className="md:text-left space-y-2">
                            <div className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-2">
                                <span className="text-xs font-bold text-primary tracking-widest uppercase">Visit Us</span>
                            </div>
                            <h3 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase">Arena 360</h3>
                            <p className="text-gray-400 text-lg leading-relaxed max-w-md">
                                Ayub Chowk, Johar Town,<br />
                                Lahore, 46000, Pakistan
                            </p>
                        </div>

                        <div className="flex flex-col gap-4">
                            {/* WhatsApp Primary */}
                            <Link href="https://wa.me/923235192477" target="_blank" className="relative group overflow-hidden rounded-2xl bg-[#25D366] p-[1px]">
                                <div className="relative bg-[#25D366] px-8 py-5 flex items-center justify-center gap-4 rounded-2xl group-hover:bg-[#20bd5a] transition-colors shadow-[0_0_20px_rgba(37,211,102,0.3)]">
                                    <svg className="w-8 h-8 text-white shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.248-.57-.397m-5.474 7.613h-.009c-1.97 0-3.903-.531-5.59-1.543l-.401-.24-4.156 1.09 1.109-4.053-.261-.415c-1.097-1.748-1.677-3.77-1.677-5.856 0-6.085 4.937-11.033 10.993-11.033 2.924 0 5.688 1.144 7.768 3.228 2.083 2.088 3.226 4.86 3.226 7.804-.004 6.084-4.943 11.018-11.002 11.018" />
                                    </svg>
                                    <div className="flex flex-col items-start">
                                        <span className="text-xs font-semibold text-white/80 uppercase tracking-wide">Direct Booking</span>
                                        <span className="font-black text-white text-xl">Chat on WhatsApp</span>
                                    </div>
                                </div>
                            </Link>

                            <div className="grid grid-cols-2 gap-4">
                                <Link href="tel:+923235192477" className="w-full">
                                    <div className="h-full px-4 py-4 flex flex-col items-center justify-center gap-2 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-center group">
                                        <svg className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                        <span className="font-semibold text-gray-200 text-sm">Call Us</span>
                                    </div>
                                </Link>

                                <Link href="/book" className="w-full">
                                    <div className="h-full px-4 py-4 flex flex-col items-center justify-center gap-2 rounded-2xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors text-center group">
                                        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                        <span className="font-black text-primary text-sm uppercase">Book Slot</span>
                                    </div>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
