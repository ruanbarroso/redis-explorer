import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sessionManager } from '@/services/session-manager';
import { metricsStorage } from '@/services/metrics-storage';
import { MetricPeriod } from '@/types/metrics-history';

const PERIOD_MS: Record<MetricPeriod, number> = {
  '1h': 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '12h': 12 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
};

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('redis-explorer-session');

    if (!sessionCookie) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    const sessionId = sessionCookie.value;
    const redis = sessionManager.getRedis(sessionId);

    if (!redis) {
      return NextResponse.json(
        { error: 'No active Redis connection for this session' },
        { status: 503 }
      );
    }

    const connectionId = sessionManager.getConnectionId(sessionId);
    if (!connectionId) {
      return NextResponse.json({ error: 'No connection ID found' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') || '24h') as MetricPeriod;

    if (!PERIOD_MS[period]) {
      return NextResponse.json({ error: 'Invalid period. Use: 1h, 6h, 12h, or 24h' }, { status: 400 });
    }

    const periodMs = PERIOD_MS[period];
    const history = metricsStorage.getAllMetricsHistory(connectionId, periodMs);

    return NextResponse.json({
      connectionId,
      period,
      history,
    });
  } catch (error) {
    console.error('Error fetching metrics history:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
