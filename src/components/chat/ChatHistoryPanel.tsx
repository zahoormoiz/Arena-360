'use client';

import { History, Plus, Search, X } from 'lucide-react';
import type { ChatHistoryListItem } from '@/lib/chat/types';
import { cn } from '@/lib/utils';

interface ChatHistoryPanelProps {
    sessions: ChatHistoryListItem[];
    isLoading: boolean;
    isOpen: boolean;
    query: string;
    currentSessionId?: string | null;
    onQueryChange: (value: string) => void;
    onSelect: (sessionId: string) => void;
    onNewChat: () => void;
    onClose: () => void;
}

function formatRelativeDate(value: string) {
    const date = new Date(value);
    return new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
    }).format(date);
}

export default function ChatHistoryPanel({
    sessions,
    isLoading,
    isOpen,
    query,
    currentSessionId,
    onQueryChange,
    onSelect,
    onNewChat,
    onClose,
}: ChatHistoryPanelProps) {
    return (
        <aside
            className={cn(
                'absolute inset-y-0 left-0 z-20 w-full border-r border-white/8 bg-[#050505]/98 backdrop-blur-xl transition duration-200 md:w-[320px]',
                isOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'
            )}
        >
            <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-white/8 px-4 py-4">
                    <div>
                        <p className="text-sm font-semibold text-white">Conversation history</p>
                        <p className="text-xs text-white/45">Search past chats and reopen context.</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 text-white/60 transition hover:bg-white/8 hover:text-white"
                        aria-label="Close conversation history"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="border-b border-white/8 px-4 py-3">
                    <button
                        type="button"
                        onClick={onNewChat}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-emerald-500 px-4 py-3 text-sm font-semibold text-black shadow-[0_12px_24px_rgba(34,197,94,0.18)] transition hover:brightness-105"
                    >
                        <Plus className="h-4 w-4" />
                        New conversation
                    </button>
                    <label className="mt-3 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
                        <Search className="h-4 w-4 text-white/35" />
                        <input
                            value={query}
                            onChange={(event) => onQueryChange(event.target.value)}
                            placeholder="Search history"
                            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                        />
                    </label>
                </div>

                <div className="flex-1 overflow-y-auto px-3 py-3 scrollbar-hide">
                    {isLoading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 4 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03] p-4"
                                >
                                    <div className="h-4 w-2/3 animate-pulse rounded-full bg-white/8" />
                                    <div className="mt-3 h-3 w-full animate-pulse rounded-full bg-white/6" />
                                    <div className="mt-2 h-3 w-5/6 animate-pulse rounded-full bg-white/6" />
                                </div>
                            ))}
                        </div>
                    ) : sessions.length ? (
                        <div className="space-y-3">
                            {sessions.map((session) => (
                                <button
                                    key={session.sessionId}
                                    type="button"
                                    onClick={() => onSelect(session.sessionId)}
                                    className={cn(
                                        'w-full rounded-2xl border px-4 py-3 text-left transition',
                                        session.sessionId === currentSessionId
                                            ? 'border-primary/35 bg-primary/10'
                                            : 'border-white/8 bg-white/[0.03] hover:border-white/14 hover:bg-white/[0.06]'
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="line-clamp-1 text-sm font-semibold text-white">
                                                {session.title}
                                            </p>
                                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/55">
                                                {session.summary || session.lastMessage || 'No preview available yet.'}
                                            </p>
                                        </div>
                                        <span className="whitespace-nowrap text-[10px] uppercase tracking-[0.2em] text-white/30">
                                            {formatRelativeDate(session.updatedAt)}
                                        </span>
                                    </div>
                                    <div className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/35">
                                        <History className="h-3.5 w-3.5" />
                                        <span>{session.messageCount} messages</span>
                                        <span>{session.lastIntent}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                            <div className="rounded-full border border-white/8 bg-white/[0.04] p-4">
                                <History className="h-6 w-6 text-white/40" />
                            </div>
                            <p className="mt-4 text-sm font-semibold text-white">No saved conversations</p>
                            <p className="mt-2 text-sm leading-6 text-white/50">
                                Start a chat and it will appear here for quick return visits.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
