'use client';

import { Bot, Copy, RefreshCw, User2, Volume2 } from 'lucide-react';
import type { ChatSuggestion } from '@/lib/chat/types';
import { cn } from '@/lib/utils';
import ChatMarkdown from './ChatMarkdown';

export interface DisplayMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    status?: 'sent' | 'streaming' | 'error';
    retryPrompt?: string;
    suggestions?: ChatSuggestion[];
}

interface ChatMessageBubbleProps {
    message: DisplayMessage;
    groupedWithPrevious?: boolean;
    onCopy: (value: string) => void;
    onRetry: (messageId: string, prompt: string) => void;
    onSpeak: (messageId: string, value: string) => void;
    onSuggestion: (suggestion: ChatSuggestion) => void;
    isSpeaking?: boolean;
}

function formatTime(value: string) {
    return new Date(value).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function ChatMessageBubble({
    message,
    groupedWithPrevious,
    onCopy,
    onRetry,
    onSpeak,
    onSuggestion,
    isSpeaking,
}: ChatMessageBubbleProps) {
    const isAssistant = message.role === 'assistant';

    return (
        <div
            className={cn(
                'flex w-full gap-3 animate-fade-up',
                isAssistant ? 'justify-start' : 'justify-end',
                groupedWithPrevious ? 'mt-2' : 'mt-4'
            )}
        >
            {isAssistant ? (
                <div
                    className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl border border-white/8 bg-gradient-to-br from-primary/15 to-emerald-900/30 text-primary transition-opacity',
                        groupedWithPrevious ? 'opacity-0' : 'opacity-100'
                    )}
                >
                    <Bot className="h-4 w-4" />
                </div>
            ) : null}

            <div className={cn('max-w-[86%] md:max-w-[78%]', !isAssistant && 'order-first')}>
                <div
                    className={cn(
                        'group rounded-[22px] px-4 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.16)] transition-all',
                        isAssistant
                            ? 'rounded-bl-md border border-white/8 bg-white/[0.06] text-white'
                            : 'rounded-br-md bg-gradient-to-br from-primary to-emerald-500 text-black'
                    )}
                >
                    {message.status === 'streaming' && !message.content ? (
                        <div className="flex items-center gap-1.5 py-1">
                            <span className="h-2 w-2 rounded-full bg-primary/70 animate-bounce" />
                            <span className="h-2 w-2 rounded-full bg-primary/70 animate-bounce [animation-delay:0.12s]" />
                            <span className="h-2 w-2 rounded-full bg-primary/70 animate-bounce [animation-delay:0.24s]" />
                        </div>
                    ) : isAssistant ? (
                        <ChatMarkdown content={message.content} onCopy={onCopy} />
                    ) : (
                        <p className="whitespace-pre-wrap break-words text-[13px] font-medium leading-7 md:text-sm">
                            {message.content}
                        </p>
                    )}
                </div>

                <div className="mt-2 flex items-center gap-2 px-1 text-[11px] text-white/35">
                    <span>{formatTime(message.timestamp)}</span>
                    {message.status === 'streaming' ? <span>Streaming</span> : null}
                    {message.status === 'error' ? <span className="text-red-300">Failed</span> : null}
                    <div className="ml-auto flex items-center gap-1.5">
                        {isAssistant ? (
                            <button
                                type="button"
                                onClick={() => onSpeak(message.id, message.content)}
                                className={cn(
                                    'rounded-full p-1.5 transition hover:bg-white/8 hover:text-white',
                                    isSpeaking && 'bg-primary/15 text-primary'
                                )}
                                aria-label="Read this response aloud"
                            >
                                <Volume2 className="h-3.5 w-3.5" />
                            </button>
                        ) : null}
                        <button
                            type="button"
                            onClick={() => onCopy(message.content)}
                            className="rounded-full p-1.5 transition hover:bg-white/8 hover:text-white"
                            aria-label="Copy message"
                        >
                            <Copy className="h-3.5 w-3.5" />
                        </button>
                        {message.status === 'error' && message.retryPrompt ? (
                            <button
                                type="button"
                                onClick={() => onRetry(message.id, message.retryPrompt!)}
                                className="inline-flex items-center gap-1 rounded-full bg-white/6 px-2.5 py-1 text-white/70 transition hover:bg-white/12 hover:text-white"
                            >
                                <RefreshCw className="h-3.5 w-3.5" />
                                Retry
                            </button>
                        ) : null}
                    </div>
                </div>

                {isAssistant && message.suggestions?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {message.suggestions.map((suggestion) => (
                            <button
                                key={suggestion.id}
                                type="button"
                                onClick={() => onSuggestion(suggestion)}
                                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/80 transition hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
                            >
                                {suggestion.label}
                            </button>
                        ))}
                    </div>
                ) : null}
            </div>

            {!isAssistant ? (
                <div
                    className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl border border-black/10 bg-black/10 text-black transition-opacity',
                        groupedWithPrevious ? 'opacity-0' : 'opacity-100'
                    )}
                >
                    <User2 className="h-4 w-4" />
                </div>
            ) : null}
        </div>
    );
}
