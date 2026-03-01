import { describe, it, expect, vi, afterEach } from "vitest";
import { MemoryMonitor } from "./memory-monitor";

const silentLogger = { log: vi.fn(), warn: vi.fn() };

describe("MemoryMonitor", () => {
  afterEach(() => vi.clearAllMocks());

  it("getMemoryUsage returns stats in MB", () => {
    const mm = new MemoryMonitor({}, silentLogger);
    const { stats, formatted, warnings } = mm.getMemoryUsage();

    expect(stats.rss).toBeTypeOf("number");
    expect(stats.rss).toBeGreaterThan(0);
    expect(formatted.rss).toMatch(/^\d+MB$/);
    expect(Array.isArray(warnings)).toBe(true);
  });

  it("getHealthStatus returns healthy for normal usage", () => {
    const mm = new MemoryMonitor(
      { warningThreshold: 4096, criticalThreshold: 8192 },
      silentLogger
    );
    const health = mm.getHealthStatus();

    expect(health.healthy).toBe(true);
    expect(health.warnings).toHaveLength(0);
  });

  it("getHealthStatus returns unhealthy when thresholds are very low", () => {
    const mm = new MemoryMonitor(
      { warningThreshold: 1, criticalThreshold: 2 },
      silentLogger
    );
    const health = mm.getHealthStatus();

    expect(health.healthy).toBe(false);
    expect(health.warnings.length).toBeGreaterThan(0);
  });

  it("startMonitoring and stopMonitoring lifecycle", () => {
    const mm = new MemoryMonitor(
      { checkInterval: 100_000, enableLogging: false },
      silentLogger
    );
    mm.startMonitoring();
    // calling again should be a no-op
    mm.startMonitoring();
    mm.stopMonitoring();
    // calling again should be a no-op
    mm.stopMonitoring();
  });

  it("logMemoryUsage respects warning cooldown", () => {
    const logger = { log: vi.fn(), warn: vi.fn() };
    const mm = new MemoryMonitor(
      { warningThreshold: 1, criticalThreshold: 2, enableLogging: true },
      logger
    );

    mm.logMemoryUsage();
    const firstCallCount = logger.warn.mock.calls.length;
    expect(firstCallCount).toBeGreaterThan(0); // header + warning lines

    mm.logMemoryUsage(); // should be suppressed by cooldown
    expect(logger.warn.mock.calls.length).toBe(firstCallCount); // no new calls
  });
});
