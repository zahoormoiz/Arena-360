export type ChatRole = 'user' | 'assistant';
export type ChatLanguagePreference = 'auto' | 'en' | 'ur';
export type ChatLanguage = 'en' | 'ur';
export type ChatSentiment = 'positive' | 'neutral' | 'frustrated' | 'urgent';
export type ChatIntent =
    | 'booking'
    | 'pricing'
    | 'availability'
    | 'facilities'
    | 'location'
    | 'support'
    | 'sports'
    | 'greeting'
    | 'policy'
    | 'general';

export interface ChatMessageRecord {
    id?: string;
    role: ChatRole;
    content: string;
    createdAt?: Date | string;
}

export interface ChatSuggestion {
    id: string;
    label: string;
    type: 'prompt' | 'link' | 'support';
    prompt?: string;
    href?: string;
}

export interface ChatHistoryListItem {
    sessionId: string;
    title: string;
    summary: string;
    lastMessage: string;
    messageCount: number;
    updatedAt: string;
    language: ChatLanguage;
    lastIntent: ChatIntent;
}

export interface ChatSessionPayload {
    sessionId: string;
    title: string;
    summary: string;
    language: ChatLanguage;
    sentiment: ChatSentiment;
    lastIntent: ChatIntent;
    updatedAt: string;
    messages: Array<{
        id: string;
        role: ChatRole;
        content: string;
        timestamp: string;
    }>;
}
