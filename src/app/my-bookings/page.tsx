'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin, XCircle, AlertCircle, RefreshCw, ArrowRightLeft, X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Booking {
    _id: string;
    sport: {
        _id: string;
        name: string;
        image: string;
        basePrice: number;
    };
    date: string;
    startTime: string;
    endTime: string;
    duration: number;
    amount: number;
    status: 'pending' | 'confirmed' | 'cancelled' | 'rescheduled';
    source?: 'online' | 'walk-in';
    rescheduledFrom?: string;
}

interface SlotInfo {
    time: string;
    available: boolean;
}

export default function MyBookingsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    // Reschedule state
    const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
    const [rescheduleDate, setRescheduleDate] = useState('');
    const [rescheduleTime, setRescheduleTime] = useState('');
    const [rescheduleDuration, setRescheduleDuration] = useState(1);
    const [rescheduleSlots, setRescheduleSlots] = useState<SlotInfo[]>([]);
    const [rescheduleLoading, setRescheduleLoading] = useState(false);
    const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);
    const [rescheduleError, setRescheduleError] = useState('');
    const [rescheduleSuccess, setRescheduleSuccess] = useState('');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login?callbackUrl=/my-bookings');
            return;
        }

        if (user) {
            fetchBookings();
        }
    }, [user, authLoading, router]);

    const fetchBookings = async () => {
        try {
            const res = await fetch('/api/bookings/my');
            const data = await res.json();
            if (data.success) {
                setBookings(data.bookings);
                setError('');
            } else {
                setError(data.error || 'Failed to fetch bookings');
            }
        } catch (err) {
            setError('Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (bookingId: string) => {
        if (!confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) return;

        setCancellingId(bookingId);
        try {
            const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
                method: 'POST'
            });
            const data = await res.json();

            if (data.success) {
                setBookings(prev => prev.map(b =>
                    b._id === bookingId ? { ...b, status: 'cancelled' } : b
                ));
            } else {
                alert(data.error || 'Failed to cancel');
            }
        } catch (e) {
            alert('Error cancelling booking');
        } finally {
            setCancellingId(null);
        }
    };

    // === Reschedule Functions ===

    const openRescheduleModal = (booking: Booking) => {
        setRescheduleBooking(booking);
        setRescheduleDate(booking.date);
        setRescheduleDuration(booking.duration || 1);
        setRescheduleTime('');
        setRescheduleSlots([]);
        setRescheduleError('');
        setRescheduleSuccess('');
    };

    const closeRescheduleModal = () => {
        setRescheduleBooking(null);
        setRescheduleDate('');
        setRescheduleTime('');
        setRescheduleSlots([]);
        setRescheduleError('');
        setRescheduleSuccess('');
    };

    // Fetch available slots when date changes
    useEffect(() => {
        if (!rescheduleBooking || !rescheduleDate) return;

        const fetchSlots = async () => {
            setRescheduleLoading(true);
            setRescheduleTime('');
            try {
                const res = await fetch(`/api/availability?date=${rescheduleDate}&sportId=${rescheduleBooking.sport._id}`);
                const data = await res.json();
                if (data.success) {
                    setRescheduleSlots(data.data || []);
                }
            } catch (e) {
                setRescheduleSlots([]);
            } finally {
                setRescheduleLoading(false);
            }
        };

        fetchSlots();
    }, [rescheduleDate, rescheduleBooking]);

    const handleReschedule = async () => {
        if (!rescheduleBooking || !rescheduleDate || !rescheduleTime) return;

        setRescheduleSubmitting(true);
        setRescheduleError('');
        setRescheduleSuccess('');

        try {
            const res = await fetch(`/api/bookings/${rescheduleBooking._id}/reschedule`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    newDate: rescheduleDate,
                    newStartTime: rescheduleTime,
                    newDuration: rescheduleDuration
                })
            });

            const data = await res.json();

            if (data.success) {
                setRescheduleSuccess('Booking rescheduled successfully!');
                // Refresh bookings after a short delay
                setTimeout(() => {
                    closeRescheduleModal();
                    fetchBookings();
                }, 1500);
            } else {
                setRescheduleError(data.error || 'Failed to reschedule booking');
            }
        } catch (e) {
            setRescheduleError('Network error. Please try again.');
        } finally {
            setRescheduleSubmitting(false);
        }
    };

    // Date navigation helpers
    const shiftDate = (days: number) => {
        const d = new Date(rescheduleDate);
        d.setDate(d.getDate() + days);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (d >= today) {
            setRescheduleDate(d.toISOString().split('T')[0]);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-green-500/20 text-green-500';
            case 'cancelled': return 'bg-red-500/20 text-red-500';
            case 'rescheduled': return 'bg-blue-500/20 text-blue-400';
            case 'pending': return 'bg-yellow-500/20 text-yellow-500';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen pt-24 px-4 sm:px-6 max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-white mb-2">My Bookings</h1>
                <p className="text-sm sm:text-base text-gray-400 mb-6 sm:mb-8">Manage your upcoming and past sessions</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-64 bg-white/5 rounded-2xl animate-pulse border border-white/5"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 max-w-7xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">My Bookings</h1>
            <p className="text-sm sm:text-base text-gray-400 mb-6 sm:mb-8">Manage your upcoming and past sessions</p>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                    <Button variant="outline" size="sm" onClick={() => fetchBookings()} className="ml-auto border-red-500/30 hover:bg-red-500/20 text-red-400">
                        Retry
                    </Button>
                </div>
            )}

            {bookings.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
                    <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Bookings Yet</h3>
                    <p className="text-gray-400 mb-6">You haven't booked any slots yet.</p>
                    <Button onClick={() => router.push('/book')} className="bg-primary text-black font-bold">
                        Book Now
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bookings.map((booking) => (
                        <div key={booking._id} className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all group relative">
                            {/* Ambient backing */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                            <div className="bg-black/40 p-4 border-b border-white/5 flex justify-between items-center relative z-10">
                                <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wider ${getStatusBadge(booking.status)}`}>
                                    {booking.status}
                                </span>
                                <span className="text-white font-mono font-bold">Rs {booking.amount}</span>
                            </div>

                            <div className="p-6 space-y-4 relative z-10">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1">{booking.sport?.name || 'Sport'}</h3>
                                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                                        <Calendar className="w-4 h-4" />
                                        {format(new Date(booking.date), 'EEEE, MMM do, yyyy')}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-gray-300">
                                        <Clock className="w-4 h-4 text-primary" />
                                        <span>{booking.startTime} - {booking.endTime} ({booking.duration}h)</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-300">
                                        <MapPin className="w-4 h-4 text-primary" />
                                        <span>Arena 1 (Main Hall)</span>
                                    </div>
                                </div>

                                {booking.status === 'pending' && (
                                    <div className="mt-3 py-2 px-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400 text-xs flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5" />
                                        Awaiting confirmation. You will be notified once confirmed.
                                    </div>
                                )}

                                {(booking.status === 'confirmed' || booking.status === 'pending') && (
                                    <div className="flex gap-2 mt-4">
                                        {booking.status === 'confirmed' && (
                                            <button
                                                onClick={() => openRescheduleModal(booking)}
                                                className="flex-1 py-3 border border-primary/30 text-primary rounded-xl hover:bg-primary/10 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                                            >
                                                <ArrowRightLeft className="w-4 h-4" />
                                                Reschedule
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleCancel(booking._id)}
                                            disabled={cancellingId === booking._id}
                                            className="flex-1 py-3 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {cancellingId === booking._id ? (
                                                <>
                                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                                    Cancelling...
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle className="w-4 h-4" />
                                                    Cancel
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}

                                {booking.status === 'rescheduled' && (
                                    <div className="mt-3 py-2 px-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 text-xs">
                                        This booking was rescheduled to a new slot
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ===== RESCHEDULE MODAL ===== */}
            {rescheduleBooking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-[#111] border border-white/10 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-white/10">
                            <div>
                                <h2 className="text-lg font-bold text-white">Reschedule Booking</h2>
                                <p className="text-sm text-gray-400">{rescheduleBooking.sport?.name}</p>
                            </div>
                            <button onClick={closeRescheduleModal} className="text-gray-400 hover:text-white p-1">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Current booking info */}
                        <div className="px-5 pt-4">
                            <div className="bg-white/5 rounded-xl p-3 text-sm text-gray-400 flex items-center gap-3">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span>Current: <span className="text-white font-medium">{format(new Date(rescheduleBooking.date), 'MMM do')} at {rescheduleBooking.startTime}</span></span>
                            </div>
                        </div>

                        {/* Date selector */}
                        <div className="px-5 pt-4">
                            <label className="block text-sm font-medium text-gray-300 mb-2">New Date</label>
                            <div className="flex items-center gap-2">
                                <button onClick={() => shiftDate(-1)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-colors">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <input
                                    type="date"
                                    value={rescheduleDate}
                                    onChange={(e) => setRescheduleDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="flex-1 bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary/50 text-center"
                                />
                                <button onClick={() => shiftDate(1)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-colors">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Duration selector */}
                        <div className="px-5 pt-4">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Duration</label>
                            <div className="flex gap-2">
                                {[1, 2, 3].map((d) => (
                                    <button
                                        key={d}
                                        onClick={() => setRescheduleDuration(d)}
                                        className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors border ${rescheduleDuration === d
                                            ? 'bg-primary/20 border-primary/50 text-primary'
                                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                            }`}
                                    >
                                        {d}h
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Slot selector */}
                        <div className="px-5 pt-4">
                            <label className="block text-sm font-medium text-gray-300 mb-2">New Time Slot</label>
                            {rescheduleLoading ? (
                                <div className="grid grid-cols-4 gap-2">
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                        <div key={i} className="h-10 rounded-lg bg-white/5 animate-pulse" />
                                    ))}
                                </div>
                            ) : rescheduleSlots.length === 0 ? (
                                <p className="text-gray-500 text-sm text-center py-4">No slots available for this date</p>
                            ) : (
                                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                                    {rescheduleSlots.map((slot) => (
                                        <button
                                            key={slot.time}
                                            disabled={!slot.available}
                                            onClick={() => setRescheduleTime(slot.time)}
                                            className={`py-2 px-1 rounded-lg text-sm font-medium transition-all ${!slot.available
                                                ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                                                : rescheduleTime === slot.time
                                                    ? 'bg-primary text-black ring-2 ring-primary/50'
                                                    : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                                                }`}
                                        >
                                            {slot.time}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Error / Success */}
                        {rescheduleError && (
                            <div className="mx-5 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {rescheduleError}
                            </div>
                        )}

                        {rescheduleSuccess && (
                            <div className="mx-5 mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm flex items-center gap-2">
                                <Check className="w-4 h-4 flex-shrink-0" />
                                {rescheduleSuccess}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="p-5 flex gap-3">
                            <button
                                onClick={closeRescheduleModal}
                                className="flex-1 py-3 border border-white/10 text-gray-400 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReschedule}
                                disabled={!rescheduleTime || rescheduleSubmitting || !!rescheduleSuccess}
                                className="flex-1 py-3 bg-primary text-black rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {rescheduleSubmitting ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <ArrowRightLeft className="w-4 h-4" />
                                        Confirm Reschedule
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
