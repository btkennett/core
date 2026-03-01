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

import { createHmac, timingSafeEqual } from "node:crypto";

export interface HmacOptions {
  /** HMAC algorithm. Defaults to sha256 */
  algorithm?: string;
  /** Digest encoding. Defaults to base64 */
  encoding?: "base64" | "base64url" | "hex";
}

const DEFAULTS: Required<HmacOptions> = {
  algorithm: "sha256",
  encoding: "base64",
};

/**
 * Sign a payload body with a shared secret.
 *
 * ```ts
 * const signature = signHmac(secret, JSON.stringify(envelope));
 * headers['x-forge-event-signature'] = signature;
 * ```
 */
export function signHmac(
  secret: string,
  body: string,
  options: HmacOptions = {}
): string {
  const trimmed = secret.trim();
  if (!trimmed) {
    throw new Error("signHmac: secret must not be empty");
  }
  const { algorithm, encoding } = { ...DEFAULTS, ...options };
  return createHmac(algorithm, trimmed)
    .update(body, "utf8")
    .digest(encoding);
}

/**
 * Verify a signature using timing-safe comparison.
 *
 * ```ts
 * if (!verifyHmac(secret, rawBody, signatureHeader)) {
 *   return res.status(401).json({ error: 'Invalid signature' });
 * }
 * ```
 */
export function verifyHmac(
  secret: string,
  body: string,
  signature: string,
  options: HmacOptions = {}
): boolean {
  const { algorithm, encoding } = { ...DEFAULTS, ...options };

  if (!signature || !secret || secret.trim().length === 0) {
    return false;
  }

  const expected = createHmac(algorithm, secret.trim())
    .update(body, "utf8")
    .digest(encoding);

  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(signature);

  if (expectedBuf.length !== actualBuf.length) return false;

  return timingSafeEqual(expectedBuf, actualBuf);
}

/** Standard header names used across the ecosystem */
export const EVENT_SIGNATURE_HEADERS = {
  /** fn-flux → fn-forge (fulfillment & execution events) */
  FORGE: "x-forge-event-signature",
  /** fn-v2 → fn-flux (compass sync events) */
  COMPASS: "x-compass-event-signature",
  /** Cross-repo correlation (new convention) */
  TRACE: "x-fn-trace-id",
} as const;
