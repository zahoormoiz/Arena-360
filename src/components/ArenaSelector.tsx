"use client";

import { useBooking, Sport, Arena } from "@/context/BookingContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

interface ArenaSelectorProps {
    sport: Sport;
    arenas: { id: string; name: string; type: string; image?: string }[];
}

export default function ArenaSelector({ sport, arenas }: ArenaSelectorProps) {
    const { setSport, setArena } = useBooking();
    const router = useRouter();

    const handleSelect = (arena: any) => {
        // Sync state
        setSport(sport);
        setArena({
            id: arena.id,
            name: arena.name,
            type: arena.type,
            sportId: sport._id,
        });

        // Navigate
        router.push("/book/slot");
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {arenas.map((arena) => (
                <button
                    key={arena.id}
                    onClick={() => handleSelect(arena)}
                    className="group relative flex flex-col md:flex-row w-full bg-[#1A1A1A] border border-white/5 rounded-2xl overflow-hidden hover:border-primary/50 hover:shadow-[0_0_30px_rgba(34,197,94,0.1)] transition-all duration-300 text-left"
                >
                    {/* Image Placeholder or Actual Image */}
                    <div className="relative w-full md:w-1/3 aspect-video md:aspect-auto bg-neutral-900">
                        <div className="absolute inset-0 flex items-center justify-center text-gray-700 font-bold text-4xl opacity-20 uppercase">
                            {sport.name[0]}
                        </div>
                        {/* We can add real images here later if available from MOCK_ARENAS */}
                    </div>

                    <div className="p-6 flex flex-col justify-center w-full md:w-2/3">
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">{arena.name}</h3>
                                <p className="text-sm text-gray-400 font-medium uppercase tracking-wider">{arena.type}</p>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-all">
                                <ArrowRight className="w-4 h-4" />
                            </div>
                        </div>

                        <div className="mt-4 flex items-center gap-2 text-xs text-green-400 bg-green-900/20 px-3 py-1 rounded-full w-fit">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            Available Now
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
}
