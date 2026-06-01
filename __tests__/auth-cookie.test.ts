import type { NextRequest } from 'next/server';
import {
  isSecureRequest,
  shouldUseSecureCookie,
  authCookieOptions,
} from '@/lib/auth-cookie';

// Minimal NextRequest stub — the helper only reads headers.get() and nextUrl.protocol.
function makeRequest(opts: {
  forwardedProto?: string;
  protocol?: string;
}): NextRequest {
  const { forwardedProto, protocol = 'http:' } = opts;
  return {
    headers: {
      get: (name: string) =>
        name.toLowerCase() === 'x-forwarded-proto'
          ? forwardedProto ?? null
          : null,
    },
    nextUrl: { protocol },
  } as unknown as NextRequest;
}

describe('isSecureRequest', () => {
  it('is true when x-forwarded-proto is https', () => {
    expect(isSecureRequest(makeRequest({ forwardedProto: 'https' }))).toBe(true);
  });

  it('uses the first value of a comma-separated x-forwarded-proto list', () => {
    expect(
      isSecureRequest(makeRequest({ forwardedProto: 'https,http' }))
    ).toBe(true);
    expect(
      isSecureRequest(makeRequest({ forwardedProto: 'http,https' }))
    ).toBe(false);
  });

  it('is false when x-forwarded-proto is http', () => {
    expect(isSecureRequest(makeRequest({ forwardedProto: 'http' }))).toBe(false);
  });

  it('falls back to nextUrl.protocol when no forwarded header', () => {
    expect(isSecureRequest(makeRequest({ protocol: 'https:' }))).toBe(true);
    expect(isSecureRequest(makeRequest({ protocol: 'http:' }))).toBe(false);
  });
});

describe('shouldUseSecureCookie', () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    process.env = { ...OLD_ENV };
    delete process.env.FORCE_HTTPS;
    delete process.env.DISABLE_SECURE_COOKIE;
  });
  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('follows the request protocol by default', () => {
    expect(shouldUseSecureCookie(makeRequest({ forwardedProto: 'https' }))).toBe(
      true
    );
    expect(shouldUseSecureCookie(makeRequest({ protocol: 'http:' }))).toBe(false);
  });

  it('FORCE_HTTPS=true always returns true, even over plain HTTP', () => {
    process.env.FORCE_HTTPS = 'true';
    expect(shouldUseSecureCookie(makeRequest({ protocol: 'http:' }))).toBe(true);
  });

  it('DISABLE_SECURE_COOKIE=true always returns false, even over HTTPS', () => {
    process.env.DISABLE_SECURE_COOKIE = 'true';
    expect(
      shouldUseSecureCookie(makeRequest({ forwardedProto: 'https' }))
    ).toBe(false);
  });

  it('FORCE_HTTPS takes precedence over DISABLE_SECURE_COOKIE', () => {
    process.env.FORCE_HTTPS = 'true';
    process.env.DISABLE_SECURE_COOKIE = 'true';
    expect(shouldUseSecureCookie(makeRequest({ protocol: 'http:' }))).toBe(true);
  });
});

describe('authCookieOptions', () => {
  it('returns httpOnly/lax cookie options with protocol-derived secure flag', () => {
    const opts = authCookieOptions(makeRequest({ protocol: 'http:' }), 3600);
    expect(opts).toEqual({
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 3600,
      path: '/',
    });
  });
});
