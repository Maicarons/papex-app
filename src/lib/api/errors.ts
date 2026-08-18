/**
 * Unified API error envelope.
 *
 * The papex backend returns Chinese free-text errors (`{ error: "..." }`). The
 * client maps a normalized `code` to an i18n key under the `errors` namespace.
 * When the server provides no machine code, we fall back to the HTTP status.
 *
 * @see docs/development/papex-app.md §8 (error i18n).
 */

/** Normalized error codes used internally and for i18n lookup. */
export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'SERVER_ERROR'
  | 'NETWORK'
  | 'TIMEOUT'
  | 'REFRESH_FAILED'
  | 'VALIDATION'
  | 'UNKNOWN';

export interface ApiErrorBody {
  error?: string;
  message?: string;
  code?: string;
}

/** i18n keys under the `errors` namespace (see src/lib/i18n). */
const CODE_TO_I18N: Record<ApiErrorCode, string> = {
  BAD_REQUEST: 'errors:badRequest',
  UNAUTHORIZED: 'errors:unauthorized',
  FORBIDDEN: 'errors:forbidden',
  NOT_FOUND: 'errors:notFound',
  RATE_LIMITED: 'errors:rateLimited',
  SERVER_ERROR: 'errors:serverError',
  NETWORK: 'errors:network',
  TIMEOUT: 'errors:timeout',
  REFRESH_FAILED: 'errors:refreshFailed',
  VALIDATION: 'errors:validation',
  UNKNOWN: 'errors:unknown',
};

/** Map a known server business code to an i18n key (extends as backend grows). */
const SERVER_CODE_MAP: Record<string, string> = {
  'AUTH_INVALID_CREDENTIALS': 'errors:invalidCredentials',
  'AUTH_USER_EXISTS': 'errors:userExists',
  'AUTH_WEAK_PASSWORD': 'errors:weakPassword',
  'TOKEN_EXPIRED': 'errors:tokenExpired',
  'TOKEN_REVOKED': 'errors:tokenRevoked',
  'DEVICE_REVOKED': 'errors:deviceRevoked',
  'QUOTA_EXCEEDED': 'errors:quotaExceeded',
  'RATE_LIMIT': 'errors:rateLimited',
  'PAPER_NOT_FOUND': 'errors:paperNotFound',
};

function statusToCode(status: number): ApiErrorCode {
  switch (status) {
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 429:
      return 'RATE_LIMITED';
    case 0: // network failure
      return 'NETWORK';
    default:
      if (status >= 500) return 'SERVER_ERROR';
      return 'UNKNOWN';
  }
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly serverCode?: string;
  readonly i18nKey: string;
  readonly raw?: unknown;

  constructor(opts: {
    status: number;
    code?: ApiErrorCode;
    serverCode?: string;
    message: string;
    raw?: unknown;
  }) {
    super(opts.message);
    this.name = 'ApiError';
    this.status = opts.status;
    this.code = opts.code ?? statusToCode(opts.status);
    this.serverCode = opts.serverCode;
    this.raw = opts.raw;

    // Prefer an explicit server business code; else fall back to HTTP mapping.
    if (opts.serverCode && SERVER_CODE_MAP[opts.serverCode]) {
      this.i18nKey = SERVER_CODE_MAP[opts.serverCode]!;
    } else {
      this.i18nKey = CODE_TO_I18N[this.code];
    }
  }

  /** True when the error is retryable with backoff (429 / 5xx / network). */
  get retryable(): boolean {
    return this.code === 'RATE_LIMITED' || this.code === 'SERVER_ERROR' || this.code === 'NETWORK';
  }
}

/** Parse a non-ok fetch Response into an ApiError. */
export async function toApiError(res: Response, preParsed?: ApiErrorBody): Promise<ApiError> {
  let body: ApiErrorBody = preParsed ?? {};
  if (!preParsed) {
    try {
      body = (await res.json()) as ApiErrorBody;
    } catch {
      // non-JSON body (e.g. HTML error page) — keep empty.
    }
  }
  const serverCode = body.code;
  return new ApiError({
    status: res.status,
    serverCode,
    message: body.error ?? body.message ?? res.statusText ?? 'Request failed',
    raw: body,
  });
}

/** Build an error for a transport-level failure (no response). */
export function transportError(kind: 'NETWORK' | 'TIMEOUT', message: string): ApiError {
  return new ApiError({ status: kind === 'NETWORK' ? 0 : 0, code: kind, message });
}
