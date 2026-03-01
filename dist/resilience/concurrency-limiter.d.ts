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
    queuedItems: Array<{
        waitTime: number;
    }>;
}
export declare class ConcurrencyLimiter {
    private readonly maxConcurrent;
    private readonly queueTimeout;
    private readonly name;
    private readonly logger;
    private activeOperations;
    private queue;
    constructor(options: ConcurrencyLimiterOptions);
    /** Execute an operation with concurrency control */
    execute<T>(operation: () => Promise<T>): Promise<T>;
    private processQueue;
    private executeOperation;
    /** Get current limiter status */
    getStatus(): ConcurrencyStatus;
    /** Cancel all queued operations (for graceful shutdown) */
    clear(): void;
}
//# sourceMappingURL=concurrency-limiter.d.ts.map