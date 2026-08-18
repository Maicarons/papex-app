/**
 * API client — the single network boundary for the app.
 *
 * Responsibilities (docs §4.3, §7):
 *   - inject `Authorization: Bearer <accessToken>` on every authed request
 *   - demo mode: inject the API Key bearer instead of an access token
 *   - 401 → queue a single token refresh (auth-refresh.ts) and replay once
 *   - 429 → exponential backoff + jitter, then surface a rate-limited error
 *   - unify errors into `ApiError` (code → i18n key)
 *   - request timeout (no hung requests)
 *
 * `lib/` never imports `features/`; the auth store wires credential callbacks
 * in via `configure()`.
 */
import { config, isDemoMode } from '../config';
import { toApiError, transportError, ApiError } from './errors';
import { RefreshController, type RefreshedTokens } from './auth-refresh';

const REQUEST_TIMEOUT_MS = 15000;
const MAX_429_RETRIES = 3;
const BACKOFF_BASE_MS = 500;
const BACKOFF_MAX_MS = 8000;

export interface ApiConfig {
  baseUrl?: string;
  apiKey?: string;
  getAccessToken?: () => Promise<string | null>;
  getRefreshToken?: () => Promise<string | null>;
  getDeviceId?: () => Promise<string | null>;
  getUserId?: () => Promise<string | null>;
  onTokensRefreshed?: (t: RefreshedTokens) => Promise<void>;
  onUnauthorized?: () => void;
}

interface InternalConfig extends Required<Pick<ApiConfig, 'baseUrl' | 'apiKey'>> {
  getAccessToken?: () => Promise<string | null>;
  getRefreshToken?: () => Promise<string | null>;
  getDeviceId?: () => Promise<string | null>;
  getUserId?: () => Promise<string | null>;
  onTokensRefreshed?: (t: RefreshedTokens) => Promise<void>;
  onUnauthorized?: () => void;
}

const internal: InternalConfig = {
  baseUrl: config.API_BASE_URL,
  apiKey: config.PAPEX_API_KEY,
};

export function configure(opts: ApiConfig): void {
  // Merge: only defined fields are applied, so callers can update a single
  // credential callback (e.g. onTokensRefreshed after a refresh) without
  // wiping the others.
  if (opts.baseUrl !== undefined) internal.baseUrl = opts.baseUrl;
  if (opts.apiKey !== undefined) internal.apiKey = opts.apiKey;
  if (opts.getAccessToken !== undefined) internal.getAccessToken = opts.getAccessToken;
  if (opts.getRefreshToken !== undefined) internal.getRefreshToken = opts.getRefreshToken;
  if (opts.getDeviceId !== undefined) internal.getDeviceId = opts.getDeviceId;
  if (opts.getUserId !== undefined) internal.getUserId = opts.getUserId;
  if (opts.onTokensRefreshed !== undefined) internal.onTokensRefreshed = opts.onTokensRefreshed;
  if (opts.onUnauthorized !== undefined) internal.onUnauthorized = opts.onUnauthorized;
}

/**
 * 401s carrying one of these business codes are *definitive* auth failures
 * (bad credentials, revoked token/device) where a token refresh cannot help.
 * We surface the `ApiError` directly instead of entering the refresh flow.
 * A plain 401 (or `TOKEN_EXPIRED`) still triggers refresh.
 */
const REFRESH_BYPASS_CODES = new Set<string>([
  'AUTH_INVALID_CREDENTIALS',
  'AUTH_WEAK_PASSWORD',
  'TOKEN_REVOKED',
  'DEVICE_REVOKED',
]);

const refreshController = new RefreshController(
  {
    getRefreshToken: () => internal.getRefreshToken?.() ?? Promise.resolve(null),
    getDeviceId: () => internal.getDeviceId?.() ?? Promise.resolve(null),
    getUserId: () => internal.getUserId?.() ?? Promise.resolve(null),
    onRefreshed: (t) => internal.onTokensRefreshed?.(t) ?? Promise.resolve(),
    onSessionExpired: () => internal.onUnauthorized?.(),
  },
  internal.baseUrl,
);

