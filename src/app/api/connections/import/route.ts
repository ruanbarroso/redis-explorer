import { NextRequest, NextResponse } from 'next/server';
import { serverConnectionStorage } from '@/services/connection-storage';
import { RedisConnection } from '@/types/redis';

// POST /api/connections/import - Import connections from JSON
export async function POST(request: NextRequest) {
  try {
    const { connections }: { connections: RedisConnection[] } = await request.json();
    
    if (!Array.isArray(connections)) {
      return NextResponse.json(
        { success: false, error: 'Invalid data format. Expected array of connections.' },
        { status: 400 }
      );
    }
    
    const success = serverConnectionStorage.importConnections(connections);
    
    if (success) {
      const importedCount = connections.filter(conn => 
        conn.id && conn.name && conn.host
      ).length;
      
      return NextResponse.json({ 
        success: true, 
        message: `Successfully imported ${importedCount} connection(s)`,
        importedCount 
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to import connections' },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON data' },
      { status: 400 }
    );
  }
}
