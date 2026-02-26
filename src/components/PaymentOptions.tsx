"use client";

import { useBooking } from "@/context/BookingContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
    CreditCard,
    Loader2,
    AlertTriangle,
    Copy,
    Check,
    ShieldCheck,
    ArrowLeft,
    Calendar,
    Clock,
    Trophy,
    Lock,
    Banknote,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Image from "next/image";

const PAYMENT_METHODS = [
    { id: 'easypaisa', name: 'EasyPaisa', icon: '/easypaisa.png', color: 'bg-emerald-500', accountName: 'Arena360', accountNumber: '0323-5192477' },
    { id: 'jazzcash', name: 'JazzCash', icon: '/jazzcash.png', color: 'bg-red-500', accountName: 'Arena360', accountNumber: '0323-5192477' },
    { id: 'cash', name: 'Pay at Venue', icon: null, color: 'bg-gray-600', accountName: '', accountNumber: '' },
];

const STEPS = [
    { label: 'Sport', step: 1 },
    { label: 'Time', step: 2 },
    { label: 'Details', step: 3 },
    { label: 'Payment', step: 4 },
];

export default function PaymentOptions() {
    const { state } = useBooking();
    const router = useRouter();
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    useEffect(() => {
        if (!state.selectedSlot || !state.details.customerName) {
            router.push("/book");
        }
    }, [state.selectedSlot, state.details, router]);

    const totalPrice = state.selectedSlot?.price || 0;
    const advanceAmount = Math.ceil(totalPrice * 0.2);
    const selectedPayment = PAYMENT_METHODS.find(m => m.id === selectedMethod);

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text.replace(/-/g, ''));
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handlePayment = async () => {
        if (!selectedMethod) return;
        setIsProcessing(true);

        try {
            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    sport: state.selectedSport?._id,
                    date: state.selectedDate && format(new Date(state.selectedDate), 'yyyy-MM-dd'),
                    startTime: state.selectedSlot?.startTime,
                    endTime: state.selectedSlot?.endTime,
                    duration: state.selectedSlot?.duration,
                    customerName: state.details.customerName,
                    customerEmail: state.details.customerEmail,
                    customerPhone: state.details.customerPhone,
                    amount: state.selectedSlot?.price,
                    paymentMethod: selectedMethod,
                })
            });

            const data = await res.json();

            if (data.success) {
                router.push(`/book/success?id=${data.data._id}`);
            } else {
                alert('Booking Failed: ' + data.error);
                setIsProcessing(false);
            }
        } catch {
            setIsProcessing(false);
            alert('Something went wrong. Please try again.');
        }
    };

    if (!state.selectedSlot) return null;

    return (
        <div className="max-w-5xl mx-auto">

            {/* ── Step Progress Indicator ── */}
            <div className="flex items-center justify-center gap-1 sm:gap-2 mb-8 sm:mb-12">
                {STEPS.map((s, i) => (
                    <div key={s.step} className="flex items-center gap-1 sm:gap-2">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all ${s.step < 4 ? 'bg-primary text-black' :
                                s.step === 4 ? 'bg-primary text-black ring-4 ring-primary/20' :
                                    'bg-white/5 text-gray-500 border border-white/10'
                                }`}>
                                {s.step < 4 ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : s.step}
                            </div>
                            <span className={`text-xs sm:text-sm font-semibold hidden sm:block ${s.step === 4 ? 'text-white' : s.step < 4 ? 'text-gray-400' : 'text-gray-600'}`}>
                                {s.label}
                            </span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div className={`w-6 sm:w-10 md:w-16 h-px ${s.step < 4 ? 'bg-primary/40' : 'bg-white/10'}`} />
                        )}
                    </div>
                ))}
            </div>

            {/* ── Main Layout: Two Columns on Desktop ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-10">

                {/* LEFT: Payment Methods (3/5) */}
                <div className="lg:col-span-3 space-y-6">

                    {/* 20% Advance Notice Banner */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl p-4 sm:p-5">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[60px] rounded-full pointer-events-none" />
                        <div className="flex items-start gap-3 sm:gap-4 relative z-10">
                            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-5 h-5 text-amber-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-sm sm:text-base font-bold text-amber-300 mb-1">20% Advance Required</h3>
                                <p className="text-[11px] sm:text-xs text-gray-400 leading-relaxed">
                                    Send a minimum <span className="text-white font-bold">20%</span> advance via EasyPaisa or JazzCash. Remaining payable at venue.
                                </p>
                                <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-black/30 rounded-xl px-3 sm:px-4 py-2.5 border border-white/5 mt-3">
                                    <div className="text-center">
                                        <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-gray-500 font-bold">Total</p>
                                        <p className="text-sm sm:text-lg font-black text-white font-mono">Rs {totalPrice}</p>
                                    </div>
                                    <div className="text-center border-x border-white/5 px-1">
                                        <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-gray-500 font-bold">Advance</p>
                                        <p className="text-sm sm:text-lg font-black text-primary font-mono">Rs {advanceAmount}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-gray-500 font-bold">At Venue</p>
                                        <p className="text-sm sm:text-lg font-black text-gray-300 font-mono">Rs {totalPrice - advanceAmount}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Method Selection */}
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-5 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-primary" />
                            Select Payment Method
                        </h2>
                        <div className="space-y-3">
                            {PAYMENT_METHODS.map((method) => (
                                <button
                                    key={method.id}
                                    onClick={() => setSelectedMethod(method.id)}
                                    className={`w-full p-4 sm:p-5 rounded-2xl border flex items-center justify-between transition-all duration-300 group ${selectedMethod === method.id
                                        ? 'bg-primary/10 border-primary shadow-[0_0_25px_rgba(34,197,94,0.12)] scale-[1.01]'
                                        : 'bg-[#1A1A1A] border-white/5 hover:bg-[#222] hover:border-white/15'
                                        }`}
                                >
                                    <div className="flex items-center gap-4 sm:gap-5">
                                        <div className={`relative w-14 h-10 sm:w-[72px] sm:h-[52px] rounded-xl shadow-lg border border-white/10 flex items-center justify-center shrink-0 overflow-hidden transition-transform duration-300 group-hover:scale-105 ${method.icon ? 'bg-white' : method.color}`}>
                                            {method.icon ? (
                                                <Image src={method.icon} alt={method.name} fill sizes="(max-width: 768px) 56px, 72px" className="object-contain p-1.5 sm:p-1 sm:scale-110" />
                                            ) : (
                                                <Banknote className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                            )}
                                        </div>
                                        <div className="text-left">
                                            <span className="text-sm sm:text-base font-bold text-white block mb-0.5">{method.name}</span>
                                            {method.id === 'cash' ? (
                                                <span className="text-[10px] sm:text-xs text-gray-500 leading-tight block">Pay full amount at the venue</span>
                                            ) : (
                                                <span className="text-[10px] sm:text-xs text-gray-500 leading-tight block">Send min <span className="text-gray-300 font-semibold">Rs {advanceAmount}</span> advance</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className={`w-5 h-5 sm:w-[22px] sm:h-[22px] shrink-0 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${selectedMethod === method.id ? 'border-primary bg-primary shadow-[0_0_12px_rgba(34,197,94,0.4)]' : 'border-gray-600'
                                        }`}>
                                        {selectedMethod === method.id && <div className="w-2 h-2 rounded-full bg-black" />}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Account Details — shown when EasyPaisa or JazzCash is selected */}
                    {selectedPayment && selectedPayment.id !== 'cash' && (
                        <div className="animate-fade-up bg-[#111] border border-white/5 rounded-2xl p-4 sm:p-6 space-y-4">
                            <div className="flex items-center gap-3 sm:gap-4 mb-1">
                                <div className="relative w-14 h-10 sm:w-[72px] sm:h-[52px] bg-white rounded-xl shadow-lg border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                                    <Image src={selectedPayment.icon!} alt={selectedPayment.name} fill sizes="(max-width: 768px) 56px, 72px" className="object-contain p-1.5 sm:p-1 sm:scale-110" />
                                </div>
                                <div>
                                    <h3 className="text-sm sm:text-base font-bold text-white">{selectedPayment.name} Account Details</h3>
                                    <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">Send the advance to this account</p>
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                {/* Account Name */}
                                <div className="flex items-center justify-between bg-black/40 border border-white/5 rounded-xl px-4 sm:px-5 py-3 sm:py-4">
                                    <div>
                                        <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-0.5">Account Name</p>
                                        <p className="text-white font-bold text-base sm:text-lg">{selectedPayment.accountName}</p>
                                    </div>
                                </div>

                                {/* Account Number */}
                                <div className="flex items-center justify-between bg-black/40 border border-white/5 rounded-xl px-4 sm:px-5 py-3 sm:py-4">
                                    <div>
                                        <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-0.5">Account Number</p>
                                        <p className="text-white font-bold text-base sm:text-lg font-mono tracking-wider">{selectedPayment.accountNumber}</p>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); copyToClipboard(selectedPayment.accountNumber, 'number'); }}
                                        className="flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-400 hover:text-primary bg-white/5 hover:bg-white/10 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all"
                                    >
                                        {copiedField === 'number' ? (
                                            <><Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" /> Copied</>
                                        ) : (
                                            <><Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Copy</>
                                        )}
                                    </button>
                                </div>

                                {/* Amount to Send */}
                                <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl px-4 sm:px-5 py-3 sm:py-4">
                                    <div>
                                        <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-0.5">Minimum Amount to Send</p>
                                        <p className="text-primary font-black text-xl sm:text-2xl font-mono">Rs {advanceAmount}</p>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); copyToClipboard(String(advanceAmount), 'amount'); }}
                                        className="flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-400 hover:text-primary bg-white/5 hover:bg-white/10 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all"
                                    >
                                        {copiedField === 'amount' ? (
                                            <><Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" /> Copied</>
                                        ) : (
                                            <><Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Copy</>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <p className="text-[10px] sm:text-xs text-gray-500 leading-relaxed text-center pt-1">
                                After sending the payment, press <span className="text-white font-bold">Confirm Booking</span> below.
                                Your booking will be verified and confirmed shortly.
                            </p>
                        </div>
                    )}
                </div>

                {/* RIGHT: Booking Recap Sidebar (2/5) */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Booking Summary Card */}
                    <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-4 sm:p-6 sticky top-28">
                        <h3 className="text-sm sm:text-base font-bold text-white mb-4 flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-primary" />
                            Booking Summary
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                    <Trophy className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Sport</p>
                                    <p className="text-white font-semibold text-sm">{state.selectedSport?.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                                    <Calendar className="w-4 h-4 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Date</p>
                                    <p className="text-white font-semibold text-sm">
                                        {state.selectedDate && format(new Date(state.selectedDate), "EEE, MMM d, yyyy")}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                                    <Clock className="w-4 h-4 text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Time</p>
                                    <p className="text-white font-semibold text-sm">
                                        {state.selectedSlot?.startTime} – {state.selectedSlot?.endTime}
                                        <span className="text-gray-500 ml-1.5">({state.selectedSlot?.duration || 1}hr)</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Divider + Total */}
                        <div className="mt-4 pt-4 border-t border-white/5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs uppercase tracking-widest text-gray-500 font-bold">Total</span>
                                <span className="text-2xl sm:text-3xl font-black text-primary font-mono">Rs {totalPrice}</span>
                            </div>
                        </div>

                        {/* CTA Buttons */}
                        <div className="mt-5 space-y-3">
                            <Button
                                onClick={handlePayment}
                                disabled={!selectedMethod || isProcessing}
                                className="w-full h-12 sm:h-14 text-base sm:text-lg font-bold rounded-xl bg-primary text-black hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(34,197,94,0.2)] transition-all"
                            >
                                {isProcessing ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Processing...
                                    </span>
                                ) : selectedMethod === 'cash' ? (
                                    <>
                                        <Banknote className="w-5 h-5 mr-2" />
                                        Confirm — Rs {totalPrice}
                                    </>
                                ) : (
                                    <>
                                        <Lock className="w-4 h-4 mr-2" />
                                        Confirm Booking
                                    </>
                                )}
                            </Button>

                            <button
                                onClick={() => router.back()}
                                className="w-full flex items-center justify-center gap-2 py-3 text-xs sm:text-sm text-gray-500 hover:text-white transition-colors uppercase tracking-widest font-bold"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                Change Details
                            </button>
                        </div>

                        {/* Trust Indicators */}
                        <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-center gap-4 text-[10px] sm:text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                <span>Secure</span>
                            </div>
                            <div className="w-px h-3 bg-white/10" />
                            <div className="flex items-center gap-1">
                                <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                <span>Encrypted</span>
                            </div>
                            <div className="w-px h-3 bg-white/10" />
                            <div className="flex items-center gap-1">
                                <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                <span>Verified</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
