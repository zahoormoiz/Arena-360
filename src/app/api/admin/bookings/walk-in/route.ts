import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import { Booking, Sport, BlockedSlot } from '@/models';
import { walkInBookingSchema } from '@/lib/validations';
import { validateBody } from '@/lib/validate';
import { getSportPrice } from '@/lib/pricing';
import { sendWhatsAppNotification } from '@/lib/whatsapp';

function parseTimeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return (hours * 60) + minutes;
}

function minutesToTime(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Admin walk-in booking - auto-confirmed, source: 'walk-in', paymentStatus: 'paid'
 * Uses MongoDB transaction to prevent race conditions
 */
export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const body = await request.json();

        // Zod validation
        const validation = validateBody(walkInBookingSchema, body);
        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.message, errors: validation.errors },
                { status: 400 }
            );
        }

        const { sportId, date, startTime, duration, customerName, customerPhone } = validation.data!;

        // Resolve sport
        const sport = await Sport.findById(sportId);
        if (!sport) {
            return NextResponse.json({ success: false, error: 'Sport not found' }, { status: 404 });
        }

        // Calculate end time and price
        const endTime = minutesToTime(parseTimeToMinutes(startTime) + Math.round(duration * 60));
        const hourPrice = await getSportPrice(sport.name, date);
        const amount = hourPrice * duration;

        // Start MongoDB Session for Transaction - prevents race conditions
        const session = await mongoose.startSession();

        try {
            let newBookingId = '';
            let createdBooking: Record<string, unknown> | null = null;

            await session.withTransaction(async () => {
                // Check for overlapping bookings within transaction
                const overlapping = await Booking.findOne({
                    sport: sport._id,
                    date,
                    status: { $nin: ['cancelled', 'rescheduled'] },
                    $and: [
                        { startTime: { $lt: endTime } },
                        { endTime: { $gt: startTime } }
                    ]
                }).session(session);

                if (overlapping) {
                    throw new Error('SLOT_UNAVAILABLE');
                }

                // Check blocked slots
                const blocked = await BlockedSlot.findOne({
                    sport: sport._id,
                    date,
                    $and: [
                        { startTime: { $lt: endTime } },
                        { endTime: { $gt: startTime } }
                    ]
                }).session(session);

                if (blocked) {
                    throw new Error('SLOT_BLOCKED');
                }

                // Create walk-in booking within transaction
                const result = await Booking.create([{
                    sport: sport._id,
                    date,
                    startTime,
                    endTime,
                    duration,
                    customerName,
                    customerEmail: 'walk-in@arena360.com',
                    customerPhone,
                    amount,
                    status: 'confirmed',
                    paymentStatus: 'paid',
                    paymentMethod: 'cash',
                    paidAmount: amount,
                    paymentVerified: true,
                    paymentVerifiedAt: new Date(),
                    source: 'walk-in',
                    createdAt: new Date()
                }], { session });

                createdBooking = result[0] as unknown as Record<string, unknown>;
                newBookingId = String(result[0]._id);
            });

            await session.endSession();

            console.log(`[ADMIN_ACTION] Walk-in booking created: ${newBookingId} for ${customerName} on ${date} at ${startTime}`);

            const notificationResult = await sendWhatsAppNotification(
                {
                    customerName,
                    customerPhone,
                    sportName: sport.name,
                    date,
                    startTime,
                    endTime,
                    amount,
                    status: 'confirmed'
                },
                'confirmed'
            );
            if (!notificationResult.sent) {
                console.warn('[WHATSAPP_NOTIFICATION_FAILED]', notificationResult.reason);
            }

            return NextResponse.json({
                success: true,
                data: createdBooking
            }, { status: 201 });

        } catch (error: unknown) {
            await session.endSession();

            const errorMessage = error instanceof Error ? error.message : '';

            if (errorMessage === 'SLOT_UNAVAILABLE') {
                return NextResponse.json(
                    { success: false, error: 'Slot is already booked' },
                    { status: 409 }
                );
            }
            if (errorMessage === 'SLOT_BLOCKED') {
                return NextResponse.json(
                    { success: false, error: 'Slot is blocked by admin' },
                    { status: 409 }
                );
            }
            throw error;
        }

    } catch (error: unknown) {
        console.error('Walk-in booking error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create walk-in booking' },
            { status: 500 }
        );
    }
}
