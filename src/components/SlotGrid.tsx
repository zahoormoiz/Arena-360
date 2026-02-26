import { clsx } from 'clsx';

interface Slot {
    time: string;
    startTime: string;
    status: 'available' | 'booked' | 'blocked' | 'pending_payment' | 'passed';
    price: number;
}

interface SlotGridProps {
    slots: Slot[];
    selectedSlot: Slot | null;
    onSelect: (slot: Slot) => void;
    loading?: boolean;
    duration?: number;
}

export default function SlotGrid({ slots, selectedSlot, onSelect, loading, duration = 1 }: SlotGridProps) {
    if (loading) {
        return <div className="p-8 text-center text-gray-400 animate-pulse">Checking availability...</div>;
    }

    if (slots.length === 0) {
        return <div className="p-8 text-center text-gray-400">No slots available for this date.</div>;
    }

    // Helper to check if a slot is part of the selected range
    const isSlotSelected = (slotTime: string) => {
        if (!selectedSlot) return false;

        const [selH] = selectedSlot.startTime.split(':').map(Number);
        const [currH] = slotTime.split(':').map(Number);

        // Simple comparison for consecutive hours
        // Slot is selected if: curr >= sel AND curr < sel + duration
        return currH >= selH && currH < (selH + duration);
    };

    return (
        <div className="grid grid-cols-3 gap-3">
            {slots.map((slot, idx) => {
                const isBooked = slot.status === 'booked';
                const isBlocked = slot.status === 'blocked';
                const isPassed = slot.status === 'passed';
                const isDisabled = isBooked || isBlocked || isPassed;
                const isSelected = isSlotSelected(slot.startTime);

                return (
                    <button
                        key={idx}
                        disabled={isDisabled}
                        onClick={() => onSelect(slot)}
                        title={isBooked ? "Slot Booked" : isPassed ? "This time has passed" : isBlocked ? "Not enough time for selected duration" : "Available"}
                        className={clsx(
                            "relative h-14 rounded-2xl border text-sm font-bold transition-all duration-300 flex items-center justify-center",
                            isPassed
                                ? "bg-white/[0.03] border-white/5 text-gray-600 cursor-not-allowed opacity-40"
                                : isBooked
                                    ? "bg-red-500/10 border-red-500/20 text-red-500 cursor-not-allowed"
                                    : isSelected
                                        ? "bg-gradient-to-r from-accent to-primary border-none text-black shadow-[0_0_20px_rgba(6,182,212,0.4)] scale-105 z-10"
                                        : isBlocked
                                            ? "bg-white/5 border-transparent text-gray-600 cursor-not-allowed opacity-50"
                                            : "bg-[#1A1A1A] border-white/5 text-gray-300 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/10"
                        )}
                    >
                        {slot.time.split(' - ')[0]}
                    </button>
                );
            })}
        </div>
    );
}
