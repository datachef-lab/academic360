/**
 * Tiny in-memory TTL cache for reference/master data GET list handlers
 * (categories, religions, blood groups, board universities, etc).
 *
 * Scope: use ONLY for pure global reference/master lookup lists that are
 * the same for every caller. Never use this for student- or
 * session-specific data.
 *
 * IMPORTANT - per-instance limitation: this cache lives in the Node.js
 * process memory of a single running instance. The student-console app can
 * run as multiple instances behind a load balancer with no sticky
 * sessions, so a POST/PUT/DELETE handled by instance A only clears
 * instance A's cache entry - instance B (and any others) keep serving
 * their own cached copy until it naturally expires (up to `ttlMs`, default
 * 60s). This is an accepted staleness window for slow-changing reference
 * data, not a bug. Keep the TTL short (60s) to bound the window.
 */

type CacheEntry<T> = { value: T; expiresAt: number };

export function createTtlCache<T = unknown>(ttlMs: number = 60_000) {
  const entries = new Map<string, CacheEntry<T>>();

  return {
    get(key: string = "default"): T | undefined {
      const entry = entries.get(key);
      if (!entry) return undefined;
      if (Date.now() > entry.expiresAt) {
        entries.delete(key);
        return undefined;
      }
      return entry.value;
    },
    set(key: string = "default", value: T): void {
      entries.set(key, { value, expiresAt: Date.now() + ttlMs });
    },
    clear(): void {
      entries.clear();
    },
  };
}
