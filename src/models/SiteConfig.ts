import mongoose, { Schema, Model, Document } from 'mongoose';

export interface ISiteConfig extends Document {
    key: string;
    value: any;
    updatedAt: Date;
}

const SiteConfigSchema = new Schema<ISiteConfig>({
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, required: true },
    updatedAt: { type: Date, default: Date.now },
});

const SiteConfig: Model<ISiteConfig> = mongoose.models.SiteConfig || mongoose.model<ISiteConfig>('SiteConfig', SiteConfigSchema);

export default SiteConfig;
