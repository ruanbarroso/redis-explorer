import { NextRequest, NextResponse } from 'next/server';
import { serverConnectionStorage } from '@/services/connection-storage';

// DELETE /api/connections/[id] - Remove a specific connection
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const connectionId = params.id;
    
    if (!connectionId) {
      return NextResponse.json(
        { success: false, error: 'Connection ID is required' },
        { status: 400 }
      );
    }
    
    const success = serverConnectionStorage.removeConnection(connectionId);
    
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to remove connection' },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to remove connection' },
      { status: 500 }
    );
  }
}
