'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

interface AnimatedCounterProps {
    end: number;
    duration?: number; // in seconds
    label: string;
    suffix?: string;
    className?: string;
}

const easeOutQuart = (x: number): number => {
    return 1 - Math.pow(1 - x, 4);
};

export default function AnimatedCounter({
    end,
    duration = 2,
    label,
    suffix = '',
    className = '',
}: AnimatedCounterProps) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!isInView) return;

        let startTime: number | null = null;
        let animationFrameId: number;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / (duration * 1000), 1);

            // Apply easing
            const easedProgress = easeOutQuart(percentage);

            const currentCount = Math.floor(easedProgress * end);
            setCount(currentCount);

            if (percentage < 1) {
                animationFrameId = requestAnimationFrame(animate);
            } else {
                setCount(end); // Ensure we land exactly on the end value
            }
        };

        animationFrameId = requestAnimationFrame(animate);

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, [isInView, end, duration]);

    return (
        <div
            ref={ref}
            className={`flex flex-col items-center justify-center text-center p-4 ${className}`}
            role="group"
            aria-label={`${label}: ${count}${suffix}`}
        >
            <div
                className="text-4xl md:text-5xl lg:text-6xl font-black text-primary mb-2 tabular-nums"
                aria-hidden="true"
            >
                {count}
                {suffix}
            </div>
            <div className="text-sm md:text-base text-gray-400 font-medium tracking-wide uppercase">
                {label}
            </div>
        </div>
    );
}
