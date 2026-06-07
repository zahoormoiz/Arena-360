interface KnowledgeEntry {
    id: string;
    topic: string;
    keywords: string[];
    content: string;
}

const KNOWLEDGE_BASE: KnowledgeEntry[] = [
    {
        id: 'booking-flow',
        topic: 'Booking flow',
        keywords: ['book', 'booking', 'reserve', 'slot', 'calendar', 'date', 'time'],
        content:
            'Bookings happen on `/book`. Customers choose a sport, arena, date, time slot, and duration, then confirm payment details. Guests can book without creating an account, while signed-in users can track bookings in `/my-bookings`.',
    },
    {
        id: 'availability',
        topic: 'Availability',
        keywords: ['availability', 'available', 'free', 'today', 'tomorrow', 'weekend'],
        content:
            'Real-time slot availability should always be checked on `/book`. The assistant should not invent open slots or guarantee times without live booking data.',
    },
    {
        id: 'pricing',
        topic: 'Pricing',
        keywords: ['price', 'pricing', 'cost', 'rate', 'fee', 'discount'],
        content:
            'Pricing varies by sport, slot timing, and duration. Direct users to `/pricing` for exact rates, and mention group or corporate packages when relevant.',
    },
    {
        id: 'sports',
        topic: 'Sports and arenas',
        keywords: ['sports', 'futsal', 'football', 'cricket', 'padel', 'badminton', 'volleyball'],
        content:
            'Arena360 offers Football/Futsal, Cricket, Padel, Badminton, and Volleyball. Football has 7v7 and 5v5 turf options, cricket includes Tape Ball and Pro Pitch, and padel is played on professional glass courts.',
    },
    {
        id: 'facilities',
        topic: 'Facilities',
        keywords: ['facility', 'facilities', 'parking', 'cafeteria', 'locker', 'changing', 'equipment'],
        content:
            'The facility includes free parking, changing rooms, lockers, a cafeteria, equipment rental, indoor weather-protected play, and spectator-friendly areas.',
    },
    {
        id: 'support',
        topic: 'Support and escalation',
        keywords: ['support', 'help', 'agent', 'human', 'complaint', 'refund', 'cancel', 'reschedule'],
        content:
            'For complaints, guest-booking changes, refunds, or anything that needs staff intervention, guide users to WhatsApp support. Signed-in users can manage eligible bookings in `/my-bookings`.',
    },
    {
        id: 'location',
        topic: 'Location',
        keywords: ['location', 'address', 'map', 'where', 'directions', 'lahore'],
        content:
            'Arena360 is based in Lahore, Pakistan. The full address and map link are available in the site contact section, and visitors have on-site parking.',
    },
    {
        id: 'payments',
        topic: 'Payments',
        keywords: ['payment', 'jazzcash', 'easypaisa', 'cash', 'card'],
        content:
            'Payment options are surfaced during checkout. If a user needs exact supported methods for a booking, point them to the booking flow or support team rather than assuming unsupported methods.',
    },
    {
        id: 'policies',
        topic: 'Policies',
        keywords: ['policy', 'rules', 'refund', 'safety', 'kids', 'family'],
        content:
            'When policy questions are unclear or likely to vary, avoid inventing specifics. Share the known self-service path and escalate to support for policy confirmation.',
    },
];

function tokenize(value: string) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9/ ]+/g, ' ')
        .split(/\s+/)
        .filter(Boolean);
}

export function retrieveRelevantKnowledge(query: string, pathname = '/', limit = 4) {
    const tokens = new Set([...tokenize(query), ...tokenize(pathname)]);

    return KNOWLEDGE_BASE
        .map((entry) => {
            const keywordScore = entry.keywords.reduce(
                (score, keyword) => score + (tokens.has(keyword.toLowerCase()) ? 3 : 0),
                0
            );
            const topicScore = tokens.has(entry.topic.toLowerCase()) ? 2 : 0;
            const pageScore = pathname.includes('pricing') && entry.id === 'pricing'
                ? 4
                : pathname.includes('book') && entry.id === 'booking-flow'
                    ? 4
                    : 0;

            return { entry, score: keywordScore + topicScore + pageScore };
        })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((item) => item.entry.content);
}

export function getKnowledgeTopics() {
    return KNOWLEDGE_BASE.map((entry) => entry.topic);
}
