/**
 * Monitored Operation — Structured Error + Performance Tracking
 *
 * Inspired by st-docs `monitoredOperation()`. Wraps async operations
 * with timing, error capture, and optional callbacks.
 *
 * Unlike the st-docs version this is server-only (no fetch to /api/monitoring)
 * and integrates with any logger.
 */
export interface MonitoredOperationOptions {
    /** Threshold in ms to log a slow-operation warning. Defaults to 1000 */
    slowThresholdMs?: number;
    /** Contextual metadata attached to logs */
    context?: Record<string, unknown>;
    /** Called on success with duration */
    onSuccess?: (durationMs: number) => void;
    /** Called on failure with error and duration */
    onError?: (error: Error, durationMs: number) => void;
    /** Logger. Defaults to console */
    logger?: Pick<Console, "warn" | "error">;
}
export interface MonitoredResult<T> {
    result: T;
    durationMs: number;
}
/**
 * Execute an async operation with timing and error tracking.
 *
 * ```ts
 * const data = await monitoredOperation('fetchOrders', async () => {
 *   return db.select().from(orders);
 * });
 * ```
 */
export declare function monitoredOperation<T>(operationName: string, operation: () => Promise<T>, options?: MonitoredOperationOptions): Promise<T>;
/**
 * Same as monitoredOperation but also returns the duration.
 * Uses a single timer internally (does not double-wrap monitoredOperation).
 */
export declare function timedOperation<T>(operationName: string, operation: () => Promise<T>, options?: MonitoredOperationOptions): Promise<MonitoredResult<T>>;
//# sourceMappingURL=monitored-operation.d.ts.map