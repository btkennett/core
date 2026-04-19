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

export class CircuitBreaker {
  private state: CircuitState = "CLOSED";
  private failures = 0;
  private successes = 0;
  private lastFailureTime?: number;
  private nextRetryTime?: number;
  private resetTimeout: number;
  private consecutiveFailures = 0;
  private readonly maxResetTimeout: number;
  private readonly monitoringWindow: number;
  private readonly recentFailures: number[] = [];
  private readonly logger: Pick<Console, "log" | "warn" | "error">;

  constructor(private readonly options: CircuitBreakerOptions) {
    this.resetTimeout = options.resetTimeout;
    this.maxResetTimeout = options.maxResetTimeout ?? options.resetTimeout * 16;
    this.monitoringWindow = options.monitoringWindow ?? 60_000;
    this.logger = options.logger ?? console;
  }

  /** Execute a function with circuit breaker protection */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.cleanupOldFailures();

    if (this.state === "OPEN") {
      if (Date.now() < (this.nextRetryTime ?? 0)) {
        if (this.options.fallbackFunction) {
          return (await this.options.fallbackFunction()) as T;
        }
        throw new CircuitBreakerError(
          `Circuit breaker is OPEN for ${this.options.name}`,
          "CIRCUIT_OPEN"
        );
      }
      this.state = "HALF_OPEN";
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();

      // onFailure() may have transitioned state to OPEN
      if (this.options.fallbackFunction && (this.state as CircuitState) === "OPEN") {
        return (await this.options.fallbackFunction()) as T;
      }
      throw error;
    }
  }

  private onSuccess(): void {
    this.successes++;
    if (this.state === "HALF_OPEN") {
      this.logger.log(
        `[CircuitBreaker:${this.options.name}] recovered — closing circuit`
      );
      this.state = "CLOSED";
      this.resetTimeout = this.options.resetTimeout;
    }
    this.consecutiveFailures = 0;
  }

  private onFailure(): void {
    const now = Date.now();
    this.failures++;
    this.lastFailureTime = now;
    this.consecutiveFailures++;
    this.recentFailures.push(now);

    if (this.state === "HALF_OPEN") {
      this.openCircuit();
    } else if (
      this.state === "CLOSED" &&
      this.recentFailures.length >= this.options.failureThreshold
    ) {
      this.openCircuit();
    }
  }

  private openCircuit(): void {
    this.state = "OPEN";

    const jitter = Math.random() * 0.3;
    const backoffMultiplier = Math.pow(
      2,
      Math.min(this.consecutiveFailures - 1, 10)
    );
    const backoffTime = Math.min(
      this.resetTimeout * backoffMultiplier * (1 + jitter),
      this.maxResetTimeout
    );

    this.nextRetryTime = Date.now() + backoffTime;
    this.resetTimeout = Math.min(this.resetTimeout * 2, this.maxResetTimeout);

    this.logger.warn(
      `[CircuitBreaker:${this.options.name}] OPENED — retry in ${Math.round(backoffTime / 1000)}s`
    );
  }

  private cleanupOldFailures(): void {
    const cutoff = Date.now() - this.monitoringWindow;
    if (this.recentFailures.length === 0) return;

    // Find first entry within the window — splice once (O(n) vs O(n^2) shift loop)
    const firstValid = this.recentFailures.findIndex((t) => t >= cutoff);

    if (firstValid === -1) {
      // All failures are outside the window
      this.recentFailures.length = 0;
      this.consecutiveFailures = 0;
    } else if (firstValid > 0) {
      this.recentFailures.splice(0, firstValid);
      this.consecutiveFailures = Math.min(
        this.consecutiveFailures,
        this.recentFailures.length
      );
    }
  }

  /** Get current circuit breaker metrics */
  getMetrics(): CircuitBreakerMetrics {
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
  reset(): void {
    this.state = "CLOSED";
    this.consecutiveFailures = 0;
    this.resetTimeout = this.options.resetTimeout;
    this.nextRetryTime = undefined;
    this.recentFailures.length = 0;
  }
}

/** Custom error for circuit breaker failures */
export class CircuitBreakerError extends Error {
  constructor(
    message: string,
    public readonly code: "CIRCUIT_OPEN" | "FALLBACK_FAILED"
  ) {
    super(message);
    this.name = "CircuitBreakerError";
  }
}
