/**
 * Booking Service
 * All booking business logic with MongoDB transactions
 * NO direct DB calls in route handlers
 */

import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import { Booking, Sport, BlockedSlot } from '@/models';
import { IBooking } from '@/models/Booking'; // Import interface
import { getSportPrice } from '@/lib/pricing';
import { escapeRegex } from '@/lib/utils';

export interface BookingCreateInput {
    sportId: string;
    date: string;
    startTime: string;
    duration?: number;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    userId?: string; // Optional - from auth token
    guestId?: string; // Optional - for guest tracking
    paymentMethod?: 'easypaisa' | 'jazzcash' | 'cash' | 'card' | 'other';
    paymentReference?: string;
}

export interface BookingResult {
    success: boolean;
    booking?: any;
    error?: string;
}

export interface BookingListResult {
    success: boolean;
    bookings?: any[];
    stats?: {
        revenue: number;
        count: number;
        confirmed: number;
    };
    error?: string;
}

/**
 * Calculate end time from start time and duration
 */
function parseTimeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return (h * 60) + m;
}

function minutesToTime(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function calculateEndTime(start: string, hours: number): string {
    const startMinutes = parseTimeToMinutes(start);
    const durationMinutes = Math.round(hours * 60);
    return minutesToTime(startMinutes + durationMinutes);
}

/**
 * Resolve sport ID - supports both ObjectId and name lookup
 */
async function resolveSport(sportId: string): Promise<any | null> {
    await dbConnect();

    if (sportId.match(/^[0-9a-fA-F]{24}$/)) {
        return Sport.findById(sportId);
    }
    return Sport.findOne({ name: { $regex: new RegExp(escapeRegex(sportId), 'i') } });
}

/**
 * Create a new booking with MongoDB transaction
 * Prevents race conditions and double bookings
 */
export async function createBooking(input: BookingCreateInput): Promise<BookingResult> {
    await dbConnect();

    const {
        sportId,
        date,
        startTime,
        duration = 1,
        customerName,
        customerEmail,
        customerPhone,
        userId,
        guestId,
        paymentMethod,
        paymentReference
    } = input;

    // Resolve sport
    const sportDoc = await resolveSport(sportId);
    if (!sportDoc) {
        return { success: false, error: 'Sport not found' };
    }

    const endTime = calculateEndTime(startTime, duration);

    // Calculate price
    const hourPrice = await getSportPrice(sportDoc.name, date);
    const amount = hourPrice * duration;

    // Start MongoDB Session for Transaction
    const session = await mongoose.startSession();

    try {
        let newBooking: any;

        await session.withTransaction(async () => {
            // Check for overlapping bookings within transaction
            // Include 'pending' to prevent overbooking while payment is processing
            const overlappingBooking = await Booking.findOne({
                sport: sportDoc._id,
                date: date,
                status: { $nin: ['cancelled', 'rescheduled'] },
                $and: [
                    { startTime: { $lt: endTime } },
                    { endTime: { $gt: startTime } }
                ]
            }).session(session);

            if (overlappingBooking) {
                throw new Error('SLOT_UNAVAILABLE');
            }

            // Check blocked slots within transaction
            const blockedSlot = await BlockedSlot.findOne({
                sport: sportDoc._id,
                date: date,
                $and: [
                    { startTime: { $lt: endTime } },
                    { endTime: { $gt: startTime } }
                ]
            }).session(session);

            if (blockedSlot) {
                throw new Error('SLOT_BLOCKED');
            }

            // Build booking data — status is 'pending' until payment is verified
            const bookingData: any = {
                sport: sportDoc._id,
                date,
                startTime,
                endTime,
                duration,
                customerName,
                customerEmail,
                customerPhone,
                amount,
                status: 'pending',
                paymentStatus: 'pending',
                paymentMethod: paymentMethod || 'other',
                paymentReference: paymentReference || undefined,
                paidAmount: 0,
                paymentVerified: false,
                createdAt: new Date()
            };

            // Link to user or guest
            if (userId) {
                bookingData.user = userId;
            } else if (guestId) {
                bookingData.guestId = guestId;
            }

            // Create booking within transaction
            const result = await Booking.create([bookingData], { session });
            newBooking = result[0];
        });

        await session.endSession();

        return { success: true, booking: newBooking };

    } catch (error: any) {
        await session.endSession();

        if (error.message === 'SLOT_UNAVAILABLE') {
            return { success: false, error: 'Slot is not available for the selected duration.' };
        }
        if (error.message === 'SLOT_BLOCKED') {
            return { success: false, error: 'This slot has been blocked by the administrator.' };
        }

        // Handle duplicate key error
        if (error.code === 11000) {
            return { success: false, error: 'Slot already booked.' };
        }

        throw error;
    }
}

/**
 * Get bookings for a specific user
 */
export async function getUserBookings(userId: string): Promise<BookingListResult> {
    await dbConnect();

    const bookings = await Booking.find({ user: userId })
        .sort({ date: -1, startTime: -1 })
        .populate('sport', 'name image basePrice')
        .lean();

    return { success: true, bookings };
}

/**
 * Get bookings by email (for guest recovery)
 */
export async function getBookingsByEmail(email: string): Promise<BookingListResult> {
    await dbConnect();

    const bookings = await Booking.find({ customerEmail: email })
        .sort({ date: -1, startTime: -1 })
        .populate('sport', 'name image basePrice')
        .lean();

    return { success: true, bookings };
}

/**
 * Link guest bookings to a user account
 * Called after user registers/logs in with the same email
 */
export async function linkBookingsToUser(email: string, userId: string): Promise<number> {
    await dbConnect();

    const result = await Booking.updateMany(
        { customerEmail: email, user: { $exists: false } },
        { $set: { user: userId } }
    );

    return result.modifiedCount;
}

/**
 * Get all bookings with optional filters (admin)
 */
export async function getAllBookings(filters?: {
    date?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
}): Promise<BookingListResult> {
    await dbConnect();

    const query: any = {};

    if (filters?.date) {
        query.date = filters.date;
    } else if (filters?.startDate) {
        query.date = { $gte: filters.startDate };
        if (filters.endDate) {
            query.date.$lte = filters.endDate;
        }
    }

    if (filters?.status && filters.status !== 'all') {
        query.status = filters.status;
    }

    const bookings = await Booking.find(query)
        .sort({ createdAt: -1 })
        .populate('sport', 'name basePrice')
        .lean();

    // Calculate stats
    const revenue = bookings.reduce((sum: number, b: IBooking) => sum + (b.amount || 0), 0);
    const confirmed = bookings.filter((b: IBooking) => b.status === 'confirmed').length;

    return {
        success: true,
        bookings,
        stats: {
            revenue,
            count: bookings.length,
            confirmed
        }
    };
}

/**
 * Cancel a booking
 */
/**
 * Cancel a booking
 */
export async function cancelBooking(bookingId: string, userId?: string): Promise<BookingResult> {
    await dbConnect();

    const session = await mongoose.startSession();
    let result: BookingResult = { success: false, error: 'Initialization failed' };

    try {
        await session.withTransaction(async () => {
            const query: any = { _id: bookingId };

            // If userId provided, ensure user owns the booking (non-admin)
            if (userId) {
                query.user = userId;
            }

            const booking = await Booking.findOne(query).session(session);

            if (!booking) {
                throw new Error('BOOKING_NOT_FOUND');
            }

            if (booking.status === 'cancelled') {
                throw new Error('ALREADY_CANCELLED');
            }

            booking.status = 'cancelled';
            await booking.save({ session });

            result = { success: true, booking };
        });
    } catch (error: any) {
        if (error.message === 'BOOKING_NOT_FOUND') {
            result = { success: false, error: 'Booking not found or you do not have permission to cancel it.' };
        } else if (error.message === 'ALREADY_CANCELLED') {
            result = { success: false, error: 'Booking is already cancelled.' };
        } else {
            console.error('Cancel booking error:', error);
            result = { success: false, error: 'Failed to cancel booking.' };
        }
    } finally {
        await session.endSession();
    }

    return result;
}

/**
 * Get a single booking by ID
 */
export async function getBookingById(bookingId: string): Promise<BookingResult> {
    await dbConnect();

    const booking = await Booking.findById(bookingId)
        .populate('sport', 'name image basePrice')
        .lean();

    if (!booking) {
        return { success: false, error: 'Booking not found' };
    }

    return { success: true, booking };
}

/**
 * Reschedule a booking
 * Atomically cancels old booking and creates new booking in a single transaction
 */
export async function rescheduleBooking(
    bookingId: string,
    userId: string,
    newDate: string,
    newStartTime: string,
    newDuration: number = 1
): Promise<{ success: boolean; oldBooking?: any; newBooking?: any; error?: string }> {
    await dbConnect();

    const session = await mongoose.startSession();

    try {
        let resultData: { oldBooking: any; newBooking: any } = { oldBooking: null, newBooking: null };

        await session.withTransaction(async () => {
            // 1. Find and validate the existing booking
            const existingBooking = await Booking.findOne({
                _id: bookingId,
                user: userId,
                status: 'confirmed'
            }).populate('sport', 'name image basePrice').session(session);

            if (!existingBooking) {
                throw new Error('BOOKING_NOT_FOUND');
            }

            // 2. Calculate new end time and price
            const endTime = calculateEndTime(newStartTime, newDuration);
            const sportDoc = existingBooking.sport;
            const hourPrice = await getSportPrice(sportDoc.name, newDate);
            const amount = hourPrice * newDuration;

            // 3. Check for conflicts at the new slot (excluding the booking being rescheduled)
            const overlapping = await Booking.findOne({
                sport: sportDoc._id,
                date: newDate,
                status: { $nin: ['cancelled', 'rescheduled'] },
                _id: { $ne: bookingId },
                $and: [
                    { startTime: { $lt: endTime } },
                    { endTime: { $gt: newStartTime } }
                ]
            }).session(session);

            if (overlapping) {
                throw new Error('SLOT_UNAVAILABLE');
            }

            // 4. Mark old booking as rescheduled
            existingBooking.status = 'rescheduled' as any;
            await existingBooking.save({ session });

            // 5. Create new booking
            const newBookingData: any = {
                sport: sportDoc._id,
                date: newDate,
                startTime: newStartTime,
                endTime,
                duration: newDuration,
                customerName: existingBooking.customerName,
                customerEmail: existingBooking.customerEmail,
                customerPhone: existingBooking.customerPhone,
                amount,
                status: 'confirmed',
                paymentStatus: existingBooking.paymentStatus,
                source: 'online',
                rescheduledFrom: existingBooking._id,
                user: userId,
                createdAt: new Date()
            };

            const [newBooking] = await Booking.create([newBookingData], { session });

            resultData = {
                oldBooking: existingBooking,
                newBooking
            };
        });

        await session.endSession();
        return { success: true, ...resultData };

    } catch (error: any) {
        await session.endSession();

        if (error.message === 'BOOKING_NOT_FOUND') {
            return { success: false, error: 'Booking not found or you do not have permission to reschedule it.' };
        }
        if (error.message === 'SLOT_UNAVAILABLE') {
            return { success: false, error: 'The new slot is not available.' };
        }

        console.error('Reschedule booking error:', error);
        return { success: false, error: 'Failed to reschedule booking.' };
    }
}

