import { jwtSecret } from '@/config/secrets';
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';


export function verifyAuthToken(request: NextRequest): boolean {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return false;
    }

    jwt.verify(token, jwtSecret());
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
