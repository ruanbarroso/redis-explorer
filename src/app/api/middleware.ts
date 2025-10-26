import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Lista de rotas públicas que não requerem autenticação
const PUBLIC_ROUTES = [
  '/api/auth/login',
  '/api/auth/setup',
  '/api/auth/verify',
  '/api/health',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Verifica se a rota é pública
  const isPublicRoute = PUBLIC_ROUTES.some(route => 
    pathname.startsWith(route)
  );
  
  // Se for uma rota pública, não precisa verificar autenticação
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // Para rotas de API que exigem autenticação, verifica o token
  if (pathname.startsWith('/api/')) {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return new NextResponse(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Adiciona o token ao cabeçalho da requisição para uso posterior
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('authorization', `Bearer ${token}`);
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }
  
  // Para rotas não-API, apenas continua
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - api (API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
    // Match all API routes except auth routes
    '/api/:path*',
  ],
};
