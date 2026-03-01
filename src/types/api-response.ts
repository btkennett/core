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
export function successResponse<T>(
  data: T,
  meta?: Record<string, unknown>
): ApiSuccess<T> {
  return meta ? { ok: true, data, meta } : { ok: true, data };
}

/** Create an error response */
export function errorResponse(
  code: ErrorCode | (string & {}),
  error: string,
  details?: Record<string, string[]>
): ApiError {
  const response: ApiError = { ok: false, code, error };
  if (details) response.details = details;
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
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
