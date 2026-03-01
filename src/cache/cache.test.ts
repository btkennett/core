import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createMemoryCache,
  createNamespacedCache,
  createFallbackCache,
} from "./cache";
import type { Cache } from "./cache";

describe("createMemoryCache", () => {
  it("returns null for non-existent key", async () => {
    const cache = createMemoryCache<string>();
    expect(await cache.get("missing")).toBeNull();
  });

  it("stores and retrieves values", async () => {
    const cache = createMemoryCache<string>();
    await cache.set("key", "value");
    expect(await cache.get("key")).toBe("value");
  });

  it("deletes values", async () => {
    const cache = createMemoryCache<string>();
    await cache.set("key", "value");
    await cache.del("key");
    expect(await cache.get("key")).toBeNull();
  });

  it("del on non-existent key is a no-op", async () => {
    const cache = createMemoryCache<string>();
    await expect(cache.del("missing")).resolves.toBeUndefined();
  });

  it("expires entries after TTL", async () => {
    vi.useFakeTimers();
    try {
      const cache = createMemoryCache<string>({ defaultTtlSeconds: 1 });
      await cache.set("key", "value");
      expect(await cache.get("key")).toBe("value");

      vi.advanceTimersByTime(1001);
      expect(await cache.get("key")).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("respects per-key TTL override", async () => {
    vi.useFakeTimers();
    try {
      const cache = createMemoryCache<string>({ defaultTtlSeconds: 60 });
      await cache.set("short", "value", 1);
      await cache.set("long", "value");

      vi.advanceTimersByTime(1001);
      expect(await cache.get("short")).toBeNull();
      expect(await cache.get("long")).toBe("value");
    } finally {
      vi.useRealTimers();
    }
  });

  it("evicts oldest entry when maxEntries exceeded", async () => {
    const cache = createMemoryCache<string>({ maxEntries: 2 });
    await cache.set("a", "1");
    await cache.set("b", "2");
    await cache.set("c", "3"); // should evict "a"

    expect(await cache.get("a")).toBeNull();
    expect(await cache.get("b")).toBe("2");
    expect(await cache.get("c")).toBe("3");
  });

  it("handles complex value types", async () => {
    const cache = createMemoryCache<{ name: string; count: number }>();
    const obj = { name: "test", count: 42 };
    await cache.set("obj", obj);
    expect(await cache.get("obj")).toEqual(obj);
  });
});

describe("createNamespacedCache", () => {
  it("prefixes keys on get/set/del", async () => {
    const inner = createMemoryCache<string>();
    const ns = createNamespacedCache(inner, "users");

    await ns.set("123", "alice");
    // Should be stored under "users:123" in inner cache
    expect(await inner.get("users:123")).toBe("alice");
    expect(await ns.get("123")).toBe("alice");

    await ns.del("123");
    expect(await inner.get("users:123")).toBeNull();
  });

  it("isolates namespaces from each other", async () => {
    const inner = createMemoryCache<string>();
    const users = createNamespacedCache(inner, "users");
    const sessions = createNamespacedCache(inner, "sessions");

    await users.set("key", "user-val");
    await sessions.set("key", "session-val");

    expect(await users.get("key")).toBe("user-val");
    expect(await sessions.get("key")).toBe("session-val");
  });
});

describe("createFallbackCache", () => {
  it("returns value from primary when available", async () => {
    const primary = createMemoryCache<string>();
    const fallback = createMemoryCache<string>();
    const cache = createFallbackCache(primary, fallback);

    await primary.set("key", "primary-val");
    await fallback.set("key", "fallback-val");

    expect(await cache.get("key")).toBe("primary-val");
  });

  it("falls back to secondary when primary returns null", async () => {
    const primary = createMemoryCache<string>();
    const fallback = createMemoryCache<string>();
    const cache = createFallbackCache(primary, fallback);

    await fallback.set("key", "fallback-val");
    expect(await cache.get("key")).toBe("fallback-val");
  });

  it("falls back to secondary when primary throws", async () => {
    const failing: Cache<string> = {
      get: () => Promise.reject(new Error("boom")),
      set: () => Promise.reject(new Error("boom")),
      del: () => Promise.reject(new Error("boom")),
    };
    const fallback = createMemoryCache<string>();
    const cache = createFallbackCache(failing, fallback);

    await fallback.set("key", "fallback-val");
    expect(await cache.get("key")).toBe("fallback-val");
  });

  it("returns null when both primary and fallback fail", async () => {
    const failing: Cache<string> = {
      get: () => Promise.reject(new Error("boom")),
      set: () => Promise.reject(new Error("boom")),
      del: () => Promise.reject(new Error("boom")),
    };
    const cache = createFallbackCache(failing, failing);
    expect(await cache.get("key")).toBeNull();
  });

  it("writes to both primary and fallback on set", async () => {
    const primary = createMemoryCache<string>();
    const fallback = createMemoryCache<string>();
    const cache = createFallbackCache(primary, fallback);

    await cache.set("key", "value");
    expect(await primary.get("key")).toBe("value");
    expect(await fallback.get("key")).toBe("value");
  });

  it("deletes from both primary and fallback", async () => {
    const primary = createMemoryCache<string>();
    const fallback = createMemoryCache<string>();
    const cache = createFallbackCache(primary, fallback);

    await cache.set("key", "value");
    await cache.del("key");
    expect(await primary.get("key")).toBeNull();
    expect(await fallback.get("key")).toBeNull();
  });

  it("tolerates fallback failure on set", async () => {
    const primary = createMemoryCache<string>();
    const failing: Cache<string> = {
      get: () => Promise.reject(new Error("boom")),
      set: () => Promise.reject(new Error("boom")),
      del: () => Promise.reject(new Error("boom")),
    };
    const cache = createFallbackCache(primary, failing);

    // Should not throw
    await cache.set("key", "value");
    expect(await primary.get("key")).toBe("value");
  });
});
