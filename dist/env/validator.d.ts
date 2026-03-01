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
/** Any schema with a safeParse method (compatible with Zod v3/v4) */
export interface SafeParseableSchema<T> {
    safeParse(input: unknown): {
        success: true;
        data: T;
    } | {
        success: false;
        error: {
            issues: ReadonlyArray<{
                path: (string | number)[];
                message: string;
            }>;
        };
    };
}
export interface ValidateEnvOptions {
    /** Override process.env with custom source. Useful for testing */
    source?: Record<string, string | undefined>;
    /** If true, log at warn level instead of error level before throwing */
    warnOnly?: boolean;
    /** Logger. Defaults to console */
    logger?: Pick<Console, "error" | "warn" | "log">;
}
/**
 * Validate environment variables against a schema.
 * Throws at startup if required variables are missing or invalid.
 *
 * @returns Parsed and typed env object
 */
export declare function validateEnv<T>(schema: SafeParseableSchema<T>, options?: ValidateEnvOptions): T;
export declare class EnvValidationError extends Error {
    readonly issues: ReadonlyArray<{
        path: (string | number)[];
        message: string;
    }>;
    constructor(message: string, issues: ReadonlyArray<{
        path: (string | number)[];
        message: string;
    }>);
}
//# sourceMappingURL=validator.d.ts.map