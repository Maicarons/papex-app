/**
 * authStore — single source of truth for the active session and account list.
 *
 * Wires `apiClient.configure` so every authed request carries the access token,
 * and routes 401-refresh / session-expiry back into the store. Holds secrets in
 * secure storage only; the store keeps a non-secret in-memory `Session` mirror.
 *
 * Dependency rule: stores may import `lib/*` but NOT `features/*`.
 */
import { create } from 'zustand';
import { Platform } from 'react-native';
import { apiClient } from '@lib/api/client';
import { Endpoints } from '@lib/api/endpoints';
import { isDemoMode } from '@lib/config';
import { pushService } from '@lib/push/pushService';
import {
  type Session,
  type AccountMeta,
  storeTokens,
  rotateTokens,
  clearTokens,
  loadSession,
  decodeAccessToken,
  ACCESS_TTL_MS,
  setActiveUser,
  getActiveUser,
  listAccounts,
  removeAccountMeta,
} from '@lib/security/tokens';
import type { LoginResponse, User, Device } from '@lib/types';

type AuthStatus = 'idle' | 'guest' | 'authed';

interface AuthState {
  status: AuthStatus;
  session: Session | null;
  accounts: AccountMeta[];
  loading: boolean;
  error: string | null;

  bootstrap: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  switchAccount: (userId: string) => Promise<void>;
  removeAccount: (userId: string) => Promise<void>;
  loadDevices: () => Promise<Device[]>;
  revokeDevice: (id: string) => Promise<void>;
}

function devicePlatform(): 'android' | 'ios' | 'harmony' | 'desktop' {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return 'harmony';
}

function applySession(session: Session): void {
  apiClient.configure({
    getAccessToken: () => Promise.resolve(session.accessToken || null),
    getRefreshToken: () => Promise.resolve(session.refreshToken || null),
    getDeviceId: () => Promise.resolve(session.deviceId || null),
    getUserId: () => Promise.resolve(session.userId),
    onTokensRefreshed: async (next) => {
      await rotateTokens(session.userId, next);
      useAuthStore.setState((s) => ({
        session: s.session ? { ...s.session, ...next } : s.session,
      }));
    },
    onUnauthorized: () => {
      useAuthStore.setState({ status: 'guest', session: null });
      setActiveUser(null);
    },
  });
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'idle',
  session: null,
  accounts: [],
  loading: false,
  error: null,

  bootstrap: async () => {
    const active = getActiveUser();
    if (!active) {
      set({ status: 'guest', accounts: listAccounts() });
      return;
    }
    const session = await loadSession(active);
    if (session) {
      applySession(session);
      set({ status: 'authed', session, accounts: listAccounts() });
    } else {
      set({ status: 'guest', accounts: listAccounts() });
    }
  },

  login: async (username, password) => {
    set({ loading: true, error: null });
    try {
      const body = {
        username,
        password,
        mode: 'app' as const,
        platform: devicePlatform(),
        deviceName: `${devicePlatform()} device`,
      };
      const res = await apiClient.post<LoginResponse>(Endpoints.auth.login, body, { skipAuth: true });
      const payload = decodeAccessToken(res.accessToken);
      const session: Session = {
        userId: payload?.sub ?? res.user.id,
        username: res.user.username,
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        expiresAt: Date.now() + ACCESS_TTL_MS,
        deviceId: res.deviceId,
        perms: payload?.perms ?? res.user.perms,
        role: payload?.role ?? res.user.role,
      };
      await storeTokens(session);
      setActiveUser(session.userId);
      applySession(session);
      set({ status: 'authed', session, accounts: listAccounts(), loading: false });
      void pushService.register();
    } catch (e) {
      set({ loading: false, error: (e as Error).message });
      throw e;
    }
  },

  register: async (username, password, displayName) => {
    set({ loading: true, error: null });
    try {
      const res = await apiClient.post<LoginResponse & { user: User }>(
        Endpoints.auth.register,
        { username, password, displayName },
        { skipAuth: true },
      );
      // Auto sign-in after register (same shape as login).
      await get().login(username, password);
      void res;
    } catch (e) {
      set({ loading: false, error: (e as Error).message });
      throw e;
    }
  },

  logout: async () => {
    const { session } = get();
    if (session && !isDemoMode()) {
      try {
        await apiClient.post(Endpoints.auth.logout, { deviceId: session.deviceId });
      } catch {
        /* best-effort revoke */
      }
    }
    if (session) await clearTokens(session.userId);
    setActiveUser(null);
    set({ status: 'guest', session: null });
    void pushService.unregister();
  },

  switchAccount: async (userId) => {
    const session = await loadSession(userId);
    if (!session) {
      // No stored tokens (e.g. logged out elsewhere) — keep meta for fast login.
      setActiveUser(userId);
      set({ status: 'guest', session: null });
      return;
    }
    applySession(session);
    setActiveUser(userId);
    set({ status: 'authed', session, accounts: listAccounts() });
  },

  removeAccount: async (userId) => {
    await clearTokens(userId);
    removeAccountMeta(userId);
    if (getActiveUser() === userId) setActiveUser(null);
    set({ accounts: listAccounts() });
  },

  loadDevices: async () => {
    // TODO(backend): /api/me/devices not yet implemented in papex.
    if (isDemoMode()) return [];
    return apiClient.get<Device[]>(Endpoints.auth.devices);
  },

  revokeDevice: async (id) => {
    // TODO(backend): DELETE /api/me/devices/[id] not yet implemented.
    if (isDemoMode()) return;
    await apiClient.del(Endpoints.auth.device(id));
  },
}));
