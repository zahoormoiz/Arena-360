import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IAuditLog extends Document {
    adminId: mongoose.Types.ObjectId;
    adminEmail: string;
    action: string;
    targetType: 'booking' | 'sport' | 'settings' | 'auth';
    targetId?: string;
    changes: {
        before?: Record<string, unknown>;
        after?: Record<string, unknown>;
        summary?: string;
    };
    ip?: string;
    createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
    adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    adminEmail: { type: String, required: true },
    action: {
        type: String,
        required: true,
        enum: [
            'booking_status_change',
            'payment_update',
            'booking_create_walkin',
            'sport_create',
            'sport_update',
            'sport_delete',
            'settings_update',
            'password_change',
            'login',
        ],
    },
    targetType: { type: String, enum: ['booking', 'sport', 'settings', 'auth'], required: true },
    targetId: { type: String },
    changes: {
        before: { type: Schema.Types.Mixed },
        after: { type: Schema.Types.Mixed },
        summary: { type: String },
    },
    ip: { type: String },
    createdAt: { type: Date, default: Date.now },
});

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ adminId: 1, createdAt: -1 });

const AuditLog: Model<IAuditLog> =
    mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

export default AuditLog;
