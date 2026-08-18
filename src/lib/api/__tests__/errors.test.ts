import { ApiError, toApiError, transportError } from '../errors';

describe('ApiError', () => {
  it('maps HTTP status to a normalized code and i18n key', () => {
    expect(new ApiError({ status: 400, message: 'x' }).code).toBe('BAD_REQUEST');
    expect(new ApiError({ status: 403, message: 'x' }).code).toBe('FORBIDDEN');
    expect(new ApiError({ status: 429, message: 'x' }).code).toBe('RATE_LIMITED');
    expect(new ApiError({ status: 500, message: 'x' }).code).toBe('SERVER_ERROR');
    expect(new ApiError({ status: 418, message: 'x' }).code).toBe('UNKNOWN');
    expect(new ApiError({ status: 0, message: 'x' }).code).toBe('NETWORK');
  });

  it('prefers a server business code for the i18n key', () => {
    const e = new ApiError({ status: 401, serverCode: 'AUTH_USER_EXISTS', message: 'x' });
    expect(e.i18nKey).toBe('errors:userExists');
  });

  it('retryable reflects the error code', () => {
    expect(new ApiError({ status: 429, message: 'x' }).retryable).toBe(true);
    expect(new ApiError({ status: 500, message: 'x' }).retryable).toBe(true);
    expect(new ApiError({ status: 418, message: 'x' }).retryable).toBe(false);
  });

  it('transportError builds NETWORK / TIMEOUT errors', () => {
    expect(transportError('NETWORK', 'boom').code).toBe('NETWORK');
    expect(transportError('TIMEOUT', 'slow').code).toBe('TIMEOUT');
  });

  it('toApiError reads a server business code from the body', async () => {
    const res = {
      status: 403,
      statusText: 'Forbidden',
      json: async () => ({ code: 'DEVICE_REVOKED' }),
    } as unknown as Response;
    const e = await toApiError(res);
    expect(e.i18nKey).toBe('errors:deviceRevoked');
  });

  it('toApiError tolerates a non-JSON body', async () => {
    const res = {
      status: 500,
      statusText: 'Error',
      json: async () => {
        throw new Error('bad');
      },
    } as unknown as Response;
    const e = await toApiError(res);
    expect(e.code).toBe('SERVER_ERROR');
  });
});
