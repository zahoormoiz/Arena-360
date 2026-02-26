"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";

// Define types for our booking state
export type Sport = {
    _id: string;
    name: string;
    image: string;
    basePrice: number;
    [key: string]: any;
};

export type Arena = {
    id: string;
    name: string;
    type: string; // e.g., "Turf 1", "Turf 2"
    sportId: string;
};

export type BookingState = {
    selectedSport: Sport | null;
    selectedArena: Arena | null;
    selectedDate: Date | null;
    selectedSlot: {
        startTime: string;
        endTime: string;
        price: number;
        duration: number;
    } | null;
    details: {
        customerName: string;
        customerEmail: string;
        customerPhone: string;
    };
};

type BookingContextType = {
    state: BookingState;
    setSport: (sport: Sport) => void;
    setArena: (arena: Arena) => void;
    setDate: (date: Date) => void;
    setSlot: (slot: BookingState["selectedSlot"]) => void;
    setDetails: (details: BookingState["details"]) => void;
    resetBooking: () => void;
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
    // Initialize state from localStorage if available, or default
    const [state, setState] = useState<BookingState>({
        selectedSport: null,
        selectedArena: null,
        selectedDate: null, // Date objects don't serialize well to JSON, handled below
        selectedSlot: null,
        details: {
            customerName: "",
            customerEmail: "",
            customerPhone: "",
        },
    });

    // Load from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem("bookingState");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Restore Date object
                if (parsed.selectedDate) {
                    const date = new Date(parsed.selectedDate);
                    if (!isNaN(date.getTime())) {
                        parsed.selectedDate = date;
                    } else {
                        parsed.selectedDate = null;
                    }
                }
                setState(parsed);
            } catch {
                // Silently ignore parse errors, use default state
            }
        }
    }, []);

    // Save to local storage on change
    useEffect(() => {
        localStorage.setItem("bookingState", JSON.stringify(state));
    }, [state]);

    const setSport = useCallback((sport: Sport) => setState((prev) => ({ ...prev, selectedSport: sport, selectedArena: null, selectedSlot: null })), []);
    const setArena = useCallback((arena: Arena) => setState((prev) => ({ ...prev, selectedArena: arena, selectedSlot: null })), []);
    const setDate = useCallback((date: Date) => setState((prev) => ({ ...prev, selectedDate: date, selectedSlot: null })), []);
    const setSlot = useCallback((slot: BookingState["selectedSlot"]) => setState((prev) => ({ ...prev, selectedSlot: slot })), []);
    const setDetails = useCallback((details: BookingState["details"]) => setState((prev) => ({ ...prev, details })), []);
    const resetBooking = useCallback(() => {
        const newState = {
            selectedSport: null,
            selectedArena: null,
            selectedDate: null,
            selectedSlot: null,
            details: { customerName: "", customerEmail: "", customerPhone: "" },
        };
        setState(newState);
        localStorage.removeItem("bookingState");
    }, []);

    const value = React.useMemo(() => ({
        state,
        setSport,
        setArena,
        setDate,
        setSlot,
        setDetails,
        resetBooking,
    }), [state, setSport, setArena, setDate, setSlot, setDetails, resetBooking]);

    return (
        <BookingContext.Provider value={value}>
            {children}
        </BookingContext.Provider>
    );
}

export function useBooking() {
    const context = useContext(BookingContext);
    if (context === undefined) {
        throw new Error("useBooking must be used within a BookingProvider");
    }
    return context;
}
