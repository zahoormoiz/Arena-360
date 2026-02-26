import mongoose, { Schema, Model, Document } from 'mongoose';

export interface ISport extends Document {
    name: string;
    description?: string;
    image: string;
    basePrice: number;
    isActive: boolean;
    durationOptions: number[]; // e.g., [1, 1.5, 2]
    sortOrder: number;
}

const SportSchema = new Schema<ISport>({
    name: { type: String, required: true, unique: true },
    description: { type: String },
    image: { type: String, required: true },
    basePrice: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    durationOptions: { type: [Number], default: [1, 1.5, 2, 3] },
    sortOrder: { type: Number, default: 0 }
});

const Sport: Model<ISport> = mongoose.models.Sport || mongoose.model<ISport>('Sport', SportSchema);

export default Sport;
