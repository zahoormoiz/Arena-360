import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Booking } from '@/models';
import { verifyToken } from '@/lib/auth';
import { checkRateLimit, getClientIP } from '@/lib/rateLimit';
import { sendWhatsAppNotification } from '@/lib/whatsapp';

/**
 * GET: Admin-only — fetch all bookings with filters.
 * Auth is enforced by middleware, but we double-check role here.
 */
export async function GET(request: NextRequest) {
    await dbConnect();

    try {
        // Double-check admin role (middleware already verified auth)
        const token = request.cookies.get('auth-token')?.value;
        if (!token) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const payload: any = await verifyToken(token);
        if (!payload || payload.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const url = request.nextUrl;
        const dateParam = url.searchParams.get('date');
        const startDate = url.searchParams.get('startDate');
        const endDate = url.searchParams.get('endDate');
        const status = url.searchParams.get('status');

        const filter: Record<string, any> = {};

        if (dateParam) {
            filter.date = dateParam;
        } else if (startDate) {
            filter.date = { $gte: startDate };
            if (endDate) {
                filter.date.$lte = endDate;
            }
        }

        if (status && status !== 'all') {
            filter.status = status;
        }

        const bookings = await Booking.find(filter)
            .sort({ createdAt: -1 })
            .populate('sport', 'name basePrice')
            .lean();

        return NextResponse.json({
            success: true,
            data: bookings,
        }, { status: 200 });

    } catch (error) {
        console.error('Error fetching bookings:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch bookings' }, { status: 500 });
    }
}

/**
 * POST: Create booking — available to guests and logged-in users.
 * Rate limited by IP.
 */
export async function POST(request: NextRequest) {
    try {
        // Rate limiting
        const clientIP = getClientIP(request.headers);
        const rateCheck = checkRateLimit(clientIP, 'booking');
        if (rateCheck.limited) {
            return NextResponse.json(
                { success: false, error: 'Too many booking attempts. Please try again later.' },
                { status: 429 }
            );
        }

        await dbConnect();
        const body = await request.json();

        // Zod validation
        const { validateBody } = await import('@/lib/validate');
        const { bookingCreateSchema } = await import('@/lib/validations');
        const validation = validateBody(bookingCreateSchema, body);
        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.message, errors: validation.errors },
                { status: 400 }
            );
        }

        // Create Booking via Service
        const { createBooking } = await import('@/lib/services/bookingService');

        let userId: string | undefined;

        // Check for logged-in user
        const token = request.cookies.get('auth-token')?.value;
        if (token) {
            const payload: any = await verifyToken(token);
            if (payload && payload.userId) {
                userId = payload.userId;
            }
        }

        const result = await createBooking({
            sportId: body.sport,
            date: body.date,
            startTime: body.startTime,
            duration: body.duration,
            customerName: body.customerName,
            customerEmail: body.customerEmail,
            customerPhone: body.customerPhone,
            userId: userId,
            guestId: body.guestId,
            paymentMethod: body.paymentMethod,
            paymentReference: body.paymentReference
        });

        if (!result.success) {
            return NextResponse.json({ success: false, error: result.error }, { status: 400 });
        }

        const createdBooking = result.booking as {
            customerName: string;
            customerPhone: string;
            date: string;
            startTime: string;
            endTime?: string;
            amount?: number;
            status?: string;
        };

        const notificationResult = await sendWhatsAppNotification(
            {
                customerName: createdBooking.customerName || body.customerName,
                customerPhone: createdBooking.customerPhone || body.customerPhone,
                date: createdBooking.date || body.date,
                startTime: createdBooking.startTime || body.startTime,
                endTime: createdBooking.endTime,
                amount: createdBooking.amount,
                status: createdBooking.status || 'pending'
            },
            'created'
        );

        if (!notificationResult.sent) {
            console.warn('[WHATSAPP_NOTIFICATION_FAILED]', notificationResult.reason);
        }

        return NextResponse.json({ success: true, data: result.booking }, { status: 201 });

    } catch (error: any) {
        console.error('Error creating booking:', error);
        // Never leak raw error messages to client
        return NextResponse.json({ success: false, error: 'Failed to create booking' }, { status: 500 });
    }
}
