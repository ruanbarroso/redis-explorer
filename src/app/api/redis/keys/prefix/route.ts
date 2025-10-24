import { NextRequest, NextResponse } from 'next/server';
import { getRedisFromSession } from '@/lib/session-helper';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get('prefix');
    const separator = searchParams.get('separator') || '::'; // Default para ::
    
    if (!prefix) {
      return NextResponse.json(
        { error: 'Prefix parameter is required' },
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
    
    // Adiciona separador no final se não tiver, para match exato da pasta
    // Exemplo: "portal" + "::" vira "portal::*" para não pegar "portal_new"
    const prefixWithSeparator = prefix.includes(separator) ? prefix : `${prefix}${separator}`;
    const pattern = `${prefixWithSeparator}*`;
    
    console.log(`🗑️ Deletando chaves com padrão: "${pattern}" (prefixo: "${prefix}", separador: "${separator}")`);
    
    // Lua script para deletar chaves por padrão de forma otimizada
    // Executa tudo no servidor Redis, muito mais rápido
    const luaScript = `
      local cursor = "0"
      local pattern = ARGV[1]
      local deleted = 0
      
      repeat
        local result = redis.call("SCAN", cursor, "MATCH", pattern, "COUNT", 1000)
        cursor = result[1]
        local keys = result[2]
        
        if #keys > 0 then
          deleted = deleted + redis.call("DEL", unpack(keys))
        end
      until cursor == "0"
      
      return deleted
    `;
    
    // Executar script Lua
    const deletedCount = await redis.eval(luaScript, 0, pattern) as number;
    
    console.log(`✅ ${deletedCount} chave(s) deletada(s) com padrão "${pattern}"`);
    
    return NextResponse.json({ 
      success: true, 
      deletedCount,
      prefix 
    });
  } catch (error) {
    console.error('Error deleting keys by prefix:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
