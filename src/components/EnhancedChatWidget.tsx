/**
 * Enhanced ChatWidget with Agent Integration
 * Connects the chat UI to the agent system with action handling
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import ChatMessageBubble from './chat/ChatMessageBubble';
import ChatHistoryPanel from './chat/ChatHistoryPanel';
import { useAuth } from '@/context/AuthContext';
import Toast from './ui/Toast';
import type { UserIntent } from '@/lib/agent/types';

interface AgentMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  actionId?: string;
  requiresApproval?: boolean;
  action?: string;
  intents?: UserIntent[];
  suggestions?: string[];
}

interface AgentActionRequest {
  actionId: string;
  action: string;
  summary: string;
  riskLevel: 'low' | 'medium' | 'high';
  expiresAt: Date;
}

export default function EnhancedChatWidget() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substring(7)}`);
  const [pendingApproval, setPendingApproval] = useState<AgentActionRequest | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load initial welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMsg: AgentMessage = {
        id: `msg_${Date.now()}`,
        role: 'agent',
        content: `Hello! I'm your Arena360 agent. I can help you with booking sports facilities, checking availability, managing your reservations, and more. What would you like to do today?`,
        timestamp: new Date(),
        suggestions: ['Check availability', 'Create a booking', 'View my bookings', 'Get pricing'],
      };
      setMessages([welcomeMsg]);
    }
  }, [isOpen]);

  /**
   * Send message to agent
   */
  const sendMessage = useCallback(async () => {
    if (!input.trim()) return;

    // Add user message
    const userMsg: AgentMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          sessionId,
          userId: user?.id,
          userRole: user?.role || 'guest',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      // Handle agent response
      if (data.clarification) {
        // Clarification needed
        const clarMsg: AgentMessage = {
          id: `msg_${Date.now()}`,
          role: 'agent',
          content: data.response,
          timestamp: new Date(),
          intents: data.intents,
          suggestions: data.intents?.map((i) => i.action.replace(/_/g, ' ')) || [],
        };
        setMessages((prev) => [...prev, clarMsg]);
      } else if (data.requiresApproval && data.actions?.[0]) {
        // Action requires approval
        const action = data.actions[0];
        setPendingApproval({
          actionId: action.id,
          action: action.tool,
          summary: data.response,
          riskLevel: data.intents?.[0]?.confidence ? 'high' : 'medium',
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        });

        const approvalMsg: AgentMessage = {
          id: `msg_${Date.now()}`,
          role: 'agent',
          content: data.response,
          timestamp: new Date(),
          actionId: action.id,
          requiresApproval: true,
          action: action.tool,
        };
        setMessages((prev) => [...prev, approvalMsg]);
      } else {
        // Direct response or action executed
        const agentMsg: AgentMessage = {
          id: `msg_${Date.now()}`,
          role: 'agent',
          content: data.response,
          timestamp: new Date(),
          suggestions: [],
        };
        setMessages((prev) => [...prev, agentMsg]);

        if (data.response.startsWith('✅')) {
          setToast({
            message: 'Action completed successfully',
            type: 'success',
          });
        }
      }
    } catch (error) {
      const errorMsg: AgentMessage = {
        id: `msg_${Date.now()}`,
        role: 'system',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
      setToast({
        message: 'Error processing message',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [input, sessionId, user]);

  /**
   * Handle user approval/rejection of action
   */
  const handleApproval = useCallback(
    async (approved: boolean) => {
      if (!pendingApproval) return;

      setLoading(true);
      try {
        const response = await fetch('/api/agent/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            actionId: pendingApproval.actionId,
            approved,
            userId: user?.id,
            sessionId,
            userRole: user?.role || 'guest',
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to process approval');
        }

        const data = await response.json();

        // Add result message
        const resultMsg: AgentMessage = {
          id: `msg_${Date.now()}`,
          role: 'agent',
          content: data.result.humanReadable,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, resultMsg]);

        setPendingApproval(null);

        if (data.result.status === 'completed') {
          setToast({
            message: approved ? 'Action completed' : 'Action declined',
            type: approved ? 'success' : 'info',
          });
        }
      } catch (error) {
        setToast({
          message: 'Error processing approval',
          type: 'error',
        });
      } finally {
        setLoading(false);
      }
    },
    [pendingApproval, sessionId, user]
  );

  /**
   * Handle suggestion click
   */
  const handleSuggestion = (suggestion: string) => {
    setInput(suggestion);
  };

  // UI Layout
  return (
    <>
      {/* Chat Widget Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-[#22c55e] to-[#06b6d4] rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center z-50"
          aria-label="Open chat"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-[#0A0A0A] border border-[#1a1a1a] rounded-[18px] shadow-2xl flex flex-col z-50 animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#1a1a1a]">
            <div>
              <h3 className="font-semibold text-white">Arena360 Agent</h3>
              <p className="text-xs text-gray-400">Always here to help</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Close chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-[#22c55e]/20 scrollbar-track-transparent">
            {messages.map((msg) => (
              <div key={msg.id}>
                <ChatMessageBubble
                  role={msg.role}
                  content={msg.content}
                  timestamp={msg.timestamp}
                />

                {/* Action Approval UI */}
                {msg.requiresApproval && pendingApproval && (
                  <div className="mt-3 p-3 bg-[#0F5F3C] border border-[#22c55e]/30 rounded-lg space-y-3">
                    <p className="text-sm text-white font-medium">Please confirm this action:</p>
                    <p className="text-xs text-gray-300">{pendingApproval.summary}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproval(true)}
                        disabled={loading}
                        className="flex-1 px-3 py-2 bg-[#22c55e] text-[#050505] rounded text-sm font-medium hover:bg-[#1ea853] disabled:opacity-50 transition-colors"
                      >
                        {loading ? 'Processing...' : 'Confirm'}
                      </button>
                      <button
                        onClick={() => handleApproval(false)}
                        disabled={loading}
                        className="flex-1 px-3 py-2 bg-[#ff4444] text-white rounded text-sm font-medium hover:bg-[#cc0000] disabled:opacity-50 transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {msg.suggestions.map((sug) => (
                      <button
                        key={sug}
                        onClick={() => handleSuggestion(sug)}
                        className="px-3 py-1 text-xs bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/30 rounded-full hover:bg-[#22c55e]/20 transition-colors"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-gray-400">
                <div className="w-2 h-2 bg-[#22c55e] rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-[#22c55e] rounded-full animate-pulse animation-delay-100" />
                <div className="w-2 h-2 bg-[#22c55e] rounded-full animate-pulse animation-delay-200" />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-[#1a1a1a]">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Type a message..."
                disabled={loading}
                className="flex-1 bg-[#050505] border border-[#1a1a1a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#22c55e]/50 disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="px-4 py-2 bg-[#22c55e] text-[#050505] rounded-lg font-medium hover:bg-[#1ea853] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
