/**
 * Concurrency Limiter — Bounded Parallel Execution
 *
 * Extracted from fn-forge. Prevents memory spikes and provider
 * throttling by limiting concurrent operations.
 *
 * Features:
 * - Queue-based with configurable max concurrent operations
 * - Queue timeout to prevent indefinite waits
 * - Status reporting for health endpoints
 * - Graceful shutdown via clear()
 */

export interface ConcurrencyLimiterOptions {
  /** Maximum number of concurrent operations */
  maxConcurrent: number;
  /** Max time to wait in queue before rejecting (ms). Defaults to 30_000 */
  queueTimeout?: number;
  /** Identifier for logging */
  name?: string;
  /** Optional logger. Defaults to console */
  logger?: Pick<Console, "log" | "warn">;
}

export interface ConcurrencyStatus {
  name: string;
  activeOperations: number;
  maxConcurrent: number;
  queueLength: number;
  queuedItems: Array<{ waitTime: number }>;
}

interface QueueItem<T> {
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  operation: () => Promise<T>;
  queuedAt: number;
}

export class ConcurrencyLimiter {
  private readonly maxConcurrent: number;
  private readonly queueTimeout: number;
  private readonly name: string;
  private readonly logger: Pick<Console, "log" | "warn">;
  private activeOperations = 0;
  private queue: QueueItem<unknown>[] = [];

  constructor(options: ConcurrencyLimiterOptions) {
    this.maxConcurrent = options.maxConcurrent;
    this.queueTimeout = options.queueTimeout ?? 30_000;
    this.name = options.name ?? "ConcurrencyLimiter";
    this.logger = options.logger ?? console;
  }

  /** Execute an operation with concurrency control */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        resolve: resolve as (value: unknown) => void,
        reject,
        operation: operation as () => Promise<unknown>,
        queuedAt: Date.now(),
      });
      this.processQueue();
    });
  }

  private processQueue(): void {
    const now = Date.now();

    // Expire timed-out items
    this.queue = this.queue.filter((item) => {
      if (now - item.queuedAt > this.queueTimeout) {
        item.reject(
          new Error(`Operation timed out in queue after ${this.queueTimeout}ms`)
        );
        return false;
      }
      return true;
    });

    // Execute operations if we have capacity
    while (
      this.activeOperations < this.maxConcurrent &&
      this.queue.length > 0
    ) {
      const item = this.queue.shift()!;
      this.executeOperation(item);
    }
  }

  private async executeOperation(item: QueueItem<unknown>): Promise<void> {
    this.activeOperations++;

    try {
      const result = await item.operation();
      item.resolve(result);
    } catch (error) {
      item.reject(error instanceof Error ? error : new Error(String(error)));
    } finally {
      this.activeOperations--;
      setImmediate(() => this.processQueue());
    }
  }

  /** Get current limiter status */
  getStatus(): ConcurrencyStatus {
    const now = Date.now();
    return {
      name: this.name,
      activeOperations: this.activeOperations,
      maxConcurrent: this.maxConcurrent,
      queueLength: this.queue.length,
      queuedItems: this.queue.map((item) => ({
        waitTime: now - item.queuedAt,
      })),
    };
  }

  /** Cancel all queued operations (for graceful shutdown) */
  clear(): void {
    for (const item of this.queue) {
      item.reject(new Error("Operation cancelled — limiter cleared"));
    }
    this.queue = [];
  }
}
