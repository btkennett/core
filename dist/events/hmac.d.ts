/**
 * HMAC Signing & Verification — Consolidated
 *
 * The ecosystem had 3+ HMAC implementations (fn-flux outbox, fn-forge
 * receivers, fn-flux compass events). All used HMAC-SHA256 with base64
 * digest and timing-safe comparison. This module unifies them.
 *
 * The legacy fn-legacy → fn-flux path uses plain shared secrets
 * (not HMAC). That's intentionally NOT covered here — those should
 * migrate to HMAC signing.
 */
export interface HmacOptions {
    /** HMAC algorithm. Defaults to sha256 */
    algorithm?: string;
    /** Digest encoding. Defaults to base64 */
    encoding?: "base64" | "base64url" | "hex";
}
/**
 * Sign a payload body with a shared secret.
 *
 * ```ts
 * const signature = signHmac(secret, JSON.stringify(envelope));
 * headers['x-forge-event-signature'] = signature;
 * ```
 */
export declare function signHmac(secret: string, body: string, options?: HmacOptions): string;
/**
 * Verify a signature using timing-safe comparison.
 *
 * ```ts
 * if (!verifyHmac(secret, rawBody, signatureHeader)) {
 *   return res.status(401).json({ error: 'Invalid signature' });
 * }
 * ```
 */
export declare function verifyHmac(secret: string, body: string, signature: string, options?: HmacOptions): boolean;
/** Standard header names used across the ecosystem */
export declare const EVENT_SIGNATURE_HEADERS: {
    /** fn-flux → fn-forge (fulfillment & execution events) */
    readonly FORGE: "x-forge-event-signature";
    /** fn-v2 → fn-flux (compass sync events) */
    readonly COMPASS: "x-compass-event-signature";
    /** Cross-repo correlation (new convention) */
    readonly TRACE: "x-fn-trace-id";
};
//# sourceMappingURL=hmac.d.ts.map