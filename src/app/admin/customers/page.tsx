'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Star, Clock, Phone, MessageCircle, ChevronLeft, ChevronRight, X, Calendar, DollarSign, User } from 'lucide-react';
import { format } from 'date-fns';

interface Customer {
    name: string;
    phone: string;
    email?: string;
    totalBookings: number;
    totalSpend: number;
    cancelledBookings: number;
    lastBooking: string;
    firstBooking: string;
    favoriteSport: string;
    frequencyScore: 'VIP' | 'Regular' | 'Occasional';
}

interface CustomerDetail {
    bookings: any[];
    summary: {
        totalBookings: number;
        totalSpend: number;
        confirmedCount: number;
        cancelledCount: number;
        customerName: string;
        customerEmail: string;
    };
}

const FREQUENCY_BADGE: Record<string, { bg: string; text: string; label: string }> = {
    VIP: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: '⭐ VIP' },
    Regular: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Regular' },
    Occasional: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Occasional' },
};

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // Detail panel
    const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
    const [customerDetail, setCustomerDetail] = useState<CustomerDetail | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const fetchCustomers = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (search.trim()) params.set('search', search.trim());
            params.set('page', String(page));
            params.set('limit', '25');

            const res = await fetch(`/api/admin/customers?${params.toString()}`);
            const data = await res.json();
            if (data.success) {
                setCustomers(data.data || []);
                setTotalPages(data.pagination?.totalPages || 1);
                setTotal(data.pagination?.total || 0);
            }
        } catch (e) {
            console.error('Failed to load customers:', e);
        } finally {
            setLoading(false);
        }
    }, [search, page]);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    const openDetail = async (phone: string) => {
        setSelectedPhone(phone);
        setLoadingDetail(true);
        try {
            const res = await fetch(`/api/admin/customers/${encodeURIComponent(phone)}`);
            const data = await res.json();
            if (data.success) {
                setCustomerDetail(data.data);
            }
        } catch (e) {
            console.error('Failed to load customer detail:', e);
        } finally {
            setLoadingDetail(false);
        }
    };

    const vipCount = customers.filter(c => c.frequencyScore === 'VIP').length;
    const regularCount = customers.filter(c => c.frequencyScore === 'Regular').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Customer Intelligence</h1>
                <p className="text-gray-400 text-sm">Server-side analytics with frequency scoring and booking history</p>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white/5 rounded-xl border border-white/10 p-4 text-center">
                    <div className="text-2xl font-bold text-white">{total}</div>
                    <div className="text-xs text-gray-400 mt-1">Total Customers</div>
                </div>
                <div className="bg-white/5 rounded-xl border border-white/10 p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-400">{vipCount}</div>
                    <div className="text-xs text-gray-400 mt-1">VIP (10+ bookings)</div>
                </div>
                <div className="bg-white/5 rounded-xl border border-white/10 p-4 text-center">
                    <div className="text-2xl font-bold text-blue-400">{regularCount}</div>
                    <div className="text-xs text-gray-400 mt-1">Regular (3-9)</div>
                </div>
                <div className="bg-white/5 rounded-xl border border-white/10 p-4 text-center">
                    <div className="text-2xl font-bold text-gray-400">{total - vipCount - regularCount}</div>
                    <div className="text-xs text-gray-400 mt-1">Occasional (1-2)</div>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search by name, phone, or email..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:border-primary focus:ring-0 transition-colors"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                />
            </div>

            {/* Customer Table */}
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-black/20 text-gray-400 uppercase text-xs font-semibold">
                            <tr>
                                <th className="px-6 py-3">Customer</th>
                                <th className="px-6 py-3">Tier</th>
                                <th className="px-6 py-3 text-center">Bookings</th>
                                <th className="px-6 py-3 text-right">Total Spend</th>
                                <th className="px-6 py-3">Favorite Sport</th>
                                <th className="px-6 py-3">Last Seen</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {loading ? (
                                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Loading customers...</td></tr>
                            ) : customers.length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No customers found</td></tr>
                            ) : (
                                customers.map((c) => (
                                    <tr
                                        key={c.phone}
                                        className="hover:bg-white/5 transition-colors cursor-pointer group"
                                        onClick={() => openDetail(c.phone)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-white">{c.name}</div>
                                            <div className="text-xs text-gray-500 flex items-center gap-1">
                                                <Phone size={11} /> {c.phone}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${FREQUENCY_BADGE[c.frequencyScore]?.bg} ${FREQUENCY_BADGE[c.frequencyScore]?.text}`}>
                                                {FREQUENCY_BADGE[c.frequencyScore]?.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-white font-bold">{c.totalBookings}</span>
                                            {c.cancelledBookings > 0 && (
                                                <span className="text-red-400 text-xs ml-1">({c.cancelledBookings} cancelled)</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-primary font-bold">
                                            Rs {c.totalSpend.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-gray-300">
                                            {c.favoriteSport || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-400 text-xs">
                                            {c.lastBooking
                                                ? format(new Date(c.lastBooking + 'T00:00:00'), 'MMM do, yyyy')
                                                : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                            <a
                                                href={`https://wa.me/${c.phone.replace(/[^\d]/g, '').replace(/^0/, '92')}?text=${encodeURIComponent(`Hi ${c.name}! This is Arena360.`)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-block p-2 hover:bg-[#25D366]/20 rounded-lg text-[#25D366] transition-colors"
                                                title="WhatsApp"
                                            >
                                                <MessageCircle size={17} />
                                            </a>
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
                    Page {page} of {totalPages} ({total} customers)
                </div>
                <div className="flex items-center gap-2">
                    <button
                        disabled={page <= 1}
                        onClick={() => setPage(page - 1)}
                        className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white disabled:opacity-30"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        disabled={page >= totalPages}
                        onClick={() => setPage(page + 1)}
                        className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white disabled:opacity-30"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* ===== CUSTOMER DETAIL DRAWER ===== */}
            {selectedPhone && (
                <div className="fixed inset-0 z-50 flex justify-end" onClick={() => { setSelectedPhone(null); setCustomerDetail(null); }}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <div
                        className="relative w-full max-w-md bg-[#0d0d0d] border-l border-white/10 h-full overflow-y-auto animate-[slideDrawer_0.3s_ease-out]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="sticky top-0 bg-[#0d0d0d]/95 backdrop-blur-xl border-b border-white/10 p-5 flex items-center justify-between z-10">
                            <h3 className="text-lg font-bold text-white">Customer History</h3>
                            <button onClick={() => { setSelectedPhone(null); setCustomerDetail(null); }} className="text-gray-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 space-y-6">
                            {loadingDetail ? (
                                <div className="text-gray-500 text-center py-12">Loading history...</div>
                            ) : customerDetail ? (
                                <>
                                    {/* Customer Summary Card */}
                                    <div className="bg-white/5 rounded-xl p-5 border border-white/10 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                                                <User className="w-6 h-6 text-primary" />
                                            </div>
                                            <div>
                                                <div className="text-white font-bold text-lg">{customerDetail.summary.customerName}</div>
                                                <div className="text-gray-400 text-sm">{selectedPhone}</div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3 mt-4">
                                            <div className="text-center bg-black/30 rounded-lg p-3">
                                                <div className="text-white font-bold text-lg">{customerDetail.summary.totalBookings}</div>
                                                <div className="text-[11px] text-gray-500">Total</div>
                                            </div>
                                            <div className="text-center bg-black/30 rounded-lg p-3">
                                                <div className="text-green-400 font-bold text-lg">{customerDetail.summary.confirmedCount}</div>
                                                <div className="text-[11px] text-gray-500">Confirmed</div>
                                            </div>
                                            <div className="text-center bg-black/30 rounded-lg p-3">
                                                <div className="text-primary font-bold font-mono text-lg">Rs {customerDetail.summary.totalSpend.toLocaleString()}</div>
                                                <div className="text-[11px] text-gray-500">Spent</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Booking Timeline */}
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3">Booking History</h4>
                                        <div className="space-y-2">
                                            {customerDetail.bookings.length === 0 && (
                                                <div className="text-gray-500 text-center py-4">No bookings found</div>
                                            )}
                                            {customerDetail.bookings.map((b: any) => (
                                                <div key={b._id} className="bg-white/5 rounded-lg p-4 border border-white/5 hover:border-white/10 transition-colors">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-white font-medium text-sm">
                                                            {typeof b.sport === 'string' ? b.sport : b.sport?.name || 'Unknown'}
                                                        </span>
                                                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${b.status === 'confirmed' ? 'bg-green-500/20 text-green-500' :
                                                                b.status === 'cancelled' ? 'bg-red-500/20 text-red-500' :
                                                                    b.status === 'rescheduled' ? 'bg-blue-500/20 text-blue-400' :
                                                                        'bg-yellow-500/20 text-yellow-500'
                                                            }`}>
                                                            {b.status}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs text-gray-400">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar size={12} />
                                                            {format(new Date(b.date + 'T00:00:00'), 'MMM do, yyyy')}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock size={12} />
                                                            {b.startTime} - {b.endTime}
                                                        </span>
                                                        <span className="flex items-center gap-1 ml-auto text-primary font-mono">
                                                            <DollarSign size={12} />
                                                            Rs {b.amount}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-gray-500 text-center py-12">Failed to load customer data</div>
                            )}
                        </div>
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
