'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, X, Clock, User, Phone, DollarSign, AlertCircle, RefreshCw } from 'lucide-react';

interface Sport {
    _id: string;
    name: string;
}

interface BookingBlock {
    _id: string;
    sport: { _id: string; name: string };
    date: string;
    startTime: string;
    endTime: string;
    duration: number;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    amount: number;
    status: string;
    source?: string;
    paymentStatus?: string;
}

const HOURS = Array.from({ length: 16 }, (_, i) => `${(i + 7).toString().padStart(2, '0')}:00`);

const STATUS_COLORS: Record<string, string> = {
    confirmed: 'bg-green-500/80 border-green-500',
    pending: 'bg-yellow-500/80 border-yellow-500',
    cancelled: 'bg-red-500/40 border-red-500/50',
    rescheduled: 'bg-blue-500/40 border-blue-500/50',
};

function parseTimeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return (h * 60) + m;
}

export default function AdminCalendarPage() {
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [sports, setSports] = useState<Sport[]>([]);
    const [bookings, setBookings] = useState<BookingBlock[]>([]);
    const [loading, setLoading] = useState(true);

    // Popup state
    const [selectedBooking, setSelectedBooking] = useState<BookingBlock | null>(null);

    // Walk-in booking state
    const [walkInOpen, setWalkInOpen] = useState(false);
    const [walkInSportId, setWalkInSportId] = useState('');
    const [walkInTime, setWalkInTime] = useState('');
    const [walkInName, setWalkInName] = useState('');
    const [walkInPhone, setWalkInPhone] = useState('');
    const [walkInDuration, setWalkInDuration] = useState(1);
    const [walkInSubmitting, setWalkInSubmitting] = useState(false);
    const [walkInError, setWalkInError] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [sportsRes, bookingsRes] = await Promise.all([
                fetch('/api/sports'),
                fetch(`/api/bookings?date=${selectedDate}`)
            ]);

            const sportsData = await sportsRes.json();
            const bookingsData = await bookingsRes.json();

            if (sportsData.success) setSports(sportsData.data || []);
            if (bookingsData.success) setBookings(bookingsData.data || []);
        } catch (error) {
            console.error('Error fetching calendar data:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedDate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Get current time position for the red indicator line
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const isToday = selectedDate === format(now, 'yyyy-MM-dd');
    const timeIndicatorPercent = currentHour >= 7 && currentHour <= 22
        ? ((currentHour - 7 + currentMinute / 60) / 16) * 100
        : -1;

    // Get bookings for a specific sport
    const getBookingsForSport = (sportId: string) =>
        bookings.filter(b => b.sport?._id === sportId && b.status !== 'cancelled');

    // Calculate block position on the timeline
    const getBlockStyle = (booking: BookingBlock) => {
        const dayStart = 7 * 60;
        const timelineMinutes = 16 * 60;
        const startMinutes = parseTimeToMinutes(booking.startTime);
        const endMinutes = booking.endTime
            ? parseTimeToMinutes(booking.endTime)
            : (startMinutes + Math.round((booking.duration || 1) * 60));
        const left = ((startMinutes - dayStart) / timelineMinutes) * 100;
        const width = ((endMinutes - startMinutes) / timelineMinutes) * 100;
        return { left: `${left}%`, width: `${width}%` };
    };

    // Open walk-in form for a specific sport and time
    const openWalkIn = (sportId: string, time: string) => {
        setWalkInSportId(sportId);
        setWalkInTime(time);
        setWalkInName('');
        setWalkInPhone('');
        setWalkInDuration(1);
        setWalkInError('');
        setWalkInOpen(true);
    };

    const handleWalkInSubmit = async () => {
        if (!walkInName.trim()) {
            setWalkInError('Customer name is required');
            return;
        }

        setWalkInSubmitting(true);
        setWalkInError('');

        try {
            const res = await fetch('/api/admin/bookings/walk-in', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sportId: walkInSportId,
                    date: selectedDate,
                    startTime: walkInTime,
                    duration: walkInDuration,
                    customerName: walkInName,
                    customerPhone: walkInPhone
                })
            });

            const data = await res.json();

            if (data.success) {
                setWalkInOpen(false);
                fetchData(); // Refresh calendar
            } else {
                setWalkInError(data.error || 'Failed to create booking');
            }
        } catch {
            setWalkInError('Network error');
        } finally {
            setWalkInSubmitting(false);
        }
    };

    // Handle booking status update from popup
    const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
        try {
            const res = await fetch('/api/bookings/update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: bookingId, status: newStatus })
            });

            const data = await res.json();
            if (data.success) {
                setSelectedBooking(null);
                fetchData();
            }
        } catch (err) {
            console.error('Error updating booking status:', err);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Booking Calendar</h1>
                    <p className="text-gray-400 text-sm">
                        {format(new Date(selectedDate), 'EEEE, MMMM do, yyyy')}
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => setSelectedDate(format(subDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}
                        className="p-2 bg-white/5 rounded-lg hover:bg-white/10 text-gray-400 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    <button
                        onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
                        className="px-4 py-2 bg-primary/20 text-primary rounded-lg text-sm font-medium hover:bg-primary/30 transition-colors"
                    >
                        Today
                    </button>

                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="hidden sm:block bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
                    />

                    <button
                        onClick={() => setSelectedDate(format(addDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}
                        className="p-2 bg-white/5 rounded-lg hover:bg-white/10 text-gray-400 transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 sm:gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-500/80"></span> Confirmed</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-yellow-500/80"></span> Pending</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-500/40"></span> Rescheduled</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-6 rounded bg-red-500"></span> Now</span>
            </div>

            {/* Timeline Grid */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="bg-[#111] border border-white/10 rounded-xl overflow-x-auto">
                    {/* Time header */}
                    <div className="flex border-b border-white/10 sticky top-0 bg-[#111] z-20">
                        <div className="w-28 min-w-28 p-3 text-xs text-gray-500 font-medium border-r border-white/5">Sport</div>
                        <div className="flex-1 flex relative">
                            {HOURS.map(hour => (
                                <div key={hour} className="flex-1 p-2 text-xs text-gray-500 text-center border-r border-white/5 min-w-12">
                                    {hour}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sport rows */}
                    {sports.map(sport => (
                        <div key={sport._id} className="flex border-b border-white/5 last:border-0 group/row">
                            <div className="w-28 min-w-28 p-3 text-sm font-medium text-white border-r border-white/5 flex items-center">
                                {sport.name}
                            </div>
                            <div className="flex-1 flex relative min-h-16">
                                {/* Grid lines */}
                                {HOURS.map(hour => (
                                    <div
                                        key={hour}
                                        className="flex-1 border-r border-white/5 min-w-12 cursor-pointer hover:bg-white/5 transition-colors"
                                        onClick={() => {
                                            // Check if slot is already taken
                                            const slotStart = parseTimeToMinutes(hour);
                                            const isBooked = getBookingsForSport(sport._id).some(b => {
                                                const bStart = parseTimeToMinutes(b.startTime);
                                                const bEnd = b.endTime
                                                    ? parseTimeToMinutes(b.endTime)
                                                    : (bStart + Math.round((b.duration || 1) * 60));
                                                return slotStart >= bStart && slotStart < bEnd;
                                            });
                                            if (!isBooked) {
                                                openWalkIn(sport._id, hour);
                                            }
                                        }}
                                    />
                                ))}

                                {/* Booking blocks */}
                                {getBookingsForSport(sport._id).map(booking => (
                                    <div
                                        key={booking._id}
                                        className={`absolute top-1 bottom-1 rounded-lg border ${STATUS_COLORS[booking.status] || STATUS_COLORS.confirmed} cursor-pointer hover:brightness-125 transition-all flex items-center px-2 overflow-hidden z-10`}
                                        style={getBlockStyle(booking)}
                                        onClick={() => setSelectedBooking(booking)}
                                    >
                                        <div className="truncate">
                                            <p className="text-xs font-bold text-white truncate">{booking.customerName}</p>
                                            <p className="text-[10px] text-white/70">{booking.startTime}-{booking.endTime}</p>
                                        </div>
                                    </div>
                                ))}

                                {/* Current time indicator */}
                                {isToday && timeIndicatorPercent >= 0 && (
                                    <div
                                        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
                                        style={{ left: `${timeIndicatorPercent}%` }}
                                    >
                                        <div className="w-2 h-2 bg-red-500 rounded-full -ml-[3px] -mt-1" />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {sports.length === 0 && (
                        <div className="text-center py-12 text-gray-500">No sports configured</div>
                    )}
                </div>
            )}

            {/* ===== BOOKING DETAIL POPUP ===== */}
            {selectedBooking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setSelectedBooking(null)}>
                    <div className="bg-[#111] border border-white/10 rounded-2xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b border-white/10">
                            <h3 className="text-lg font-bold text-white">Booking Details</h3>
                            <button onClick={() => setSelectedBooking(null)} className="text-gray-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${selectedBooking.status === 'confirmed' ? 'bg-green-500/20 text-green-500' :
                                    selectedBooking.status === 'cancelled' ? 'bg-red-500/20 text-red-500' :
                                        selectedBooking.status === 'rescheduled' ? 'bg-blue-500/20 text-blue-400' :
                                            'bg-yellow-500/20 text-yellow-500'
                                    }`}>
                                    {selectedBooking.status}
                                </span>
                                {selectedBooking.source === 'walk-in' && (
                                    <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded">Walk-in</span>
                                )}
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-gray-300">
                                    <User className="w-4 h-4 text-primary" />
                                    <span className="font-medium">{selectedBooking.customerName}</span>
                                </div>
                                {selectedBooking.customerEmail && selectedBooking.customerEmail !== 'walk-in@arena360.com' && (
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <span className="w-4 text-center text-xs">@</span>
                                        {selectedBooking.customerEmail}
                                    </div>
                                )}
                                {selectedBooking.customerPhone && (
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <Phone className="w-4 h-4 text-gray-500" />
                                        {selectedBooking.customerPhone}
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-gray-300">
                                    <Clock className="w-4 h-4 text-primary" />
                                    <span>{selectedBooking.startTime} - {selectedBooking.endTime} ({selectedBooking.duration}h)</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-300">
                                    <DollarSign className="w-4 h-4 text-primary" />
                                    <span className="font-mono font-bold">Rs {selectedBooking.amount}</span>
                                </div>
                            </div>

                            {selectedBooking.status === 'confirmed' && (
                                <button
                                    onClick={() => handleStatusUpdate(selectedBooking._id, 'cancelled')}
                                    className="w-full mt-2 py-2.5 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/10 transition-colors text-sm font-medium"
                                >
                                    Cancel Booking
                                </button>
                            )}

                            {selectedBooking.status === 'pending' && (
                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={() => handleStatusUpdate(selectedBooking._id, 'confirmed')}
                                        className="flex-1 py-2.5 bg-green-500/20 text-green-400 rounded-xl hover:bg-green-500/30 transition-colors text-sm font-medium"
                                    >
                                        Confirm
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate(selectedBooking._id, 'cancelled')}
                                        className="flex-1 py-2.5 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/10 transition-colors text-sm font-medium"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ===== WALK-IN BOOKING MODAL ===== */}
            {walkInOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setWalkInOpen(false)}>
                    <div className="bg-[#111] border border-white/10 rounded-2xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b border-white/10">
                            <div>
                                <h3 className="text-lg font-bold text-white">Walk-in Booking</h3>
                                <p className="text-sm text-gray-400">{format(new Date(selectedDate), 'MMM do')} at {walkInTime}</p>
                            </div>
                            <button onClick={() => setWalkInOpen(false)} className="text-gray-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Customer Name *</label>
                                <input
                                    type="text"
                                    value={walkInName}
                                    onChange={(e) => setWalkInName(e.target.value)}
                                    placeholder="Enter name"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Phone *</label>
                                <input
                                    type="tel"
                                    value={walkInPhone}
                                    onChange={(e) => setWalkInPhone(e.target.value)}
                                    placeholder="Enter phone number"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Duration</label>
                                <div className="flex gap-2">
                                    {[1, 1.5, 2, 3].map((d) => (
                                        <button
                                            key={d}
                                            onClick={() => setWalkInDuration(d)}
                                            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors border ${walkInDuration === d
                                                ? 'bg-primary/20 border-primary/50 text-primary'
                                                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                                }`}
                                        >
                                            {d}h
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {walkInError && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {walkInError}
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setWalkInOpen(false)}
                                    className="flex-1 py-3 border border-white/10 text-gray-400 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleWalkInSubmit}
                                    disabled={walkInSubmitting || !walkInName.trim() || walkInPhone.trim().length < 10}
                                    className="flex-1 py-3 bg-primary text-black rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {walkInSubmitting ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            Booking...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-4 h-4" />
                                            Create Booking
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
