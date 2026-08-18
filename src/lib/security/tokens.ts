/**
 * TOKENS SYSTEM — six elements (docs/development/papex-app.md §7):
 *   (a) Authentication : access JWT (15 min) + refresh opaque (30 d)
 *   (b) Authorization  : perms embedded in access token; UI-only toggles
 *   (c) Quota          : client-side 429 backoff; server rate-limit documented
 *   (d) Refresh        : rotate on every refresh, device-bound
 *   (e) Validation     : client decodes/exp-checks; signature verified server-side
 *   (f) Persistence    : refreshToken ONLY in native secure storage (secureStore)
 *
 * Secrets never enter MMKV / logs. This module is platform-independent and
 * depends only on the `SecureStore` interface (so tests inject a memory store).
 */
import { getSecureStore, MemorySecureStore, type SecureStore } from './secureStore';
import { session as sessionStore } from '../storage/mmkv';

/** Access token lifetime (15 min) — mirrors server HS256 exp. */
export const ACCESS_TTL_MS = 15 * 60 * 1000;
/** Refresh token lifetime (30 d). */
export const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;
/** Server rate-limit documented for the client (docs §7.4). */
export const SERVER_RATE_LIMIT = { api: '120/min', auth: '10/min' } as const;

export interface AccessTokenPayload {
  sub: string; // userId
  role: string;
  perms: string[];
  iat: number; // seconds
  exp: number; // seconds
  jti?: string;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface Session {
  userId: string;
  username: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // ms epoch
  deviceId: string;
  perms: string[];
  role: string;
}

/** Tokens persisted in the secure store (no username/perms — those are derived). */
export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  deviceId: string;
}

export interface AccountMeta {
  userId: string;
  username: string;
  lastLoginAt: number;
}

// ---------------------------------------------------------------------------
// (e) Validation — base64url JWT decode (no signature check on client).
// ---------------------------------------------------------------------------

function b64urlDecode(input: string): string {
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), '=');
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(pad, 'base64').toString('utf-8');
  }
  // atob is provided by Hermes (RN) and Node 18+.
  return atob(pad);
}

export function decodeAccessToken(token: string | null | undefined): AccessTokenPayload | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const json = b64urlDecode(parts[1]!);
    const payload = JSON.parse(json) as AccessTokenPayload;
    if (typeof payload.sub !== 'string' || typeof payload.exp !== 'number') return null;
    return payload;
  } catch {
    return null;
  }
}

export function getAccessTokenExpiry(token: string): number | null {
  const p = decodeAccessToken(token);
  return p ? p.exp * 1000 : null;
}

/** True if the access token is expired (with optional clock skew tolerance). */
export function isAccessTokenExpired(token: string, skewMs = 5000): boolean {
  const exp = getAccessTokenExpiry(token);
  if (exp == null) return true;
  return Date.now() >= exp - skewMs;
}

// ---------------------------------------------------------------------------
// (f) Persistence — secure store, keyed per user (multi-account).
// ---------------------------------------------------------------------------

function aliasFor(userId: string): string {
  return `papex:${userId}`;
}

export async function storeTokens(
  session: Session,
  store: SecureStore = getSecureStore(),
): Promise<void> {
  await store.set(
    aliasFor(session.userId),
    JSON.stringify({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt,
      deviceId: session.deviceId,
    }),
  );
  addAccountMeta({ userId: session.userId, username: session.username, lastLoginAt: Date.now() });
}

export async function loadTokens(
  userId: string,
  store: SecureStore = getSecureStore(),
): Promise<StoredTokens | null> {
  const raw = await store.get(aliasFor(userId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredTokens;
    return parsed;
  } catch {
    return null;
  }
}

export async function clearTokens(
  userId: string,
  store: SecureStore = getSecureStore(),
): Promise<void> {
  await store.delete(aliasFor(userId));
  // Keep the sanitized account meta for fast re-login (docs §7.7).
}

/** (d) Rotate: persist a fresh access+refresh pair. Refresh is replaced (old invalidated server-side). */
export async function rotateTokens(
  userId: string,
  next: Tokens & { expiresAt: number; deviceId: string },
  store: SecureStore = getSecureStore(),
): Promise<void> {
  await store.set(
    aliasFor(userId),
    JSON.stringify({
      accessToken: next.accessToken,
      refreshToken: next.refreshToken,
      expiresAt: next.expiresAt,
      deviceId: next.deviceId,
    }),
  );
}

// ---------------------------------------------------------------------------
// Multi-account helpers (sanitized metadata in MMKV only).
// ---------------------------------------------------------------------------

export function addAccountMeta(meta: AccountMeta): void {
  const list = sessionStore.getAccountList().filter((a) => a.userId !== meta.userId);
  list.unshift(meta);
  sessionStore.setAccountList(list.slice(0, 5));
}

export function removeAccountMeta(userId: string): void {
  sessionStore.setAccountList(sessionStore.getAccountList().filter((a) => a.userId !== userId));
}

export function listAccounts(): AccountMeta[] {
  return sessionStore.getAccountList();
}

export function setActiveUser(userId: string | null): void {
  sessionStore.setActiveUserId(userId);
}

export function getActiveUser(): string | null {
  return sessionStore.getActiveUserId();
}

/** Build a full Session from stored tokens + decoded access payload. */
export async function loadSession(
  userId: string,
  store: SecureStore = getSecureStore(),
): Promise<Session | null> {
  const stored = await loadTokens(userId, store);
  if (!stored) return null;
  const payload = decodeAccessToken(stored.accessToken);
  const meta = listAccounts().find((a) => a.userId === userId);
  return {
    userId,
    username: meta?.username ?? '',
    accessToken: stored.accessToken,
    refreshToken: stored.refreshToken,
    expiresAt: stored.expiresAt,
    deviceId: stored.deviceId,
    perms: payload?.perms ?? [],
    role: payload?.role ?? 'user',
  };
}

// ---------------------------------------------------------------------------
// Device id (per-device, stable; used to bind refresh tokens).
// ---------------------------------------------------------------------------

export async function getDeviceId(mmkvGet: () => string | null, mmkvSet: (v: string) => void): Promise<string> {
  const existing = mmkvGet();
  if (existing) return existing;
  const generated = `dev_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  mmkvSet(generated);
  return generated;
}

// ---------------------------------------------------------------------------
// (b) Authorization — client-side permission check (UI toggle only).
// The server RBAC remains the sole authority; this never gates API calls.
// ---------------------------------------------------------------------------

export function hasPerm(session: Session | null, perm: string): boolean {
  return session?.perms.includes(perm) ?? false;
}

/** Convenience: whether to show an "upload/contribute" entry (paper:create). */
export function canContribute(session: Session | null): boolean {
  return hasPerm(session, 'paper:create');
}

// ---------------------------------------------------------------------------
// Test helper — build an in-memory secure store.
// ---------------------------------------------------------------------------

export function createTestSecureStore(): SecureStore {
  return new MemorySecureStore();
}
