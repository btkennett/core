import { describe, it, expect, vi } from "vitest";
import { ConcurrencyLimiter } from "./concurrency-limiter";

const silentLogger = { log: vi.fn(), warn: vi.fn() };

describe("ConcurrencyLimiter", () => {
  it("executes operations within concurrency limit", async () => {
    const limiter = new ConcurrencyLimiter({
      maxConcurrent: 2,
      name: "test",
      logger: silentLogger,
    });

    const results = await Promise.all([
      limiter.execute(() => Promise.resolve(1)),
      limiter.execute(() => Promise.resolve(2)),
    ]);

    expect(results).toEqual([1, 2]);
  });

  it("queues operations beyond the limit", async () => {
    const limiter = new ConcurrencyLimiter({
      maxConcurrent: 1,
      name: "test",
      logger: silentLogger,
    });

    const order: number[] = [];

    const results = await Promise.all([
      limiter.execute(async () => {
        await new Promise((r) => setTimeout(r, 20));
        order.push(1);
        return "a";
      }),
      limiter.execute(async () => {
        order.push(2);
        return "b";
      }),
    ]);

    expect(results).toEqual(["a", "b"]);
    expect(order).toEqual([1, 2]); // first finishes before second starts
  });

  it("rejects queued items after timeout", async () => {
    const limiter = new ConcurrencyLimiter({
      maxConcurrent: 1,
      queueTimeout: 10,
      name: "test",
      logger: silentLogger,
    });

    // Block the only slot
    const blocking = limiter.execute(
      () => new Promise((r) => setTimeout(() => r("done"), 50))
    );

    // This should timeout in queue
    const queued = limiter.execute(() => Promise.resolve("should not run"));

    await expect(queued).rejects.toThrow("timed out in queue");
    await expect(blocking).resolves.toBe("done");
  });

  it("clear() rejects all queued operations", async () => {
    const limiter = new ConcurrencyLimiter({
      maxConcurrent: 1,
      name: "test",
      logger: silentLogger,
    });

    const blocking = limiter.execute(
      () => new Promise((r) => setTimeout(() => r("done"), 100))
    );
    const queued = limiter.execute(() => Promise.resolve("queued"));

    limiter.clear();

    await expect(queued).rejects.toThrow("cancelled");
    await expect(blocking).resolves.toBe("done");
  });

  it("reports status correctly", () => {
    const limiter = new ConcurrencyLimiter({
      maxConcurrent: 3,
      name: "test-status",
      logger: silentLogger,
    });

    const status = limiter.getStatus();
    expect(status.name).toBe("test-status");
    expect(status.maxConcurrent).toBe(3);
    expect(status.activeOperations).toBe(0);
    expect(status.queueLength).toBe(0);
  });
});
