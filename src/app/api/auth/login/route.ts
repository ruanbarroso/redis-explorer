import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

const AUTH_FILE = path.join(process.cwd(), 'data', 'auth.json');
const JWT_SECRET = process.env.JWT_SECRET || 'redis-explorer-secret-key';

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
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('[Auth Login] Generated token for user');

    // Define cookie httpOnly
    const response = NextResponse.json({ 
      success: true, 
      message: 'Login successful' 
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Mudando para 'lax' para funcionar melhor em desenvolvimento
      maxAge: 24 * 60 * 60, // 24 horas
      path: '/', // Garantindo que o cookie seja válido para todo o site
    });

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
