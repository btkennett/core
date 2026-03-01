/**
 * Environment Validator — Schema-Based Startup Validation
 *
 * Validates process.env at startup using any schema with a safeParse interface
 * (Zod v3, v4, or compatible). Fails fast with clear error messages.
 *
 * Usage with Zod:
 * ```ts
 * import { validateEnv } from '@foundry-north/core/env';
 * import { z } from 'zod';
 *
 * const envSchema = z.object({
 *   DATABASE_URL: z.string().url(),
 *   OPENAI_API_KEY: z.string().min(1),
 *   NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
 *   PORT: z.coerce.number().default(3000),
 * });
 *
 * export const env = validateEnv(envSchema);
 * ```
 */
/**
 * Validate environment variables against a schema.
 * Throws at startup if required variables are missing or invalid.
 *
 * @returns Parsed and typed env object
 */
export function validateEnv(schema, options = {}) {
    const { source = process.env, warnOnly = false, logger = console } = options;
    const result = schema.safeParse(source);
    if (result.success) {
        return result.data;
    }
    const formatted = result.error.issues
        .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
        .join("\n");
    const level = warnOnly ? "warn" : "error";
    logger[level](`[env] Validation ${warnOnly ? "warnings" : "failed"}:\n` + formatted);
    throw new EnvValidationError(`Environment validation failed:\n${formatted}`, result.error.issues);
}
export class EnvValidationError extends Error {
    issues;
    constructor(message, issues) {
        super(message);
        this.name = "EnvValidationError";
        this.issues = issues;
    }
}
//# sourceMappingURL=validator.js.map