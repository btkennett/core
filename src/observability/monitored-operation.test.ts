import { describe, it, expect, vi } from "vitest";
import { monitoredOperation, timedOperation } from "./monitored-operation";

const silentLogger = { warn: vi.fn(), error: vi.fn() };

describe("monitoredOperation", () => {
  it("returns the operation result", async () => {
    const result = await monitoredOperation(
      "test",
      () => Promise.resolve(42),
      { logger: silentLogger }
    );
    expect(result).toBe(42);
  });

  it("re-throws on failure", async () => {
    await expect(
      monitoredOperation("test", () => Promise.reject(new Error("boom")), {
        logger: silentLogger,
      })
    ).rejects.toThrow("boom");
  });

  it("calls onSuccess with duration", async () => {
    const onSuccess = vi.fn();
    await monitoredOperation("test", () => Promise.resolve("ok"), {
      onSuccess,
      logger: silentLogger,
    });
    expect(onSuccess).toHaveBeenCalledOnce();
    expect(onSuccess.mock.calls[0][0]).toBeTypeOf("number");
  });

  it("calls onError with error and duration", async () => {
    const onError = vi.fn();
    await expect(
      monitoredOperation("test", () => Promise.reject(new Error("fail")), {
        onError,
        logger: silentLogger,
      })
    ).rejects.toThrow();
    expect(onError).toHaveBeenCalledOnce();
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(onError.mock.calls[0][1]).toBeTypeOf("number");
  });

  it("logs warning for slow operations", async () => {
    const logger = { warn: vi.fn(), error: vi.fn() };
    await monitoredOperation(
      "slow-op",
      () => new Promise((r) => setTimeout(() => r("done"), 20)),
      { slowThresholdMs: 10, logger }
    );
    expect(logger.warn).toHaveBeenCalledOnce();
    expect(logger.warn.mock.calls[0][0]).toContain("slow-op");
  });
});

describe("timedOperation", () => {
  it("returns result and durationMs", async () => {
    const { result, durationMs } = await timedOperation(
      "test",
      () => Promise.resolve("ok"),
      { logger: silentLogger }
    );
    expect(result).toBe("ok");
    expect(durationMs).toBeTypeOf("number");
    expect(durationMs).toBeGreaterThanOrEqual(0);
  });

  it("re-throws on failure with error logged", async () => {
    await expect(
      timedOperation("test", () => Promise.reject(new Error("boom")), {
        logger: silentLogger,
      })
    ).rejects.toThrow("boom");
    expect(silentLogger.error).toHaveBeenCalled();
  });
});
