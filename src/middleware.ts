import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { SESSION_COOKIE_NAME, shouldUseSecureCookie } from '@/lib/auth-cookie';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Criar sessionId único para cada usuário se não existir
  if (!request.cookies.get(SESSION_COOKIE_NAME)) {
    const sessionId = uuidv4();
    response.cookies.set(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: shouldUseSecureCookie(request),
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 dias
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
