'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, X, Send, Bot, Sparkles, Phone } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const WHATSAPP_URL = 'https://wa.me/923235192477?text=Hi%20Arena360%2C%20I%20need%20help!';

const QUICK_REPLIES = [
  { label: '📅 How to book?', value: 'How do I book a court at Arena360?' },
  { label: '🕐 Timings', value: 'What are the timings and opening hours?' },
  { label: '⚽ Sports', value: 'What sports are available at Arena360?' },
  { label: '❌ Cancellations', value: 'How do cancellations and refunds work?' },
];

const GREETING_MESSAGE: Message = {
  id: 'greeting',
  role: 'assistant',
  content: "Hey there! 👋 Welcome to Arena360! I'm your Arena Assistant — here to help you book courts, answer questions, or handle any support needs. What can I help you with today?",
  timestamp: new Date(),
};

export default function ChatWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [hasOpened, setHasOpened] = useState(false);
  const [bubblePulse, setBubblePulse] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hide on admin pages
  if (pathname.startsWith('/admin')) return null;

  const scrollToBottom = useCallback(() => {
    // Use setTimeout to ensure DOM has updated before scrolling
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Focus input when chat opens (skip on mobile to avoid keyboard jump)
  useEffect(() => {
    if (isOpen && inputRef.current) {
      const isMobile = window.innerWidth < 768;
      if (!isMobile) {
        inputRef.current.focus();
      }
    }
  }, [isOpen]);

  // Stop pulse animation after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => setBubblePulse(false), 10000);
    return () => clearTimeout(timer);
  }, []);

  // Prevent body scroll when chat is open on mobile
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const toggleChat = () => {
    if (!isOpen && !hasOpened) {
      setMessages([GREETING_MESSAGE]);
      setHasOpened(true);
      setShowQuickReplies(true);
    }
    setIsOpen(!isOpen);
    setBubblePulse(false);
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setShowQuickReplies(false);
    setIsLoading(true);

    try {
      const history = [...messages.filter((m) => m.id !== 'greeting'), userMessage].map(
        (m) => ({
          role: m.role,
          content: m.content,
        })
      );

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });

      const data = await response.json();

      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: data.reply || "I'm having trouble responding right now. Please try again!",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "Oops! Something went wrong. Please try again or contact our support team directly. 🙏",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const formatTime = useCallback((date: Date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  return (
    <>
      {/* ── Chat Panel ── */}
      <div
        id="chat-widget-panel"
        className={`
          fixed z-[9999] will-change-transform
          transition-all duration-200 ease-out
          ${isOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto scale-100'
            : 'opacity-0 translate-y-4 pointer-events-none scale-95'
          }
        `}
        style={{
          /* ── Mobile-first: full-screen takeover ── */
          bottom: '0px',
          right: '0px',
          left: '0px',
          top: '0px',
        }}
      >
        {/* ── Responsive container ── */}
        <div
          className="
            absolute
            /* ─ Mobile: full screen ─ */
            inset-0
            /* ─ Tablet & Desktop: floating panel ─ */
            md:inset-auto md:bottom-[100px] md:right-5
            md:w-[380px] md:h-[540px] md:max-h-[calc(100vh-140px)]
            lg:right-8
          "
        >
          <div className="flex flex-col h-full md:rounded-2xl overflow-hidden shadow-2xl border-0 md:border md:border-white/10 backdrop-blur-xl bg-[#0a0a0a]/[0.98] md:bg-[#0a0a0a]/95">
            {/* ── Header ── */}
            <div
              id="chat-widget-header"
              className="flex items-center justify-between px-4 py-3 md:px-5 md:py-4 bg-gradient-to-r from-[#0d1f12] to-[#0a0a0a] border-b border-white/5 shrink-0"
              style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center shadow-lg shadow-primary/20">
                    <Bot size={20} className="text-black" />
                  </div>
                  {/* Online pulse indicator */}
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[#0a0a0a]">
                    <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white tracking-wide font-heading">
                    Arena Assistant
                  </h3>
                  <span className="text-[11px] text-emerald-400/80 flex items-center gap-1">
                    <Sparkles size={10} />
                    Online · AI-Powered
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 md:w-8 md:h-8 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 active:bg-[#25D366]/30 flex items-center justify-center transition-colors"
                  aria-label="Chat on WhatsApp"
                  title="Talk to a representative on WhatsApp"
                >
                  <Phone size={16} className="text-[#25D366] md:w-3.5 md:h-3.5" />
                </a>
                <button
                  id="chat-widget-close"
                  onClick={toggleChat}
                  className="w-10 h-10 md:w-8 md:h-8 rounded-lg bg-white/5 hover:bg-white/10 active:bg-white/15 flex items-center justify-center transition-colors"
                  aria-label="Close chat"
                >
                  <X size={18} className="text-white/60 md:w-4 md:h-4" />
                </button>
              </div>
            </div>

            {/* ── Messages Area ── */}
            <div
              id="chat-widget-messages"
              className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 md:px-4 md:py-4 space-y-3 md:space-y-4 scrollbar-hide"
              style={{
                background: 'linear-gradient(180deg, #0a0a0a 0%, #050505 100%)',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-up`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/20 to-emerald-900/30 flex items-center justify-center mr-2 mt-1 shrink-0 border border-primary/10">
                      <Bot size={14} className="text-primary" />
                    </div>
                  )}
                  <div
                    className={`
                      max-w-[80%] md:max-w-[75%] px-3.5 py-2.5 md:px-4 text-[13px] leading-relaxed
                      ${msg.role === 'user'
                        ? 'bg-gradient-to-br from-primary to-emerald-600 text-black rounded-2xl rounded-br-md font-medium shadow-lg shadow-primary/10'
                        : 'bg-white/[0.06] text-white/90 rounded-2xl rounded-bl-md border border-white/5'
                      }
                    `}
                  >
                    <p className="whitespace-pre-wrap break-words overflow-wrap-anywhere">{msg.content}</p>
                    <span
                      className={`block text-[10px] mt-1.5 ${
                        msg.role === 'user' ? 'text-black/50' : 'text-white/30'
                      }`}
                    >
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isLoading && (
                <div className="flex justify-start animate-fade-up">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/20 to-emerald-900/30 flex items-center justify-center mr-2 mt-1 shrink-0 border border-primary/10">
                    <Bot size={14} className="text-primary" />
                  </div>
                  <div className="bg-white/[0.06] border border-white/5 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Reply Chips */}
              {showQuickReplies && messages.length <= 1 && (
                <div className="flex flex-wrap gap-2 pt-2 animate-fade-up" style={{ animationDelay: '0.3s' }}>
                  {QUICK_REPLIES.map((chip) => (
                    <button
                      key={chip.label}
                      onClick={() => sendMessage(chip.value)}
                      className="px-3.5 py-2.5 md:py-2 text-xs font-medium rounded-xl bg-white/[0.06] hover:bg-primary/20 active:bg-primary/30 border border-white/10 hover:border-primary/30 text-white/80 hover:text-primary transition-all duration-200 active:scale-95 select-none touch-manipulation"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ── Input Area ── */}
            <div
              id="chat-widget-input"
              className="px-3 py-2.5 md:px-4 md:py-3 bg-[#0a0a0a] border-t border-white/5 shrink-0"
              style={{ paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom))' }}
            >
              <div className="flex items-center gap-2 bg-white/[0.04] rounded-xl border border-white/10 focus-within:border-primary/40 transition-colors px-3 py-0.5">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  disabled={isLoading}
                  autoComplete="off"
                  autoCorrect="on"
                  enterKeyHint="send"
                  className="flex-1 bg-transparent text-sm md:text-sm text-white placeholder:text-white/30 outline-none py-2.5 md:py-2 disabled:opacity-50"
                  style={{ fontSize: '16px' }}  /* Prevents iOS zoom on focus */
                  id="chat-widget-text-input"
                />
                <button
                  id="chat-widget-send"
                  onClick={() => sendMessage(input)}
                  disabled={isLoading || !input.trim()}
                  className={`
                    w-10 h-10 md:w-8 md:h-8 rounded-lg flex items-center justify-center transition-all duration-200 shrink-0 touch-manipulation
                    ${input.trim() && !isLoading
                      ? 'bg-primary text-black hover:bg-primary/90 shadow-md shadow-primary/20 active:scale-90'
                      : 'bg-white/5 text-white/20 cursor-not-allowed'
                    }
                  `}
                  aria-label="Send message"
                >
                  <Send size={16} />
                </button>
              </div>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 mt-2 py-1.5 md:py-1 text-[11px] text-[#25D366]/70 hover:text-[#25D366] active:text-[#25D366] transition-colors touch-manipulation"
              >
                <Phone size={10} />
                Talk to a representative on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Floating Chat Bubble ── */}
      <button
        id="chat-widget-bubble"
        onClick={toggleChat}
        className={`
          fixed z-[9999] w-14 h-14 rounded-full
          bg-gradient-to-br from-primary to-emerald-600
          text-black shadow-xl shadow-primary/30
          flex items-center justify-center
          hover:scale-110 active:scale-95
          transition-all duration-200 ease-out
          will-change-transform touch-manipulation
          ${bubblePulse ? 'animate-bounce' : ''}
          ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}
          bottom-[88px] right-4
          md:bottom-8 md:right-8
        `}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        <div className={`absolute inset-0 rounded-full bg-primary/30 ${bubblePulse ? 'animate-ping' : ''}`} />
        <div className="relative">
          <MessageCircle size={24} />
        </div>

        {/* Notification badge */}
        {!isOpen && !hasOpened && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-[#050505] animate-pulse">
            1
          </span>
        )}
      </button>
    </>
  );
}
