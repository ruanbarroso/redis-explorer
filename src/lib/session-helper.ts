import { cookies } from 'next/headers';
import { sessionManager } from '@/services/session-manager';
import Redis from 'ioredis';

export async function getRedisFromSession(): Promise<Redis | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('redis-explorer-session');
  
  if (!sessionCookie) {
    return null;
  }

  return sessionManager.getRedis(sessionCookie.value);
}

export async function getSessionId(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('redis-explorer-session');
  
  return sessionCookie?.value || null;
}
