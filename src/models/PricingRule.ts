import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IPricingRule extends Document {
    sportId: mongoose.Types.ObjectId;
    name: string; // e.g., "Weekend Peak"
    type: 'weekday' | 'weekend' | 'special';
    startTime: string; // "17:00"
    endTime: string; // "23:00"
    priceMultiplier: number; // 1.2 or fixed price logic
    overridePrice?: number; // Exact price if set
    isActive: boolean;
}

const PricingRuleSchema = new Schema<IPricingRule>({
    sportId: { type: Schema.Types.ObjectId, ref: 'Sport', required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['weekday', 'weekend', 'special'], required: true },
    startTime: { type: String, required: true }, // 24h format
    endTime: { type: String, required: true },
    priceMultiplier: { type: Number, default: 1 },
    overridePrice: { type: Number },
    isActive: { type: Boolean, default: true }
});

// Index for quick lookup during price validation
PricingRuleSchema.index({ sportId: 1, type: 1 });

const PricingRule: Model<IPricingRule> = mongoose.models.PricingRule || mongoose.model<IPricingRule>('PricingRule', PricingRuleSchema);

export default PricingRule;