function buildUrl(path: string, query?: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(path, internal.baseUrl);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

async function buildHeaders(
  extra: Record<string, string> = {},
  skipAuth = false,
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...extra,
  };
  if (!skipAuth) {
    const token = isDemoMode() ? internal.apiKey : await internal.getAccessToken?.();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function doFetch(url: string, init: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } catch (e: unknown) {
    if (ctrl.signal.aborted) {
      throw transportError('TIMEOUT', 'Request timed out');
    }
    throw transportError('NETWORK', e instanceof Error ? e.message : String(e));
  } finally {
    clearTimeout(timer);
  }
}

async function backoff(attempt: number): Promise<void> {
  const exp = Math.min(BACKOFF_MAX_MS, BACKOFF_BASE_MS * Math.pow(2, attempt));
  const jitter = Math.random() * exp * 0.3; // ±30% jitter
  await new Promise((r) => setTimeout(r, exp + jitter));
}

async function parseJson<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

/** Read an error body without throwing (used to inspect 401 business codes). */
async function parseErrorBody(res: Response): Promise<{ code?: string }> {
  try {
    return (await res.json()) as { code?: string };
  } catch {
    return {};
  }
}

export interface RequestOptions {
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  skipAuth?: boolean;
}

/** Core request with 401-replay and 429-backoff handling. */
export async function request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
  const url = buildUrl(path, opts.query);
  const headers = await buildHeaders(opts.headers, opts.skipAuth);
  const init: RequestInit = {
    method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  };

  let didRefresh = false;

  for (let attempt = 0; ; attempt++) {
    const res = await doFetch(url, init);
    if (res.ok) return parseJson<T>(res);

    // (c) Quota: 429 → exponential backoff + jitter, then retry.
    if (res.status === 429 && attempt < MAX_429_RETRIES) {
      await backoff(attempt);
      continue;
    }

    // (e/d) 401 → refresh once (no loop), then replay.
    if (res.status === 401 && !opts.skipAuth && !isDemoMode() && !didRefresh) {
      const errBody = await parseErrorBody(res);
      // Definitive auth failure (bad credentials / revoked) — no point refreshing.
      if (errBody.code && REFRESH_BYPASS_CODES.has(errBody.code)) {
        throw await toApiError(res, errBody);
      }
      const refreshed = await refreshController.refresh();
      if (refreshed) {
        didRefresh = true;
        const h2 = await buildHeaders(opts.headers, opts.skipAuth);
        const res2 = await doFetch(url, { ...init, headers: h2 });
        if (res2.ok) return parseJson<T>(res2);
        // fall through to error below with the replayed response
        throw await toApiError(res2);
      }
      internal.onUnauthorized?.();
      throw await toApiError(res, errBody);
    }

    throw await toApiError(res);
  }
}

export const apiClient = {
  configure,
  get: <T>(path: string, opts?: RequestOptions) => request<T>('GET', path, opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>('POST', path, { ...opts, body }),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>('PUT', path, { ...opts, body }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>('PATCH', path, { ...opts, body }),
  del: <T>(path: string, opts?: RequestOptions) => request<T>('DELETE', path, opts),
  /** Multipart upload (avatar) — auth injected, body is FormData. */
  upload: async <T>(path: string, form: FormData, opts?: RequestOptions): Promise<T> => {
    const headers = await buildHeaders(opts?.headers, opts?.skipAuth);
    delete (headers as Record<string, string>)['Content-Type']; // let fetch set boundary
    const res = await doFetch(buildUrl(path, opts?.query), { method: 'POST', headers, body: form });
    if (!res.ok) throw await toApiError(res);
    return parseJson<T>(res);
  },
};

export type { ApiError };
