/**
 * Generic cache interface. Implementations can be Redis, in-memory, etc.
 * All methods are async to support network-backed caches.
 */
export interface Cache<T = unknown> {
  get(key: string): Promise<T | null>;
  set(key: string, value: T, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
}

export interface MemoryCacheOptions {
  /** Maximum entries before evicting oldest (default: 1000) */
  maxEntries?: number;
  /** Default TTL in seconds (default: 3600) */
  defaultTtlSeconds?: number;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * In-memory cache with TTL and optional max entry limit.
 * Simple Map-based — entries expire on access (lazy eviction).
 */
export function createMemoryCache<T = unknown>(
  options: MemoryCacheOptions = {}
): Cache<T> {
  const { maxEntries = 1000, defaultTtlSeconds = 3600 } = options;
  const store = new Map<string, CacheEntry<T>>();

  function evictOldest(): void {
    if (store.size <= maxEntries) return;
    // Map iterates in insertion order — first entry is oldest
    const firstKey = store.keys().next().value;
    if (firstKey !== undefined) {
      store.delete(firstKey);
    }
  }

  return {
    async get(key: string): Promise<T | null> {
      const entry = store.get(key);
      if (!entry) return null;
      if (entry.expiresAt <= Date.now()) {
        store.delete(key);
        return null;
      }
      return entry.value;
    },

    async set(key: string, value: T, ttlSeconds?: number): Promise<void> {
      const ttl = ttlSeconds ?? defaultTtlSeconds;
      store.set(key, {
        value,
        expiresAt: Date.now() + ttl * 1000,
      });
      evictOldest();
    },

    async del(key: string): Promise<void> {
      store.delete(key);
    },
  };
}

/**
 * Create a namespaced cache that prefixes all keys.
 * Useful for sharing a single cache instance across multiple use cases.
 */
export function createNamespacedCache<T = unknown>(
  cache: Cache<T>,
  namespace: string
): Cache<T> {
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
export function createFallbackCache<T = unknown>(
  primary: Cache<T>,
  fallback: Cache<T>
): Cache<T> {
  return {
    async get(key: string): Promise<T | null> {
      try {
        const result = await primary.get(key);
        if (result !== null) return result;
      } catch {
        // Primary failed, try fallback
      }
      try {
        return await fallback.get(key);
      } catch {
        return null;
      }
    },

    async set(key: string, value: T, ttlSeconds?: number): Promise<void> {
      await Promise.allSettled([
        primary.set(key, value, ttlSeconds),
        fallback.set(key, value, ttlSeconds),
      ]);
    },

    async del(key: string): Promise<void> {
      await Promise.allSettled([primary.del(key), fallback.del(key)]);
    },
  };
}
