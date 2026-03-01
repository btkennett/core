/**
 * API Response Types — Standardized Response Shape
 *
 * fn-legacy uses `{ ok, code, error }` in some places but it's
 * inconsistent. This standardizes the shape with helper functions.
 */
/** Successful API response */
export interface ApiSuccess<T = unknown> {
    ok: true;
    data: T;
    /** Optional metadata (pagination, counts, etc.) */
    meta?: Record<string, unknown>;
}
/** Failed API response */
export interface ApiError {
    ok: false;
    /** Machine-readable error code, e.g. "VALIDATION_FAILED", "NOT_FOUND" */
    code: string;
    /** Human-readable error message */
    error: string;
    /** Optional field-level errors for validation failures */
    details?: Record<string, string[]>;
}
/** Union type — every API response is one of these */
export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;
/** Create a success response */
export declare function successResponse<T>(data: T, meta?: Record<string, unknown>): ApiSuccess<T>;
/** Create an error response */
export declare function errorResponse(code: ErrorCode | (string & {}), error: string, details?: Record<string, string[]>): ApiError;
/** Common error codes */
export declare const ERROR_CODES: {
    readonly VALIDATION_FAILED: "VALIDATION_FAILED";
    readonly NOT_FOUND: "NOT_FOUND";
    readonly UNAUTHORIZED: "UNAUTHORIZED";
    readonly FORBIDDEN: "FORBIDDEN";
    readonly CONFLICT: "CONFLICT";
    readonly RATE_LIMITED: "RATE_LIMITED";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
    readonly SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE";
    readonly CIRCUIT_OPEN: "CIRCUIT_OPEN";
};
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
//# sourceMappingURL=api-response.d.ts.map