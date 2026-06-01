import type { NextRequest } from 'next/server';

export const AUTH_COOKIE_NAME = 'auth-token';
export const SESSION_COOKIE_NAME = 'redis-explorer-session';

/**
 * Detecta se a requisição chegou via HTTPS.
 *
 * Considera o header `x-forwarded-proto` (definido por proxies reversos que
 * terminam o TLS, ex: nginx/Traefik) antes de cair no protocolo da própria
 * requisição — necessário porque, atrás de um proxy, a conexão interna é HTTP.
 */
export function isSecureRequest(request: NextRequest): boolean {
  const forwardedProto = request.headers.get('x-forwarded-proto');
  if (forwardedProto) {
    // Pode vir como lista: "https,http" — o primeiro valor é o do cliente.
    return forwardedProto.split(',')[0].trim().toLowerCase() === 'https';
  }
  return request.nextUrl.protocol === 'https:';
}

/**
 * Decide se o cookie de autenticação deve receber a flag `Secure`.
 *
 * - `FORCE_HTTPS=true`         → sempre Secure (deploy sempre atrás de HTTPS).
 * - `DISABLE_SECURE_COOKIE=true` → nunca Secure (escape hatch explícito).
 * - caso contrário             → segue o protocolo real da requisição, de modo
 *   que o login funcione sobre HTTP simples (ex.: acesso interno por IP:porta)
 *   sem abrir mão do Secure quando servido sobre HTTPS.
 *
 * Navegadores descartam cookies `Secure` em conexões HTTP (exceto localhost),
 * então marcar Secure incondicionalmente quebra o login sobre HTTP simples.
 */
export function shouldUseSecureCookie(request: NextRequest): boolean {
  if (process.env.FORCE_HTTPS === 'true') {
    return true;
  }
  if (process.env.DISABLE_SECURE_COOKIE === 'true') {
    return false;
  }
  return isSecureRequest(request);
}

/**
 * Opções padrão do cookie de autenticação (`auth-token`).
 */
export function authCookieOptions(request: NextRequest, maxAge: number) {
  return {
    httpOnly: true,
    secure: shouldUseSecureCookie(request),
    sameSite: 'lax' as const,
    maxAge,
    path: '/',
  };
}
