import { describe, it, expect, vi } from "vitest";
import { validateEnv, EnvValidationError } from "./validator";

// Inline a minimal Zod-like schema for testing without requiring zod as a dep
// In real usage, consumers pass real Zod schemas
function mockZodSchema<T extends Record<string, unknown>>(
  shape: Record<string, { parse: (v: unknown) => unknown; optional?: boolean }>
) {
  return {
    safeParse(input: Record<string, unknown>) {
      const data: Record<string, unknown> = {};
      const issues: Array<{ path: string[]; message: string }> = [];

      for (const [key, def] of Object.entries(shape)) {
        try {
          data[key] = def.parse(input[key]);
        } catch (e: any) {
          if (!def.optional) {
            issues.push({ path: [key], message: e.message || "Invalid" });
          }
        }
      }

      if (issues.length > 0) {
        return { success: false as const, error: { issues } };
      }
      return { success: true as const, data: data as T };
    },
    parse(input: Record<string, unknown>) {
      const result = this.safeParse(input);
      if (!result.success) throw result.error;
      return result.data;
    },
  };
}

describe("validateEnv", () => {
  it("returns parsed values when valid", () => {
    const schema = mockZodSchema({
      FOO: {
        parse: (v: unknown) => {
          if (typeof v !== "string" || !v) throw new Error("Required");
          return v;
        },
      },
    });

    const result = validateEnv(schema as any, {
      source: { FOO: "bar" } as any,
    });
    expect(result).toEqual({ FOO: "bar" });
  });

  it("throws EnvValidationError when invalid", () => {
    const schema = mockZodSchema({
      REQUIRED_VAR: {
        parse: (v: unknown) => {
          if (!v) throw new Error("Required");
          return v;
        },
      },
    });

    expect(() =>
      validateEnv(schema as any, {
        source: {} as any,
        logger: { error: vi.fn(), warn: vi.fn(), log: vi.fn() },
      })
    ).toThrow(EnvValidationError);
  });
});
