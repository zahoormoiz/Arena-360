import { NextRequest, NextResponse } from 'next/server';
import { rescheduleBooking } from '@/lib/services/bookingService';
import { rescheduleSchema } from '@/lib/validations';
import { validateBody } from '@/lib/validate';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: bookingId } = await params;
        const body = await request.json();

        // Zod validation
        const validation = validateBody(rescheduleSchema, body);
        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.message, errors: validation.errors },
                { status: 400 }
            );
        }

        // Get userId from JWT
        const token = request.cookies.get('auth-token')?.value;
        if (!token) {
            return NextResponse.json(
                { success: false, error: 'Authentication required to reschedule' },
                { status: 401 }
            );
        }

        const { verifyToken } = await import('@/lib/auth');
        const payload: any = await verifyToken(token);
        if (!payload?.userId) {
            return NextResponse.json(
                { success: false, error: 'Invalid authentication' },
                { status: 401 }
            );
        }

        const { newDate, newStartTime, newDuration } = validation.data!;

        const result = await rescheduleBooking(
            bookingId,
            payload.userId,
            newDate,
            newStartTime,
            newDuration
        );

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                oldBooking: result.oldBooking,
                newBooking: result.newBooking,
            }
        }, { status: 200 });

    } catch (error: any) {
        console.error('Reschedule error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to reschedule booking' },
            { status: 500 }
        );
    }
}
