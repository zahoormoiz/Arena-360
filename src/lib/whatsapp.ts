export type WhatsAppEvent = 'created' | 'confirmed' | 'cancelled' | 'rescheduled' | 'payment_received';

export interface WhatsAppBookingPayload {
    customerName: string;
    customerPhone: string;
    date: string;
    startTime: string;
    endTime?: string;
    amount?: number;
    sportName?: string;
    status?: string;
}

interface WhatsAppSendResult {
    sent: boolean;
    provider: 'meta' | 'none';
    reason?: string;
}

function normalizePhoneNumber(input: string): string {
    const defaultCountryCode = (process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || '92').replace(/[^\d]/g, '');
    const digits = (input || '').replace(/[^\d+]/g, '');

    if (!digits) return '';

    if (digits.startsWith('+')) {
        return `+${digits.slice(1).replace(/[^\d]/g, '')}`;
    }

    if (digits.startsWith('00')) {
        return `+${digits.slice(2).replace(/[^\d]/g, '')}`;
    }

    const raw = digits.replace(/[^\d]/g, '');
    if (raw.startsWith('0')) {
        return `+${defaultCountryCode}${raw.slice(1)}`;
    }

    if (raw.length <= 10) {
        return `+${defaultCountryCode}${raw}`;
    }

    return `+${raw}`;
}

function buildBookingMessage(payload: WhatsAppBookingPayload, event: WhatsAppEvent): string {
    const sportLine = payload.sportName ? `Sport: ${payload.sportName}\n` : '';
    const timeLine = payload.endTime
        ? `Time: ${payload.startTime} - ${payload.endTime}`
        : `Time: ${payload.startTime}`;
    const amountLine = payload.amount !== undefined ? `\nAmount: Rs ${payload.amount}` : '';
    const statusLine = payload.status ? `\nStatus: ${payload.status}` : '';

    const titles: Record<WhatsAppEvent, string> = {
        created: 'Booking Received',
        confirmed: 'Booking Confirmed',
        cancelled: 'Booking Cancelled',
        rescheduled: 'Booking Rescheduled',
        payment_received: 'Payment Received'
    };

    return [
        `Arena360 - ${titles[event]}`,
        '',
        `Hi ${payload.customerName},`,
        'Your booking update is below:',
        '',
        sportLine ? sportLine.trimEnd() : null,
        `Date: ${payload.date}`,
        timeLine,
        `${amountLine}${statusLine}`.trim(),
        '',
        'Thank you for choosing Arena360.'
    ]
        .filter(Boolean)
        .join('\n');
}

async function sendViaMeta(to: string, body: string): Promise<WhatsAppSendResult> {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!accessToken || !phoneNumberId) {
        return { sent: false, provider: 'meta', reason: 'Meta credentials missing' };
    }

    const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: to.replace('+', ''),
            type: 'text',
            text: { body }
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        return { sent: false, provider: 'meta', reason: errorText || 'Meta API error' };
    }

    return { sent: true, provider: 'meta' };
}

export async function sendWhatsAppNotification(
    booking: WhatsAppBookingPayload,
    event: WhatsAppEvent = 'created'
): Promise<WhatsAppSendResult> {
    const to = normalizePhoneNumber(booking.customerPhone);
    if (!to) {
        return { sent: false, provider: 'none', reason: 'Invalid customer phone' };
    }

    const message = buildBookingMessage(booking, event);

    try {
        return await sendViaMeta(to, message);
    } catch (error) {
        const reason = error instanceof Error ? error.message : 'Unknown WhatsApp error';
        return { sent: false, provider: 'meta', reason };
    }
}
