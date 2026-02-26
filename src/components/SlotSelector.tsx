"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useBooking } from "@/context/BookingContext";
import { useRouter } from "next/navigation";
import { format, addDays, isSameDay, startOfToday } from "date-fns";
import { Loader2, Calendar as CalendarIcon, Clock, CheckCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import DurationSelector from "./DurationSelector";

interface Slot {
    time: string;
    startTime: string;
    date: string;
    status: 'available' | 'booked' | 'passed';
    price: number;
}

interface SlotSelectorProps {
    initialSport?: any;
}

export default function SlotSelector({ initialSport }: SlotSelectorProps) {
    const { state, setDate, setSlot, setSport } = useBooking();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [slots, setSlots] = useState<Slot[]>([]);
    const [selectedDateState, setSelectedDateState] = useState<Date>(startOfToday());
    const [selectedSlotState, setSelectedSlotState] = useState<Slot | null>(null);
    const [duration, setDuration] = useState(1);
    const [hoveredSlotIndex, setHoveredSlotIndex] = useState<number | null>(null);

    // Initialize context if prop provided
    useEffect(() => {
        if (initialSport && (!state.selectedSport || state.selectedSport._id !== initialSport._id)) {
            setSport(initialSport);
        }
    }, [initialSport, state.selectedSport, setSport]);

    // Redirect if no sport selected (and no prop to set it)
    useEffect(() => {
        if (!state.selectedSport && !initialSport) {
            router.push("/book");
        }
    }, [state.selectedSport, initialSport, router]);

    // Fetch slots when date changes
    useEffect(() => {
        const sport = state.selectedSport || initialSport;
        if (!sport) return;

        const fetchSlots = async () => {
            // Validate Date
            if (!selectedDateState || isNaN(selectedDateState.getTime())) {
                return;
            }

            setLoading(true);
            setSlots([]);
            setSelectedSlotState(null); // Reset selection on date change

            try {
                const dateStr = format(selectedDateState, "yyyy-MM-dd");
                // Fetch from API
                const res = await fetch(`/api/availability?date=${dateStr}&sportId=${sport._id}`);
                const data = await res.json();

                if (data.success) {
                    setSlots(data.data);
                }
            } catch {
                // Silently handle fetch errors - slots remain empty
            } finally {
                setLoading(false);
            }
        };

        fetchSlots();
        // Update global context date
        setDate(selectedDateState);
    }, [selectedDateState, state.selectedSport, initialSport, setDate]);

    // Check availability for a range of slots
    const isRangeAvailable = (startIndex: number, duration: number) => {
        if (startIndex + duration > slots.length) return false;

        for (let i = 0; i < duration; i++) {
            const s = slots[startIndex + i]?.status;
            if (s === 'booked' || s === 'passed') return false;
        }
        return true;
    };

    const handleSlotClick = (slot: Slot, index: number) => {
        if (!isRangeAvailable(index, duration)) return;

        const totalPrice = slots.slice(index, index + duration).reduce((sum, s) => sum + s.price, 0);

        setSelectedSlotState(slot);

        // Update context immediately so UI reflects it, but don't route yet
        setSlot({
            startTime: slot.startTime,
            endTime: calculateEndTime(slot.startTime, duration),
            price: totalPrice,
            duration: duration
        });
    };

    const handleConfirmBooking = () => {
        if (selectedSlotState) {
            router.push("/book/confirm");
        }
    };

    const calculateEndTime = (startTime: string, duration: number) => {
        const [h, m] = startTime.split(':').map(Number);
        const endH = h + duration;
        return `${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    const getSlotStatus = (index: number) => {
        // Base Status
        const slot = slots[index];
        const isBooked = slot.status === 'booked';
        const isPassed = slot.status === 'passed';

        // Selection Logic
        const isSelectedStart = selectedSlotState?.startTime === slot.startTime;
        const selectedIndex = slots.findIndex(s => s.startTime === selectedSlotState?.startTime);
        const isInSelectedRange = selectedIndex !== -1 && index >= selectedIndex && index < selectedIndex + duration;

        // Hover Logic
        const isHoveredStart = hoveredSlotIndex === index;
        const isInHoveredRange = hoveredSlotIndex !== null && index >= hoveredSlotIndex && index < hoveredSlotIndex + duration;

        // Availability for current duration (for hover/disabled state)
        const isStartOfValidRange = isRangeAvailable(index, duration);
        const isStartOfInvalidRange = !isStartOfValidRange && !isBooked;

        return {
            isBooked,
            isPassed,
            isSelectedStart,
            isInSelectedRange,
            isHoveredStart,
            isInHoveredRange,
            isStartOfValidRange,
            isStartOfInvalidRange
        };
    };

    // Generate next 30 days - Client Side to prevent hydration mismatch
    const [calendarDays, setCalendarDays] = useState<Date[]>([]);

    useEffect(() => {
        const days = Array.from({ length: 30 }, (_, i) => addDays(startOfToday(), i));
        setCalendarDays(days);
    }, []);

    // Memoize derived selection data
    const selectedEndTime = useMemo(() =>
        selectedSlotState ? calculateEndTime(selectedSlotState.startTime, duration) : "",
        [selectedSlotState, duration]);

    const selectedPrice = useMemo(() =>
        selectedSlotState ? slots.slice(
            slots.findIndex(s => s.startTime === selectedSlotState.startTime),
            slots.findIndex(s => s.startTime === selectedSlotState.startTime) + duration
        ).reduce((sum, s) => sum + s.price, 0) : 0,
        [selectedSlotState, slots, duration]);

    if (!state.selectedSport && !initialSport) return null;

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const dateButtonsRef = useRef<{ [key: string]: HTMLButtonElement | null }>({});

    // Scroll selected date to center
    const scrollToCenter = (dateStr: string) => {
        const container = scrollContainerRef.current;
        const button = dateButtonsRef.current[dateStr];

        if (container && button) {
            const containerCenter = container.offsetWidth / 2;
            const buttonCenter = button.offsetLeft + button.offsetWidth / 2;
            const scrollLeft = buttonCenter - containerCenter;

            container.scrollTo({
                left: scrollLeft,
                behavior: 'smooth'
            });
        }
    };

    // Auto-scroll on mount or change
    useEffect(() => {
        const dateStr = format(selectedDateState, "yyyy-MM-dd");
        // small delay to ensure rendering
        setTimeout(() => scrollToCenter(dateStr), 100);
    }, [selectedDateState]);

    // Group calendar days by showing a month label when month changes
    const getMonthLabel = (day: Date, index: number) => {
        if (index === 0) return format(day, "MMM yyyy");
        const prevDay = calendarDays[index - 1];
        if (prevDay && day.getMonth() !== prevDay.getMonth()) {
            return format(day, "MMM");
        }
        return null;
    };

    return (
        <div className="flex flex-col gap-8 sm:gap-10 animate-fade-up relative pb-28 sm:pb-32">
            {/* Date Selector Strip */}
            <div className="space-y-4 sm:space-y-6">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center justify-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-primary" />
                    Select Date
                </h2>
                <div
                    ref={scrollContainerRef}
                    className="flex overflow-x-auto py-3 sm:py-4 gap-2 sm:gap-3 px-2 sm:px-4 md:px-0 scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-primary/50 hover:scrollbar-thumb-primary [&::-webkit-scrollbar]:h-1.5 sm:[&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-white/5 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-primary [&::-webkit-scrollbar-thumb]:rounded-full snap-x snap-mandatory justify-start w-full"
                >
                    {calendarDays.map((day, index) => {
                        const isSelected = isSameDay(day, selectedDateState);
                        const dateStr = format(day, "yyyy-MM-dd");
                        const monthLabel = getMonthLabel(day, index);
                        const isToday = isSameDay(day, startOfToday());
                        const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                        return (
                            <div key={day.toISOString()} className="flex flex-col items-center gap-1 shrink-0">
                                {/* Month label chip */}
                                {monthLabel && (
                                    <span className="text-[9px] sm:text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">{monthLabel}</span>
                                )}
                                <button
                                    ref={el => { dateButtonsRef.current[dateStr] = el; }}
                                    onClick={() => {
                                        setSelectedDateState(day);
                                        setSelectedSlotState(null);
                                        scrollToCenter(dateStr);
                                    }}
                                    className={cn(
                                        "group relative flex flex-col items-center justify-center min-w-[60px] h-[76px] sm:min-w-[70px] sm:h-[85px] rounded-2xl border transition-all duration-300 snap-center",
                                        isSelected
                                            ? "bg-primary border-primary shadow-[0_0_25px_rgba(34,197,94,0.3)] scale-105 z-10"
                                            : "bg-[#1A1A1A] border-white/5 text-gray-400 hover:border-white/20 hover:bg-white/5 hover:text-white"
                                    )}
                                >
                                    <span className={cn(
                                        "text-[9px] sm:text-[10px] uppercase tracking-widest font-bold mb-0.5 sm:mb-1",
                                        isSelected ? "text-black/70" : isWeekend ? "text-primary/70" : "text-gray-500"
                                    )}>{format(day, "EEE")}</span>
                                    <span className={cn(
                                        "text-xl sm:text-2xl font-mono font-bold tracking-tighter",
                                        isSelected ? "text-black" : "text-white"
                                    )}>{format(day, "d")}</span>
                                    {/* Today indicator dot */}
                                    {isToday && !isSelected && (
                                        <div className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary" />
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Duration Selector */}
            <div className="space-y-4">
                <DurationSelector duration={duration} setDuration={(d) => {
                    setDuration(d);
                    setSelectedSlotState(null); // Reset selection when duration changes
                }} />
            </div>

            {/* Slots Grid */}
            <div className="space-y-5 sm:space-y-6 min-h-[280px] sm:min-h-[300px] bg-[#111] backdrop-blur-sm rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 md:p-10 border border-white/5 relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

                <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 sm:mb-8 gap-3 sm:gap-4 relative z-10">
                    <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary" />
                        Available Slots
                        {loading && <Loader2 className="w-4 h-4 animate-spin text-gray-500 ml-2" />}
                    </h2>

                    {/* Legend */}
                    <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1.5 text-[9px] sm:text-xs font-medium text-gray-500 bg-black/20 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-full border border-white/5 backdrop-blur-sm">
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-[#2a2a2a] border border-white/10"></div>Available</div>
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-primary shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>Selected</div>
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-900/20 border border-red-900/20 striped-bg opacity-50"></div>Booked</div>
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-white/5 border border-white/5"></div>Passed</div>
                    </div>
                </header>

                {loading ? (
                    <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 animate-pulse">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="h-[68px] sm:h-[76px] bg-white/5 rounded-xl border border-white/5"></div>
                        ))}
                    </div>
                ) : slots.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
                        {slots.map((slot, index) => {
                            const status = getSlotStatus(index);

                            // Determine visual state classes
                            let containerClass = "bg-black/40 border-white/10 text-gray-300 hover:border-primary/50 hover:bg-white/5 hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]";

                            if (status.isPassed) {
                                containerClass = "bg-white/[0.03] border-white/5 text-gray-600 cursor-not-allowed opacity-40";
                            } else if (status.isBooked) {
                                containerClass = "bg-red-950/10 border-red-900/20 text-red-900/40 cursor-not-allowed striped-bg opacity-70";
                            } else if (status.isSelectedStart) {
                                containerClass = "bg-primary text-black border-primary shadow-[0_0_20px_rgba(34,197,94,0.4)] z-10 scale-[1.03]";
                            } else if (status.isInSelectedRange) {
                                containerClass = "bg-primary/90 text-black border-primary/50 scale-[1.01]";
                            } else if (status.isInHoveredRange && !status.isBooked) {
                                // Check valid/invalid hover
                                const hoverStartValid = isRangeAvailable(hoveredSlotIndex!, duration);
                                containerClass = hoverStartValid
                                    ? "bg-primary/10 border-primary/50 text-white shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                                    : "bg-red-500/10 border-red-500/30 text-gray-400";
                            }

                            return (
                                <button
                                    key={index}
                                    disabled={status.isBooked || status.isPassed || (!status.isStartOfValidRange && !status.isInSelectedRange && !status.isInHoveredRange)}
                                    onMouseEnter={() => setHoveredSlotIndex(index)}
                                    onMouseLeave={() => setHoveredSlotIndex(null)}
                                    onClick={() => handleSlotClick(slot, index)}
                                    className={cn(
                                        "relative py-2.5 sm:py-3 px-1.5 sm:px-2 rounded-xl text-sm font-medium border transition-all duration-200 flex flex-col items-center gap-0.5 active:scale-95",
                                        containerClass,
                                        // Cleaner opacity logic
                                        !status.isBooked && !status.isStartOfValidRange && !status.isInSelectedRange && !status.isInHoveredRange && "opacity-30 grayscale"
                                    )}
                                >
                                    <span className="font-mono text-sm sm:text-base font-bold tracking-tight">{slot.startTime}</span>
                                    {status.isSelectedStart || status.isInSelectedRange ? (
                                        <span className="text-[8px] sm:text-[9px] uppercase tracking-wider font-bold opacity-80">Selected</span>
                                    ) : (
                                        <span className="text-[8px] sm:text-[9px] uppercase tracking-wider font-bold opacity-60">
                                            {status.isPassed ? "Passed" : status.isBooked ? "Booked" : `Rs ${slot.price}`}
                                        </span>
                                    )}

                                    {/* Visual Indicator for selection */}
                                    {status.isSelectedStart && (
                                        <div className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 bg-white text-primary rounded-full p-0.5 shadow-md animate-scale-in">
                                            <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-gray-500 bg-white/5 rounded-2xl sm:rounded-3xl border border-dashed border-white/10">
                        <Clock className="w-8 h-8 sm:w-10 sm:h-10 mb-3 opacity-20" />
                        <p className="text-sm sm:text-base">No slots available for this date.</p>
                    </div>
                )}
            </div>

            {/* Floating Proceed Button — with bottom-nav clearance on mobile */}
            <div className={cn(
                "fixed bottom-20 sm:bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 cubic-bezier(0.175, 0.885, 0.32, 1.275) w-[calc(100%-2rem)] sm:w-auto max-w-md sm:max-w-none",
                selectedSlotState ? "translate-y-0 opacity-100 scale-100" : "translate-y-20 opacity-0 scale-90 pointer-events-none"
            )}>
                <button
                    onClick={handleConfirmBooking}
                    className="group flex items-center justify-center gap-3 w-full sm:w-auto bg-primary hover:bg-[#1faa50] text-black px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl sm:rounded-full font-bold text-sm sm:text-base uppercase tracking-widest shadow-[0_0_40px_rgba(34,197,94,0.4)] hover:shadow-[0_0_60px_rgba(34,197,94,0.6)] transition-all transform hover:scale-105 active:scale-95"
                >
                    <span className="flex flex-col items-start leading-none mr-2">
                        <span className="text-[9px] sm:text-[10px] opacity-60 font-bold">Total</span>
                        <span className="text-base sm:text-lg font-mono">Rs {selectedPrice}</span>
                    </span>
                    <span className="w-px h-7 sm:h-8 bg-black/10 mx-1"></span>
                    <span>Proceed</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:translate-x-1" />
                </button>
            </div>

        </div >
    );
}
