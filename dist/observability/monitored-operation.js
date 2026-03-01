/**
 * Monitored Operation — Structured Error + Performance Tracking
 *
 * Inspired by st-docs `monitoredOperation()`. Wraps async operations
 * with timing, error capture, and optional callbacks.
 *
 * Unlike the st-docs version this is server-only (no fetch to /api/monitoring)
 * and integrates with any logger.
 */
/**
 * Execute an async operation with timing and error tracking.
 *
 * ```ts
 * const data = await monitoredOperation('fetchOrders', async () => {
 *   return db.select().from(orders);
 * });
 * ```
 */
export async function monitoredOperation(operationName, operation, options = {}) {
    const { slowThresholdMs = 1000, context, onSuccess, onError, logger = console, } = options;
    const start = Date.now();
    try {
        const result = await operation();
        const durationMs = Date.now() - start;
        if (durationMs > slowThresholdMs) {
            logger.warn(`[MonitoredOp:${operationName}] slow: ${durationMs}ms`, context ?? "");
        }
        onSuccess?.(durationMs);
        return result;
    }
    catch (error) {
        const durationMs = Date.now() - start;
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error(`[MonitoredOp:${operationName}] failed after ${durationMs}ms: ${err.message}`, context ?? "");
        onError?.(err, durationMs);
        throw error;
    }
}
/**
 * Same as monitoredOperation but also returns the duration.
 * Uses a single timer internally (does not double-wrap monitoredOperation).
 */
export async function timedOperation(operationName, operation, options = {}) {
    const { slowThresholdMs = 1000, context, onSuccess, onError, logger = console, } = options;
    const start = Date.now();
    try {
        const result = await operation();
        const durationMs = Date.now() - start;
        if (durationMs > slowThresholdMs) {
            logger.warn(`[MonitoredOp:${operationName}] slow: ${durationMs}ms`, context ?? "");
        }
        onSuccess?.(durationMs);
        return { result, durationMs };
    }
    catch (error) {
        const durationMs = Date.now() - start;
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error(`[MonitoredOp:${operationName}] failed after ${durationMs}ms: ${err.message}`, context ?? "");
        onError?.(err, durationMs);
        throw error;
    }
}
//# sourceMappingURL=monitored-operation.js.map