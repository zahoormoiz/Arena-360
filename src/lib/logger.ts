/**
 * Structured Logger
 * Provides consistent JSON logging for booking events, payment events, and admin actions.
 * Ready for production log aggregation (e.g., Datadog, CloudWatch, ELK).
 */

type LogLevel = 'info' | 'warn' | 'error';
type EventCategory = 'booking' | 'payment' | 'admin' | 'auth' | 'system';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    category: EventCategory;
    event: string;
    data?: Record<string, any>;
    userId?: string;
    ip?: string;
}

function formatLog(entry: LogEntry): string {
    return JSON.stringify(entry);
}

export function logEvent(
    level: LogLevel,
    category: EventCategory,
    event: string,
    data?: Record<string, any>,
    userId?: string,
    ip?: string
) {
    const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        category,
        event,
        ...(data && { data }),
        ...(userId && { userId }),
        ...(ip && { ip }),
    };

    const formatted = formatLog(entry);

    switch (level) {
        case 'error':
            console.error(formatted);
            break;
        case 'warn':
            console.warn(formatted);
            break;
        default:
            console.log(formatted);
    }
}

// Convenience functions
export const logBooking = (event: string, data?: Record<string, any>, userId?: string) =>
    logEvent('info', 'booking', event, data, userId);

export const logPayment = (event: string, data?: Record<string, any>, userId?: string) =>
    logEvent('info', 'payment', event, data, userId);

export const logAdmin = (event: string, data?: Record<string, any>, userId?: string) =>
    logEvent('info', 'admin', event, data, userId);

export const logAuth = (event: string, data?: Record<string, any>, userId?: string, ip?: string) =>
    logEvent('info', 'auth', event, data, userId, ip);

export const logError = (category: EventCategory, event: string, data?: Record<string, any>) =>
    logEvent('error', category, event, data);
