import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Booking } from '@/models';
import { escapeRegex } from '@/lib/utils';

const MAX_LIMIT = 100;

interface BookingExportRecord {
    _id: unknown;
    date?: string;
    startTime?: string;
    endTime?: string;
    duration?: number;
    sport?: { name?: string } | string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    status?: string;
    paymentStatus?: string;
    paymentMethod?: string;
    paidAmount?: number;
    amount?: number;
    source?: string;
    createdAt?: string | Date;
}

function parsePositiveInt(value: string | null, fallback: number): number {
    const parsed = Number.parseInt(value || '', 10);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return parsed;
}

function buildCsv(bookings: BookingExportRecord[]): string {
    const headers = [
        'Booking ID',
        'Date',
        'Start Time',
        'End Time',
        'Duration',
        'Sport',
        'Customer Name',
        'Customer Phone',
        'Customer Email',
        'Booking Status',
        'Payment Status',
        'Payment Method',
        'Paid Amount',
        'Amount',
        'Source',
        'Created At'
    ];

    const escapeCell = (value: unknown): string => {
        const safe = String(value ?? '');
        return `"${safe.replace(/"/g, '""')}"`;
    };

    const rows = bookings.map((b) => [
        b._id,
        b.date,
        b.startTime,
        b.endTime,
        b.duration,
        typeof b.sport === 'string' ? b.sport : (b.sport?.name || ''),
        b.customerName,
        b.customerPhone,
        b.customerEmail,
        b.status,
        b.paymentStatus,
        b.paymentMethod || '',
        b.paidAmount ?? 0,
        b.amount,
        b.source,
        b.createdAt ? new Date(b.createdAt).toISOString() : ''
    ]);

    return [headers, ...rows].map((row) => row.map(escapeCell).join(',')).join('\n');
}

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const searchParams = request.nextUrl.searchParams;
        const status = searchParams.get('status');
        const paymentStatus = searchParams.get('paymentStatus');
        const source = searchParams.get('source');
        const date = searchParams.get('date');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const sportId = searchParams.get('sportId');
        const search = (searchParams.get('search') || '').trim();
        const format = searchParams.get('format');

        const page = parsePositiveInt(searchParams.get('page'), 1);
        const limit = Math.min(parsePositiveInt(searchParams.get('limit'), 25), MAX_LIMIT);
        const skip = (page - 1) * limit;

        const filter: Record<string, unknown> = {};

        if (date) {
            filter.date = date;
        } else if (startDate || endDate) {
            const dateFilter: Record<string, string> = {};
            if (startDate) dateFilter.$gte = startDate;
            if (endDate) dateFilter.$lte = endDate;
            filter.date = dateFilter;
        }

        if (status && status !== 'all') filter.status = status;
        if (paymentStatus && paymentStatus !== 'all') filter.paymentStatus = paymentStatus;
        if (source && source !== 'all') filter.source = source;
        if (sportId) filter.sport = sportId;

        if (search) {
            const searchRegex = new RegExp(escapeRegex(search), 'i');
            filter.$or = [
                { customerName: searchRegex },
                { customerPhone: searchRegex },
                { customerEmail: searchRegex },
                { paymentReference: searchRegex }
            ];
        }

        if (format === 'csv') {
            const csvBookings = await Booking.find(filter)
                .sort({ createdAt: -1 })
                .populate('sport', 'name')
                .lean();

            const csv = buildCsv(csvBookings);

            return new NextResponse(csv, {
                status: 200,
                headers: {
                    'Content-Type': 'text/csv; charset=utf-8',
                    'Content-Disposition': `attachment; filename="arena360-bookings-${Date.now()}.csv"`
                }
            });
        }

        const [bookings, total, summary] = await Promise.all([
            Booking.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('sport', 'name basePrice')
                .lean(),
            Booking.countDocuments(filter),
            Booking.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: null,
                        revenue: {
                            $sum: {
                                $cond: [{ $ne: ['$status', 'cancelled'] }, '$amount', 0]
                            }
                        },
                        count: { $sum: 1 },
                        cancelled: {
                            $sum: {
                                $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0]
                            }
                        },
                        pendingPayments: {
                            $sum: {
                                $cond: [{ $in: ['$paymentStatus', ['pending', 'partial']] }, 1, 0]
                            }
                        }
                    }
                }
            ])
        ]);

        const summaryStats = summary[0] || { revenue: 0, count: 0, cancelled: 0, pendingPayments: 0 };

        return NextResponse.json({
            success: true,
            data: bookings,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / limit))
            },
            stats: {
                revenue: summaryStats.revenue,
                count: summaryStats.count,
                cancelled: summaryStats.cancelled,
                pendingPayments: summaryStats.pendingPayments
            }
        }, { status: 200 });
    } catch (error) {
        console.error('Error fetching admin bookings:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch bookings' }, { status: 500 });
    }
}
