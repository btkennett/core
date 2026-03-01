/**
 * Retry Configuration Presets
 *
 * Extracted from fn-v2 Trigger.dev tasks. Standardized retry configs
 * for different operation categories.
 *
 * These presets are designed to work with Trigger.dev retry config,
 * but the shape is generic enough for any retry library.
 */

export interface RetryPreset {
  /** Max number of retry attempts */
  readonly maxAttempts: number;
  /** Backoff multiplier */
  readonly factor: number;
  /** Minimum delay between retries (ms) */
  readonly minTimeoutInMs: number;
  /** Maximum delay between retries (ms) */
  readonly maxTimeoutInMs: number;
  /** Add randomness to prevent thundering herd */
  readonly randomize: boolean;
}

/** External API calls (SEO, social, Places) — 3 attempts, fast backoff */
export const API_RETRY: RetryPreset = {
  maxAttempts: 3,
  factor: 2,
  minTimeoutInMs: 2_000,
  maxTimeoutInMs: 15_000,
  randomize: true,
};

/** LLM-heavy enrichment/agent tasks — 2 attempts, slower backoff */
export const ENRICHMENT_RETRY: RetryPreset = {
  maxAttempts: 2,
  factor: 2,
  minTimeoutInMs: 5_000,
  maxTimeoutInMs: 30_000,
  randomize: true,
};

/** Third-party integrations (HubSpot, CRM) — 5 attempts, aggressive retry */
export const INTEGRATION_RETRY: RetryPreset = {
  maxAttempts: 5,
  factor: 2,
  minTimeoutInMs: 1_000,
  maxTimeoutInMs: 30_000,
  randomize: true,
};

/** Fast LLM classification tasks — 2 attempts, quick backoff */
export const CLASSIFICATION_RETRY: RetryPreset = {
  maxAttempts: 2,
  factor: 2,
  minTimeoutInMs: 2_000,
  maxTimeoutInMs: 10_000,
  randomize: true,
};

/** Serverless-friendly preset — fewer attempts, shorter timeouts to stay within function limits */
export const SERVERLESS_RETRY: RetryPreset = {
  maxAttempts: 2,
  factor: 1.5,
  minTimeoutInMs: 1_000,
  maxTimeoutInMs: 5_000,
  randomize: true,
};

/** Calculate delay for a given attempt using the preset config */
export function calculateRetryDelay(
  preset: RetryPreset,
  attempt: number
): number {
  const delay = Math.min(
    preset.minTimeoutInMs * Math.pow(preset.factor, attempt),
    preset.maxTimeoutInMs
  );

  if (preset.randomize) {
    const jitter = Math.random() * 0.3;
    return Math.round(delay * (1 + jitter));
  }
  return delay;
}
