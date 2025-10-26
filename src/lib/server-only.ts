// Este arquivo contém utilitários que só devem ser executados no lado do servidor

/**
 * Verifica se o código está sendo executado no servidor
 */
export const isServer = typeof window === 'undefined';

/**
 * Carrega o ioredis apenas no servidor
 */
export function requireServerOnly<T>(module: string): T | null {
  if (typeof window === 'undefined') {
    // No servidor, carrega o módulo normalmente
    return require(module);
  }
  // No cliente, retorna null
  return null;
}
