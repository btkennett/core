import { describe, it, expect, vi, beforeEach } from "vitest";
import { CircuitBreaker, CircuitBreakerError } from "./circuit-breaker";

const silentLogger = { log: vi.fn(), warn: vi.fn(), error: vi.fn() };

function makeBreaker(overrides: Partial<import("./circuit-breaker").CircuitBreakerOptions> = {}) {
  return new CircuitBreaker({
    name: "test",
    failureThreshold: 3,
    resetTimeout: 100,
    maxResetTimeout: 1000,
    monitoringWindow: 5000,
    logger: silentLogger,
    ...overrides,
  });
}

describe("CircuitBreaker", () => {
  beforeEach(() => vi.clearAllMocks());

  it("passes through successful calls in CLOSED state", async () => {
    const cb = makeBreaker();
    const result = await cb.execute(() => Promise.resolve("ok"));
    expect(result).toBe("ok");
    expect(cb.getMetrics().state).toBe("CLOSED");
    expect(cb.getMetrics().successes).toBe(1);
  });

  it("opens after reaching failure threshold", async () => {
    const cb = makeBreaker({ failureThreshold: 2 });
    const fail = () => cb.execute(() => Promise.reject(new Error("fail")));

    await expect(fail()).rejects.toThrow("fail");
    await expect(fail()).rejects.toThrow("fail");

    expect(cb.getMetrics().state).toBe("OPEN");
    expect(cb.getMetrics().consecutiveFailures).toBe(2);
  });

  it("fast-fails when OPEN", async () => {
    const cb = makeBreaker({ failureThreshold: 1, resetTimeout: 60_000 });

    await expect(cb.execute(() => Promise.reject(new Error("x")))).rejects.toThrow();
    expect(cb.getMetrics().state).toBe("OPEN");

    await expect(cb.execute(() => Promise.resolve("y"))).rejects.toThrow(CircuitBreakerError);
  });

  it("uses fallback when OPEN", async () => {
    const cb = makeBreaker({
      failureThreshold: 1,
      resetTimeout: 60_000,
      fallbackFunction: async () => "fallback-value",
    });

    // First failure opens circuit AND returns fallback (catch path sees OPEN)
    const firstResult = await cb.execute(() => Promise.reject(new Error("x")));
    expect(firstResult).toBe("fallback-value");
    expect(cb.getMetrics().state).toBe("OPEN");

    // Second call fast-fails and also returns fallback
    const secondResult = await cb.execute(() => Promise.resolve("should not reach"));
    expect(secondResult).toBe("fallback-value");
  });

  it("transitions to HALF_OPEN after resetTimeout", async () => {
    const cb = makeBreaker({ failureThreshold: 1, resetTimeout: 30, maxResetTimeout: 100 });

    await expect(cb.execute(() => Promise.reject(new Error("x")))).rejects.toThrow();
    expect(cb.getMetrics().state).toBe("OPEN");

    // Wait longer than max possible backoff (30ms * 1 * 1.3 jitter ≈ 39ms)
    await new Promise((r) => setTimeout(r, 80));
    const result = await cb.execute(() => Promise.resolve("recovered"));
    expect(result).toBe("recovered");
    expect(cb.getMetrics().state).toBe("CLOSED");
  });

  it("re-opens on failure during HALF_OPEN", async () => {
    const cb = makeBreaker({ failureThreshold: 1, resetTimeout: 50 });

    await expect(cb.execute(() => Promise.reject(new Error("x")))).rejects.toThrow();
    await new Promise((r) => setTimeout(r, 60));

    await expect(cb.execute(() => Promise.reject(new Error("still down")))).rejects.toThrow();
    expect(cb.getMetrics().state).toBe("OPEN");
  });

  it("reset() restores to initial state", async () => {
    const cb = makeBreaker({ failureThreshold: 1 });
    await expect(cb.execute(() => Promise.reject(new Error("x")))).rejects.toThrow();
    expect(cb.getMetrics().state).toBe("OPEN");

    cb.reset();
    expect(cb.getMetrics().state).toBe("CLOSED");
    expect(cb.getMetrics().consecutiveFailures).toBe(0);
  });
});
