"use client";

import { useBooking } from "@/context/BookingContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Calendar, Clock, Trophy, ArrowRight, Wallet, User, Phone, Mail, ShieldCheck, MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function BookingSummary() {
    const { state, setDetails } = useBooking();
    const { user } = useAuth();
    const router = useRouter();

    // Initialize with user data if available, otherwise context data, otherwise empty
    const [name, setName] = useState(state.details.customerName || user?.name || "");
    const [email, setEmail] = useState(state.details.customerEmail || user?.email || "");
    const [phone, setPhone] = useState(state.details.customerPhone || user?.phone || "");

    // Track if user has manually edited fields to prevent overwriting
    const [isNameDirty, setIsNameDirty] = useState(false);
    const [isEmailDirty, setIsEmailDirty] = useState(false);
    const [isPhoneDirty, setIsPhoneDirty] = useState(false);

    const [isValid, setIsValid] = useState(false);

    useEffect(() => {
        if (!state.selectedSlot) {
            router.push("/book/slot");
        }
    }, [state.selectedSlot, router]);

    // Pre-fill user details when they become available, unless manually muted
    useEffect(() => {
        if (user) {
            if (!isNameDirty) setName(user.name);
            if (!isEmailDirty) setEmail(user.email);
            if (!isPhoneDirty) setPhone(user.phone || '');
        }
    }, [user, isNameDirty, isEmailDirty, isPhoneDirty]);

    useEffect(() => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        setIsValid(name.length > 2 && phone.length > 9 && emailRegex.test(email));
        setDetails({ customerName: name, customerEmail: email, customerPhone: phone });
    }, [name, phone, email, setDetails]);

    // Skeleton Loading State to prevent CLS
    if (!state.selectedSlot && !state.selectedSport) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-12 animate-pulse">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 h-[280px] sm:h-[300px]"></div>
                    <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 h-[180px] sm:h-[200px]"></div>
                </div>
                <div className="space-y-6">
                    <div className="bg-primary/5 border border-primary/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 h-[120px] sm:h-[150px]"></div>
                    <div className="h-14 sm:h-16 bg-white/10 rounded-xl"></div>
                </div>
            </div>
        );
    }

    if (!state.selectedSlot || !state.selectedSport) return null;

    const handleProceed = () => {
        if (isValid) {
            router.push("/book/pay");
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-12">
            {/* Left: Summary Card */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8">
                    <h2 className="text-lg sm:text-xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-2">
                        <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                        Booking Details
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-[10px] sm:text-xs uppercase tracking-wider text-gray-500 font-bold">Sport</p>
                                <p className="text-base sm:text-xl text-white font-bold">{state.selectedSport.name}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-[10px] sm:text-xs uppercase tracking-wider text-gray-500 font-bold">Date</p>
                                <p className="text-base sm:text-xl text-white font-bold">
                                    {state.selectedDate && format(new Date(state.selectedDate), "EEE, MMM d, yyyy")}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                            </div>
                            <div>
                                <p className="text-[10px] sm:text-xs uppercase tracking-wider text-gray-500 font-bold">Time Slot</p>
                                <p className="text-base sm:text-xl text-white font-bold">
                                    {state.selectedSlot.startTime} – {state.selectedSlot.endTime}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 sm:mt-8 pt-5 sm:pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                        <div className="text-gray-400 text-xs sm:text-sm bg-white/5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg">
                            <span className="text-gray-500">Duration:</span> <span className="text-white font-bold">{state.selectedSlot.duration || 1} Hour{state.selectedSlot.duration && state.selectedSlot.duration > 1 ? 's' : ''}</span>
                        </div>
                        <div className="text-center sm:text-right">
                            <p className="text-[10px] sm:text-sm text-gray-400 uppercase tracking-wider font-bold mb-0.5 sm:mb-1">Total Amount</p>
                            <p className="text-2xl sm:text-4xl font-black text-primary font-mono">Rs {state.selectedSlot.price}</p>
                        </div>
                    </div>
                </div>

                {/* Customer Details Form */}
                <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 animate-fade-up [animation-delay:100ms]">
                    <h2 className="text-lg sm:text-xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-2">
                        <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                        Your Details
                    </h2>

                    {!user && (
                        <div className="mb-6 sm:mb-8 bg-white/5 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                            <div className="text-xs sm:text-sm text-gray-400">
                                <span className="font-bold text-white">Already have an account?</span> Login to speed up booking.
                            </div>
                            <Button variant="outline" className="h-8 sm:h-9 px-3 sm:px-4 text-xs font-bold shrink-0" onClick={() => router.push(`/login?redirect=/book/confirm`)}>
                                Login
                            </Button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
                        <div className="space-y-1.5 sm:space-y-2">
                            <label className="text-xs sm:text-sm text-gray-400 font-bold ml-1">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        setIsNameDirty(true);
                                    }}
                                    onBlur={() => {
                                        setDetails({
                                            customerName: name,
                                            customerEmail: email,
                                            customerPhone: phone
                                        });
                                    }}
                                    placeholder="Enter your name"
                                    className="w-full bg-black/50 border border-white/10 rounded-xl py-3 sm:py-4 pl-10 sm:pl-12 pr-3 sm:pr-4 text-sm sm:text-base text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all disabled:opacity-50"
                                    disabled={!!user?.name}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5 sm:space-y-2">
                            <label className="text-xs sm:text-sm text-gray-400 font-bold ml-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setIsEmailDirty(true);
                                    }}
                                    onBlur={() => {
                                        setDetails({
                                            customerName: name,
                                            customerEmail: email,
                                            customerPhone: phone
                                        });
                                    }}
                                    placeholder="john@example.com"
                                    className="w-full bg-black/50 border border-white/10 rounded-xl py-3 sm:py-4 pl-10 sm:pl-12 pr-3 sm:pr-4 text-sm sm:text-base text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all disabled:opacity-50"
                                    disabled={!!user?.email}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5 sm:space-y-2 sm:col-span-2">
                            <label className="text-xs sm:text-sm text-gray-400 font-bold ml-1">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => {
                                        setPhone(e.target.value);
                                        setIsPhoneDirty(true);
                                    }}
                                    onBlur={() => {
                                        setDetails({
                                            customerName: name,
                                            customerEmail: email,
                                            customerPhone: phone
                                        });
                                    }}
                                    placeholder="0300 1234567"
                                    className="w-full bg-black/50 border border-white/10 rounded-xl py-3 sm:py-4 pl-10 sm:pl-12 pr-3 sm:pr-4 text-sm sm:text-base text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Validation hint */}
                    {!isValid && (name.length > 0 || email.length > 0 || phone.length > 0) && (
                        <p className="mt-3 sm:mt-4 text-[10px] sm:text-xs text-amber-400/70 flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-amber-400/70 shrink-0" />
                            Please fill all fields correctly to proceed.
                        </p>
                    )}
                </div>
            </div>

            {/* Right: Action Area */}
            <div className="space-y-4 sm:space-y-6">
                <div className="bg-primary/5 border border-primary/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-bold text-white mb-2 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-primary" />
                        Important Note
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-400 leading-relaxed mb-3 sm:mb-4">
                        Please arrive 15 minutes before your scheduled time. Cancellations are only allowed up to 24 hours in advance.
                    </p>
                </div>

                <Button
                    onClick={handleProceed}
                    disabled={!isValid}
                    className="w-full h-14 sm:h-16 text-base sm:text-lg font-bold bg-primary text-black hover:bg-primary/90 shadow-[0_0_30px_rgba(34,197,94,0.3)] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                >
                    Proceed to Payment
                    <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                </Button>

                <button
                    onClick={() => router.back()}
                    className="w-full py-3 sm:py-4 text-xs sm:text-sm text-gray-500 hover:text-white transition-colors uppercase tracking-widest font-bold"
                >
                    ← Change Slot
                </button>
            </div>
        </div>
    );
}
