"use client";

import { useBooking } from "@/context/BookingContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { CheckCircle, Home, Calendar, Copy, Check, PartyPopper } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useState } from "react";

function SuccessContent() {
    const { resetBooking } = useBooking();
    const searchParams = useSearchParams();
    const bookingId = searchParams.get("id");
    const [copied, setCopied] = useState(false);

    // Clear context on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            resetBooking();
        }, 5000);

        return () => clearTimeout(timer);
    }, [resetBooking]);

    const copyBookingId = () => {
        if (bookingId) {
            navigator.clipboard.writeText(bookingId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center text-center p-5 sm:p-8 bg-[#1A1A1A] border border-white/5 rounded-2xl sm:rounded-3xl max-w-lg mx-auto relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="relative z-10 w-full">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-green-500/10 flex items-center justify-center mb-5 sm:mb-6 mx-auto animate-fade-up">
                    <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-primary drop-shadow-[0_0_20px_rgba(34,197,94,0.5)]" />
                </div>

                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4 animate-fade-up [animation-delay:100ms]">
                    Booking Submitted! 🎉
                </h1>

                <p className="text-xs sm:text-sm text-gray-400 mb-6 sm:mb-8 animate-fade-up [animation-delay:200ms] leading-relaxed max-w-sm mx-auto">
                    Your booking is being processed. You&apos;ll receive a confirmation once it is approved.
                </p>

                {/* Booking ID with Copy */}
                <div className="bg-black/30 w-full p-3 sm:p-4 rounded-xl mb-6 sm:mb-8 border border-white/5 animate-fade-up [animation-delay:300ms]">
                    <p className="text-[9px] sm:text-xs uppercase tracking-widest text-gray-500 mb-1">Booking ID</p>
                    <div className="flex items-center justify-center gap-2">
                        <p className="text-lg sm:text-xl font-mono text-primary font-bold truncate">{bookingId || "PENDING-ID"}</p>
                        {bookingId && (
                            <button
                                onClick={copyBookingId}
                                className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-400 hover:text-primary bg-white/5 hover:bg-white/10 px-2 py-1 rounded-md transition-all shrink-0"
                            >
                                {copied ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
                                {copied ? "Copied" : "Copy"}
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-2.5 sm:gap-3 w-full animate-fade-up [animation-delay:400ms]">
                    <Link href="/book" className="w-full">
                        <Button className="w-full h-11 sm:h-12 bg-white text-black hover:bg-gray-200 font-bold text-sm sm:text-base">
                            <Calendar className="w-4 h-4 mr-2" />
                            Book Another Game
                        </Button>
                    </Link>

                    <Link href="/" className="w-full">
                        <Button variant="ghost" className="w-full h-10 sm:h-11 text-gray-400 hover:text-white text-sm">
                            <Home className="w-4 h-4 mr-2" />
                            Back to Home
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function SuccessPage() {
    return (
        <div className="min-h-screen pt-20 sm:pt-24 pb-12 px-4 sm:px-6 flex items-center justify-center">
            <Suspense fallback={<div className="text-white">Loading...</div>}>
                <SuccessContent />
            </Suspense>
        </div>
    );
}
