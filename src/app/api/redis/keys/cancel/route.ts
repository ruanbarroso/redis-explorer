import { NextRequest, NextResponse } from 'next/server';

// Get shared operation status store
function getOperationStatus() {
  if (typeof global !== 'undefined') {
    if (!(global as any).operationStatus) {
      (global as any).operationStatus = new Map();
    }
    return (global as any).operationStatus;
  }
  return new Map();
}

export async function POST(request: NextRequest) {
  try {
    const { operationId } = await request.json();
    
    if (!operationId) {
      return NextResponse.json({ error: 'Operation ID required' }, { status: 400 });
    }

    console.log(`🛑 Cancelando operação: ${operationId}`);

    // Get the shared operation status
    const operationStatus = getOperationStatus();
    
    const operation = operationStatus.get(operationId);
    if (!operation) {
      return NextResponse.json({ error: 'Operation not found' }, { status: 404 });
    }

    if (operation.status !== 'running') {
      return NextResponse.json({ error: 'Operation is not running' }, { status: 400 });
    }

    // Mark as cancelled
    operationStatus.set(operationId, {
      ...operation,
      status: 'cancelled',
      cancelled: true,
      message: 'Operação cancelada pelo usuário',
    });

    console.log(`✅ Operação ${operationId} marcada como cancelada`);

    return NextResponse.json({ 
      success: true, 
      message: 'Operation cancelled' 
    });
  } catch (error) {
    console.error('❌ Error cancelling operation:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
