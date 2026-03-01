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
export async function monitoredOperation<T>(
  operationName: string,
  operation: () => Promise<T>,
  options: MonitoredOperationOptions = {}
): Promise<T> {
  const {
    slowThresholdMs = 1000,
    context,
    onSuccess,
    onError,
    logger = console,
  } = options;

  const start = Date.now();

  try {
    const result = await operation();
    const durationMs = Date.now() - start;

    if (durationMs > slowThresholdMs) {
      logger.warn(
        `[MonitoredOp:${operationName}] slow: ${durationMs}ms`,
        context ?? ""
      );
    }

    onSuccess?.(durationMs);
    return result;
  } catch (error) {
    const durationMs = Date.now() - start;
    const err = error instanceof Error ? error : new Error(String(error));

    logger.error(
      `[MonitoredOp:${operationName}] failed after ${durationMs}ms: ${err.message}`,
      context ?? ""
    );

    onError?.(err, durationMs);
    throw error;
  }
}

/**
 * Same as monitoredOperation but also returns the duration.
 * Uses a single timer internally (does not double-wrap monitoredOperation).
 */
export async function timedOperation<T>(
  operationName: string,
  operation: () => Promise<T>,
  options: MonitoredOperationOptions = {}
): Promise<MonitoredResult<T>> {
  const {
    slowThresholdMs = 1000,
    context,
    onSuccess,
    onError,
    logger = console,
  } = options;

  const start = Date.now();

  try {
    const result = await operation();
    const durationMs = Date.now() - start;

    if (durationMs > slowThresholdMs) {
      logger.warn(
        `[MonitoredOp:${operationName}] slow: ${durationMs}ms`,
        context ?? ""
      );
    }

    onSuccess?.(durationMs);
    return { result, durationMs };
  } catch (error) {
    const durationMs = Date.now() - start;
    const err = error instanceof Error ? error : new Error(String(error));

    logger.error(
      `[MonitoredOp:${operationName}] failed after ${durationMs}ms: ${err.message}`,
      context ?? ""
    );

    onError?.(err, durationMs);
    throw error;
  }
}
