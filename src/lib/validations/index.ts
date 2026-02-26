/**
 * Zod Validation Schemas
 * All API input validation is handled here with Zod
 */

import { z } from 'zod';

// ======================
// AUTH SCHEMAS
// ======================

export const loginSchema = z.object({
    email: z.string()
        .email('Invalid email format')
        .min(1, 'Email is required'),
    password: z.string()
        .min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
    name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name too long'),
    email: z.string()
        .email('Invalid email format'),
    phone: z.string()
        .min(10, 'Phone must be at least 10 characters')
        .max(15, 'Phone too long')
        .regex(/^[\d+\-\s]+$/, 'Invalid phone format'),
    password: z.string()
        .min(6, 'Password must be at least 6 characters')
        .max(128, 'Password too long'),
});

// ======================
// BOOKING SCHEMAS
// ======================

export const bookingCreateSchema = z.object({
    sport: z.string().min(1, 'Sport is required'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
    endTime: z.string().optional(),
    duration: z.number().min(1).max(4).optional().default(1),
    customerName: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name too long'),
    customerEmail: z.string()
        .email('Invalid email format'),
    customerPhone: z.string()
        .min(10, 'Phone must be at least 10 characters')
        .max(15, 'Phone too long')
        .regex(/^[\d+\-\s]+$/, 'Invalid phone format'),
    amount: z.number().optional(),
    paymentMethod: z.enum(['easypaisa', 'jazzcash', 'cash', 'card', 'other']).optional(),
    paymentReference: z.string().max(120, 'Payment reference too long').optional(),
});

export const bookingSchema = bookingCreateSchema;

export const bookingUpdateSchema = z.object({
    id: z.string().min(1, 'Booking ID is required'),
    status: z.enum(['confirmed', 'cancelled', 'pending', 'rescheduled']).optional(),
    paymentStatus: z.enum(['pending', 'partial', 'paid', 'failed', 'refunded']).optional(),
    paymentMethod: z.enum(['easypaisa', 'jazzcash', 'cash', 'card', 'other']).optional(),
    paidAmount: z.number().min(0, 'Paid amount cannot be negative').optional(),
    paymentReference: z.string().max(120, 'Payment reference too long').optional(),
    paymentVerified: z.boolean().optional(),
}).refine(
    (data) => data.status !== undefined
        || data.paymentStatus !== undefined
        || data.paymentMethod !== undefined
        || data.paidAmount !== undefined
        || data.paymentReference !== undefined
        || data.paymentVerified !== undefined,
    {
        message: 'At least one update field is required',
        path: ['status']
    }
);

export const bookingFiltersSchema = z.object({
    date: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    status: z.enum(['all', 'confirmed', 'cancelled', 'pending', 'rescheduled']).optional(),
    paymentStatus: z.enum(['all', 'pending', 'partial', 'paid', 'failed', 'refunded']).optional(),
});

// ======================
// AVAILABILITY SCHEMAS
// ======================

export const availabilityQuerySchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    sportId: z.string().min(1, 'Sport ID is required'),
});

// ======================
// SPORT SCHEMAS
// ======================

export const sportCreateSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    description: z.string().optional(),
    basePrice: z.number().positive('Price must be positive'),
    weekendPrice: z.number().positive().optional(),
    image: z.string().url().or(z.string().startsWith('/')),
    durationOptions: z.array(z.number()).optional(),
    isActive: z.boolean().optional().default(true),
    sortOrder: z.number().int().optional().default(0),
});

export const sportUpdateSchema = sportCreateSchema.partial();

// ======================
// RESCHEDULE SCHEMAS
// ======================

export const rescheduleSchema = z.object({
    newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    newStartTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
    newDuration: z.number().min(1).max(4).optional().default(1),
});

// ======================
// WALK-IN BOOKING SCHEMAS
// ======================

export const walkInBookingSchema = z.object({
    sportId: z.string().min(1, 'Sport is required'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
    duration: z.number().min(1).max(4).optional().default(1),
    customerName: z.string().min(2, 'Name must be at least 2 characters'),
    customerPhone: z.string().min(10, 'Phone must be at least 10 characters'),
});

// ======================
// BLOCKED SLOT SCHEMAS
// ======================

export const blockedSlotSchema = z.object({
    sport: z.string().min(1, 'Sport is required'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Start time required'),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, 'End time required'),
    reason: z.string().optional(),
});

// ======================
// SETTINGS SCHEMAS
// ======================

export const settingsUpdateSchema = z.object({
    adminName: z.string().optional(),
    notificationEmail: z.string().email().optional(),
    maintenanceMode: z.boolean().optional(),
    allowWeekendPricing: z.boolean().optional(),
    smsNotifications: z.boolean().optional(),
});

// ======================
// TYPE EXPORTS
// ======================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type BookingCreateInput = z.infer<typeof bookingCreateSchema>;
export type BookingUpdateInput = z.infer<typeof bookingUpdateSchema>;
export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;
export type SportCreateInput = z.infer<typeof sportCreateSchema>;
export type SportUpdateInput = z.infer<typeof sportUpdateSchema>;
export type RescheduleInput = z.infer<typeof rescheduleSchema>;
export type WalkInBookingInput = z.infer<typeof walkInBookingSchema>;
export type BlockedSlotInput = z.infer<typeof blockedSlotSchema>;
export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>;
