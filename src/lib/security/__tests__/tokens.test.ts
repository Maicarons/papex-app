import {
  decodeAccessToken,
  isAccessTokenExpired,
  getAccessTokenExpiry,
  storeTokens,
  loadTokens,
  rotateTokens,
  clearTokens,
  loadSession,
  addAccountMeta,
  removeAccountMeta,
  listAccounts,
  hasPerm,
  canContribute,
  getDeviceId,
  createTestSecureStore,
  type Session,
} from '../tokens';
import { session as sessionStore } from '../../storage/mmkv';

function makeToken(payload: Record<string, unknown>): string {
  const b64 = (obj: unknown) =>
    Buffer.from(JSON.stringify(obj)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${b64({ alg: 'HS256' })}.${b64(payload)}.sig`;
}

const now = Math.floor(Date.now() / 1000);
const validToken = makeToken({ sub: 'u1', role: 'user', perms: ['paper:create'], iat: now - 10, exp: now + 600, jti: 'j1' });
const expiredToken = makeToken({ sub: 'u1', role: 'user', perms: [], iat: now - 1000, exp: now - 500 });

const baseSession: Session = {
  userId: 'u1',
  username: 'alice',
  accessToken: validToken,
  refreshToken: 'refresh-xyz',
  expiresAt: Date.now() + 600_000,
  deviceId: 'dev1',
  perms: ['paper:create'],
  role: 'user',
};

describe('tokens: validation (element e)', () => {
  it('decodes a well-formed JWT payload', () => {
    const p = decodeAccessToken(validToken);
    expect(p).not.toBeNull();
    expect(p?.sub).toBe('u1');
    expect(p?.perms).toContain('paper:create');
  });

  it('returns null for malformed tokens', () => {
    expect(decodeAccessToken('not-a-jwt')).toBeNull();
    expect(decodeAccessToken('')).toBeNull();
    expect(decodeAccessToken(null)).toBeNull();
  });

  it('detects expiry', () => {
    expect(isAccessTokenExpired(validToken)).toBe(false);
    expect(isAccessTokenExpired(expiredToken)).toBe(true);
  });

  it('returns expiry ms', () => {
    const exp = getAccessTokenExpiry(validToken);
    expect(exp).toBeGreaterThan(Date.now());
  });
});

describe('tokens: persistence + refresh (elements d/f)', () => {
  const store = createTestSecureStore();
  beforeEach(() => {
    sessionStore.setAccountList([]);
  });

  it('stores and loads tokens per user', async () => {
    await storeTokens(baseSession, store);
    const loaded = await loadTokens('u1', store);
    expect(loaded?.accessToken).toBe(validToken);
    expect(loaded?.refreshToken).toBe('refresh-xyz');
    expect(loaded?.deviceId).toBe('dev1');
  });

  it('rotates tokens (refresh is replaced)', async () => {
    await storeTokens(baseSession, store);
    const newAccess = makeToken({ sub: 'u1', role: 'user', perms: [], iat: now, exp: now + 600 });
    await rotateTokens('u1', { accessToken: newAccess, refreshToken: 'refresh-2', expiresAt: Date.now() + 600_000, deviceId: 'dev1' }, store);
    const loaded = await loadTokens('u1', store);
    expect(loaded?.accessToken).toBe(newAccess);
    expect(loaded?.refreshToken).toBe('refresh-2');
  });

  it('clears tokens but keeps account meta', async () => {
    await storeTokens(baseSession, store);
    await clearTokens('u1', store);
    expect(await loadTokens('u1', store)).toBeNull();
    expect(listAccounts().some((a) => a.userId === 'u1')).toBe(true);
  });

  it('loadSession reconstructs a Session with perms', async () => {
    await storeTokens(baseSession, store);
    const s = await loadSession('u1', store);
    expect(s?.userId).toBe('u1');
    expect(s?.perms).toContain('paper:create');
  });
});

describe('tokens: multi-account + authorization (elements a/b)', () => {
  beforeEach(() => sessionStore.setAccountList([]));

  it('caps account list at 5', () => {
    for (let i = 0; i < 7; i++) addAccountMeta({ userId: `u${i}`, username: `u${i}`, lastLoginAt: i });
    expect(listAccounts().length).toBe(5);
  });

  it('removes an account', () => {
    addAccountMeta({ userId: 'u9', username: 'u9', lastLoginAt: 1 });
    removeAccountMeta('u9');
    expect(listAccounts().some((a) => a.userId === 'u9')).toBe(false);
  });

  it('hasPerm / canContribute reflect embedded perms (UI only)', () => {
    expect(hasPerm(baseSession, 'paper:create')).toBe(true);
    expect(canContribute(baseSession)).toBe(true);
    expect(hasPerm({ ...baseSession, perms: [] }, 'paper:create')).toBe(false);
  });

  it('hasPerm / canContribute are false for a null session', () => {
    expect(hasPerm(null, 'paper:create')).toBe(false);
    expect(canContribute(null)).toBe(false);
  });
});

describe('tokens: edge branches', () => {
  const store = createTestSecureStore();
  beforeEach(() => sessionStore.setAccountList([]));

  it('rejects a payload missing sub/exp', () => {
    const t = makeToken({ role: 'user', perms: [] });
    expect(decodeAccessToken(t)).toBeNull();
  });

  it('returns null for a corrupt JWT payload', () => {
    const bad = `${Buffer.from('{}').toString('base64')}.not-json!!.sig`;
    expect(decodeAccessToken(bad)).toBeNull();
  });

  it('decodes via atob when Buffer is unavailable', () => {
    const realBuffer = (global as { Buffer?: unknown }).Buffer;
    delete (global as { Buffer?: unknown }).Buffer;
    try {
      expect(decodeAccessToken(validToken)?.sub).toBe('u1');
    } finally {
      (global as { Buffer?: unknown }).Buffer = realBuffer;
    }
  });

  it('loadTokens returns null for corrupt stored JSON', async () => {
    await store.set('papex:uX', 'not-json');
    expect(await loadTokens('uX', store)).toBeNull();
  });

  it('isAccessTokenExpired is true for an undecodable token', () => {
    expect(isAccessTokenExpired('garbage')).toBe(true);
  });

  it('loadSession returns null when nothing is stored', async () => {
    expect(await loadSession('ghost', store)).toBeNull();
  });

  it('loadSession falls back to empty username when meta is missing', async () => {
    await storeTokens(baseSession, store);
    sessionStore.setAccountList([]); // drop meta
    const s = await loadSession('u1', store);
    expect(s?.username).toBe('');
  });

  it('getDeviceId returns existing then generates and persists a new one', async () => {
    const get = jest.fn<string | null, []>(() => null);
    const set = jest.fn();
    const first = await getDeviceId(get, set);
    expect(get).toHaveBeenCalledTimes(1);
    expect(set).toHaveBeenCalledWith(first);
    get.mockReturnValue(first);
    expect(await getDeviceId(get, set)).toBe(first);
    expect(set).toHaveBeenCalledTimes(1); // not re-persisted
  });
});
