import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { logError } from '@/lib/logger';
import { validateBody } from '@/lib/validate';
import { chatHistoryQuerySchema } from '@/lib/validations';
import { getUserFromToken } from '@/lib/services/authService';
import {
    findSessionForIdentity,
    listSessionsForIdentity,
    serializeSession,
    serializeSessionListItem,
} from '@/lib/chat/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        if (!process.env.MONGODB_URI) {
            return NextResponse.json(
                { success: false, error: 'Chat history is unavailable in this environment.' },
                { status: 503 }
            );
        }

        const query = Object.fromEntries(request.nextUrl.searchParams.entries());
        const validation = validateBody(chatHistoryQuerySchema, query);

        if (!validation.success || !validation.data) {
            return NextResponse.json(
                { success: false, error: validation.message, errors: validation.errors },
                { status: 400 }
            );
        }

        const authToken = request.cookies.get('auth-token')?.value;
        const auth = authToken ? await getUserFromToken(authToken) : null;
        const userId = auth?.userId;
        const { sessionId, visitorId, q, limit } = validation.data;

        if (!visitorId && !userId) {
            return NextResponse.json(
                { success: false, error: 'A visitor identity is required to load chat history.' },
                { status: 400 }
            );
        }

        await dbConnect();

        if (sessionId) {
            const session = await findSessionForIdentity({ sessionId, visitorId, userId });

            if (!session) {
                return NextResponse.json(
                    { success: false, error: 'Conversation not found.' },
                    { status: 404 }
                );
            }

            return NextResponse.json({ success: true, session: serializeSession(session) });
        }

        const sessions = await listSessionsForIdentity({ visitorId, userId, q, limit });

        return NextResponse.json({
            success: true,
            sessions: sessions.map(serializeSessionListItem),
        });
    } catch (error) {
        logError('chat', 'history_fetch_failed', {
            message: error instanceof Error ? error.message : 'Unknown history error',
        });

        return NextResponse.json(
            { success: false, error: 'Unable to load chat history.' },
            { status: 500 }
        );
    }
}
