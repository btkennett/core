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
/**
 * In-memory cache with TTL and optional max entry limit.
 * Simple Map-based — entries expire on access (lazy eviction).
 */
export declare function createMemoryCache<T = unknown>(options?: MemoryCacheOptions): Cache<T>;
/**
 * Create a namespaced cache that prefixes all keys.
 * Useful for sharing a single cache instance across multiple use cases.
 */
export declare function createNamespacedCache<T = unknown>(cache: Cache<T>, namespace: string): Cache<T>;
/**
 * Wrap a primary cache with a fallback.
 * On get: tries primary, falls back to secondary.
 * On set/del: writes to both (best-effort on fallback).
 */
export declare function createFallbackCache<T = unknown>(primary: Cache<T>, fallback: Cache<T>): Cache<T>;
//# sourceMappingURL=cache.d.ts.map