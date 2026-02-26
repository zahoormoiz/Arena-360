import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Booking } from '@/models';

/**
 * GET /api/admin/customers/:phone
 * Returns all bookings for a specific customer phone number.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ phone: string }> }
) {
    try {
        await dbConnect();
        const { phone } = await params;

        if (!phone) {
            return NextResponse.json(
                { success: false, error: 'Phone number required' },
                { status: 400 },
            );
        }

        const bookings = await Booking.find({ customerPhone: phone })
            .sort({ date: -1, startTime: -1 })
            .populate('sport', 'name')
            .lean();

        // Aggregate summary
        let totalSpend = 0;
        let confirmedCount = 0;
        let cancelledCount = 0;

        bookings.forEach((b: any) => {
            if (b.status !== 'cancelled') totalSpend += b.amount || 0;
            if (b.status === 'confirmed') confirmedCount++;
            if (b.status === 'cancelled') cancelledCount++;
        });

        return NextResponse.json({
            success: true,
            data: {
                bookings,
                summary: {
                    totalBookings: bookings.length,
                    totalSpend,
                    confirmedCount,
                    cancelledCount,
                    customerName: bookings[0]?.customerName || '',
                    customerEmail: bookings[0]?.customerEmail || '',
                },
            },
        });
    } catch (error) {
        console.error('Error fetching customer detail:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch customer' },
            { status: 500 },
        );
    }
}
