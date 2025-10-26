import { NextRequest, NextResponse } from 'next/server';
import { getRedisFromSession } from '@/lib/session-helper';

type MaintenanceCommand = 'bgsave' | 'bgrewriteaof';

async function isCommandAvailable(redis: any, command: MaintenanceCommand): Promise<boolean> {
  try {
    const result = await redis.call('COMMAND', 'INFO', command.toUpperCase());
    if (!Array.isArray(result)) {
      return false;
    }

    const [info] = result;
    return Array.isArray(info) && info.length > 0;
  } catch (error: any) {
    const message = error?.message?.toLowerCase?.() ?? '';

    if (
      message.includes('unknown command') ||
      message.includes('command not allowed') ||
      message.includes('permission denied') ||
      message.includes('no such key')
    ) {
      return false;
    }

    throw error;
  }
}

export async function GET() {
  try {
    const redis = await getRedisFromSession();
    if (!redis) {
      return NextResponse.json(
        { error: 'No active Redis connection for this session' },
        { status: 503 }
      );
    }

    const optionalCommands: MaintenanceCommand[] = ['bgsave', 'bgrewriteaof'];
    const availabilityEntries = await Promise.all(
      optionalCommands.map(async (cmd) => [cmd, await isCommandAvailable(redis, cmd)] as const)
    );

    const availability = Object.fromEntries(availabilityEntries) as Record<MaintenanceCommand, boolean>;

    return NextResponse.json({
      commands: {
        bgsave: availability.bgsave ?? false,
        bgrewriteaof: availability.bgrewriteaof ?? false,
        flushdb: true,
        flushall: true,
      },
    });
  } catch (error: any) {
    const message = error?.message ?? String(error);
    if (message.toLowerCase().includes('unknown command')) {
      return NextResponse.json({
        commands: {
          bgsave: false,
          bgrewriteaof: false,
          flushdb: true,
          flushall: true,
        },
      });
    }

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const redis = await getRedisFromSession();
    if (!redis) {
      return NextResponse.json(
        { error: 'No active Redis connection for this session' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { operation } = body;

    let result;

    switch (operation) {
      case 'bgsave':
        if (!(await isCommandAvailable(redis, 'bgsave'))) {
          return NextResponse.json(
            { error: 'O comando BGSAVE não está disponível neste servidor Redis.' },
            { status: 400 }
          );
        }
        result = await redis.bgsave();
        break;

      case 'bgrewriteaof':
        if (!(await isCommandAvailable(redis, 'bgrewriteaof'))) {
          return NextResponse.json(
            { error: 'O comando BGREWRITEAOF não está disponível neste servidor Redis.' },
            { status: 400 }
          );
        }
        result = await redis.bgrewriteaof();
        break;

      case 'flushdb':
        result = await redis.flushdb();
        break;

      case 'flushall':
        result = await redis.flushall();
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid operation' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      result: result
    });
  } catch (error: any) {
    const message = error?.message ?? String(error);
    if (message.includes('unknown command')) {
      return NextResponse.json(
        { error: 'Comando de manutenção não suportado por este servidor Redis.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
