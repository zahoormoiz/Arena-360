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
    const hasError = message.status === 'error';

    return (
        <div
            className={cn(
                'flex w-full gap-2.5 md:gap-3 animate-fade-up will-change-transform',
                isAssistant ? 'justify-start' : 'justify-end',
                groupedWithPrevious ? 'mt-1' : 'mt-4'
            )}
        >
            {isAssistant ? (
                <div
                    className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/8 bg-gradient-to-br from-primary/20 to-emerald-900/30 text-primary transition-all',
                        groupedWithPrevious ? 'opacity-0 invisible' : 'opacity-100'
                    )}
                >
                    <Bot className="h-4 w-4" />
                </div>
            ) : null}

            <div className={cn('max-w-xs md:max-w-md lg:max-w-lg', !isAssistant && 'order-first')}>
                <div
                    className={cn(
                        'group rounded-[18px] px-3.5 py-2.5 md:px-4 md:py-3 shadow-[0_8px_16px_rgba(0,0,0,0.12)] transition-all',
                        isAssistant
                            ? 'rounded-bl-sm border border-white/8 bg-white/[0.05] backdrop-blur-sm text-white'
                            : 'rounded-br-sm bg-gradient-to-br from-primary to-emerald-500 text-black shadow-[0_12px_24px_rgba(34,197,94,0.15)]'
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
                        <p className="whitespace-pre-wrap break-words text-[13px] font-medium leading-relaxed md:text-sm">
                            {message.content}
                        </p>
                    )}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2 px-1">
                    <span className="text-[10px] md:text-[11px] text-white/40 font-medium">
                        {formatTime(message.timestamp)}
                    </span>
                    {message.status === 'streaming' ? (
                        <span className="text-[10px] md:text-[11px] text-primary font-medium">Streaming...</span>
                    ) : null}
                    {hasError ? (
                        <span className="text-[10px] md:text-[11px] text-red-400 font-medium">Failed</span>
                    ) : null}
                    <div className="ml-auto flex items-center gap-1.5">
                        {isAssistant ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => onSpeak(message.id, message.content)}
                                    className={cn(
                                        'rounded-full p-1.5 transition hover:bg-white/8 hover:text-white',
                                        isSpeaking && 'bg-primary/15 text-primary'
                                    )}
                                    title="Listen to response"
                                    aria-label="Listen to response"
                                >
                                    <Volume2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onCopy(message.content)}
                                    className="rounded-full p-1.5 text-white/50 transition hover:bg-white/8 hover:text-white"
                                    title="Copy response"
                                    aria-label="Copy response"
                                >
                                    <Copy className="h-3.5 w-3.5" />
                                </button>
                            </>
                        ) : null}
                        {hasError && message.retryPrompt ? (
                            <button
                                type="button"
                                onClick={() => onRetry(message.id, message.retryPrompt!)}
                                className="rounded-full p-1.5 text-white/50 transition hover:bg-white/8 hover:text-primary"
                                title="Retry message"
                                aria-label="Retry message"
                            >
                                <RefreshCw className="h-3.5 w-3.5" />
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
                                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/70 transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
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
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/60 transition-all',
                        groupedWithPrevious ? 'opacity-0 invisible' : 'opacity-100'
                    )}
                >
                    <User2 className="h-4 w-4" />
                </div>
            ) : null}
        </div>
    );
}
