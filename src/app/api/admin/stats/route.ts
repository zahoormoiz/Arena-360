
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Booking } from '@/models';
import { subDays, format } from 'date-fns';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const searchParams = request.nextUrl.searchParams;
        const period = searchParams.get('period') || '7d';

        // Determine the number of days for the chart
        const periodDays = period === '90d' ? 90 : period === '30d' ? 30 : 7;

        const today = new Date();
        const periodAgo = subDays(today, periodDays);
        const periodAgoStr = format(periodAgo, 'yyyy-MM-dd');
        const todayStr = format(today, 'yyyy-MM-dd');

        // ALL queries in parallel for maximum speed
        const [
            totalBookings,
            confirmedDocs,
            cancelledDocs,
            revenueResult,
            chartAgg,
            recentBookings,
            pendingPayments,
            todayBookings,
            sportsDistribution,
        ] = await Promise.all([
            Booking.countDocuments({}),
            Booking.countDocuments({ status: 'confirmed' }),
            Booking.countDocuments({ status: 'cancelled' }),
            Booking.aggregate([
                { $match: { status: 'confirmed' } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]),
            Booking.aggregate([
                {
                    $match: {
                        status: 'confirmed',
                        date: { $gte: periodAgoStr, $lte: todayStr },
                    },
                },
                {
                    $group: {
                        _id: '$date',
                        revenue: { $sum: '$amount' },
                        bookings: { $sum: 1 },
                    },
                },
            ]),
            Booking.find({})
                .select('sport date startTime duration status amount createdAt customerName paymentStatus')
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('sport', 'name')
                .lean(),
            Booking.countDocuments({
                paymentStatus: { $in: ['pending', 'partial'] },
                status: { $ne: 'cancelled' },
            }),
            Booking.countDocuments({ date: todayStr }),
            // Sports distribution — top sports by booking count
            Booking.aggregate([
                { $match: { status: { $ne: 'cancelled' } } },
                { $group: { _id: '$sport', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: 'sports',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'sportInfo',
                    },
                },
                {
                    $project: {
                        name: { $arrayElemAt: ['$sportInfo.name', 0] },
                        count: 1,
                    },
                },
            ]),
        ]);

        const totalRevenue = revenueResult[0]?.total || 0;
        const cancellationRate =
            totalBookings > 0
                ? Math.round((cancelledDocs / totalBookings) * 100)
                : 0;

        // Map chart data — fill gaps with zeros
        const chartMap = new Map<string, { revenue: number; bookings: number }>();
        chartAgg.forEach((item: any) =>
            chartMap.set(item._id, { revenue: item.revenue, bookings: item.bookings }),
        );

        const chartData = [];
        for (let i = periodDays - 1; i >= 0; i--) {
            const d = subDays(today, i);
            const isoKey = format(d, 'yyyy-MM-dd');
            const displayLabel =
                periodDays <= 7
                    ? format(d, 'MMM dd')
                    : periodDays <= 30
                        ? format(d, 'dd')
                        : format(d, 'MMM dd');
            const entry = chartMap.get(isoKey);
            chartData.push({
                date: displayLabel,
                revenue: entry?.revenue || 0,
                bookings: entry?.bookings || 0,
            });
        }

        return NextResponse.json(
            {
                success: true,
                stats: {
                    revenue: totalRevenue,
                    count: totalBookings,
                    confirmed: confirmedDocs,
                    cancelled: cancelledDocs,
                    cancellationRate,
                    pendingPayments,
                    todayBookings,
                },
                chart: chartData,
                sportsDistribution,
                recent: recentBookings,
            },
            { status: 200 },
        );
    } catch {
        return NextResponse.json(
            { success: false, error: 'Failed to fetch stats' },
            { status: 500 },
        );
    }
}
