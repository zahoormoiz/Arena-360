'use client';

import Image from 'next/image';
import Link from 'next/link';

const galleryImages = [
    { id: 1, src: '/gmaps-1.jpg', alt: 'Arena 360 Complex' },
    { id: 2, src: '/gmaps-2.jpg', alt: 'Padel Courts' },
    { id: 3, src: '/gmaps-3.jpg', alt: 'Night Ambience' },
    { id: 4, src: '/gmaps-4.jpg', alt: 'Action Moments' },
    { id: 5, src: '/gmaps-5.jpg', alt: 'Crowd & Vibes' },
];

export default function Gallery() {
    return (
        <section className="py-12 md:py-24 relative z-20 overflow-hidden">
            <div className="px-6 md:px-12 lg:px-24 mb-6 md:mb-14 max-w-[1440px] mx-auto">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Community Photos</h2>
                    <Link
                        href="https://www.google.com/maps/place/Arena+360/@31.4574832,74.2610114,17z/data=!3m1!4b1!4m6!3m5!1s0x391901b5575bf4f9:0xc287c04f93a879dc!8m2!3d31.4574832!4d74.2610114!16s%2Fg%2F11rcjnm89t"
                        target="_blank"
                        className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1"
                    >
                        View on Google Maps
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </Link>
                </div>
            </div>

            {/* Horizontal Scrollable Carousel */}
            <div className="relative w-full md:max-w-7xl md:mx-auto">
                <div className="flex gap-4 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide -mr-6 pr-6 md:mr-0 md:pr-0 pl-6 md:pl-0 md:grid md:grid-cols-3 lg:grid-cols-5 md:pb-0 md:gap-4 md:overflow-visible">
                    {galleryImages.map((img) => (
                        <div
                            key={img.id}
                            className="snap-center shrink-0 w-[85vw] md:w-full aspect-square relative rounded-2xl overflow-hidden shadow-lg border border-white/5 group bg-gray-900"
                        >
                            <Image
                                src={img.src}
                                alt={img.alt}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                sizes="(max-width: 768px) 85vw, (max-width: 1024px) 33vw, 20vw"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                                <Link href="https://www.google.com/maps/place/Arena+360/@31.4574832,74.2610114,17z/data=!3m1!4b1!4m6!3m5!1s0x391901b5575bf4f9:0xc287c04f93a879dc!8m2!3d31.4574832!4d74.2610114!16s%2Fg%2F11rcjnm89t" target="_blank">
                                    <span className="text-white/90 text-sm font-medium flex items-center gap-2 hover:text-primary transition-colors cursor-pointer">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
                                        View on Maps
                                    </span>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
