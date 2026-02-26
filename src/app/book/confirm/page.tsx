"use client";

import BookingSummary from '@/components/BookingSummary';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ConfirmPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    // Auth check removed for Guest Checkout
    // useEffect(() => {
    //     if (!loading && !user) {
    //         router.push('/login');
    //     }
    // }, [user, loading, router]);

    if (loading) return null; // Or a loading spinner

    // if (!user) return null;

    return (
        <div className="min-h-screen pt-20 sm:pt-24 pb-12 px-3 sm:px-6">
            <div className="max-w-7xl mx-auto">
                <header className="mb-5 sm:mb-10">
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mb-2 uppercase tracking-widest font-bold">
                        <span>Booking</span>
                        <span>/</span>
                        <span>Time</span>
                        <span>/</span>
                        <span className="text-primary">Details</span>
                        <span>/</span>
                        <span className="text-gray-600">Payment</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-1 sm:mb-2">Confirm Booking</h1>
                    <p className="text-sm sm:text-base text-gray-400">Review your details and proceed to payment.</p>
                </header>

                <BookingSummary />
            </div>
        </div>
    );
}
