'use client';

import {
    startTransition,
    useCallback,
    useDeferredValue,
    useEffect,
    useRef,
    useState,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
    Bot,
    Globe,
    History,
    MessageCircle,
    Mic,
    Phone,
    Plus,
    Send,
    Sparkles,
    X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type {
    ChatHistoryListItem,
    ChatIntent,
    ChatLanguagePreference,
    ChatSessionPayload,
    ChatSuggestion,
} from '@/lib/chat/types';
import { getSuggestedActions } from '@/lib/chat/suggestions';
import Toast, { type ToastType } from './ui/Toast';
import { cn } from '@/lib/utils';
import ChatHistoryPanel from './chat/ChatHistoryPanel';
import ChatMessageBubble, { type DisplayMessage } from './chat/ChatMessageBubble';

declare global {
    interface Window {
        SpeechRecognition?: new () => BrowserSpeechRecognition;
        webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
    }
}

interface SpeechRecognitionResultLike {
    0?: {
        transcript?: string;
    };
}

interface SpeechRecognitionEventLike {
    results: ArrayLike<SpeechRecognitionResultLike>;
}

interface BrowserSpeechRecognition {
    lang: string;
    interimResults: boolean;
    continuous: boolean;
    maxAlternatives: number;
    start: () => void;
    stop: () => void;
    onresult: ((event: SpeechRecognitionEventLike) => void) | null;
    onerror: (() => void) | null;
    onend: (() => void) | null;
}

const STORAGE_KEYS = {
    visitor: 'arena360-chat-visitor-id',
    session: 'arena360-chat-session-id',
    language: 'arena360-chat-language',
};

const WHATSAPP_URL = 'https://wa.me/923235192477?text=Hi%20Arena360%2C%20I%20need%20help!';

interface ToastState {
    message: string;
    type: ToastType;
    visible: boolean;
}

function mapIntentToSuggestions(intent?: ChatIntent) {
    return getSuggestedActions(intent || 'greeting');
}

function mapSessionMessages(session: ChatSessionPayload): DisplayMessage[] {
    return session.messages.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        timestamp: message.timestamp,
        status: 'sent',
    }));
}

function parseSsePayload(rawEvent: string) {
    const lines = rawEvent.split('\n');
    let event = 'message';
    let data = '';

    for (const line of lines) {
        if (line.startsWith('event:')) {
            event = line.slice(6).trim();
        }

        if (line.startsWith('data:')) {
            data += line.slice(5).trim();
        }
    }

    return { event, data };
}

