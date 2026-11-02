/**
 * Typed API failures. The client maps HTTP status / envelope errors to a
 * specific class so the UI can react precisely (redirect on Unauthorized,
 * show field errors on Validation) without sniffing status codes everywhere.
 */

/** User-safe sentences. Server text is never shown for 5xx or unrecognised failures. */
export const SAFE_MESSAGES = {
  invalidCredentials: "Invalid email or password.",
  unavailable: "The service is temporarily unavailable. Please try again later.",
  generic: "Something went wrong. Please try again later.",
  network: "Unable to reach the service. Check your connection and try again.",
  forbidden: "You do not have permission to do this.",
  notFound: "The requested resource could not be found.",
  tooManyRequests: "Too many requests. Please wait a moment and try again.",
  sessionExpired: "Your session has expired. Please sign in again.",
  validation: "Please check the highlighted fields and try again.",
  request: "The request could not be completed.",
} as const;

/**
 * True when a server-supplied string looks like backend internals (SQL, driver
 * text, hosts, file paths, stack frames). Such text is never surfaced to users.
 */
export function looksLikeInternals(text: string): boolean {
  return /SQLSTATE|Stack trace|\.php\b|\bvendor\/|\bApp\\|relation "|\bselect\b[\s\S]+\bfrom\b|\binsert\b[\s\S]+\binto\b|pgsql|\bPDO|Connection:|\bhost\b[\s\S]*\bport\b|<\/?(html|body|script)\b|\bat [\w$.]+\(.*:\d+:\d+\)/i.test(
    text,
  );
}

function isSafeServerText(text: unknown): text is string {
  return (
    typeof text === "string" &&
    text.trim() !== "" &&
    text.length <= 300 &&
    !looksLikeInternals(text)
  );
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errors: Record<string, string[]> = {},
    /** Stable machine-readable code from the API (e.g. "invalid_credentials"). */
    public readonly code?: string,
    /** Correlation ID the API returned; quote it when reporting a problem. */
    public readonly requestId?: string,
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

/** Keep only well-formed, safe field errors (`field => string[]`). */
function sanitizeErrors(errors: unknown): Record<string, string[]> {
  if (!errors || typeof errors !== "object" || Array.isArray(errors)) return {};
  const clean: Record<string, string[]> = {};
  for (const [field, value] of Object.entries(errors as Record<string, unknown>)) {
    if (!Array.isArray(value)) continue;
    const messages = value.filter(isSafeServerText);
    if (messages.length > 0) clean[field] = messages;
  }
  return clean;
}

/** The message shown to users for a failure, derived from status/code first. */
function safeMessage(status: number, serverMessage: unknown, code?: string): string {
  if (code === "invalid_credentials") return SAFE_MESSAGES.invalidCredentials;
  if (code === "service_unavailable" || status === 502 || status === 503 || status === 504) {
    return SAFE_MESSAGES.unavailable;
  }
  if (status >= 500) return SAFE_MESSAGES.generic;

  if (status === 403) return SAFE_MESSAGES.forbidden;
  if (status === 404) return SAFE_MESSAGES.notFound;
  if (status === 419) return SAFE_MESSAGES.sessionExpired;
  if (status === 429) return SAFE_MESSAGES.tooManyRequests;

  // 4xx: the API's own sentence is intended for users, unless it looks like internals.
  if (isSafeServerText(serverMessage)) return serverMessage;
  return status === 422 ? SAFE_MESSAGES.validation : SAFE_MESSAGES.request;
}

export function errorFromStatus(
  status: number,
  message: string,
  errors: Record<string, string[]> = {},
  code?: string,
  requestId?: string,
): ApiError {
  const safe = safeMessage(status, message, code);
  const fields = sanitizeErrors(errors);
  switch (true) {
    case status === 401:
      return new UnauthorizedError(safe, status, fields, code, requestId);
    case status === 403:
      return new ForbiddenError(safe, status, fields, code, requestId);
    case status === 404:
      return new NotFoundError(safe, status, fields, code, requestId);
    case status === 422:
      return new ValidationError(safe, status, fields, code, requestId);
    case status >= 500:
      return new ServerError(safe, status, fields, code, requestId);
    default:
      return new ApiError(safe, status, fields, code, requestId);
  }
}

/**
 * Message for any caught value, safe to render. ApiError messages are already
 * sanitised by errorFromStatus; anything else (TypeError, DOMException, a
 * rejected non-Error) gets the generic sentence — never `String(err)`.
 */
export function userMessage(err: unknown, fallback: string = SAFE_MESSAGES.generic): string {
  return err instanceof ApiError && err.message ? err.message : fallback;
}
