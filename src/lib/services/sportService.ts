/**
 * Sport Service
 * All sport-related business logic
 * NO direct DB calls in route handlers
 */

import dbConnect from '@/lib/db';
import { Sport, PricingRule, Booking, BlockedSlot } from '@/models';
import { getSportPrice } from '@/lib/pricing';
import { escapeRegex } from '@/lib/utils';

export interface SportResult {
    success: boolean;
    sport?: any;
    error?: string;
}

export interface SportListResult {
    success: boolean;
    sports?: any[];
    error?: string;
}

export interface SlotAvailability {
    time: string;
    startTime: string;
    date: string;
    status: 'available' | 'booked' | 'passed';
    price: number;
}

/**
 * Get all sports with weekend pricing
 */
export async function getAllSports(): Promise<SportListResult> {
    await dbConnect();

    const sports = await Sport.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
    const rules = await PricingRule.find({ type: 'weekend', isActive: true }).lean();

    const ruleMap = new Map();
    rules.forEach((r: any) => ruleMap.set(r.sportId.toString(), r));

    const data = sports.map((s: any) => {
        const r = ruleMap.get(s._id.toString());
        return {
            ...s,
            weekendPrice: r?.overridePrice || s.basePrice
        };
    });

    return { success: true, sports: data };
}

/**
 * Get a single sport by ID or name
 */
export async function getSport(identifier: string): Promise<SportResult> {
    await dbConnect();

    let sport;
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
        sport = await Sport.findById(identifier);
    } else {
        sport = await Sport.findOne({ name: { $regex: new RegExp(escapeRegex(identifier), 'i') } });
    }

    if (!sport) {
        return { success: false, error: 'Sport not found' };
    }

    return { success: true, sport };
}

/**
 * Generate time slots for a day
 */
function generateSlots(startTime: number, endTime: number, date: string, price: number): SlotAvailability[] {
    const slots: SlotAvailability[] = [];
    for (let i = startTime; i < endTime; i++) {
        const start = `${i.toString().padStart(2, '0')}:00`;
        const end = `${(i + 1).toString().padStart(2, '0')}:00`;
        slots.push({
            time: `${start} - ${end}`,
            startTime: start,
            date: date,
            status: 'available',
            price: price
        });
    }
    return slots;
}

/**
 * Get slot availability for a sport on a specific date
 */
export async function getSlotAvailability(sportIdentifier: string, date: string): Promise<{
    success: boolean;
    slots?: SlotAvailability[];
    error?: string;
}> {
    await dbConnect();

    // Resolve sport
    const sportResult = await getSport(sportIdentifier);
    if (!sportResult.success || !sportResult.sport) {
        return { success: false, error: 'Sport not found' };
    }

    const sportDoc = sportResult.sport;

    // Calculate prev date for overnight bookings
    const currentDateObj = new Date(date);
    currentDateObj.setDate(currentDateObj.getDate() - 1);
    const prevDate = currentDateObj.toISOString().split('T')[0];

    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    // PARALLEL: Fetch price, current bookings, prev-day bookings, and blocked slots simultaneously
    const [sportPrice, bookings, prevBookings, blockedSlots] = await Promise.all([
        getSportPrice(sportDoc.name, date),
        Booking.find({
            sport: sportDoc._id,
            date: date,
            status: { $nin: ['cancelled', 'rescheduled'] },
            $or: [
                { status: 'confirmed' },
                { createdAt: { $gt: fifteenMinsAgo } },
                { paymentStatus: { $ne: 'pending' } }
            ]
        }).select('startTime endTime').lean(),
        Booking.find({
            sport: sportDoc._id,
            date: prevDate,
            status: { $nin: ['cancelled', 'rescheduled'] },
            $or: [
                { status: 'confirmed' },
                { createdAt: { $gt: fifteenMinsAgo } },
                { paymentStatus: { $ne: 'pending' } }
            ],
            endTime: { $gt: "24:00" }
        }).select('startTime endTime').lean(),
        BlockedSlot.find({
            sport: sportDoc._id,
            date: date
        }).select('startTime endTime').lean()
    ]);

    // Generate base slots (00:00 to 24:00)
    const baseSlots = generateSlots(0, 24, date, sportPrice);

    // Map bookings and blocked slots to slots — single pass
    const finalSlots: SlotAvailability[] = baseSlots.map(slot => {
        const isBooked = bookings.some((b: any) => {
            return slot.startTime >= b.startTime && slot.startTime < b.endTime;
        });

        if (isBooked) {
            return { ...slot, status: 'booked' as const };
        }

        // Check blocked slots
        const isBlocked = blockedSlots.some((b: any) => {
            return slot.startTime >= b.startTime && slot.startTime < b.endTime;
        });

        if (isBlocked) {
            return { ...slot, status: 'booked' as const };
        }

        // Check overnight bookings from previous day
        const [h] = slot.startTime.split(':').map(Number);
        const isOvernightBlocked = prevBookings.some((b: any) => {
            const [endH] = b.endTime.split(':').map(Number);
            return h < (endH - 24);
        });

        return {
            ...slot,
            status: isOvernightBlocked ? 'booked' as const : 'available' as const
        };
    });

    // Mark past slots as 'passed' for today's date (PKT = UTC+5)
    const nowPKT = new Date(Date.now() + 5 * 60 * 60 * 1000);
    const todayPKT = nowPKT.toISOString().split('T')[0];

    if (date === todayPKT) {
        const currentHour = nowPKT.getUTCHours();
        for (let i = 0; i < finalSlots.length; i++) {
            const [slotHour] = finalSlots[i].startTime.split(':').map(Number);
            if (slotHour < currentHour && finalSlots[i].status === 'available') {
                finalSlots[i] = { ...finalSlots[i], status: 'passed' as const };
            }
        }
    }

    return { success: true, slots: finalSlots };
}

/**
 * Create a new sport (admin)
 */
export async function createSport(data: {
    name: string;
    description?: string;
    basePrice: number;
    image?: string;
    durationOptions?: number[];
    weekendPrice?: number;
    sortOrder?: number;
}): Promise<SportResult> {
    await dbConnect();

    const newSport = await Sport.create({
        name: data.name,
        description: data.description,
        basePrice: data.basePrice,
        image: data.image,
        durationOptions: data.durationOptions,
        sortOrder: data.sortOrder || 0,
        isActive: true
    });

    // Handle Weekend Price
    if (data.weekendPrice) {
        await PricingRule.create({
            sportId: newSport._id,
            name: 'Weekend Peak',
            type: 'weekend',
            startTime: '00:00',
            endTime: '24:00',
            priceMultiplier: 1,
            overridePrice: data.weekendPrice,
            isActive: true
        });
    }

    return { success: true, sport: newSport };
}
