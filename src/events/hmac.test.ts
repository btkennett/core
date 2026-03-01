import { describe, it, expect } from "vitest";
import { signHmac, verifyHmac } from "./hmac";

describe("HMAC signing & verification", () => {
  const secret = "test-secret-key";
  const body = JSON.stringify({ eventType: "order.created", id: 123 });

  it("signHmac produces a non-empty string", () => {
    const sig = signHmac(secret, body);
    expect(sig).toBeTruthy();
    expect(typeof sig).toBe("string");
  });

  it("verifyHmac returns true for valid signatures", () => {
    const sig = signHmac(secret, body);
    expect(verifyHmac(secret, body, sig)).toBe(true);
  });

  it("verifyHmac returns false for wrong body", () => {
    const sig = signHmac(secret, body);
    expect(verifyHmac(secret, "tampered body", sig)).toBe(false);
  });

  it("verifyHmac returns false for wrong secret", () => {
    const sig = signHmac(secret, body);
    expect(verifyHmac("wrong-secret", body, sig)).toBe(false);
  });

  it("verifyHmac returns false for empty signature", () => {
    expect(verifyHmac(secret, body, "")).toBe(false);
  });

  it("verifyHmac returns false for empty secret", () => {
    const sig = signHmac(secret, body);
    expect(verifyHmac("", body, sig)).toBe(false);
  });

  it("trims whitespace from secrets", () => {
    const sig = signHmac("  test-secret  ", body);
    expect(verifyHmac("test-secret", body, sig)).toBe(true);
  });

  it("supports base64url encoding", () => {
    const opts = { encoding: "base64url" as const };
    const sig = signHmac(secret, body, opts);
    expect(sig).not.toContain("+");
    expect(sig).not.toContain("/");
    expect(verifyHmac(secret, body, sig, opts)).toBe(true);
  });

  it("supports hex encoding", () => {
    const opts = { encoding: "hex" as const };
    const sig = signHmac(secret, body, opts);
    expect(/^[0-9a-f]+$/.test(sig)).toBe(true);
    expect(verifyHmac(secret, body, sig, opts)).toBe(true);
  });

  it("signHmac throws on empty secret", () => {
    expect(() => signHmac("", body)).toThrow("secret must not be empty");
  });

  it("signHmac throws on whitespace-only secret", () => {
    expect(() => signHmac("   ", body)).toThrow("secret must not be empty");
  });
});
