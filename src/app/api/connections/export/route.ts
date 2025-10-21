import { NextResponse } from 'next/server';
import { serverConnectionStorage } from '@/services/connection-storage';

// GET /api/connections/export - Export all connections as JSON
export async function GET() {
  try {
    const connections = serverConnectionStorage.exportConnections();
    
    // Create filename with current date
    const date = new Date().toISOString().split('T')[0];
    const filename = `redis-connections-${date}.json`;
    
    return new NextResponse(JSON.stringify(connections, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to export connections' },
      { status: 500 }
    );
  }
}
