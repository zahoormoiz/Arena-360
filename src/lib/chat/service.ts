import type { Types } from 'mongoose';
import ChatSession, { type IChatSession } from '@/models/ChatSession';
import { escapeRegex } from '@/lib/utils';
import type {
    ChatHistoryListItem,
    ChatIntent,
    ChatLanguage,
    ChatLanguagePreference,
    ChatMessageRecord,
    ChatSentiment,
    ChatSessionPayload,
} from './types';

// Mongoose 9 removed FilterQuery — use a plain record type for filter objects
type MongoFilter = Record<string, unknown>;

const ROMAN_URDU_HINTS = ['karna', 'kya', 'hai', 'hain', 'kaise', 'booking', 'krna', 'slot', 'book'];

function sanitizeText(value: string, maxLength: number) {
    return value.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

export function detectLanguage(
    message: string,
    locale = 'en',
    preferredLanguage: ChatLanguagePreference = 'auto'
): ChatLanguage {
    if (preferredLanguage !== 'auto') {
        return preferredLanguage;
    }

    if (/[\u0600-\u06FF]/.test(message)) {
        return 'ur';
    }

    const normalized = message.toLowerCase();
    const romanMatches = ROMAN_URDU_HINTS.filter((hint) => normalized.includes(hint)).length;
    if (romanMatches >= 2 || locale.toLowerCase().startsWith('ur')) {
        return 'ur';
    }

    return 'en';
}

export function detectIntent(message: string): ChatIntent {
    const value = message.toLowerCase();

    if (/(book|reserve|slot|calendar|schedule)/.test(value)) return 'booking';
    if (/(price|pricing|rate|cost|fee|discount)/.test(value)) return 'pricing';
    if (/(available|availability|free slot|today|tomorrow|weekend)/.test(value)) return 'availability';
    if (/(parking|cafeteria|facility|equipment|locker|changing|washroom)/.test(value)) return 'facilities';
    if (/(where|location|address|map|directions|lahore)/.test(value)) return 'location';
    if (/(cancel|refund|support|complaint|agent|human|whatsapp|reschedule)/.test(value)) return 'support';
    if (/(futsal|football|cricket|padel|badminton|volleyball|sports)/.test(value)) return 'sports';
    if (/(policy|rule|safe|family|kids)/.test(value)) return 'policy';
    if (/^(hi|hello|hey|salam|aoa|assalam)/.test(value)) return 'greeting';

    return 'general';
}

export function detectSentiment(message: string): ChatSentiment {
    const value = message.toLowerCase();

    if (/(urgent|asap|immediately|right now)/.test(value)) return 'urgent';
    if (/(angry|upset|bad|terrible|frustrated|annoyed|issue|problem|complaint)/.test(value)) {
        return 'frustrated';
    }
    if (/(great|awesome|thanks|thank you|love|perfect)/.test(value)) return 'positive';

    return 'neutral';
}

export function buildConversationTitle(message: string) {
    const cleaned = sanitizeText(message, 80);
    if (!cleaned) return 'New conversation';
    return cleaned.length > 48 ? `${cleaned.slice(0, 45)}...` : cleaned;
}

export function summarizeConversation(messages: ChatMessageRecord[], intent: ChatIntent) {
    const latestUserTurns = messages
        .filter((message) => message.role === 'user')
        .slice(-3)
        .map((message) => sanitizeText(message.content, 120));

    if (!latestUserTurns.length) {
        return '';
    }

    return `Intent: ${intent}. Recent user needs: ${latestUserTurns.join(' | ')}`.slice(0, 600);
}

export function buildFallbackReply(options: {
    message: string;
    intent: ChatIntent;
    language: ChatLanguage;
    sentiment: ChatSentiment;
    pathname: string;
    knowledge: string[];
    userName?: string;
}) {
    const greetingName = options.userName ? ` ${options.userName}` : '';
    const empathy =
        options.sentiment === 'frustrated'
            ? 'I understand this is frustrating.'
            : options.sentiment === 'urgent'
                ? 'I will keep this brief so you can move quickly.'
                : '';

    const primaryKnowledge = options.knowledge[0] || 'I can help with bookings, pricing, facilities, support, and sports information.';

    if (options.language === 'ur') {
        return [
            empathy,
            `Assalam o alaikum${greetingName}. ${primaryKnowledge}`,
            options.intent === 'booking' || options.pathname.startsWith('/book')
                ? 'Agar aap booking karna chahte hain to `/book` par sport, date aur slot select karein.'
                : 'Agar aap exact booking ya pricing dekhna chahte hain to `/book` ya `/pricing` khol sakte hain.',
            'Aap kis cheez mein madad chahte hain?',
        ]
            .filter(Boolean)
            .join(' ');
    }

    return [
        empathy,
        `Hi${greetingName}. ${primaryKnowledge}`,
        options.intent === 'booking' || options.pathname.startsWith('/book')
            ? 'For the fastest path, open `/book`, choose your sport, then pick a date and slot.'
            : 'If you need an exact price or live availability, the safest next step is `/pricing` or `/book`.',
        'What would you like help with next?',
    ]
        .filter(Boolean)
        .join(' ');
}

export function trimMessagesForModel(messages: ChatMessageRecord[]) {
    const result: ChatMessageRecord[] = [];
    let totalLength = 0;

    for (const message of [...messages].reverse()) {
        totalLength += message.content.length;
        if (result.length >= 12 || totalLength > 5000) {
            break;
        }
        result.unshift({
            role: message.role,
            content: sanitizeText(message.content, 2000),
        });
    }

    return result;
}

export function serializeSession(session: IChatSession): ChatSessionPayload {
    return {
        sessionId: session.sessionId,
        title: session.title,
        summary: session.summary,
        language: session.language,
        sentiment: session.sentiment,
        lastIntent: session.lastIntent as ChatIntent,
        updatedAt: session.updatedAt.toISOString(),
        messages: session.messages.map((message) => ({
            id: message.id,
            role: message.role,
            content: message.content,
            timestamp: new Date(message.createdAt).toISOString(),
        })),
    };
}

export function serializeSessionListItem(session: IChatSession): ChatHistoryListItem {
    const lastMessage = session.messages[session.messages.length - 1];

    return {
        sessionId: session.sessionId,
        title: session.title,
        summary: session.summary,
        lastMessage: lastMessage?.content || '',
        messageCount: session.messages.length,
        updatedAt: session.updatedAt.toISOString(),
        language: session.language,
        lastIntent: session.lastIntent as ChatIntent,
    };
}

export async function findSessionForIdentity({
    sessionId,
    visitorId,
    userId,
}: {
    sessionId?: string;
    visitorId?: string;
    userId?: string;
}) {
    const ownerFilters = [
        ...(visitorId ? [{ visitorId }] : []),
        ...(userId ? [{ userId }] : []),
    ];

    if (!ownerFilters.length) return null;

    const query: MongoFilter = sessionId
        ? { sessionId, $or: ownerFilters }
        : { $or: ownerFilters };

    return ChatSession.findOne(query).sort({ updatedAt: -1 });
}

export async function ensureSession(options: {
    sessionId: string;
    visitorId: string;
    userId?: string;
    pathname: string;
    language: ChatLanguage;
    intent: ChatIntent;
    sentiment: ChatSentiment;
    userMessage: string;
}) {
    const session =
        (await findSessionForIdentity({
            sessionId: options.sessionId,
            visitorId: options.visitorId,
            userId: options.userId,
        })) ||
        new ChatSession({
            sessionId: options.sessionId,
            visitorId: options.visitorId,
        });

    if (!session.title || session.title === 'New conversation') {
        session.title = buildConversationTitle(options.userMessage);
    }

    if (options.userId) {
        session.userId = options.userId as unknown as Types.ObjectId;
    }

    session.language = options.language;
    session.lastIntent = options.intent;
    session.sentiment = options.sentiment;
    session.lastPathname = options.pathname;

    return session;
}

export async function appendSessionMessage(
    session: IChatSession,
    message: ChatMessageRecord,
    intent?: ChatIntent
) {
    session.messages.push({
        id: message.id || crypto.randomUUID(),
        role: message.role,
        content: sanitizeText(message.content, 4000),
        createdAt: message.createdAt ? new Date(message.createdAt) : new Date(),
    });

    if (intent) {
        session.summary = summarizeConversation(session.messages, intent);
    }

    await session.save();
}

export async function listSessionsForIdentity(options: {
    visitorId?: string;
    userId?: string;
    q?: string;
    limit: number;
}) {
    const ownershipFilters = [];

    if (options.visitorId) {
        ownershipFilters.push({ visitorId: options.visitorId });
    }

    if (options.userId) {
        ownershipFilters.push({ userId: options.userId });
    }

    if (!ownershipFilters.length) {
        return [];
    }

    const query: MongoFilter = { $or: ownershipFilters };

    if (options.q) {
        const safePattern = escapeRegex(options.q);
        query.$and = [
            {
                $or: [
                    { title: { $regex: safePattern, $options: 'i' } },
                    { summary: { $regex: safePattern, $options: 'i' } },
                    { 'messages.content': { $regex: safePattern, $options: 'i' } },
                ],
            },
        ];
    }

    return ChatSession.find(query).sort({ updatedAt: -1 }).limit(options.limit);
}
