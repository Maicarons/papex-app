/**
 * Refresh controller — implements docs §7.5 (refresh & validation).
 *
 * - A single in-flight refresh lock queues concurrent 401s so we never fire N
 *   parallel refreshes (no infinite loop / thundering herd).
 * - On success the rotated token pair is persisted and the original request
 *   is replayed with the new access token.
 * - On failure (refresh revoked / device revoked) the session is cleared and
 *   the app is sent back to login.
 *
 * This module talks to the refresh endpoint directly (no auth header needed —
 * the refresh token is sent in the body), so it does NOT depend on the wrapped
 * client and avoids a circular import.
 */
import { Endpoints } from './endpoints';
import { toApiError, ApiError } from './errors';
import { ACCESS_TTL_MS } from '../security/tokens';
import type { LoginResponse } from '../types';

export interface RefreshedTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  deviceId: string;
}

export interface RefreshDeps {
  getRefreshToken(): Promise<string | null>;
  getDeviceId(): Promise<string | null>;
  getUserId(): Promise<string | null>;
  onRefreshed(next: RefreshedTokens): Promise<void>;
  onSessionExpired(): void;
}

export class RefreshController {
  private inflight: Promise<boolean> | null = null;

  constructor(
    private readonly deps: RefreshDeps,
    private readonly baseUrl: string,
  ) {}

  /** Returns true if a fresh access token is available for replay. */
  refresh(): Promise<boolean> {
    if (this.inflight) return this.inflight; // single lock — queue concurrent 401s
    this.inflight = this.doRefresh().finally(() => {
      this.inflight = null;
    });
    return this.inflight;
  }

  private async doRefresh(): Promise<boolean> {
    const refreshToken = await this.deps.getRefreshToken();
    const deviceId = await this.deps.getDeviceId();
    if (!refreshToken || !deviceId) {
      this.deps.onSessionExpired();
      return false;
    }
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}${Endpoints.auth.refresh}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken, deviceId }),
      });
    } catch {
      // Network error during refresh — surface as session expired (user re-auth).
      this.deps.onSessionExpired();
      return false;
    }

    if (res.ok) {
      const data = (await res.json()) as LoginResponse;
      await this.deps.onRefreshed({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: Date.now() + ACCESS_TTL_MS,
        deviceId: data.deviceId,
      });
      return true;
    }

    // 401/410/device-revoked → refresh token is dead.
    const err = await toApiError(res);
    void err;
    this.deps.onSessionExpired();
    return false;
  }
}

export class RefreshFailedError extends ApiError {
  constructor() {
    super({ status: 401, code: 'REFRESH_FAILED', message: 'Token refresh failed' });
  }
}