export default function ChatWidget() {
    const pathname = usePathname();
    const router = useRouter();
    const { user } = useAuth();
    const isAdminPage = pathname.startsWith('/admin');

    const [isOpen, setIsOpen] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [hasOpened, setHasOpened] = useState(false);
    const [bubblePulse, setBubblePulse] = useState(true);
    const [messages, setMessages] = useState<DisplayMessage[]>([]);
    const [input, setInput] = useState('');
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [visitorId, setVisitorId] = useState('');
    const [preferredLanguage, setPreferredLanguage] = useState<ChatLanguagePreference>('auto');
    const [activeSuggestions, setActiveSuggestions] = useState<ChatSuggestion[]>(mapIntentToSuggestions('greeting'));
    const [historySessions, setHistorySessions] = useState<ChatHistoryListItem[]>([]);
    const [historyQuery, setHistoryQuery] = useState('');
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const [isSessionLoading, setIsSessionLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
    const [toast, setToast] = useState<ToastState>({ message: '', type: 'info', visible: false });
    const [isNearBottom, setIsNearBottom] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    const deferredHistoryQuery = useDeferredValue(historyQuery);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
    const messagesRef = useRef<DisplayMessage[]>([]);

    const showToast = useCallback((message: string, type: ToastType) => {
        setToast({ message, type, visible: true });
    }, []);

    const resizeComposer = useCallback(() => {
        if (!textareaRef.current) return;
        textareaRef.current.style.height = '0px';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }, []);

    const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
        if (!isNearBottom && behavior === 'smooth') return;
        requestAnimationFrame(() => {
            messagesEndRef.current?.scrollIntoView({ behavior });
        });
    }, [isNearBottom]);

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    useEffect(() => {
        const storedVisitorId = localStorage.getItem(STORAGE_KEYS.visitor) || crypto.randomUUID();
        localStorage.setItem(STORAGE_KEYS.visitor, storedVisitorId);
        setVisitorId(storedVisitorId);

        const storedSessionId = localStorage.getItem(STORAGE_KEYS.session);
        if (storedSessionId) {
            setSessionId(storedSessionId);
            setHasOpened(true);
        }

        const storedLanguage = localStorage.getItem(STORAGE_KEYS.language) as ChatLanguagePreference | null;
        if (storedLanguage === 'auto' || storedLanguage === 'en' || storedLanguage === 'ur') {
            setPreferredLanguage(storedLanguage);
        }
    }, []);

    useEffect(() => {
        if (sessionId) {
            localStorage.setItem(STORAGE_KEYS.session, sessionId);
        } else {
            localStorage.removeItem(STORAGE_KEYS.session);
        }
    }, [sessionId]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.language, preferredLanguage);
    }, [preferredLanguage]);

    useEffect(() => {
        resizeComposer();
    }, [input, resizeComposer]);

    useEffect(() => {
        const timer = setTimeout(() => setBubblePulse(false), 12000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const isMobile = window.innerWidth < 768;
        document.body.style.overflow = isOpen && isMobile ? 'hidden' : '';

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && textareaRef.current && window.innerWidth >= 768) {
            textareaRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        if (messages.length) {
            scrollToBottom(messages.length === 1 ? 'auto' : 'smooth');
        }
    }, [messages, isStreaming, scrollToBottom]);

    const loadHistory = useCallback(
        async (query = '') => {
            if (!visitorId || !isOpen) return;

            setIsHistoryLoading(true);

            try {
                const params = new URLSearchParams({ visitorId });
                if (query) params.set('q', query);

                const response = await fetch(`/api/chat/history?${params.toString()}`);
                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(data.error || 'Failed to load chat history');
                }

                startTransition(() => {
                    setHistorySessions(data.sessions || []);
                });
            } catch {
                startTransition(() => {
                    setHistorySessions([]);
                });

                if (query) {
                    showToast('History search is temporarily unavailable.', 'warning');
                }
            } finally {
                setIsHistoryLoading(false);
            }
        },
        [isOpen, showToast, visitorId]
    );

    const loadSession = useCallback(
        async (targetSessionId: string) => {
            if (!visitorId || !targetSessionId) return;

            setIsSessionLoading(true);

            try {
                const params = new URLSearchParams({
                    sessionId: targetSessionId,
                    visitorId,
                });
                const response = await fetch(`/api/chat/history?${params.toString()}`);
                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(data.error || 'Conversation not found');
                }

                const session = data.session as ChatSessionPayload;

                setMessages(mapSessionMessages(session));
                setSessionId(session.sessionId);
                setActiveSuggestions(mapIntentToSuggestions(session.lastIntent));
                setIsNearBottom(true);
            } catch {
                setMessages([]);
                setSessionId(null);
                setActiveSuggestions(mapIntentToSuggestions('greeting'));
                localStorage.removeItem(STORAGE_KEYS.session);
                showToast('That conversation could not be restored.', 'warning');
            } finally {
                setIsSessionLoading(false);
                setHistoryOpen(false);
            }
        },
        [showToast, visitorId]
    );

    useEffect(() => {
        if (!isOpen || !visitorId) return;
        void loadHistory(deferredHistoryQuery);
    }, [deferredHistoryQuery, isOpen, loadHistory, visitorId]);

    useEffect(() => {
        if (!isOpen || !visitorId || !sessionId) return;
        void loadSession(sessionId);
    }, [isOpen, loadSession, sessionId, visitorId]);

    useEffect(() => {
        return () => {
            recognitionRef.current?.stop?.();
            window.speechSynthesis?.cancel?.();
        };
    }, []);

    const toggleChat = () => {
        setBubblePulse(false);
        setIsOpen((current) => {
            const next = !current;
            if (next) {
                setUnreadCount(0);
                setHasOpened(true);
            }
            return next;
        });
    };

    const startNewChat = () => {
        setHistoryOpen(false);
        setMessages([]);
        setSessionId(null);
        setActiveSuggestions(mapIntentToSuggestions('greeting'));
        setInput('');
        setIsNearBottom(true);
    };

    const handleMessagesScroll = () => {
        const container = messagesContainerRef.current;
        if (!container) return;
        const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
        setIsNearBottom(distanceFromBottom < 140);
    };

    const copyToClipboard = async (value: string) => {
        try {
            await navigator.clipboard.writeText(value);
            showToast('Copied to clipboard.', 'success');
        } catch {
            showToast('Copy failed on this device.', 'warning');
        }
    };

    const handleSpeak = (messageId: string, value: string) => {
        if (!('speechSynthesis' in window)) {
            showToast('Voice playback is not supported in this browser.', 'warning');
            return;
        }

        if (speakingMessageId === messageId) {
            window.speechSynthesis.cancel();
            setSpeakingMessageId(null);
            return;
        }

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(value.replace(/[`*_>#-]/g, ' '));
        utterance.lang = preferredLanguage === 'ur' ? 'ur-PK' : 'en-US';
        utterance.onend = () => setSpeakingMessageId(null);
        utterance.onerror = () => {
            setSpeakingMessageId(null);
            showToast('Voice playback failed.', 'warning');
        };
        setSpeakingMessageId(messageId);
        window.speechSynthesis.speak(utterance);
    };

    const toggleListening = () => {
        const RecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!RecognitionConstructor) {
            showToast('Voice input is not supported in this browser.', 'warning');
            return;
        }

        if (isListening) {
            recognitionRef.current?.stop?.();
            return;
        }

        const recognition = new RecognitionConstructor();
        recognition.lang = preferredLanguage === 'ur' ? 'ur-PK' : 'en-US';
        recognition.interimResults = true;
        recognition.continuous = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: SpeechRecognitionEventLike) => {
            const transcript = Array.from(event.results)
                .map((result) => result[0]?.transcript || '')
                .join('');
            setInput(transcript.trimStart());
        };

        recognition.onerror = () => {
            setIsListening(false);
            showToast('Voice input stopped unexpectedly.', 'warning');
        };

        recognition.onend = () => {
            setIsListening(false);
            recognitionRef.current = null;
        };

        recognitionRef.current = recognition;
        setIsListening(true);
        recognition.start();
    };

    const handleSuggestion = async (suggestion: ChatSuggestion) => {
        if (suggestion.type === 'prompt' && suggestion.prompt) {
            await sendMessage(suggestion.prompt);
            return;
        }

        if (suggestion.href?.startsWith('/')) {
            router.push(suggestion.href);
            setIsOpen(false);
            return;
        }

        if (suggestion.href) {
            window.open(suggestion.href, '_blank', 'noopener,noreferrer');
        }
    };

    const sendMessage = async (rawContent: string) => {
        const content = rawContent.trim();
        if (!content || isStreaming || !visitorId) return;

        const assistantId = `assistant-${crypto.randomUUID()}`;
        const userMessage: DisplayMessage = {
            id: `user-${crypto.randomUUID()}`,
            role: 'user',
            content,
            timestamp: new Date().toISOString(),
            status: 'sent',
        };

        setInput('');
        setHistoryOpen(false);
        setIsStreaming(true);
        setBubblePulse(false);

        const baseMessages = messagesRef.current.map((message) => ({ ...message, suggestions: undefined }));
        setMessages([
            ...baseMessages,
            userMessage,
            {
                id: assistantId,
                role: 'assistant',
                content: '',
                timestamp: new Date().toISOString(),
                status: 'streaming',
            },
        ]);

        try {
            const recentMessages = [...baseMessages, userMessage].slice(-10).map((message) => ({
                id: message.id,
                role: message.role,
                content: message.content,
            }));

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    visitorId,
                    message: content,
                    pathname,
                    locale: navigator.language,
                    preferredLanguage,
                    userName: user?.name,
                    messages: recentMessages,
                }),
            });

            if (!response.ok || !response.body) {
                const payload = await response.json().catch(() => null);
                throw new Error(payload?.error || 'Unable to send the message');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let finalSuggestions = mapIntentToSuggestions('general');

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const events = buffer.split('\n\n');
                buffer = events.pop() || '';

                for (const rawEvent of events) {
                    if (!rawEvent.trim()) continue;
                    const { event, data } = parseSsePayload(rawEvent);
                    if (!data) continue;

                    const payload = JSON.parse(data);

                    if (event === 'meta') {
                        if (payload.sessionId) setSessionId(payload.sessionId);
                        if (payload.intent) finalSuggestions = mapIntentToSuggestions(payload.intent);
                    }

                    if (event === 'chunk') {
                        setMessages((current) =>
                            current.map((message) =>
                                message.id === assistantId
                                    ? { ...message, content: `${message.content}${payload.text || ''}`, status: 'streaming' }
                                    : message
                            )
                        );
                    }

                    if (event === 'end') {
                        finalSuggestions = payload.suggestions || finalSuggestions;
                        setActiveSuggestions(finalSuggestions);
                        setMessages((current) =>
                            current.map((message) =>
                                message.id === assistantId
                                    ? { ...message, status: 'sent', suggestions: finalSuggestions }
                                    : message
                            )
                        );

                        if (!isOpen) {
                            setUnreadCount((count) => count + 1);
                        }
                    }
                }
            }

            await loadHistory(deferredHistoryQuery);
        } catch {
            setMessages((current) =>
                current.map((message) =>
                    message.id === assistantId
                        ? {
                            ...message,
                            status: 'error',
                            content: 'The connection dropped before I could reply. Retry the message or open WhatsApp support.',
                            retryPrompt: content,
                            suggestions: [
                                {
                                    id: 'chat-error-support',
                                    label: 'Open WhatsApp support',
                                    type: 'support',
                                    href: WHATSAPP_URL,
                                },
                            ],
                        }
                        : message
                )
            );
            showToast('Reply failed. Retry or switch to WhatsApp support.', 'error');
        } finally {
            setIsStreaming(false);
        }
    };

    const handleComposerKeyDown = async (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            await sendMessage(input);
        }
    };

    const currentLanguageLabel =
        preferredLanguage === 'auto' ? 'Auto' : preferredLanguage === 'ur' ? 'Urdu' : 'English';

    if (isAdminPage) return null;

    return (
        <>
            <div
                className={cn(
                    'fixed inset-0 z-[9999] transition duration-200',
                    isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
                )}
            >
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm md:hidden" onClick={toggleChat} />
                <div
                    className={cn(
                        'absolute inset-0 md:inset-auto md:bottom-[98px] md:right-5 md:h-[620px] md:max-h-[calc(100vh-132px)] md:w-[440px] lg:right-8',
                        isOpen ? 'translate-y-0 scale-100' : 'translate-y-4 scale-[0.98]'
                    )}
                >
                    <div className="relative flex h-full overflow-hidden border-0 bg-[#070707] shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl md:rounded-[28px] md:border md:border-white/8">
                        <ChatHistoryPanel
                            sessions={historySessions}
                            isLoading={isHistoryLoading}
                            isOpen={historyOpen}
                            query={historyQuery}
                            currentSessionId={sessionId}
                            onQueryChange={setHistoryQuery}
                            onSelect={(targetSessionId) => void loadSession(targetSessionId)}
                            onNewChat={startNewChat}
                            onClose={() => setHistoryOpen(false)}
                        />

                        <div
                            className={cn(
                                'relative flex min-w-0 flex-1 flex-col transition-[padding] duration-200',
                                historyOpen ? 'md:pl-[320px]' : ''
                            )}
                        >
                            <div className="border-b border-white/8 bg-gradient-to-r from-[#0d1f12]/70 via-[#08120c]/70 to-[#070707]/70 backdrop-blur-sm px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top,16px))] md:px-5 md:pt-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-600 text-black shadow-[0_12px_24px_rgba(34,197,94,0.25)]">
                                            <Bot className="h-5 w-5" />
                                            <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#08120c] bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]">
                                                <span className="absolute inset-0 rounded-full bg-emerald-400 animate-pulse opacity-75" />
                                            </span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-heading text-sm font-semibold tracking-wide text-white">
                                                Arena Assistant
                                            </p>
                                            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-300/85">
                                                <Sparkles className="h-3 w-3 shrink-0" />
                                                <span className="truncate">AI-powered support</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => setHistoryOpen((current) => !current)}
                                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white focus-ring-visible"
                                            aria-label="Open conversation history"
                                            title="Conversation history"
                                        >
                                            <History className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={startNewChat}
                                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white focus-ring-visible"
                                            aria-label="Start a new conversation"
                                            title="New conversation"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </button>
                                        <a
                                            href={WHATSAPP_URL}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#25D366]/12 text-[#25D366] transition hover:bg-[#25D366]/18 focus-ring-visible"
                                            aria-label="Open WhatsApp support"
                                            title="WhatsApp support"
                                        >
                                            <Phone className="h-4 w-4" />
                                        </a>
                                        <button
                                            type="button"
                                            onClick={toggleChat}
                                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white focus-ring-visible"
                                            aria-label="Close chat"
                                            title="Close"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div
                                ref={messagesContainerRef}
                                onScroll={handleMessagesScroll}
                                className="relative flex-1 overflow-y-auto px-4 py-4 scrollbar-hide md:px-5"
                                style={{
                                    background:
                                        'radial-gradient(circle at top, rgba(34,197,94,0.08), transparent 28%), linear-gradient(180deg, #090909 0%, #050505 100%)',
                                }}
                            >
                                {isSessionLoading ? (
                                    <div className="space-y-4 pt-2">
                                        {Array.from({ length: 3 }).map((_, index) => (
                                            <div key={index} className="flex gap-3 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-white/8 to-white/4 animate-pulse" />
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-3 w-1/3 rounded-full bg-white/8 animate-pulse" />
                                                    <div className="h-3 w-full rounded-full bg-white/6 animate-pulse" />
                                                    <div className="h-3 w-5/6 rounded-full bg-white/6 animate-pulse" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : messages.length ? (
                                    <div aria-live="polite">
                                        {messages.map((message, index) => (
                                            <ChatMessageBubble
                                                key={message.id}
                                                message={message}
                                                groupedWithPrevious={messages[index - 1]?.role === message.role}
                                                onCopy={(value) => void copyToClipboard(value)}
                                                onRetry={(_id, prompt) => void sendMessage(prompt)}
                                                onSpeak={handleSpeak}
                                                onSuggestion={(suggestion) => void handleSuggestion(suggestion)}
                                                isSpeaking={speakingMessageId === message.id}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="mx-auto max-w-[320px] pt-6 text-center md:pt-12 animate-fade-in">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] bg-gradient-to-br from-primary to-emerald-500 text-black shadow-[0_16px_34px_rgba(34,197,94,0.18)] md:h-16 md:w-16 md:rounded-[24px]">
                                            <MessageCircle className="h-6 w-6 md:h-7 md:w-7" />
                                        </div>
                                        <h2 className="mt-4 font-heading text-lg font-semibold text-white md:mt-5 md:text-xl">
                                            {user?.name ? `Welcome back, ${user.name.split(' ')[0]}` : 'Ask anything about Arena360'}
                                        </h2>
                                        <p className="mt-2 text-xs leading-6 text-white/50 md:mt-3 md:text-sm md:leading-7">
                                            Booking help, pricing, facilities info, and support — all in one chat.
                                        </p>
                                        <div className="mt-6 space-y-2">
                                            <p className="text-[11px] font-medium text-white/40 uppercase tracking-wide">Popular questions:</p>
                                            <div className="space-y-2">
                                                <button
                                                    type="button"
                                                    onClick={() => void sendMessage('What sports facilities do you have?')}
                                                    className="w-full rounded-lg border border-white/8 bg-white/[0.04] px-3 py-2 text-xs text-white/70 transition hover:bg-white/[0.08] hover:text-white text-left"
                                                >
                                                    What sports facilities do you have?
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => void sendMessage('How do I book a slot?')}
                                                    className="w-full rounded-lg border border-white/8 bg-white/[0.04] px-3 py-2 text-xs text-white/70 transition hover:bg-white/[0.08] hover:text-white text-left"
                                                >
                                                    How do I book a slot?
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="border-t border-white/8 bg-[#070707] px-4 pb-[max(1rem,env(safe-area-inset-bottom,16px))] pt-3 md:px-5 md:pb-4">
                                <div className="flex flex-wrap gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:overflow-visible">
                                    {(messages.length ? activeSuggestions : mapIntentToSuggestions('greeting')).map((suggestion) => (
                                        <button
                                            key={suggestion.id}
                                            type="button"
                                            onClick={() => void handleSuggestion(suggestion)}
                                            className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/70 transition whitespace-nowrap hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                                        >
                                            {suggestion.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="mt-3 overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04] shadow-[0_18px_38px_rgba(0,0,0,0.25)]">
                                    <textarea
                                        ref={textareaRef}
                                        value={input}
                                        onChange={(event) => setInput(event.target.value)}
                                        onKeyDown={handleComposerKeyDown}
                                        placeholder="Ask about booking, pricing, facilities, or support..."
                                        disabled={isStreaming}
                                        rows={1}
                                        className="max-h-[140px] min-h-[56px] w-full resize-none bg-transparent px-4 py-4 text-[15px] leading-7 text-white outline-none placeholder:text-white/28 disabled:opacity-60"
                                        style={{ fontSize: '16px' }}
                                    />
                                    <div className="flex items-center justify-between gap-3 border-t border-white/8 px-3 py-3">
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={toggleListening}
                                                className={cn(
                                                    'flex h-10 w-10 items-center justify-center rounded-full border text-white/70 transition focus:ring-2 focus:ring-primary/50 focus:outline-none',
                                                    isListening
                                                        ? 'border-primary/40 bg-primary/15 text-primary'
                                                        : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:text-white'
                                                )}
                                                aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                                                title={isListening ? 'Stop listening' : 'Click to speak your message'}
                                            >
                                                <Mic className="h-4 w-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setPreferredLanguage((current) =>
                                                        current === 'auto' ? 'en' : current === 'en' ? 'ur' : 'auto'
                                                    )
                                                }
                                                className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 text-xs font-medium text-white/70 transition focus:ring-2 focus:ring-primary/50 focus:outline-none hover:bg-white/[0.08] hover:text-white"
                                                aria-label={`Language: ${currentLanguageLabel}. Click to change.`}
                                                title="Change language"
                                            >
                                                <Globe className="h-3.5 w-3.5" />
                                                <span className="hidden sm:inline">{currentLanguageLabel}</span>
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="hidden text-[11px] text-white/35 md:inline">
                                                Enter to send, Shift+Enter for a new line
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => void sendMessage(input)}
                                                disabled={!input.trim() || isStreaming}
                                                className={cn(
                                                    'flex h-11 w-11 items-center justify-center rounded-full transition',
                                                    input.trim() && !isStreaming
                                                        ? 'bg-gradient-to-br from-primary to-emerald-500 text-black shadow-[0_14px_28px_rgba(34,197,94,0.24)] hover:brightness-105'
                                                        : 'bg-white/6 text-white/20'
                                                )}
                                                aria-label="Send message"
                                            >
                                                <Send className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-2 flex items-center justify-between text-[11px] text-white/35">
                                    <span>{isStreaming ? 'Arena Assistant is streaming a reply...' : 'Chat history persists when available.'}</span>
                                    <a
                                        href={WHATSAPP_URL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[#25D366]/80 transition hover:text-[#25D366]"
                                    >
                                        Switch to WhatsApp
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <button
                onClick={toggleChat}
                className={cn(
                    'fixed bottom-[calc(88px+env(safe-area-inset-bottom,0px))] right-4 z-[9999] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-emerald-600 text-black shadow-[0_22px_34px_rgba(34,197,94,0.32)] transition duration-200 hover:scale-105 active:scale-95 md:bottom-8 md:right-8',
                    bubblePulse && 'animate-bounce',
                    isOpen && 'pointer-events-none scale-0 opacity-0'
                )}
                aria-label={isOpen ? 'Close chat' : 'Open chat'}
            >
                <span className={cn('absolute inset-0 rounded-full bg-primary/30', bubblePulse && 'animate-ping')} />
                <MessageCircle className="relative h-6 w-6" />
                {!isOpen && (unreadCount > 0 || !hasOpened) ? (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#050505] bg-red-500 text-[10px] font-bold text-white">
                        {unreadCount > 0 ? Math.min(unreadCount, 9) : 1}
                    </span>
                ) : null}
            </button>

            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.visible}
                onClose={() => setToast((current) => ({ ...current, visible: false }))}
            />
        </>
    );
}
