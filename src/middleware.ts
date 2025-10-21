import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Por enquanto, permite todas as requisições
  // A autenticação será verificada nas próprias rotas da API
  return NextResponse.next();
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
