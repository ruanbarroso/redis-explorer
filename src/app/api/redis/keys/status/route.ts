import { NextRequest, NextResponse } from 'next/server';

// Get shared operation status store
function getOperationStatus() {
  if (typeof global !== 'undefined') {
    if (!(global as any).operationStatus) {
      (global as any).operationStatus = new Map();
    }
    return (global as any).operationStatus;
  }
  // Fallback for edge cases
  return new Map();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const operationId = searchParams.get('id');
  
  if (!operationId) {
    return NextResponse.json({ error: 'Operation ID required' }, { status: 400 });
  }
  
  const operationStatus = getOperationStatus();
  const status = operationStatus.get(operationId);
  if (!status) {
    return NextResponse.json({ error: 'Operation not found' }, { status: 404 });
  }
  
  return NextResponse.json(status);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { operationId, ...statusData } = body;
  
  if (!operationId) {
    return NextResponse.json({ error: 'Operation ID required' }, { status: 400 });
  }
  
  const operationStatus = getOperationStatus();
  operationStatus.set(operationId, statusData);
  
  // Clean up completed operations after 5 minutes
  if (statusData.status === 'complete' || statusData.status === 'error') {
    setTimeout(() => {
      operationStatus.delete(operationId);
    }, 5 * 60 * 1000);
  }
  
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const operationId = searchParams.get('id');
  
  if (!operationId) {
    return NextResponse.json({ error: 'Operation ID required' }, { status: 400 });
  }
  
  const operationStatus = getOperationStatus();
  operationStatus.delete(operationId);
  return NextResponse.json({ success: true });
}
