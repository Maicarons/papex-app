import { apiClient } from '../client';
import { ApiError } from '../errors';

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  } as unknown as Response;
}

describe('apiClient', () => {
  let fetchMock: jest.Mock;
  const refreshed: Array<{ accessToken: string; refreshToken: string; expiresAt: number; deviceId: string }> = [];
  let unauthorized = false;

  beforeEach(() => {
    fetchMock = jest.fn();
    (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
    refreshed.length = 0;
    unauthorized = false;
    apiClient.configure({
      baseUrl: 'https://api.test',
      apiKey: 'key-123',
      getAccessToken: () => Promise.resolve('access-1'),
      getRefreshToken: () => Promise.resolve('refresh-1'),
      getDeviceId: () => Promise.resolve('dev-1'),
      getUserId: () => Promise.resolve('u-1'),
      onTokensRefreshed: async (t) => {
        refreshed.push(t);
      },
      onUnauthorized: () => {
        unauthorized = true;
      },
    });
  });

  it('injects the Bearer access token on authed requests', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
    await apiClient.get('/api/papers');
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://api.test/api/papers');
    expect((init as RequestInit).headers).toMatchObject({ Authorization: 'Bearer access-1' });
  });

  it('maps 404 to an ApiError with i18n key', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'not found' }, 404));
    await expect(apiClient.get('/api/papers/x')).rejects.toMatchObject({
      status: 404,
      i18nKey: 'errors:notFound',
    });
  });

  it('maps a server business code to a specific i18n key', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'bad', code: 'AUTH_INVALID_CREDENTIALS' }, 401));
    // skipAuth isolates error-mapping from the 401-refresh flow (we only want to
    // assert the server `code` → i18n key mapping here).
    const err = await apiClient.get('/api/auth/me', { skipAuth: true }).catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).i18nKey).toBe('errors:invalidCredentials');
  });

  it('refreshes once on 401 then replays with the new token', async () => {
    // 1) first call → 401 (access expired)
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'unauth' }, 401));
    // 2) refresh endpoint → new tokens
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ accessToken: 'access-2', refreshToken: 'refresh-2', deviceId: 'dev-1', user: { id: 'u-1', username: 'a', perms: [], role: 'user' } }),
    );
    // 3) replay → 200
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));

    // point getAccessToken at the refreshed value
    let access = 'access-1';
    apiClient.configure({ getAccessToken: () => Promise.resolve(access) });
    const onRefreshed = refreshed;
    void onRefreshed;
    // re-register onTokensRefreshed to flip `access`
    apiClient.configure({
      onTokensRefreshed: async (t) => {
        access = t.accessToken;
        refreshed.push(t);
      },
    });

    const result = await apiClient.get('/api/papers');
    expect(result).toEqual({ ok: true });
    expect(refreshed.length).toBe(1);
    expect(refreshed[0]!.accessToken).toBe('access-2');
    const replayCall = fetchMock.mock.calls[2]!;
    expect((replayCall[1] as RequestInit).headers).toMatchObject({ Authorization: 'Bearer access-2' });
  });

  it('signals session expiry when refresh fails', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'unauth' }, 401));
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'revoked' }, 401)); // refresh fails
    await expect(apiClient.get('/api/papers')).rejects.toBeInstanceOf(ApiError);
    expect(unauthorized).toBe(true);
  });

  it('retries 429 with backoff then succeeds', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'slow down' }, 429));
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
    const res = await apiClient.get('/api/papers');
    expect(res).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('surfaces a network error as ApiError (NETWORK)', async () => {
    fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const err = await apiClient.get('/api/papers').catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).code).toBe('NETWORK');
  });

  it('omits the Authorization header when skipAuth is set', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
    await apiClient.get('/api/public', { skipAuth: true });
    const [, init] = fetchMock.mock.calls[0]!;
    expect((init as RequestInit).headers).not.toMatchObject({ Authorization: expect.anything() });
  });

  it('upload() strips the JSON Content-Type so fetch can set the multipart boundary', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ url: 'https://cdn/x' }));
    const form = new FormData();
    form.append('file', 'data');
    await apiClient.upload('/api/avatar', form);
    const [, init] = fetchMock.mock.calls[0]!;
    expect((init as RequestInit).headers).not.toHaveProperty('Content-Type');
  });

  it('surfaces a server business code directly on 401 without refreshing (revoked)', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'bad', code: 'TOKEN_REVOKED' }, 401));
    const err = await apiClient.get('/api/auth/me').catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).i18nKey).toBe('errors:tokenRevoked');
    // refresh endpoint must NOT have been hit
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('post sends a JSON body and parses the response', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 1 }));
    const res = await apiClient.post('/api/papers', { title: 'x' });
    expect(res).toEqual({ id: 1 });
    const [, init] = fetchMock.mock.calls[0]!;
    expect((init as RequestInit).method).toBe('POST');
    expect((init as RequestInit).body).toBe(JSON.stringify({ title: 'x' }));
  });

  it('put / patch / del map to the right HTTP methods', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
    await apiClient.put('/api/papers/1', { title: 'y' });
    await apiClient.patch('/api/papers/1', { title: 'z' });
    await apiClient.del('/api/papers/1');
    expect(fetchMock.mock.calls.map((c) => (c[1] as RequestInit).method)).toEqual([
      'PUT',
      'PATCH',
      'DELETE',
    ]);
  });
});
