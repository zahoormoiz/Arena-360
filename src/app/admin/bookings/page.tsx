'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import {
    Search, Download, CheckCircle, XCircle, MessageCircle, BadgeDollarSign,
    ChevronLeft, ChevronRight, X, ShieldCheck, Clock, User, Phone, Mail,
    Calendar, DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/admin/AdminToast';

interface BookingRecord {
    _id: string;
    sport: { name?: string } | string;
    date: string;
    startTime: string;
    endTime: string;
    duration: number;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    amount: number;
    status: 'pending' | 'confirmed' | 'cancelled' | 'rescheduled';
    paymentStatus?: 'pending' | 'partial' | 'paid' | 'failed' | 'refunded';
    paymentMethod?: 'easypaisa' | 'jazzcash' | 'cash' | 'card' | 'other';
    paymentVerified?: boolean;
    paymentVerifiedAt?: string;
    paidAmount?: number;
    paymentReference?: string;
    source?: 'online' | 'walk-in';
    createdAt?: string;
}

interface SportOption {
    _id: string;
    name: string;
}

interface PaginationState {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

interface BookingStats {
    revenue: number;
    count: number;
    cancelled: number;
    pendingPayments: number;
}

const DEFAULT_PAGINATION: PaginationState = {
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
};

const DEFAULT_STATS: BookingStats = {
    revenue: 0,
    count: 0,
    cancelled: 0,
    pendingPayments: 0,
};

export default function BookingsPage() {
    const { showToast } = useToast();
    const [bookings, setBookings] = useState<BookingRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [pagination, setPagination] = useState<PaginationState>(DEFAULT_PAGINATION);
    const [stats, setStats] = useState<BookingStats>(DEFAULT_STATS);

    // Drawer state
    const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null);

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Manual Booking State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [sports, setSports] = useState<SportOption[]>([]);
    const [newBooking, setNewBooking] = useState({
        sportId: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        startTime: '10:00',
        duration: 1,
        customerName: '',
        customerPhone: ''
    });

