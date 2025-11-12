import { metricsStorage } from './metrics-storage';

class MetricsCleanupJob {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hora

  start(): void {
    if (this.intervalId) {
      console.log('Metrics cleanup job already running');
      return;
    }

    console.log('Starting metrics cleanup job (runs every 1 hour)');

    // Executar imediatamente na inicialização
    this.runCleanup();

    // Agendar execuções periódicas
    this.intervalId = setInterval(() => {
      this.runCleanup();
    }, this.CLEANUP_INTERVAL_MS);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Metrics cleanup job stopped');
    }
  }

  private runCleanup(): void {
    try {
      console.log('[Metrics Cleanup] Starting cleanup of old metrics data...');
      const cleaned = metricsStorage.cleanupAllConnections();
      console.log(`[Metrics Cleanup] Cleaned ${cleaned} connection(s)`);
    } catch (error) {
      console.error('[Metrics Cleanup] Error during cleanup:', error);
    }
  }
}

export const metricsCleanupJob = new MetricsCleanupJob();
