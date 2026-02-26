import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IBlockedSlot extends Document {
    sport: mongoose.Types.ObjectId;
    date: string; // YYYY-MM-DD
    startTime: string; // HH:MM
    endTime: string; // HH:MM
    reason?: string;
    createdAt: Date;
}

const BlockedSlotSchema = new Schema<IBlockedSlot>({
    sport: { type: Schema.Types.ObjectId, ref: 'Sport', required: true },
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    reason: { type: String },
    createdAt: { type: Date, default: Date.now },
});

// Index for quick availability checks
BlockedSlotSchema.index({ sport: 1, date: 1 });

const BlockedSlot: Model<IBlockedSlot> = mongoose.models.BlockedSlot || mongoose.model<IBlockedSlot>('BlockedSlot', BlockedSlotSchema);

export default BlockedSlot;
