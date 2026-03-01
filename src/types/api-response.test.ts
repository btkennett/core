import { describe, it, expect } from "vitest";
import { successResponse, errorResponse, ERROR_CODES } from "./api-response";

describe("API response helpers", () => {
  it("successResponse creates { ok: true, data }", () => {
    const res = successResponse({ items: [1, 2, 3] });
    expect(res.ok).toBe(true);
    expect(res.data).toEqual({ items: [1, 2, 3] });
    expect(res.meta).toBeUndefined();
  });

  it("successResponse includes meta when provided", () => {
    const res = successResponse([1], { total: 100 });
    expect(res.meta).toEqual({ total: 100 });
  });

  it("errorResponse creates { ok: false, code, error }", () => {
    const res = errorResponse(ERROR_CODES.NOT_FOUND, "Order not found");
    expect(res.ok).toBe(false);
    expect(res.code).toBe("NOT_FOUND");
    expect(res.error).toBe("Order not found");
    expect(res.details).toBeUndefined();
  });

  it("errorResponse includes details when provided", () => {
    const res = errorResponse(ERROR_CODES.VALIDATION_FAILED, "Invalid input", {
      name: ["Required"],
      email: ["Invalid format"],
    });
    expect(res.details).toEqual({
      name: ["Required"],
      email: ["Invalid format"],
    });
  });
});
