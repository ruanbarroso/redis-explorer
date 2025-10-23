import { NextResponse } from 'next/server';

// POST - Faz logout removendo o cookie
export async function POST() {
  try {
    console.log('🚪 API /auth/logout chamada');
    
    const response = NextResponse.json({ 
      success: true, 
      message: 'Logout successful' 
    });

    // Remove o cookie de autenticação
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expira imediatamente
      path: '/',
    });

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
