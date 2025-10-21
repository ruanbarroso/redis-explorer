import { NextRequest, NextResponse } from 'next/server';
import { serverConnectionStorage } from '@/services/connection-storage';
import { RedisConnection } from '@/types/redis';
import { verifyAuthToken } from '@/utils/auth';

// GET /api/connections - Load all saved connections
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    if (!verifyAuthToken(request)) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const connections = serverConnectionStorage.loadConnections();
    return NextResponse.json({ success: true, connections });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to load connections' },
      { status: 500 }
    );
  }
}

// POST /api/connections - Add a new connection
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    if (!verifyAuthToken(request)) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const connection: RedisConnection = await request.json();
    
    // Validate required fields
    if (!connection.id || !connection.name || !connection.host) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: id, name, host' },
        { status: 400 }
      );
    }
    
    const success = serverConnectionStorage.addConnection(connection);
    
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to save connection' },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid request data' },
      { status: 400 }
    );
  }
}

// PUT /api/connections - Update an existing connection
export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticação
    if (!verifyAuthToken(request)) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const connection: RedisConnection = await request.json();
    
    if (!connection.id) {
      return NextResponse.json(
        { success: false, error: 'Connection ID is required' },
        { status: 400 }
      );
    }
    
    const success = serverConnectionStorage.updateConnection(connection);
    
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: 'Connection not found or failed to update' },
        { status: 404 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid request data' },
      { status: 400 }
    );
  }
}

// DELETE /api/connections - Clear all connections
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticação
    if (!verifyAuthToken(request)) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const success = serverConnectionStorage.clearAllConnections();
    
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to clear connections' },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to clear connections' },
      { status: 500 }
    );
  }
}
