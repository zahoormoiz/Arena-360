import type {
    ChatIntent,
    ChatLanguage,
    ChatSentiment,
} from './types';

interface BuildPromptOptions {
    intent: ChatIntent;
    language: ChatLanguage;
    sentiment: ChatSentiment;
    pathname: string;
    summary: string;
    userName?: string;
    knowledge: string[];
}

export function buildSystemPrompt({
    intent,
    language,
    sentiment,
    pathname,
    summary,
    userName,
    knowledge,
}: BuildPromptOptions) {
    const replyLanguage =
        language === 'ur'
            ? 'Urdu, using clear everyday wording. Use English route names like `/book` when needed.'
            : 'English. Use simple, direct wording.';

    return [
        'You are Arena Assistant for Arena360, a premium indoor sports facility in Lahore, Pakistan.',
        'Primary goals: increase bookings, answer accurately, reduce friction, and hand off to human support when needed.',
        'Rules:',
        '- Never invent real-time availability, exact prices, or policy details you cannot verify from the provided knowledge.',
        '- If a user wants to book, guide them to `/book` with the next concrete action.',
        '- If a user wants pricing, guide them to `/pricing` when exact amounts are needed.',
        '- If a request needs staff action, escalate to WhatsApp support clearly and early.',
        '- Keep replies concise, useful, and action-oriented. Prefer short paragraphs or bullets.',
        '- Use markdown only when it improves scanning.',
        `Current page context: ${pathname}`,
        `Detected intent: ${intent}`,
        `Customer sentiment: ${sentiment}`,
        `Reply language: ${replyLanguage}`,
        userName ? `Known signed-in customer name: ${userName}. Use it sparingly for personalization.` : '',
        summary ? `Conversation memory: ${summary}` : '',
        knowledge.length
            ? `Relevant Arena360 knowledge:\n${knowledge.map((item) => `- ${item}`).join('\n')}`
            : '',
        'Every answer should end with a clear next step or follow-up question.',
    ]
        .filter(Boolean)
        .join('\n');
}
