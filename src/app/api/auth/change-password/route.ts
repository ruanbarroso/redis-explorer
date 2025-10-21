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

// Salva a nova senha
async function updatePassword(newPassword: string): Promise<void> {
  const authData = getAuthData();
  if (!authData) {
    throw new Error('No auth data found');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  const updatedAuthData = {
    ...authData,
    passwordHash: hashedPassword,
    updatedAt: new Date().toISOString(),
  };
  
  fs.writeFileSync(AUTH_FILE, JSON.stringify(updatedAuthData, null, 2));
}

// Verifica se o usuário está autenticado
function verifyAuth(request: NextRequest): boolean {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return false;

    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

// POST - Troca a senha (requer autenticação)
export async function POST(request: NextRequest) {
  try {
    // Verifica autenticação
    if (!verifyAuth(request)) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 4) {
      return NextResponse.json(
        { error: 'New password must be at least 4 characters long' },
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

    // Verifica a senha atual
    const isValidCurrentPassword = await bcrypt.compare(
      currentPassword, 
      authData.passwordHash
    );
    
    if (!isValidCurrentPassword) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Atualiza a senha
    await updatePassword(newPassword);

    return NextResponse.json({ 
      success: true, 
      message: 'Password changed successfully' 
    });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    );
  }
}
