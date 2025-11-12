import fs from 'fs';
import path from 'path';
import {
  MetricDataPoint,
  MetricHistory,
  ConnectionMetricsHistory,
  ChartableMetricName,
} from '@/types/metrics-history';

const getDataDir = (): string => {
  return process.env.REDIS_EXPLORER_DATA_DIR || path.join(process.cwd(), 'data');
};

const METRICS_DIR = path.join(getDataDir(), 'metrics');
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 horas
const MAX_POINTS_PER_METRIC = 1440; // 1 ponto por minuto em 24h

class MetricsStorage {
  constructor() {
    this.ensureMetricsDir();
  }

  private ensureMetricsDir(): void {
    try {
      if (!fs.existsSync(METRICS_DIR)) {
        fs.mkdirSync(METRICS_DIR, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create metrics directory:', error);
    }
  }

  private getFilePath(connectionId: string): string {
    return path.join(METRICS_DIR, `metrics-${connectionId}.json`);
  }

  private loadConnectionMetrics(connectionId: string): MetricHistory {
    try {
      const filePath = this.getFilePath(connectionId);
      if (!fs.existsSync(filePath)) {
        return {};
      }

      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data) as MetricHistory;
    } catch (error) {
      console.error(`Failed to load metrics for connection ${connectionId}:`, error);
      return {};
    }
  }

  private saveConnectionMetrics(connectionId: string, metrics: MetricHistory): boolean {
    try {
      this.ensureMetricsDir();
      const filePath = this.getFilePath(connectionId);
      const data = JSON.stringify(metrics, null, 2);
      fs.writeFileSync(filePath, data, 'utf8');
      return true;
    } catch (error) {
      console.error(`Failed to save metrics for connection ${connectionId}:`, error);
      return false;
    }
  }

  saveMetricPoint(
    connectionId: string,
    metricName: ChartableMetricName,
    value: number,
    timestamp: number = Date.now()
  ): boolean {
    try {
      const metrics = this.loadConnectionMetrics(connectionId);

      if (!metrics[metricName]) {
        metrics[metricName] = [];
      }

      // Adicionar novo ponto
      metrics[metricName].push({ timestamp, value });

      // Limpar dados antigos e limitar pontos
      metrics[metricName] = this.cleanOldData(metrics[metricName]);

      return this.saveConnectionMetrics(connectionId, metrics);
    } catch (error) {
      console.error(`Failed to save metric point for ${metricName}:`, error);
      return false;
    }
  }

  saveMultipleMetrics(
    connectionId: string,
    metricsData: Partial<Record<ChartableMetricName, number>>,
    timestamp: number = Date.now()
  ): boolean {
    try {
      const metrics = this.loadConnectionMetrics(connectionId);

      for (const [metricName, value] of Object.entries(metricsData)) {
        if (value !== null && value !== undefined) {
          if (!metrics[metricName]) {
            metrics[metricName] = [];
          }

          metrics[metricName].push({ timestamp, value });
          metrics[metricName] = this.cleanOldData(metrics[metricName]);
        }
      }

      return this.saveConnectionMetrics(connectionId, metrics);
    } catch (error) {
      console.error('Failed to save multiple metrics:', error);
      return false;
    }
  }

  getMetricHistory(
    connectionId: string,
    metricName: ChartableMetricName,
    periodMs?: number
  ): MetricDataPoint[] {
    try {
      const metrics = this.loadConnectionMetrics(connectionId);
      const data = metrics[metricName] || [];

      if (!periodMs) {
        return data;
      }

      const cutoff = Date.now() - periodMs;
      return data.filter(point => point.timestamp >= cutoff);
    } catch (error) {
      console.error(`Failed to get metric history for ${metricName}:`, error);
      return [];
    }
  }

  getAllMetricsHistory(connectionId: string, periodMs?: number): MetricHistory {
    try {
      const metrics = this.loadConnectionMetrics(connectionId);

      if (!periodMs) {
        return metrics;
      }

      const cutoff = Date.now() - periodMs;
      const filtered: MetricHistory = {};

      for (const [metricName, data] of Object.entries(metrics)) {
        filtered[metricName] = data.filter(point => point.timestamp >= cutoff);
      }

      return filtered;
    } catch (error) {
      console.error('Failed to get all metrics history:', error);
      return {};
    }
  }

  private cleanOldData(data: MetricDataPoint[]): MetricDataPoint[] {
    const now = Date.now();
    const cutoff = now - MAX_AGE_MS;

    // Filtrar dados antigos
    let cleaned = data.filter(point => point.timestamp >= cutoff);

    // Limitar número de pontos
    if (cleaned.length > MAX_POINTS_PER_METRIC) {
      // Manter apenas os mais recentes
      cleaned = cleaned.slice(-MAX_POINTS_PER_METRIC);
    }

    return cleaned;
  }

  cleanupOldData(connectionId: string): boolean {
    try {
      const metrics = this.loadConnectionMetrics(connectionId);
      const cleaned: MetricHistory = {};

      for (const [metricName, data] of Object.entries(metrics)) {
        cleaned[metricName] = this.cleanOldData(data);
      }

      return this.saveConnectionMetrics(connectionId, cleaned);
    } catch (error) {
      console.error(`Failed to cleanup old data for connection ${connectionId}:`, error);
      return false;
    }
  }

  cleanupAllConnections(): number {
    try {
      if (!fs.existsSync(METRICS_DIR)) {
        return 0;
      }

      const files = fs.readdirSync(METRICS_DIR);
      let cleaned = 0;

      for (const file of files) {
        if (file.startsWith('metrics-') && file.endsWith('.json')) {
          const connectionId = file.replace('metrics-', '').replace('.json', '');
          if (this.cleanupOldData(connectionId)) {
            cleaned++;
          }
        }
      }

      return cleaned;
    } catch (error) {
      console.error('Failed to cleanup all connections:', error);
      return 0;
    }
  }

  deleteConnectionMetrics(connectionId: string): boolean {
    try {
      const filePath = this.getFilePath(connectionId);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Failed to delete metrics for connection ${connectionId}:`, error);
      return false;
    }
  }

  getStorageInfo() {
    try {
      const files = fs.existsSync(METRICS_DIR) ? fs.readdirSync(METRICS_DIR) : [];
      const connections = files.filter(f => f.startsWith('metrics-') && f.endsWith('.json')).length;

      return {
        metricsDir: METRICS_DIR,
        exists: fs.existsSync(METRICS_DIR),
        connections,
        maxAgeHours: MAX_AGE_MS / (60 * 60 * 1000),
        maxPointsPerMetric: MAX_POINTS_PER_METRIC,
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return null;
    }
  }
}

export const metricsStorage = new MetricsStorage();
