import { NextResponse } from 'next/server';
import { getSessionId } from '@/lib/session-helper';
import { sessionManager } from '@/services/session-manager';

export async function POST() {
  try {
    const sessionId = await getSessionId();
    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'No session found' });
    }
    
    await sessionManager.disconnect(sessionId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
