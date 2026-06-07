import type { ChatIntent, ChatSuggestion } from './types';

const WHATSAPP_BOOKING =
    'https://wa.me/923235192477?text=Hi%20Arena360%2C%20I%20need%20booking%20help.';
const WHATSAPP_SUPPORT =
    'https://wa.me/923235192477?text=Hi%20Arena360%2C%20I%20need%20help%20with%20my%20booking.';
const WHATSAPP_POLICY =
    'https://wa.me/923235192477?text=Hi%20Arena360%2C%20I%20need%20help%20with%20your%20policies.';
const WHATSAPP_GENERAL =
    'https://wa.me/923235192477?text=Hi%20Arena360%2C%20I%20need%20help.';

export function getSuggestedActions(intent: ChatIntent): ChatSuggestion[] {
    const suggestionsByIntent: Record<ChatIntent, ChatSuggestion[]> = {
        booking: [
            { id: 'book-now', label: 'Open booking', type: 'link', href: '/book' },
            { id: 'ask-sports', label: 'Available sports', type: 'prompt', prompt: 'What sports can I book right now?' },
            { id: 'support-booking', label: 'Talk to support', type: 'support', href: WHATSAPP_BOOKING },
        ],
        pricing: [
            { id: 'view-pricing', label: 'View pricing', type: 'link', href: '/pricing' },
            { id: 'group-rates', label: 'Group packages', type: 'prompt', prompt: 'Do you offer group or corporate packages?' },
            { id: 'book-flow', label: 'How booking works', type: 'prompt', prompt: 'How do I book a court?' },
        ],
        availability: [
            { id: 'check-slots', label: 'Check live slots', type: 'link', href: '/book' },
            { id: 'best-times', label: 'Best times to play', type: 'prompt', prompt: 'What is the best time to book padel or futsal?' },
            { id: 'sports-list', label: 'Sports list', type: 'prompt', prompt: 'Which sports are available at Arena360?' },
        ],
        facilities: [
            { id: 'facility-list', label: 'Facility details', type: 'prompt', prompt: 'What facilities are included for players?' },
            { id: 'location-link', label: 'Get directions', type: 'prompt', prompt: 'Where is Arena360 located?' },
            { id: 'book-facility', label: 'Book a session', type: 'link', href: '/book' },
        ],
        location: [
            { id: 'maps', label: 'Open contact info', type: 'prompt', prompt: 'How do I reach Arena360 from Lahore city center?' },
            { id: 'parking', label: 'Parking info', type: 'prompt', prompt: 'Is parking available at Arena360?' },
            { id: 'book-nearby', label: 'Book now', type: 'link', href: '/book' },
        ],
        support: [
            { id: 'whatsapp-help', label: 'WhatsApp support', type: 'support', href: WHATSAPP_SUPPORT },
            { id: 'my-bookings', label: 'My bookings', type: 'link', href: '/my-bookings' },
            { id: 'refunds', label: 'Refund help', type: 'prompt', prompt: 'How do cancellations and refunds work?' },
        ],
        sports: [
            { id: 'book-sport', label: 'Open booking', type: 'link', href: '/book' },
            { id: 'pricing-sport', label: 'Check pricing', type: 'link', href: '/pricing' },
            { id: 'compare-sports', label: 'Best for groups', type: 'prompt', prompt: 'Which sport is best for a group booking?' },
        ],
        greeting: [
            { id: 'start-booking', label: 'Book a court', type: 'link', href: '/book' },
            { id: 'view-pricing-greeting', label: 'See pricing', type: 'link', href: '/pricing' },
            { id: 'sports-greeting', label: 'Sports available', type: 'prompt', prompt: 'What sports are available at Arena360?' },
        ],
        policy: [
            { id: 'contact-policy', label: 'Talk to support', type: 'support', href: WHATSAPP_POLICY },
            { id: 'my-bookings-policy', label: 'Manage booking', type: 'link', href: '/my-bookings' },
            { id: 'booking-policy', label: 'Booking help', type: 'prompt', prompt: 'How do booking changes work?' },
        ],
        general: [
            { id: 'general-book', label: 'Book a court', type: 'link', href: '/book' },
            { id: 'general-pricing', label: 'Check pricing', type: 'link', href: '/pricing' },
            { id: 'general-support', label: 'Talk to support', type: 'support', href: WHATSAPP_GENERAL },
        ],
    };

    return suggestionsByIntent[intent];
}
