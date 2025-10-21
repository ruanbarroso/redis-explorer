import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

const AUTH_FILE = path.join(process.cwd(), 'data', 'auth.json');
const JWT_SECRET = process.env.JWT_SECRET || 'redis-explorer-secret-key';

// Garante que o diretório existe
function ensureDataDir() {
  const dataDir = path.dirname(AUTH_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Verifica se já existe senha configurada
function hasPassword(): boolean {
  try {
    ensureDataDir();
    return fs.existsSync(AUTH_FILE);
  } catch {
    return false;
  }
}

// Salva a senha hasheada
async function savePassword(password: string): Promise<void> {
  ensureDataDir();
  const hashedPassword = await bcrypt.hash(password, 12);
  const authData = {
    passwordHash: hashedPassword,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(AUTH_FILE, JSON.stringify(authData, null, 2));
}

// GET - Verifica se já existe senha configurada
export async function GET() {
  try {
    const passwordExists = hasPassword();
    return NextResponse.json({ hasPassword: passwordExists });
  } catch (error) {
    console.error('Error checking password setup:', error);
    return NextResponse.json(
      { error: 'Failed to check password setup' },
      { status: 500 }
    );
  }
}

// POST - Define a senha inicial
export async function POST(request: NextRequest) {
  try {
    // Verifica se já existe senha
    if (hasPassword()) {
      return NextResponse.json(
        { error: 'Password already configured' },
        { status: 400 }
      );
    }

    const { password } = await request.json();

    if (!password || password.length < 4) {
      return NextResponse.json(
        { error: 'Password must be at least 4 characters long' },
        { status: 400 }
      );
    }

    await savePassword(password);

    // Gera token JWT automaticamente após configurar senha
    const token = jwt.sign(
      { authenticated: true, timestamp: Date.now() },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Define cookie httpOnly
    const response = NextResponse.json({ 
      success: true, 
      message: 'Password configured successfully' 
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 horas
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error setting up password:', error);
    return NextResponse.json(
      { error: 'Failed to setup password' },
      { status: 500 }
    );
  }
}
