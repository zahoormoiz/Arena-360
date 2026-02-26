"use client";

import { useBooking } from "@/context/BookingContext";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface DurationSelectorProps {
    duration: number;
    setDuration: (d: number) => void;
}

export default function DurationSelector({ duration, setDuration }: DurationSelectorProps) {
    const options = [1, 2, 3];

    return (
        <div className="flex flex-col gap-3 sm:gap-4">
            <h3 className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center justify-center gap-2">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                Select Duration
            </h3>

            <div className="flex justify-center w-full">
                <div className="group flex p-1 sm:p-1.5 bg-black/40 backdrop-blur-md rounded-xl sm:rounded-2xl border border-white/10 w-fit relative shadow-inner">
                    {options.map((opt) => (
                        <button
                            key={opt}
                            onClick={() => setDuration(opt)}
                            className={cn(
                                "px-5 sm:px-8 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm font-bold transition-all duration-300 relative overflow-hidden flex items-center gap-1.5 sm:gap-2 active:scale-95",
                                duration === opt
                                    ? "bg-primary text-black shadow-[0_0_20px_rgba(34,197,94,0.3)] scale-105"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <span className="text-base sm:text-lg font-mono">{opt}</span>
                            <span className="text-[10px] sm:text-xs uppercase tracking-wider opacity-80">Hr{opt > 1 ? 's' : ''}</span>
                        </button>
                    ))}
                </div>
            </div>

            <p className="text-[10px] sm:text-xs text-gray-500 text-center flex items-center justify-center gap-2">
                <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-primary/50" />
                Book multiple hours for extended gameplay.
            </p>
        </div>
    );
}
