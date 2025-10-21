import { NextResponse } from 'next/server';
import { redisService } from '@/services/redis';

export async function POST() {
  try {
    // For now, we'll just return success since we don't have session management
    // In a real app, you'd want to track connections per session
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
