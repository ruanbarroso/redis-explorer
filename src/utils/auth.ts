import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'redis-explorer-secret-key';

export function verifyAuthToken(request: NextRequest): boolean {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return false;
    }

    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export function requireAuth(request: NextRequest) {
  if (!verifyAuthToken(request)) {
    throw new Error('Authentication required');
  }
}
