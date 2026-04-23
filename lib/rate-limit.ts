/**
 * In-memory rate limiter for API endpoints.
 * Uses a Map to track attempts per key (IP/email/identifier).
 * Auto-cleans expired entries every 5 minutes.
 */

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  blockedUntil: number | null;
}

const store = new Map<string, RateLimitEntry>();

// Auto-cleanup every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    const windowExpired = now - entry.firstAttempt > 15 * 60 * 1000;
    const blockExpired = entry.blockedUntil && now > entry.blockedUntil;
    if (windowExpired && (!entry.blockedUntil || blockExpired)) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Check if a request is rate limited.
 * @param key - Unique identifier (e.g., IP address, email)
 * @param maxAttempts - Maximum allowed attempts within the window (default: 5)
 * @param windowMs - Time window in milliseconds (default: 15 minutes)
 * @param blockMs - Block duration after exceeding limit (default: 15 minutes)
 * @returns { allowed, remaining, retryAfterMs }
 */
export function checkRateLimit(
  key: string,
  maxAttempts = 5,
  windowMs = 15 * 60 * 1000,
  blockMs = 15 * 60 * 1000
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  const entry = store.get(key);

  // No previous attempts
  if (!entry) {
    store.set(key, { count: 1, firstAttempt: now, blockedUntil: null });
    return { allowed: true, remaining: maxAttempts - 1, retryAfterMs: 0 };
  }

  // Currently blocked
  if (entry.blockedUntil && now < entry.blockedUntil) {
    return { allowed: false, remaining: 0, retryAfterMs: entry.blockedUntil - now };
  }

  // Block has expired - reset
  if (entry.blockedUntil && now >= entry.blockedUntil) {
    store.set(key, { count: 1, firstAttempt: now, blockedUntil: null });
    return { allowed: true, remaining: maxAttempts - 1, retryAfterMs: 0 };
  }

  // Window has expired - reset
  if (now - entry.firstAttempt > windowMs) {
    store.set(key, { count: 1, firstAttempt: now, blockedUntil: null });
    return { allowed: true, remaining: maxAttempts - 1, retryAfterMs: 0 };
  }

  // Within window
  entry.count++;

  if (entry.count > maxAttempts) {
    entry.blockedUntil = now + blockMs;
    store.set(key, entry);
    return { allowed: false, remaining: 0, retryAfterMs: blockMs };
  }

  store.set(key, entry);
  return { allowed: true, remaining: maxAttempts - entry.count, retryAfterMs: 0 };
}

/**
 * Reset rate limit for a key (e.g., after successful login).
 */
export function resetRateLimit(key: string): void {
  store.delete(key);
}

/**
 * Sanitize search input for Supabase PostgREST filters.
 * Strips characters that break .or() / .ilike() syntax.
 */
export function sanitizeSearch(input: string): string {
  return input.replace(/[%_.,()'"\\]/g, '').trim().slice(0, 100);
}

/**
 * Validate email format.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate URL format (must be http or https).
 */
export function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Trim and cap string length.
 */
export function sanitizeString(input: unknown, maxLength = 500): string {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, maxLength);
}