    const buildParams = useCallback((options?: { format?: 'csv' }) => {
        const params = new URLSearchParams();

        if (search.trim()) params.set('search', search.trim());
        if (statusFilter !== 'all') params.set('status', statusFilter);
        if (paymentStatusFilter !== 'all') params.set('paymentStatus', paymentStatusFilter);
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);

        if (options?.format === 'csv') {
            params.set('format', 'csv');
        } else {
            params.set('page', String(pagination.page));
            params.set('limit', String(pagination.limit));
        }

        return params;
    }, [search, statusFilter, paymentStatusFilter, startDate, endDate, pagination.page, pagination.limit]);

    const fetchBookings = useCallback(async (showLoader = true) => {
        try {
            if (showLoader) setLoading(true);

            const res = await fetch(`/api/admin/bookings?${buildParams().toString()}`, {
                cache: 'no-store'
            });
            const data = await res.json();

            if (data.success) {
                setBookings(data.data || []);
                setPagination((prev) => ({
                    ...prev,
                    ...(data.pagination || {})
                }));
                setStats(data.stats || DEFAULT_STATS);
            }
        } catch (error) {
            console.error('Failed to fetch bookings:', error);
        } finally {
            if (showLoader) setLoading(false);
        }
    }, [buildParams]);

    useEffect(() => {
        fetchBookings();
        const interval = setInterval(() => fetchBookings(false), 15000);
        return () => clearInterval(interval);
    }, [fetchBookings]);

    useEffect(() => {
        fetch('/api/admin/sports').then(res => res.json()).then(data => {
            if (data.success) setSports(data.data);
        });
    }, []);

    const handleStatusUpdate = async (id: string, newStatus: BookingRecord['status']) => {
        if (!confirm(`Mark booking as ${newStatus}?`)) return;
        try {
            const res = await fetch('/api/bookings/update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus })
            });

            const data = await res.json();
            if (!data.success) {
                showToast(data.error || 'Failed to update status', 'error');
                return;
            }
            showToast(`Booking ${newStatus} successfully`, 'success');
            fetchBookings(false);
            if (selectedBooking?._id === id) setSelectedBooking(null);
        } catch {
            showToast('Error updating booking', 'error');
        }
    };

    const handleMarkPaid = async (booking: BookingRecord) => {
        if (!confirm(`Mark full amount (Rs ${booking.amount}) as paid for ${booking.customerName}?`)) return;

        try {
            const res = await fetch('/api/bookings/update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: booking._id,
                    paymentStatus: 'paid',
                    paidAmount: booking.amount,
                    paymentVerified: true,
                    paymentMethod: booking.paymentMethod || (booking.source === 'walk-in' ? 'cash' : 'other')
                })
            });

            const data = await res.json();
            if (!data.success) {
                showToast(data.error || 'Failed to mark payment', 'error');
                return;
            }
            showToast('Full payment marked as paid', 'success');
            fetchBookings(false);
            if (selectedBooking?._id === booking._id) {
                setSelectedBooking(data.data);
            }
        } catch {
            showToast('Failed to update payment', 'error');
        }
    };

    const handleMarkAdvancePaid = async (booking: BookingRecord) => {
        const advanceAmount = Math.ceil(booking.amount * 0.2);
        if (!confirm(`Mark 20% advance (Rs ${advanceAmount}) as paid for ${booking.customerName}?`)) return;

        try {
            const res = await fetch('/api/bookings/update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: booking._id,
                    paymentStatus: 'partial',
                    paidAmount: advanceAmount,
                    paymentVerified: true,
                    paymentMethod: booking.paymentMethod || (booking.source === 'walk-in' ? 'cash' : 'other')
                })
            });

            const data = await res.json();
            if (!data.success) {
                showToast(data.error || 'Failed to mark advance payment', 'error');
                return;
            }
            showToast('Advance payment marked as paid', 'success');
            fetchBookings(false);
            if (selectedBooking?._id === booking._id) {
                setSelectedBooking(data.data);
            }
        } catch {
            showToast('Failed to update advance payment', 'error');
        }
    };

    const handleExportCsv = async () => {
        try {
            setExporting(true);
            const res = await fetch(`/api/admin/bookings?${buildParams({ format: 'csv' }).toString()}`, {
                cache: 'no-store'
            });

            if (!res.ok) {
                showToast('Failed to export CSV', 'error');
                return;
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `arena360-bookings-${format(new Date(), 'yyyy-MM-dd')}.csv`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            showToast('CSV exported successfully', 'success');
        } catch {
            showToast('Failed to export CSV', 'error');
        } finally {
            setExporting(false);
        }
    };

    const handleCreateBooking = async (e: React.FormEvent) => {
        e.preventDefault();

        // Pre-flight conflict check
        try {
            const checkRes = await fetch(`/api/availability?sportId=${newBooking.sportId}&date=${newBooking.date}`);
            const checkData = await checkRes.json();
            if (checkData.success && checkData.data) {
                const startHour = parseInt(newBooking.startTime.split(':')[0]);
                const durationHours = newBooking.duration;
                const bookedSlots = checkData.data.map((s: any) => parseInt(s.startTime?.split(':')[0]));

                for (let h = 0; h < durationHours; h++) {
                    if (bookedSlots.includes(startHour + h)) {
                        showToast(`Time conflict detected: ${startHour + h}:00 is already booked`, 'warning');
                        return;
                    }
                }
            }
        } catch {
            // If availability check fails, proceed — the walk-in API has its own conflict check
        }

        try {
            const res = await fetch('/api/admin/bookings/walk-in', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newBooking)
            });
            const data = await res.json();
            if (data.success) {
                showToast('Booking created successfully', 'success');
                setIsModalOpen(false);
                fetchBookings();
                setNewBooking({
                    sportId: '',
                    date: format(new Date(), 'yyyy-MM-dd'),
                    startTime: '10:00',
                    duration: 1,
                    customerName: '',
                    customerPhone: ''
                });
            } else {
                showToast('Error: ' + data.error, 'error');
            }
        } catch {
            showToast('Failed to create booking', 'error');
        }
    };

    const paymentBadgeClass = (paymentStatus?: string) => {
        switch (paymentStatus) {
            case 'paid':
                return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'partial':
                return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'failed':
                return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'refunded':
                return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            default:
                return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
        }
    };

    const totalFrom = pagination.total === 0 ? 0 : ((pagination.page - 1) * pagination.limit) + 1;
    const totalTo = Math.min(pagination.page * pagination.limit, pagination.total);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Bookings Management</h1>
                    <p className="text-gray-400">Operational control with payment visibility and server-side filtering</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-primary text-black hover:bg-primary/90">
                        + New Booking
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={handleExportCsv}
                        disabled={exporting}
                    >
                        <Download size={16} /> {exporting ? 'Exporting...' : 'Export CSV'}
                    </Button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col gap-4">
                <div className="relative flex-1 w-full">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search customer, phone, email, payment ref..."
                        className="w-full bg-black/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:border-primary focus:ring-0"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPagination((prev) => ({ ...prev, page: 1 }));
                        }}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <select
                        className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setPagination((prev) => ({ ...prev, page: 1 }));
                        }}
                    >
                        <option value="all">All Booking Status</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="rescheduled">Rescheduled</option>
                        <option value="cancelled">Cancelled</option>
                    </select>

                    <select
                        className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                        value={paymentStatusFilter}
                        onChange={(e) => {
                            setPaymentStatusFilter(e.target.value);
                            setPagination((prev) => ({ ...prev, page: 1 }));
                        }}
                    >
                        <option value="all">All Payment Status</option>
                        <option value="pending">Pending</option>
                        <option value="partial">Partial</option>
                        <option value="paid">Paid</option>
                        <option value="failed">Failed</option>
                        <option value="refunded">Refunded</option>
                    </select>

                    <input
                        type="date"
                        className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                        value={startDate}
                        onChange={(e) => {
                            setStartDate(e.target.value);
                            setPagination((prev) => ({ ...prev, page: 1 }));
                        }}
                    />
                    <span className="text-gray-500">-</span>
                    <input
                        type="date"
                        className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                        value={endDate}
                        onChange={(e) => {
                            setEndDate(e.target.value);
                            setPagination((prev) => ({ ...prev, page: 1 }));
                        }}
                    />
                </div>
            </div>

            {/* Summary Bar */}
            <div className="flex flex-wrap items-center gap-6 text-sm">
                <span className="text-gray-400">Showing <span className="text-white font-bold">{totalFrom}-{totalTo}</span> of {pagination.total} bookings</span>
                <span className="text-gray-600">|</span>
                <span className="text-gray-400">Revenue: <span className="text-primary font-mono font-bold">Rs {Number(stats.revenue || 0).toLocaleString()}</span></span>
                <span className="text-gray-600">|</span>
                <span className="text-gray-400">Pending Payments: <span className="text-yellow-500 font-bold">{stats.pendingPayments}</span></span>
            </div>

            {/* Table */}
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-black/20 text-gray-400 uppercase text-xs font-semibold">
                            <tr>
                                <th className="px-6 py-3">Booking Details</th>
                                <th className="px-6 py-3">Customer</th>
                                <th className="px-6 py-3">Date & Time</th>
                                <th className="px-6 py-3 text-right">Amount</th>
                                <th className="px-6 py-3">Payment</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {loading ? (
                                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Loading bookings...</td></tr>
                            ) : bookings.length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No bookings found matching filters</td></tr>
                            ) : (
                                bookings.map((b) => (
                                    <tr
                                        key={b._id}
                                        className="hover:bg-white/5 transition-colors group cursor-pointer"
                                        onClick={() => setSelectedBooking(b)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-white">
                                                {typeof b.sport === 'string' ? b.sport : b.sport?.name || 'Unknown Sport'}
                                            </div>
                                            <div className="text-xs text-gray-500 font-mono">{b._id.slice(-6).toUpperCase()} {b.source === 'walk-in' ? '• Walk-in' : ''}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-gray-300">{b.customerName}</div>
                                            <div className="text-xs text-gray-500 flex items-center gap-1.5">
                                                {b.customerPhone}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-gray-300">{format(new Date(b.date + 'T00:00:00'), 'MMM do, yyyy')}</div>
                                            <div className="text-xs text-gray-500">{b.startTime} - {b.endTime} ({b.duration}h)</div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-white">
                                            Rs {b.amount}
                                            {b.source === 'online' && b.paymentStatus === 'pending' && (
                                                <div className="text-[10px] text-amber-500/80 mt-1 font-sans">
                                                    Adv: Rs {Math.ceil(b.amount * 0.2)}
                                                </div>
                                            )}
                                            {b.paidAmount !== undefined && b.paidAmount > 0 && b.amount > b.paidAmount && (
                                                <div className="text-[10px] text-gray-400 mt-1 font-sans">
                                                    Bal: Rs {b.amount - b.paidAmount}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`inline-flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold capitalize border ${paymentBadgeClass(b.paymentStatus)}`}>
                                                        {b.paymentStatus || 'pending'}
                                                    </span>
                                                    {b.paymentVerified && (
                                                        <span title="Payment Verified" className="flex items-center">
                                                            <ShieldCheck size={14} className="text-green-500" />
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[11px] text-gray-500 uppercase tracking-wide">
                                                    {b.paymentMethod || 'N/A'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold capitalize border
                                                ${b.status === 'confirmed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                    b.status === 'cancelled' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                        b.status === 'rescheduled' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                            'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                                                {b.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex gap-2 justify-end items-center">
                                                <a
                                                    href={`https://wa.me/${b.customerPhone.replace(/[^\d]/g, '').replace(/^0/, '92')}?text=${encodeURIComponent(`Hi ${b.customerName}! This is Arena360 regarding your ${typeof b.sport === 'string' ? b.sport : b.sport?.name || ''} booking on ${b.date}.`)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1.5 hover:bg-[#25D366]/20 rounded-lg text-[#25D366] transition-colors"
                                                    title="WhatsApp Customer"
                                                >
                                                    <MessageCircle size={17} />
                                                </a>
                                                <div className="flex gap-1">
                                                    {b.paymentStatus === 'pending' && b.source === 'online' && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleMarkAdvancePaid(b); }}
                                                            className="p-1 hover:bg-amber-500/20 rounded text-amber-500"
                                                            title="Mark Advance Paid"
                                                        >
                                                            <BadgeDollarSign size={18} />
                                                        </button>
                                                    )}
                                                    {b.paymentStatus !== 'paid' && b.status !== 'cancelled' && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleMarkPaid(b); }}
                                                            className="p-1 hover:bg-emerald-500/20 rounded text-emerald-400"
                                                            title="Mark Full Amount Paid"
                                                        >
                                                            <DollarSign size={18} />
                                                        </button>
                                                    )}
                                                    {b.status === 'pending' && (
                                                        <button onClick={() => handleStatusUpdate(b._id, 'confirmed')} className="p-1 hover:bg-green-500/20 rounded text-green-500" title="Confirm">
                                                            <CheckCircle size={18} />
                                                        </button>
                                                    )}
                                                    {b.status !== 'cancelled' && (
                                                        <button onClick={() => handleStatusUpdate(b._id, 'cancelled')} className="p-1 hover:bg-red-500/20 rounded text-red-500" title="Cancel">
                                                            <XCircle size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                    Page {pagination.page} of {pagination.totalPages}
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page <= 1}
                        onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                    >
                        <ChevronLeft size={16} />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page >= pagination.totalPages}
                        onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                    >
                        <ChevronRight size={16} />
                    </Button>
                </div>
            </div>

            {/* ===== BOOKING DETAIL DRAWER ===== */}
            {selectedBooking && (
                <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedBooking(null)}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <div
                        className="relative w-full max-w-md bg-[#0d0d0d] border-l border-white/10 h-full overflow-y-auto animate-[slideDrawer_0.3s_ease-out]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="sticky top-0 bg-[#0d0d0d]/95 backdrop-blur-xl border-b border-white/10 p-5 flex items-center justify-between z-10">
                            <h3 className="text-lg font-bold text-white">Booking Details</h3>
                            <button onClick={() => setSelectedBooking(null)} className="text-gray-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 space-y-6">
                            {/* Status Badge Row */}
                            <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold px-3 py-1.5 rounded-lg uppercase ${selectedBooking.status === 'confirmed' ? 'bg-green-500/20 text-green-500' :
                                    selectedBooking.status === 'cancelled' ? 'bg-red-500/20 text-red-500' :
                                        selectedBooking.status === 'rescheduled' ? 'bg-blue-500/20 text-blue-400' :
                                            'bg-yellow-500/20 text-yellow-500'
                                    }`}>
                                    {selectedBooking.status}
                                </span>
                                {selectedBooking.source === 'walk-in' && (
                                    <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded">Walk-in</span>
                                )}
                                {selectedBooking.paymentVerified && (
                                    <span className="text-xs px-2 py-1 bg-green-500/10 text-green-500 rounded flex items-center gap-1">
                                        <ShieldCheck size={12} /> Verified
                                    </span>
                                )}
                            </div>

                            {/* Booking ID */}
                            <div className="text-xs font-mono text-gray-500">
                                ID: {selectedBooking._id}
                            </div>

                            {/* Customer Info Card */}
                            <div className="bg-white/5 rounded-xl p-4 space-y-3 border border-white/10">
                                <h4 className="text-xs uppercase text-gray-400 font-bold tracking-wider">Customer</h4>
                                <div className="flex items-center gap-2 text-white">
                                    <User className="w-4 h-4 text-primary" />
                                    <span className="font-medium">{selectedBooking.customerName}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-400 text-sm">
                                    <Phone className="w-4 h-4 text-gray-500" />
                                    {selectedBooking.customerPhone}
                                </div>
                                {selectedBooking.customerEmail && selectedBooking.customerEmail !== 'walk-in@arena360.com' && (
                                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                                        <Mail className="w-4 h-4 text-gray-500" />
                                        {selectedBooking.customerEmail}
                                    </div>
                                )}
                            </div>

                            {/* Booking Info Card */}
                            <div className="bg-white/5 rounded-xl p-4 space-y-3 border border-white/10">
                                <h4 className="text-xs uppercase text-gray-400 font-bold tracking-wider">Booking</h4>
                                <div className="flex items-center gap-2 text-white text-sm">
                                    <Calendar className="w-4 h-4 text-primary" />
                                    {format(new Date(selectedBooking.date + 'T00:00:00'), 'EEEE, MMM do, yyyy')}
                                </div>
                                <div className="flex items-center gap-2 text-white text-sm">
                                    <Clock className="w-4 h-4 text-primary" />
                                    {selectedBooking.startTime} – {selectedBooking.endTime} ({selectedBooking.duration}h)
                                </div>
                                <div className="text-sm text-gray-300">
                                    Sport: <span className="text-white font-medium">{typeof selectedBooking.sport === 'string' ? selectedBooking.sport : selectedBooking.sport?.name || 'Unknown'}</span>
                                </div>
                            </div>

                            {/* Payment Info Card */}
                            <div className="bg-white/5 rounded-xl p-4 space-y-3 border border-white/10">
                                <h4 className="text-xs uppercase text-gray-400 font-bold tracking-wider">Payment</h4>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400 text-sm">Amount</span>
                                    <span className="text-white font-mono font-bold text-lg">Rs {selectedBooking.amount}</span>
                                </div>
                                {selectedBooking.source === 'online' && selectedBooking.paymentStatus === 'pending' && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-amber-500/80 text-sm">Advance Required</span>
                                        <span className="text-amber-400 font-mono font-bold">Rs {Math.ceil(selectedBooking.amount * 0.2)}</span>
                                    </div>
                                )}
                                {selectedBooking.paidAmount !== undefined && selectedBooking.paidAmount > 0 && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-400 text-sm">Paid</span>
                                        <span className="text-green-400 font-mono font-bold">Rs {selectedBooking.paidAmount}</span>
                                    </div>
                                )}
                                {selectedBooking.paidAmount !== undefined && selectedBooking.paidAmount > 0 && selectedBooking.amount > selectedBooking.paidAmount && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-400 text-sm">Pending Balance</span>
                                        <span className="text-yellow-400 font-mono font-bold">Rs {selectedBooking.amount - selectedBooking.paidAmount}</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400 text-sm">Status</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold capitalize border ${paymentBadgeClass(selectedBooking.paymentStatus)}`}>
                                        {selectedBooking.paymentStatus || 'pending'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400 text-sm">Method</span>
                                    <span className="text-white text-sm capitalize">{selectedBooking.paymentMethod || 'N/A'}</span>
                                </div>
                                {selectedBooking.paymentReference && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-400 text-sm">Reference</span>
                                        <span className="text-white font-mono text-xs">{selectedBooking.paymentReference}</span>
                                    </div>
                                )}
                                {selectedBooking.paymentVerifiedAt && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-400 text-sm">Verified At</span>
                                        <span className="text-gray-300 text-xs">{format(new Date(selectedBooking.paymentVerifiedAt), 'MMM do, HH:mm')}</span>
                                    </div>
                                )}
                            </div>

                            {/* Created At */}
                            {selectedBooking.createdAt && (
                                <div className="text-xs text-gray-500">
                                    Created: {format(new Date(selectedBooking.createdAt), 'MMM do, yyyy HH:mm')}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="space-y-2 pt-2">
                                {selectedBooking.paymentStatus !== 'paid' && selectedBooking.status !== 'cancelled' && (
                                    <>
                                        {selectedBooking.source === 'online' && selectedBooking.paymentStatus === 'pending' && (
                                            <button
                                                onClick={() => handleMarkAdvancePaid(selectedBooking)}
                                                className="w-full py-2.5 bg-amber-500/20 text-amber-500 rounded-xl font-medium text-sm hover:bg-amber-500/30 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <BadgeDollarSign className="w-4 h-4" /> Mark Advance Paid
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleMarkPaid(selectedBooking)}
                                            className="w-full py-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl font-medium text-sm hover:bg-emerald-500/30 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <DollarSign className="w-4 h-4" /> Mark Full Amount Paid
                                        </button>
                                    </>
                                )}
                                {selectedBooking.status === 'pending' && (
                                    <button
                                        onClick={() => handleStatusUpdate(selectedBooking._id, 'confirmed')}
                                        className="w-full py-2.5 bg-green-500/20 text-green-400 rounded-xl font-medium text-sm hover:bg-green-500/30 transition-colors"
                                    >
                                        Confirm Booking
                                    </button>
                                )}
                                {selectedBooking.status !== 'cancelled' && (
                                    <button
                                        onClick={() => handleStatusUpdate(selectedBooking._id, 'cancelled')}
                                        className="w-full py-2.5 border border-red-500/30 text-red-400 rounded-xl font-medium text-sm hover:bg-red-500/10 transition-colors"
                                    >
                                        Cancel Booking
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Manual Booking Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#111] border border-white/10 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">x</button>
                        <h2 className="text-xl font-bold text-white mb-6">Create New Booking</h2>

                        <form onSubmit={handleCreateBooking} className="space-y-4">
                            <div>
                                <label className="text-xs uppercase text-gray-500 font-bold block mb-1">Select Sport</label>
                                <select required className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white"
                                    value={newBooking.sportId} onChange={e => setNewBooking({ ...newBooking, sportId: e.target.value })}>
                                    <option value="">-- Choose Sport --</option>
                                    {sports.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs uppercase text-gray-500 font-bold block mb-1">Date</label>
                                    <input required type="date" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white"
                                        value={newBooking.date} onChange={e => setNewBooking({ ...newBooking, date: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs uppercase text-gray-500 font-bold block mb-1">Time</label>
                                    <input required type="time" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white"
                                        value={newBooking.startTime} onChange={e => setNewBooking({ ...newBooking, startTime: e.target.value })} />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs uppercase text-gray-500 font-bold block mb-1">Duration (Hours)</label>
                                <select className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white"
                                    value={newBooking.duration} onChange={e => setNewBooking({ ...newBooking, duration: Number(e.target.value) })}>
                                    <option value={1}>1 Hour</option>
                                    <option value={1.5}>1.5 Hours</option>
                                    <option value={2}>2 Hours</option>
                                    <option value={3}>3 Hours</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs uppercase text-gray-500 font-bold block mb-1">Customer Name</label>
                                    <input required type="text" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white"
                                        value={newBooking.customerName} onChange={e => setNewBooking({ ...newBooking, customerName: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs uppercase text-gray-500 font-bold block mb-1">Phone</label>
                                    <input required type="text" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white"
                                        value={newBooking.customerPhone} onChange={e => setNewBooking({ ...newBooking, customerPhone: e.target.value })} />
                                </div>
                            </div>

                            <Button fullWidth className="mt-4 bg-primary text-black hover:bg-primary/90">Confirm Booking</Button>
                        </form>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes slideDrawer {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
            `}</style>
        </div>
    );
}
