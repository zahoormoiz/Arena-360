'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
    BarChart, Bar, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import {
    DollarSign, Calendar as CalendarIcon,
    Users, TrendingDown, Clock, AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

const PERIOD_OPTIONS = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
];

const DONUT_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        revenue: 0, count: 0, confirmed: 0,
        cancelled: 0, cancellationRate: 0, pendingPayments: 0, todayBookings: 0
    });
    const [chartData, setChartData] = useState<{ date: string; revenue: number; bookings: number }[]>([]);
    const [sportsDistribution, setSportsDistribution] = useState<{ name: string; count: number }[]>([]);
    const [recentBookings, setRecentBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('7d');

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 15000);
        return () => clearInterval(interval);
    }, [period]);

    const fetchData = async () => {
        try {
            const res = await fetch(`/api/admin/stats?period=${period}`);
            const data = await res.json();
            if (data.success) {
                setStats(data.stats);
                setChartData(data.chart);
                setSportsDistribution(data.sportsDistribution || []);
                setRecentBookings(data.recent);
            }
            setLoading(false);
        } catch {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">Dashboard Overview</h1>
                    <p className="text-gray-400 text-sm">Welcome back, Admin</p>
                </div>
                <div className="text-left sm:text-right">
                    <p className="text-xl font-mono text-primary font-bold">{format(new Date(), 'HH:mm')}</p>
                    <p className="text-xs text-gray-400">{format(new Date(), 'EEEE, MMM do')}</p>
                </div>
            </header>

            {/* KPI Cards — 2 rows of 3 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {/* Total Revenue */}
                <div className="bg-white/5 p-5 md:p-6 rounded-2xl border border-white/10 relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-6 opacity-10">
                        <DollarSign size={64} />
                    </div>
                    <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">Total Revenue</h3>
                    <p className="text-3xl md:text-4xl font-bold text-white">Rs {stats.revenue.toLocaleString()}</p>
                </div>

                {/* Total Bookings */}
                <div className="bg-white/5 p-5 md:p-6 rounded-2xl border border-white/10 relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-6 opacity-10">
                        <CalendarIcon size={64} />
                    </div>
                    <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">Total Bookings</h3>
                    <p className="text-3xl md:text-4xl font-bold text-white">{stats.count}</p>
                    <div className="mt-2 text-green-500 text-sm">{stats.confirmed} Confirmed</div>
                </div>

                {/* Today's Bookings */}
                <div className="bg-white/5 p-5 md:p-6 rounded-2xl border border-white/10 relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-6 opacity-10">
                        <Clock size={64} />
                    </div>
                    <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">Today&apos;s Bookings</h3>
                    <p className="text-3xl md:text-4xl font-bold text-white">{stats.todayBookings}</p>
                    <div className="mt-2 text-gray-500 text-sm">Active today</div>
                </div>

                {/* Cancellation Rate */}
                <div className="bg-white/5 p-5 md:p-6 rounded-2xl border border-white/10 relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-6 opacity-10">
                        <TrendingDown size={64} />
                    </div>
                    <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">Cancellation Rate</h3>
                    <p className={`text-3xl md:text-4xl font-bold ${stats.cancellationRate > 20 ? 'text-red-400' : stats.cancellationRate > 10 ? 'text-yellow-400' : 'text-green-400'}`}>
                        {stats.cancellationRate}%
                    </p>
                    <div className="mt-2 text-gray-500 text-sm">{stats.cancelled} cancelled</div>
                </div>

                {/* Pending Payments */}
                <div className="bg-white/5 p-5 md:p-6 rounded-2xl border border-white/10 relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-6 opacity-10">
                        <AlertTriangle size={64} />
                    </div>
                    <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">Pending Payments</h3>
                    <p className={`text-3xl md:text-4xl font-bold ${stats.pendingPayments > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                        {stats.pendingPayments}
                    </p>
                    <div className="mt-2 text-gray-500 text-sm">
                        {stats.pendingPayments > 0 ? 'Need attention' : 'All clear'}
                    </div>
                </div>

                {/* Utilization / Conversion */}
                <div className="bg-white/5 p-5 md:p-6 rounded-2xl border border-white/10 relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-6 opacity-10">
                        <Users size={64} />
                    </div>
                    <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">Conversion Rate</h3>
                    <p className="text-3xl md:text-4xl font-bold text-white">
                        {stats.count > 0 ? Math.round((stats.confirmed / stats.count) * 100) : 0}%
                    </p>
                    <div className="mt-2 text-gray-500 text-sm">Confirmed / Total</div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 bg-white/5 p-6 rounded-2xl border border-white/10">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                        <h3 className="text-lg font-bold text-white">Revenue Trend</h3>
                        <div className="flex gap-1 bg-black/30 p-1 rounded-lg">
                            {PERIOD_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => setPeriod(opt.value)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${period === opt.value
                                            ? 'bg-primary text-black'
                                            : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <XAxis dataKey="date" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: '#111', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                                    itemStyle={{ color: '#22c55e' }}
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                />
                                <Bar dataKey="revenue" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={period === '90d' ? 6 : period === '30d' ? 12 : 40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Sports Distribution Donut */}
                <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                    <h3 className="text-lg font-bold text-white mb-6">Sports Distribution</h3>
                    {sportsDistribution.length > 0 ? (
                        <>
                            <div className="h-[200px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={sportsDistribution}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            dataKey="count"
                                            nameKey="name"
                                            stroke="none"
                                        >
                                            {sportsDistribution.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip
                                            contentStyle={{ backgroundColor: '#111', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-2 mt-4">
                                {sportsDistribution.map((sport, i) => (
                                    <div key={sport.name} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
                                            />
                                            <span className="text-gray-300">{sport.name || 'Unknown'}</span>
                                        </div>
                                        <span className="text-white font-mono font-bold">{sport.count}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-gray-500 text-center py-12">No data yet</div>
                    )}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-white">Recent Activity</h3>
                    <Link href="/admin/bookings" className="text-sm text-primary hover:underline">View All</Link>
                </div>

                <div className="space-y-3">
                    {loading && <div className="text-gray-500 text-center py-4">Loading...</div>}
                    {!loading && recentBookings.length === 0 && <div className="text-gray-500 text-center py-4">No recent activity</div>}
                    {recentBookings.map((b) => (
                        <div key={b._id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                            <div>
                                <div className="text-white font-medium text-sm">{b.customerName}</div>
                                <div className="text-xs text-gray-400">
                                    {typeof b.sport === 'string' ? b.sport : b.sport?.name || 'Unknown'} • {format(new Date(b.date + 'T00:00:00'), 'MMM do')}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${b.status === 'confirmed' ? 'bg-green-500/20 text-green-500' :
                                    b.status === 'cancelled' ? 'bg-red-500/20 text-red-500' :
                                        b.status === 'rescheduled' ? 'bg-blue-500/20 text-blue-400' :
                                            'bg-yellow-500/20 text-yellow-500'
                                    }`}>
                                    {b.status}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">{b.startTime} ({b.duration || 1}h)</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
