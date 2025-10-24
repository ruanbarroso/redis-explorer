import { NextRequest, NextResponse } from 'next/server';
import { getRedisFromSession } from '@/lib/session-helper';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    
    if (!key) {
      return NextResponse.json(
        { error: 'Key parameter is required' },
        { status: 400 }
      );
    }
    
    const redis = await getRedisFromSession();
    if (!redis) {
      return NextResponse.json(
        { error: 'No active Redis connection for this session' },
        { status: 503 }
      );
    }
    
    // Get type first
    const type = await redis.type(key);
    let value: any;
    
    switch (type) {
      case 'string':
        value = await redis.get(key);
        break;
      case 'hash':
        value = await redis.hgetall(key);
        break;
      case 'list':
        value = await redis.lrange(key, 0, -1);
        break;
      case 'set':
        value = await redis.smembers(key);
        break;
      case 'zset':
        value = await redis.zrange(key, 0, -1, 'WITHSCORES');
        break;
      default:
        value = null;
    }
    
    // Get TTL
    const ttl = await redis.ttl(key);
    
    // Get size (memory usage)
    let size = 0;
    try {
      const memoryUsage = await redis.memory('USAGE', key);
      size = memoryUsage || 0;
    } catch (e) {
      // Memory command might not be available
      size = JSON.stringify(value).length;
    }
    
    return NextResponse.json({ value, type, ttl, size });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { key, value, type, ttl } = await request.json();
    
    const redis = await getRedisFromSession();
    if (!redis) {
      return NextResponse.json(
        { error: 'No active Redis connection for this session' },
        { status: 503 }
      );
    }
    
    // Set value based on type
    switch (type) {
      case 'string':
        if (ttl && ttl > 0) {
          await redis.setex(key, ttl, value);
        } else {
          await redis.set(key, value);
        }
        break;
      case 'hash':
        await redis.del(key);
        if (typeof value === 'object') {
          await redis.hset(key, value);
        }
        break;
      case 'list':
        await redis.del(key);
        if (Array.isArray(value)) {
          await redis.rpush(key, ...value);
        }
        break;
      case 'set':
        await redis.del(key);
        if (Array.isArray(value)) {
          await redis.sadd(key, ...value);
        }
        break;
      case 'zset':
        await redis.del(key);
        if (Array.isArray(value)) {
          await redis.zadd(key, ...value);
        }
        break;
    }
    
    // Set TTL if provided
    if (ttl && ttl > 0 && type !== 'string') {
      await redis.expire(key, ttl);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
