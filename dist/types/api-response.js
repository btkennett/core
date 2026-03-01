/**
 * API Response Types — Standardized Response Shape
 *
 * fn-legacy uses `{ ok, code, error }` in some places but it's
 * inconsistent. This standardizes the shape with helper functions.
 */
/** Create a success response */
export function successResponse(data, meta) {
    return meta ? { ok: true, data, meta } : { ok: true, data };
}
/** Create an error response */
export function errorResponse(code, error, details) {
    const response = { ok: false, code, error };
    if (details)
        response.details = details;
    return response;
}
/** Common error codes */
export const ERROR_CODES = {
    VALIDATION_FAILED: "VALIDATION_FAILED",
    NOT_FOUND: "NOT_FOUND",
    UNAUTHORIZED: "UNAUTHORIZED",
    FORBIDDEN: "FORBIDDEN",
    CONFLICT: "CONFLICT",
    RATE_LIMITED: "RATE_LIMITED",
    INTERNAL_ERROR: "INTERNAL_ERROR",
    SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
    CIRCUIT_OPEN: "CIRCUIT_OPEN",
};
//# sourceMappingURL=api-response.js.map