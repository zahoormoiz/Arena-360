import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import { Booking } from '@/models';

/**
 * GET /api/admin/customers
 * Server-side aggregation of customers from bookings data.
 * Replaces the previous client-side aggregation approach.
 */
export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const searchParams = request.nextUrl.searchParams;
        const search = (searchParams.get('search') || '').trim();
        const page = Math.max(1, Number(searchParams.get('page') || 1));
        const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || 25)));

        const matchStage: Record<string, unknown> = {};

        if (search) {
            matchStage.$or = [
                { customerName: { $regex: search, $options: 'i' } },
                { customerPhone: { $regex: search, $options: 'i' } },
                { customerEmail: { $regex: search, $options: 'i' } },
            ];
        }

        const pipeline: mongoose.PipelineStage[] = [];

        if (Object.keys(matchStage).length > 0) {
            pipeline.push({ $match: matchStage });
        }

        pipeline.push(
            {
                $group: {
                    _id: '$customerPhone',
                    name: { $last: '$customerName' },
                    phone: { $first: '$customerPhone' },
                    email: { $last: '$customerEmail' },
                    totalBookings: { $sum: 1 },
                    totalSpend: {
                        $sum: {
                            $cond: [{ $ne: ['$status', 'cancelled'] }, '$amount', 0],
                        },
                    },
                    cancelledBookings: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0],
                        },
                    },
                    lastBooking: { $max: '$date' },
                    firstBooking: { $min: '$date' },
                    sports: { $push: '$sport' },
                },
            },
            { $sort: { totalSpend: -1 as const } },
        );

        // Get total count before pagination
        const countPipeline = [...pipeline, { $count: 'total' }];
        const countResult = await Booking.aggregate(countPipeline);
        const total = countResult[0]?.total || 0;

        // Paginate
        pipeline.push(
            { $skip: (page - 1) * limit },
            { $limit: limit },
        );

        // Resolve sport names via lookup
        pipeline.push(
            {
                $lookup: {
                    from: 'sports',
                    localField: 'sports',
                    foreignField: '_id',
                    as: 'sportDetails',
                },
            },
            {
                $addFields: {
                    // Compute favorite sport from the most frequent
                    favoriteSport: {
                        $let: {
                            vars: {
                                sportNames: {
                                    $map: {
                                        input: '$sportDetails',
                                        as: 's',
                                        in: '$$s.name',
                                    },
                                },
                            },
                            in: { $arrayElemAt: ['$$sportNames', 0] },
                        },
                    },
                    // Frequency scoring
                    frequencyScore: {
                        $switch: {
                            branches: [
                                { case: { $gte: ['$totalBookings', 10] }, then: 'VIP' },
                                { case: { $gte: ['$totalBookings', 3] }, then: 'Regular' },
                            ],
                            default: 'Occasional',
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    name: 1,
                    phone: 1,
                    email: 1,
                    totalBookings: 1,
                    totalSpend: 1,
                    cancelledBookings: 1,
                    lastBooking: 1,
                    firstBooking: 1,
                    favoriteSport: 1,
                    frequencyScore: 1,
                },
            },
        );

        const customers = await Booking.aggregate(pipeline);

        return NextResponse.json({
            success: true,
            data: customers,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            },
        });
    } catch (error) {
        console.error('Error fetching customers:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch customers' },
            { status: 500 },
        );
    }
}
