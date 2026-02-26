/**
 * In-Memory Rate Limiter
 * For production, consider using Redis for multi-instance deployments
 */

type RateLimitType = 'login' | 'register' | 'booking';

interface RateLimitConfig {
    maxAttempts: number;
    windowMs: number;
}

interface RateLimitEntry {
    count: number;
    firstAttempt: number;
}

const rateLimitConfigs: Record<RateLimitType, RateLimitConfig> = {
    login: { maxAttempts: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
    register: { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
    booking: { maxAttempts: 10, windowMs: 60 * 1000 }, // 10 attempts per minute
};

const rateLimitStore = new Map<string, RateLimitEntry>();

function lazyCleanup() {
    const now = Date.now();
    // Only cleanup 10% of the time to avoid tax on every request
    if (Math.random() > 0.1) return;

    for (const [key, entry] of rateLimitStore.entries()) {
        const type = key.split(':')[0] as RateLimitType;
        const config = rateLimitConfigs[type];
        if (config && now - entry.firstAttempt > config.windowMs) {
            rateLimitStore.delete(key);
        }
    }
}

/**
 * Extract client IP from headers
 */
export function getClientIP(headers: Headers): string {
    const forwarded = headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    const realIP = headers.get('x-real-ip');
    if (realIP) {
        return realIP;
    }
    return 'unknown';
}

/**
 * Check if a request should be rate limited
 */
export function checkRateLimit(
    identifier: string,
    type: RateLimitType
): { limited: boolean; remaining: number; resetIn: number } {
    const config = rateLimitConfigs[type];
    const key = `${type}:${identifier}`;
    const now = Date.now();

    lazyCleanup();

    let entry = rateLimitStore.get(key);

    // If no entry or window expired, create new one
    if (!entry || now - entry.firstAttempt > config.windowMs) {
        entry = { count: 1, firstAttempt: now };
        rateLimitStore.set(key, entry);
        return {
            limited: false,
            remaining: config.maxAttempts - 1,
            resetIn: config.windowMs,
        };
    }

    // Increment count
    entry.count++;
    rateLimitStore.set(key, entry);

    const resetIn = config.windowMs - (now - entry.firstAttempt);

    // Check if over limit
    if (entry.count > config.maxAttempts) {
        return {
            limited: true,
            remaining: 0,
            resetIn,
        };
    }

    return {
        limited: false,
        remaining: config.maxAttempts - entry.count,
        resetIn,
    };
}

/**
 * Reset rate limit for a specific identifier (e.g., after successful login)
 */
export function resetRateLimit(identifier: string, type: RateLimitType): void {
    const key = `${type}:${identifier}`;
    rateLimitStore.delete(key);
}
