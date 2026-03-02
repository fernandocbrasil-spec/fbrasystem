// =============================================================================
// In-memory rate limiter for MVP (no external dependencies)
// Tracks request counts per key with automatic cleanup
// =============================================================================

type RateLimitEntry = {
    count: number;
    resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 5 minutes
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
    if (cleanupInterval) return;
    cleanupInterval = setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of store) {
            if (now >= entry.resetAt) store.delete(key);
        }
    }, 5 * 60 * 1000);
    // Don't block process exit
    if (cleanupInterval && typeof cleanupInterval === "object" && "unref" in cleanupInterval) {
        cleanupInterval.unref();
    }
}

type RateLimitConfig = {
    /** Max requests per window */
    limit: number;
    /** Window duration in seconds */
    windowSeconds: number;
};

type RateLimitResult = {
    success: boolean;
    remaining: number;
    resetAt: number;
};

/**
 * Check and consume a rate limit token.
 * @param key Unique identifier (e.g., IP, userId, sessionId)
 * @param config Rate limit configuration
 */
export function rateLimit(key: string, config: RateLimitConfig): RateLimitResult {
    ensureCleanup();

    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now >= entry.resetAt) {
        const resetAt = now + config.windowSeconds * 1000;
        store.set(key, { count: 1, resetAt });
        return { success: true, remaining: config.limit - 1, resetAt };
    }

    if (entry.count >= config.limit) {
        return { success: false, remaining: 0, resetAt: entry.resetAt };
    }

    entry.count++;
    return { success: true, remaining: config.limit - entry.count, resetAt: entry.resetAt };
}

// --- Pre-configured limiters ---

/** Login: 5 attempts per 15 minutes */
export function rateLimitLogin(ip: string): RateLimitResult {
    return rateLimit(`login:${ip}`, { limit: 5, windowSeconds: 15 * 60 });
}

/** Approval actions: 30 per minute per user */
export function rateLimitApproval(userId: string): RateLimitResult {
    return rateLimit(`approval:${userId}`, { limit: 30, windowSeconds: 60 });
}

/** General mutations: 60 per minute per user */
export function rateLimitMutation(userId: string): RateLimitResult {
    return rateLimit(`mutation:${userId}`, { limit: 60, windowSeconds: 60 });
}
