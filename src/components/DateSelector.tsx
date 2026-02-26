import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { format, addDays } from 'date-fns';

interface DateSelectorProps {
    selectedDate: string | null;
    onSelect: (date: string) => void;
}

export default function DateSelector({ selectedDate, onSelect }: DateSelectorProps) {
    const [dates, setDates] = useState<{ label: string, value: string, day: string }[]>([]);

    useEffect(() => {
        const next30Days = Array.from({ length: 30 }, (_, i) => {
            const date = addDays(new Date(), i);
            return {
                label: i === 0 ? 'Today' : format(date, 'EEE'),
                day: format(date, 'd'),
                value: format(date, 'yyyy-MM-dd')
            };
        });
        setDates(next30Days);
    }, []);

    return (
        <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide py-2">
            {dates.map((date) => {
                const isSelected = selectedDate === date.value;
                return (
                    <button
                        key={date.value}
                        onClick={() => onSelect(date.value)}
                        className={clsx(
                            "group flex flex-col items-center justify-center min-w-[72px] h-[88px] rounded-2xl border transition-all duration-300 snap-start",
                            isSelected
                                ? "bg-gradient-to-br from-accent to-primary border-none text-black shadow-[0_0_20px_rgba(6,182,212,0.4)] scale-105 z-10"
                                : "bg-[#1A1A1A] border-white/5 text-gray-400 hover:border-accent/50 hover:bg-white/5"
                        )}
                    >
                        <span className={clsx("text-[10px] font-bold uppercase tracking-widest mb-1", isSelected ? "text-black/80" : "text-gray-500 group-hover:text-accent")}>{date.label}</span>
                        <span className="text-2xl font-black">{date.day}</span>
                    </button>
                );
            })}
        </div>
    );
}
