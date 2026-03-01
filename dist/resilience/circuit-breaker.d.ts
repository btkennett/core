/**
 * Circuit Breaker — External API Resilience
 *
 * Extracted from fn-forge. Protects against cascading failures when
 * external services go down.
 *
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Service is down, requests fail immediately (fast-fail)
 * - HALF_OPEN: Testing if service recovered
 *
 * Features:
 * - Exponential backoff with jitter on repeated failures
 * - Configurable failure thresholds and monitoring windows
 * - Optional fallback functions
 * - Metrics for health endpoints
 */
export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";
export interface CircuitBreakerOptions {
    /** Identifier for logging and metrics */
    name: string;
    /** Number of failures before opening the circuit */
    failureThreshold: number;
    /** Initial time before trying again (ms) */
    resetTimeout: number;
    /** Max backoff time (ms). Defaults to resetTimeout * 16 */
    maxResetTimeout?: number;
    /** Time window for failure counting (ms). Defaults to 60_000 */
    monitoringWindow?: number;
    /** Optional function to call when circuit is open */
    fallbackFunction?: () => Promise<unknown>;
    /** Optional logger. Defaults to console */
    logger?: Pick<Console, "log" | "warn" | "error">;
}
export interface CircuitBreakerMetrics {
    state: CircuitState;
    failures: number;
    successes: number;
    lastFailureTime?: number;
    nextRetryTime?: number;
    consecutiveFailures: number;
}
export declare class CircuitBreaker {
    private readonly options;
    private state;
    private failures;
    private successes;
    private lastFailureTime?;
    private nextRetryTime?;
    private resetTimeout;
    private consecutiveFailures;
    private readonly maxResetTimeout;
    private readonly monitoringWindow;
    private readonly recentFailures;
    private readonly logger;
    constructor(options: CircuitBreakerOptions);
    /** Execute a function with circuit breaker protection */
    execute<T>(fn: () => Promise<T>): Promise<T>;
    private onSuccess;
    private onFailure;
    private openCircuit;
    private cleanupOldFailures;
    /** Get current circuit breaker metrics */
    getMetrics(): CircuitBreakerMetrics;
    /** Manually reset the circuit breaker */
    reset(): void;
}
/** Custom error for circuit breaker failures */
export declare class CircuitBreakerError extends Error {
    readonly code: "CIRCUIT_OPEN" | "FALLBACK_FAILED";
    constructor(message: string, code: "CIRCUIT_OPEN" | "FALLBACK_FAILED");
}
//# sourceMappingURL=circuit-breaker.d.ts.map