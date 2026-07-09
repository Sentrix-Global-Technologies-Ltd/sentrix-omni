/**
 * Typed API failures. The client maps HTTP status / envelope errors to a
 * specific class so the UI can react precisely (redirect on Unauthorized,
 * show field errors on Validation) without sniffing status codes everywhere.
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errors: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = new.target.name;
  }

  /** First field-level error message, if any (handy for forms/toasts). */
  firstError(): string | null {
    const first = Object.values(this.errors)[0];
    return Array.isArray(first) && first.length > 0 ? first[0] : null;
  }
}

/** 401 — missing/invalid/expired token. Triggers automatic logout. */
export class UnauthorizedError extends ApiError {}

/** 403 — authenticated but not permitted. */
export class ForbiddenError extends ApiError {}

/** 404 — resource not found (or out of tenant scope). */
export class NotFoundError extends ApiError {}

/** 422 — validation failed; `errors` holds field => messages. */
export class ValidationError extends ApiError {}

/** 5xx — backend error. */
export class ServerError extends ApiError {}

/** Transport failure — the API could not be reached at all. */
export class NetworkError extends ApiError {}

export function errorFromStatus(
  status: number,
  message: string,
  errors: Record<string, string[]> = {},
): ApiError {
  switch (true) {
    case status === 401:
      return new UnauthorizedError(message, status, errors);
    case status === 403:
      return new ForbiddenError(message, status, errors);
    case status === 404:
      return new NotFoundError(message, status, errors);
    case status === 422:
      return new ValidationError(message, status, errors);
    case status >= 500:
      return new ServerError(message, status, errors);
    default:
      return new ApiError(message, status, errors);
  }
}
