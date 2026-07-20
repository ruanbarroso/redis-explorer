import { jwtSecret } from '@/config/secrets';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { AUTH_COOKIE_NAME, authCookieOptions } from '@/lib/auth-cookie';

const AUTH_FILE = path.join(process.cwd(), 'data', 'auth.json');

// Lê os dados de autenticação
function getAuthData() {
  try {
    if (!fs.existsSync(AUTH_FILE)) {
      return null;
    }
    const data = fs.readFileSync(AUTH_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

// POST - Faz login com a senha
export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    const authData = getAuthData();
    if (!authData) {
      return NextResponse.json(
        { error: 'No password configured' },
        { status: 400 }
      );
    }

    // Verifica a senha
    const isValidPassword = await bcrypt.compare(password, authData.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Gera token JWT
    const token = jwt.sign(
      { authenticated: true, timestamp: Date.now() },
      jwtSecret(),
      { expiresIn: '24h' }
    );

    console.log('[Auth Login] Generated token for user');

    // Define cookie httpOnly
    const response = NextResponse.json({ 
      success: true, 
      message: 'Login successful' 
    });

    response.cookies.set(
      AUTH_COOKIE_NAME,
      token,
      authCookieOptions(request, 24 * 60 * 60) // 24 horas
    );

    console.log('[Auth Login] Cookie set successfully');

    return response;
  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
