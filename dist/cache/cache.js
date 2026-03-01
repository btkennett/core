/**
 * In-memory cache with TTL and optional max entry limit.
 * Simple Map-based — entries expire on access (lazy eviction).
 */
export function createMemoryCache(options = {}) {
    const { maxEntries = 1000, defaultTtlSeconds = 3600 } = options;
    const store = new Map();
    function evictOldest() {
        if (store.size <= maxEntries)
            return;
        // Map iterates in insertion order — first entry is oldest
        const firstKey = store.keys().next().value;
        if (firstKey !== undefined) {
            store.delete(firstKey);
        }
    }
    return {
        async get(key) {
            const entry = store.get(key);
            if (!entry)
                return null;
            if (entry.expiresAt <= Date.now()) {
                store.delete(key);
                return null;
            }
            return entry.value;
        },
        async set(key, value, ttlSeconds) {
            const ttl = ttlSeconds ?? defaultTtlSeconds;
            store.set(key, {
                value,
                expiresAt: Date.now() + ttl * 1000,
            });
            evictOldest();
        },
        async del(key) {
            store.delete(key);
        },
    };
}
/**
 * Create a namespaced cache that prefixes all keys.
 * Useful for sharing a single cache instance across multiple use cases.
 */
export function createNamespacedCache(cache, namespace) {
    const prefix = `${namespace}:`;
    return {
        get: (key) => cache.get(`${prefix}${key}`),
        set: (key, value, ttl) => cache.set(`${prefix}${key}`, value, ttl),
        del: (key) => cache.del(`${prefix}${key}`),
    };
}
/**
 * Wrap a primary cache with a fallback.
 * On get: tries primary, falls back to secondary.
 * On set/del: writes to both (best-effort on fallback).
 */
export function createFallbackCache(primary, fallback) {
    return {
        async get(key) {
            try {
                const result = await primary.get(key);
                if (result !== null)
                    return result;
            }
            catch {
                // Primary failed, try fallback
            }
            try {
                return await fallback.get(key);
            }
            catch {
                return null;
            }
        },
        async set(key, value, ttlSeconds) {
            await Promise.allSettled([
                primary.set(key, value, ttlSeconds),
                fallback.set(key, value, ttlSeconds),
            ]);
        },
        async del(key) {
            await Promise.allSettled([primary.del(key), fallback.del(key)]);
        },
    };
}
//# sourceMappingURL=cache.js.map