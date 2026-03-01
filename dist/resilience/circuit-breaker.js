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
export class CircuitBreaker {
    options;
    state = "CLOSED";
    failures = 0;
    successes = 0;
    lastFailureTime;
    nextRetryTime;
    resetTimeout;
    consecutiveFailures = 0;
    maxResetTimeout;
    monitoringWindow;
    recentFailures = [];
    logger;
    constructor(options) {
        this.options = options;
        this.resetTimeout = options.resetTimeout;
        this.maxResetTimeout = options.maxResetTimeout ?? options.resetTimeout * 16;
        this.monitoringWindow = options.monitoringWindow ?? 60_000;
        this.logger = options.logger ?? console;
    }
    /** Execute a function with circuit breaker protection */
    async execute(fn) {
        this.cleanupOldFailures();
        if (this.state === "OPEN") {
            if (Date.now() < (this.nextRetryTime ?? 0)) {
                if (this.options.fallbackFunction) {
                    return (await this.options.fallbackFunction());
                }
                throw new CircuitBreakerError(`Circuit breaker is OPEN for ${this.options.name}`, "CIRCUIT_OPEN");
            }
            this.state = "HALF_OPEN";
        }
        try {
            const result = await fn();
            this.onSuccess();
            return result;
        }
        catch (error) {
            this.onFailure();
            // onFailure() may have transitioned state to OPEN
            if (this.options.fallbackFunction && this.state === "OPEN") {
                return (await this.options.fallbackFunction());
            }
            throw error;
        }
    }
    onSuccess() {
        this.successes++;
        if (this.state === "HALF_OPEN") {
            this.logger.log(`[CircuitBreaker:${this.options.name}] recovered — closing circuit`);
            this.state = "CLOSED";
            this.resetTimeout = this.options.resetTimeout;
        }
        this.consecutiveFailures = 0;
    }
    onFailure() {
        const now = Date.now();
        this.failures++;
        this.lastFailureTime = now;
        this.consecutiveFailures++;
        this.recentFailures.push(now);
        if (this.state === "HALF_OPEN") {
            this.openCircuit();
        }
        else if (this.state === "CLOSED" &&
            this.consecutiveFailures >= this.options.failureThreshold) {
            this.openCircuit();
        }
    }
    openCircuit() {
        this.state = "OPEN";
        const jitter = Math.random() * 0.3;
        const backoffMultiplier = Math.pow(2, Math.min(this.consecutiveFailures - 1, 10));
        const backoffTime = Math.min(this.resetTimeout * backoffMultiplier * (1 + jitter), this.maxResetTimeout);
        this.nextRetryTime = Date.now() + backoffTime;
        this.resetTimeout = Math.min(this.resetTimeout * 2, this.maxResetTimeout);
        this.logger.warn(`[CircuitBreaker:${this.options.name}] OPENED — retry in ${Math.round(backoffTime / 1000)}s`);
    }
    cleanupOldFailures() {
        const cutoff = Date.now() - this.monitoringWindow;
        if (this.recentFailures.length === 0)
            return;
        // Find first entry within the window — splice once (O(n) vs O(n^2) shift loop)
        const firstValid = this.recentFailures.findIndex((t) => t >= cutoff);
        if (firstValid === -1) {
            // All failures are outside the window
            this.recentFailures.length = 0;
        }
        else if (firstValid > 0) {
            this.recentFailures.splice(0, firstValid);
        }
    }
    /** Get current circuit breaker metrics */
    getMetrics() {
        return {
            state: this.state,
            failures: this.failures,
            successes: this.successes,
            lastFailureTime: this.lastFailureTime,
            nextRetryTime: this.nextRetryTime,
            consecutiveFailures: this.consecutiveFailures,
        };
    }
    /** Manually reset the circuit breaker */
    reset() {
        this.state = "CLOSED";
        this.consecutiveFailures = 0;
        this.resetTimeout = this.options.resetTimeout;
        this.nextRetryTime = undefined;
        this.recentFailures.length = 0;
    }
}
/** Custom error for circuit breaker failures */
export class CircuitBreakerError extends Error {
    code;
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = "CircuitBreakerError";
    }
}
//# sourceMappingURL=circuit-breaker.js.map