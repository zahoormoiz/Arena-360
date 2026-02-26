import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IBooking extends Document {
    sport: mongoose.Types.ObjectId | any; // PopulatedDoc<ISport> would be ideal but keeping it simple to avoid cycle
    user?: mongoose.Types.ObjectId | any;
    guestId?: string;
    date: string; // YYYY-MM-DD
    startTime: string; // HH:MM
    endTime: string; // HH:MM
    duration: number; // Hours
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'rescheduled';
    amount: number;
    paymentStatus: 'pending' | 'partial' | 'paid' | 'failed' | 'refunded';
    paymentMethod?: 'easypaisa' | 'jazzcash' | 'cash' | 'card' | 'other';
    paidAmount?: number;
    paymentReference?: string;
    paymentVerified?: boolean;
    paymentVerifiedAt?: Date;
    source: 'online' | 'walk-in';
    rescheduledFrom?: mongoose.Types.ObjectId;
    createdAt: Date;
}

const BookingSchema = new Schema<IBooking>({
    sport: { type: Schema.Types.ObjectId, ref: 'Sport', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User' }, // Optional - for registered users
    guestId: { type: String, required: false }, // Optional - for guest tracking
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: false },
    duration: { type: Number, required: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String, required: true },
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'rescheduled'], default: 'confirmed' },
    amount: { type: Number, required: true },
    paymentStatus: { type: String, enum: ['pending', 'partial', 'paid', 'failed', 'refunded'], default: 'pending' },
    paymentMethod: { type: String, enum: ['easypaisa', 'jazzcash', 'cash', 'card', 'other'], default: 'other' },
    paidAmount: { type: Number, default: 0 },
    paymentReference: { type: String },
    paymentVerified: { type: Boolean, default: false },
    paymentVerifiedAt: { type: Date },
    source: { type: String, enum: ['online', 'walk-in'], default: 'online' },
    rescheduledFrom: { type: Schema.Types.ObjectId, ref: 'Booking' },
    createdAt: { type: Date, default: Date.now },
});

// Indexes for performance
BookingSchema.index(
    { sport: 1, date: 1, startTime: 1 },
    { unique: true, partialFilterExpression: { status: { $nin: ['cancelled', 'rescheduled'] } } }
); // Unique constraint prevents double-booking at DB level
BookingSchema.index({ date: -1, status: 1 }); // Admin dashboard
BookingSchema.index({ user: 1, date: -1 }); // User bookings
BookingSchema.index({ guestId: 1, date: -1 }); // Guest bookings lookup
BookingSchema.index({ customerEmail: 1, date: -1 }); // Email-based recovery
BookingSchema.index({ customerPhone: 1 }); // Admin search by phone
BookingSchema.index({ paymentStatus: 1, date: -1 }); // Payment oversight queue

const Booking: Model<IBooking> = mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);

export default Booking;

