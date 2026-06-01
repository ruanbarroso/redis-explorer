import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, authCookieOptions } from '@/lib/auth-cookie';

// POST - Faz logout removendo o cookie
export async function POST(request: NextRequest) {
  try {
    console.log('🚪 API /auth/logout chamada');

    const response = NextResponse.json({
      success: true,
      message: 'Logout successful'
    });

    // Remove o cookie de autenticação (mesmas flags do set, maxAge 0)
    response.cookies.set(
      AUTH_COOKIE_NAME,
      '',
      authCookieOptions(request, 0) // Expira imediatamente
    );

    console.log('✅ Cookie auth-token removido com sucesso');
    return response;
  } catch (error) {
    console.error('❌ Error during logout:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}
