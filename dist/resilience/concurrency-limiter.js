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
export class ConcurrencyLimiter {
    maxConcurrent;
    queueTimeout;
    name;
    logger;
    activeOperations = 0;
    queue = [];
    constructor(options) {
        this.maxConcurrent = options.maxConcurrent;
        this.queueTimeout = options.queueTimeout ?? 30_000;
        this.name = options.name ?? "ConcurrencyLimiter";
        this.logger = options.logger ?? console;
    }
    /** Execute an operation with concurrency control */
    async execute(operation) {
        return new Promise((resolve, reject) => {
            this.queue.push({
                resolve: resolve,
                reject,
                operation: operation,
                queuedAt: Date.now(),
            });
            this.processQueue();
        });
    }
    processQueue() {
        const now = Date.now();
        // Expire timed-out items
        this.queue = this.queue.filter((item) => {
            if (now - item.queuedAt > this.queueTimeout) {
                item.reject(new Error(`Operation timed out in queue after ${this.queueTimeout}ms`));
                return false;
            }
            return true;
        });
        // Execute operations if we have capacity
        while (this.activeOperations < this.maxConcurrent &&
            this.queue.length > 0) {
            const item = this.queue.shift();
            this.executeOperation(item);
        }
    }
    async executeOperation(item) {
        this.activeOperations++;
        try {
            const result = await item.operation();
            item.resolve(result);
        }
        catch (error) {
            item.reject(error instanceof Error ? error : new Error(String(error)));
        }
        finally {
            this.activeOperations--;
            setImmediate(() => this.processQueue());
        }
    }
    /** Get current limiter status */
    getStatus() {
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
    clear() {
        for (const item of this.queue) {
            item.reject(new Error("Operation cancelled — limiter cleared"));
        }
        this.queue = [];
    }
}
//# sourceMappingURL=concurrency-limiter.js.map