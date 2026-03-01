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
export declare const API_RETRY: RetryPreset;
/** LLM-heavy enrichment/agent tasks — 2 attempts, slower backoff */
export declare const ENRICHMENT_RETRY: RetryPreset;
/** Third-party integrations (HubSpot, CRM) — 5 attempts, aggressive retry */
export declare const INTEGRATION_RETRY: RetryPreset;
/** Fast LLM classification tasks — 2 attempts, quick backoff */
export declare const CLASSIFICATION_RETRY: RetryPreset;
/** Serverless-friendly preset — fewer attempts, shorter timeouts to stay within function limits */
export declare const SERVERLESS_RETRY: RetryPreset;
/** Calculate delay for a given attempt using the preset config */
export declare function calculateRetryDelay(preset: RetryPreset, attempt: number): number;
//# sourceMappingURL=retry-presets.d.ts.map