import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { logChat, logError } from '@/lib/logger';
import { checkRateLimit, getClientIP } from '@/lib/rateLimit';
import { validateBody } from '@/lib/validate';
import { chatRequestSchema } from '@/lib/validations';
import { getUserFromToken } from '@/lib/services/authService';
import { retrieveRelevantKnowledge } from '@/lib/chat/knowledgeBase';
import { buildSystemPrompt } from '@/lib/chat/prompt';
import { getSuggestedActions } from '@/lib/chat/suggestions';
import {
    appendSessionMessage,
    buildConversationTitle,
    buildFallbackReply,
    detectIntent,
    detectLanguage,
    detectSentiment,
    ensureSession,
    trimMessagesForModel,
} from '@/lib/chat/service';
import { streamGeminiCompletion, streamStaticText, toSseEvent } from '@/lib/chat/stream';
import type { ChatMessageRecord } from '@/lib/chat/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function normalizeReply(text: string) {
    const normalized = text.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    if (!normalized) {
        return '';
    }

    return /[.!?]$/.test(normalized) ? normalized : `${normalized}...`;
}

export async function POST(request: NextRequest) {
    const startedAt = Date.now();
    const clientIP = getClientIP(request.headers);

    try {
        const rawBody = await request.json();
        const validation = validateBody(chatRequestSchema, rawBody);

        if (!validation.success || !validation.data) {
            return NextResponse.json(
                { success: false, error: validation.message, errors: validation.errors },
                { status: 400 }
            );
        }

        const body = validation.data;
        const rateLimit = checkRateLimit(`${clientIP}:${body.visitorId}`, 'chat');
        if (rateLimit.limited) {
            return NextResponse.json(
                { success: false, error: 'Too many chat requests. Please wait a moment and try again.' },
                { status: 429 }
            );
        }

        const authToken = request.cookies.get('auth-token')?.value;
        const auth = authToken ? await getUserFromToken(authToken) : null;
        const userId = auth?.userId;
        const sessionId = body.sessionId || crypto.randomUUID();
        const language = detectLanguage(body.message, body.locale, body.preferredLanguage);
        const intent = detectIntent(body.message);
        const sentiment = detectSentiment(body.message);
        const title = buildConversationTitle(body.message);
        const suggestions = getSuggestedActions(intent);
        const knowledge = retrieveRelevantKnowledge(body.message, body.pathname);

        let persistedSession: Awaited<ReturnType<typeof ensureSession>> | null = null;
        let hasDatabase = Boolean(process.env.MONGODB_URI);
        let historyForModel: ChatMessageRecord[] = [];

        if (hasDatabase) {
            try {
                await dbConnect();
                persistedSession = await ensureSession({
                    sessionId,
                    visitorId: body.visitorId,
                    userId,
                    pathname: body.pathname,
                    language,
                    intent,
                    sentiment,
                    userMessage: body.message,
                });

                await appendSessionMessage(
                    persistedSession,
                    {
                        id: crypto.randomUUID(),
                        role: 'user',
                        content: body.message,
                        createdAt: new Date(),
                    },
                    intent
                );

                historyForModel = persistedSession.messages.map((message) => ({
                    id: message.id,
                    role: message.role,
                    content: message.content,
                    createdAt: message.createdAt,
                }));
            } catch (error) {
                hasDatabase = false;
                logError('chat', 'persistence_unavailable', {
                    message: error instanceof Error ? error.message : 'Unknown database error',
                });
            }
        }

        if (!historyForModel.length) {
            const recentClientMessages = body.messages.slice(-10).map((message) => ({
                id: message.id,
                role: message.role,
                content: message.content,
            }));
            const lastMessage = recentClientMessages[recentClientMessages.length - 1];
            const includesLatest =
                lastMessage?.role === 'user' && lastMessage.content.trim() === body.message.trim();

            historyForModel = includesLatest
                ? recentClientMessages
                : [...recentClientMessages, { role: 'user', content: body.message }];
        }

        const systemPrompt = buildSystemPrompt({
            intent,
            language,
            sentiment,
            pathname: body.pathname,
            summary: persistedSession?.summary || '',
            userName: body.userName,
            knowledge,
        });

        logChat(
            'chat_requested',
            {
                sessionId,
                intent,
                language,
                hasDatabase,
                pathname: body.pathname,
                historySize: historyForModel.length,
            },
            userId,
            clientIP
        );

        const encoder = new TextEncoder();
        const apiKey = process.env.GEMINI_API_KEY;

        const stream = new ReadableStream<Uint8Array>({
            async start(controller) {
                const enqueue = (event: string, data: unknown) => {
                    controller.enqueue(encoder.encode(toSseEvent(event, data)));
                };

                enqueue('meta', {
                    sessionId,
                    title: persistedSession?.title || title,
                    language,
                    intent,
                    sentiment,
                });

                let reply = '';

                try {
                    const modelMessages = trimMessagesForModel(historyForModel);
                    const source = apiKey
                        ? streamGeminiCompletion({
                            apiKey,
                            systemPrompt,
                            messages: modelMessages,
                        })
                        : streamStaticText(
                            buildFallbackReply({
                                message: body.message,
                                intent,
                                language,
                                sentiment,
                                pathname: body.pathname,
                                knowledge,
                                userName: body.userName,
                            })
                        );

                    for await (const chunk of source) {
                        reply += chunk;
                        enqueue('chunk', { text: chunk });
                    }
                } catch (error) {
                    logError('chat', 'provider_stream_failed', {
                        sessionId,
                        message: error instanceof Error ? error.message : 'Unknown provider error',
                    });

                    if (!reply.trim()) {
                        const fallbackReply = buildFallbackReply({
                            message: body.message,
                            intent,
                            language,
                            sentiment,
                            pathname: body.pathname,
                            knowledge,
                            userName: body.userName,
                        });

                        for await (const chunk of streamStaticText(fallbackReply)) {
                            reply += chunk;
                            enqueue('chunk', { text: chunk });
                        }
                    }
                }

                const normalizedReply = normalizeReply(reply) || buildFallbackReply({
                    message: body.message,
                    intent,
                    language,
                    sentiment,
                    pathname: body.pathname,
                    knowledge,
                    userName: body.userName,
                });

                if (hasDatabase && persistedSession) {
                    try {
                        await appendSessionMessage(
                            persistedSession,
                            {
                                id: crypto.randomUUID(),
                                role: 'assistant',
                                content: normalizedReply,
                                createdAt: new Date(),
                            },
                            intent
                        );
                    } catch (error) {
                        logError('chat', 'assistant_message_save_failed', {
                            sessionId,
                            message: error instanceof Error ? error.message : 'Unknown save error',
                        });
                    }
                }

                enqueue('end', {
                    sessionId,
                    title: persistedSession?.title || title,
                    suggestions,
                    persisted: hasDatabase,
                });

                logChat(
                    'chat_completed',
                    {
                        sessionId,
                        durationMs: Date.now() - startedAt,
                        replyLength: normalizedReply.length,
                        intent,
                    },
                    userId,
                    clientIP
                );

                controller.close();
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream; charset=utf-8',
                'Cache-Control': 'no-cache, no-transform',
                Connection: 'keep-alive',
                'X-Accel-Buffering': 'no',
            },
        });
    } catch (error) {
        logError('chat', 'request_failed', {
            message: error instanceof Error ? error.message : 'Unknown chat request error',
        });

        return NextResponse.json(
            { success: false, error: 'Unable to process the chat request.' },
            { status: 500 }
        );
    }
}
