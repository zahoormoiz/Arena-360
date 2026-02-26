import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

interface SportCardProps {
    name: string;
    image: string;
    price: number; // base price (weekday)
    weekendPrice?: number; // optional weekend price
}

export default function SportCard({ name, image, price, weekendPrice }: SportCardProps) {
    return (
        <Link
            href={`/book/slot?sport=${encodeURIComponent(name)}`}
            className="group relative block w-full h-full rounded-3xl overflow-hidden bg-neutral-900 
                 border border-white/10 hover:border-primary/30
                 shadow-[0_0_20px_rgba(0,0,0,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.15)]
                 focus:outline-none focus:ring-4 focus:ring-primary/20 
                 transition-all duration-500
                 aspect-[3/4]"
        >
            {/* Background Image with Zoom Effect */}
            <div className="absolute inset-0 overflow-hidden">
                <Image
                    src={image}
                    alt={name}
                    fill
                    className="object-cover transition-transform duration-700 ease-in-out"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority={false}
                />
                {/* Refined Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-90 transition-opacity duration-300" />


            </div>

            {/* Content Container */}
            <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end">

                {/* Title & Price Section */}
                <div className="mb-6">
                    <h3 className="font-bold text-white text-3xl md:text-4xl tracking-tight leading-none mb-3">
                        {name}
                    </h3>

                    <div className="flex flex-col gap-1">
                        {/* Weekday Price */}
                        <div className="flex items-center justify-between text-gray-300 text-sm">
                            <span className="uppercase tracking-wider text-xs font-bold text-gray-500">Weekday</span>
                            <span className="text-white font-mono font-bold">Rs {price}/hr</span>
                        </div>

                        {/* Weekend Price (if exists and different) */}
                        {weekendPrice && weekendPrice !== price && (
                            <div className="flex items-center justify-between text-primary text-sm">
                                <span className="uppercase tracking-wider text-xs font-bold opacity-80">Weekend</span>
                                <span className="font-mono font-bold">Rs {weekendPrice}/hr</span>
                            </div>
                        )}

                        {!weekendPrice && (
                            <div className="flex items-center gap-2 text-gray-300 mt-1">
                                <span className="text-primary font-bold text-lg">Rs {price}/hr</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Proper Professional CTA */}
                <div className="w-full">
                    <div className="w-full py-4 px-6 rounded-xl bg-white text-black font-bold text-sm tracking-widest uppercase flex items-center justify-between transition-colors duration-300">
                        <span>Book Slot</span>
                        <ArrowRight className="w-5 h-5 transition-transform duration-300" />
                    </div>
                </div>

            </div>
        </Link>
    );
}
