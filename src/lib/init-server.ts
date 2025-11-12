import { metricsCleanupJob } from '@/services/metrics-cleanup-job';

let initialized = false;

export function initializeServer() {
  if (initialized) {
    return;
  }

  console.log('[Server Init] Initializing server components...');

  // Iniciar job de limpeza de métricas
  metricsCleanupJob.start();

  initialized = true;
  console.log('[Server Init] Server components initialized successfully');
}

// Auto-inicializar quando o módulo for carregado (server-side only)
if (typeof window === 'undefined') {
  initializeServer();
}
