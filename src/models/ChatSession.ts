import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export type ChatRole = 'user' | 'assistant';
export type ChatLanguage = 'en' | 'ur';
export type ChatSentiment = 'positive' | 'neutral' | 'frustrated' | 'urgent';

export interface IChatMessage {
    id: string;
    role: ChatRole;
    content: string;
    createdAt: Date;
}

export interface IChatSession extends Document {
    sessionId: string;
    visitorId: string;
    userId?: Types.ObjectId;
    title: string;
    summary: string;
    language: ChatLanguage;
    lastIntent: string;
    sentiment: ChatSentiment;
    lastPathname: string;
    messages: IChatMessage[];
    createdAt: Date;
    updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
    {
        id: { type: String, required: true },
        role: {
            type: String,
            enum: ['user', 'assistant'],
            required: true,
        },
        content: { type: String, required: true, maxlength: 4000 },
        createdAt: { type: Date, required: true, default: Date.now },
    },
    { _id: false }
);

const ChatSessionSchema = new Schema<IChatSession>(
    {
        sessionId: { type: String, required: true, unique: true, index: true },
        visitorId: { type: String, required: true, index: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
        title: { type: String, default: 'New conversation', maxlength: 120 },
        summary: { type: String, default: '', maxlength: 1200 },
        language: { type: String, enum: ['en', 'ur'], default: 'en' },
        lastIntent: { type: String, default: 'general', maxlength: 40 },
        sentiment: {
            type: String,
            enum: ['positive', 'neutral', 'frustrated', 'urgent'],
            default: 'neutral',
        },
        lastPathname: { type: String, default: '/', maxlength: 160 },
        messages: { type: [ChatMessageSchema], default: [] },
    },
    { timestamps: true }
);

ChatSessionSchema.index({ userId: 1, updatedAt: -1 });
ChatSessionSchema.index({ visitorId: 1, updatedAt: -1 });

ChatSessionSchema.pre('save', function () {
    if (this.messages.length > 40) {
        this.messages = this.messages.slice(-40);
    }
});

const ChatSession: Model<IChatSession> =
    mongoose.models.ChatSession || mongoose.model<IChatSession>('ChatSession', ChatSessionSchema);

export default ChatSession;
