export interface MetricDataPoint {
  timestamp: number;
  value: number;
}

export interface MetricHistory {
  [metricName: string]: MetricDataPoint[];
}

export interface ConnectionMetricsHistory {
  [connectionId: string]: MetricHistory;
}

export type MetricPeriod = '1h' | '6h' | '12h' | '24h';

export type ChartableMetricName =
  | 'cacheHitRatio'
  | 'memoryUsagePercentage'
  | 'memoryFragmentationRatio'
  | 'cpuPercentage'
  | 'latencyP50'
  | 'latencyP95'
  | 'opsPerSec'
  | 'connectedClients'
  | 'evictedPerSec'
  | 'expiredPerSec'
  | 'networkInputKbps'
  | 'networkOutputKbps';

export interface MetricConfig {
  name: ChartableMetricName;
  title: string;
  unit: string;
  color: string;
  chartable: boolean;
}

export const CHARTABLE_METRICS: Record<ChartableMetricName, MetricConfig> = {
  cacheHitRatio: {
    name: 'cacheHitRatio',
    title: 'Cache Hit Ratio',
    unit: '%',
    color: '#2196f3',
    chartable: true,
  },
  memoryUsagePercentage: {
    name: 'memoryUsagePercentage',
    title: 'Memory Usage',
    unit: '%',
    color: '#ff9800',
    chartable: true,
  },
  memoryFragmentationRatio: {
    name: 'memoryFragmentationRatio',
    title: 'Memory Fragmentation',
    unit: 'ratio',
    color: '#f44336',
    chartable: true,
  },
  cpuPercentage: {
    name: 'cpuPercentage',
    title: 'CPU Usage',
    unit: '%',
    color: '#9c27b0',
    chartable: true,
  },
  latencyP50: {
    name: 'latencyP50',
    title: 'Latency P50',
    unit: 'ms',
    color: '#4caf50',
    chartable: true,
  },
  latencyP95: {
    name: 'latencyP95',
    title: 'Latency P95',
    unit: 'ms',
    color: '#ff5722',
    chartable: true,
  },
  opsPerSec: {
    name: 'opsPerSec',
    title: 'Operations/sec',
    unit: 'ops/s',
    color: '#00bcd4',
    chartable: true,
  },
  connectedClients: {
    name: 'connectedClients',
    title: 'Connected Clients',
    unit: 'clients',
    color: '#3f51b5',
    chartable: true,
  },
  evictedPerSec: {
    name: 'evictedPerSec',
    title: 'Eviction Rate',
    unit: '/s',
    color: '#e91e63',
    chartable: true,
  },
  expiredPerSec: {
    name: 'expiredPerSec',
    title: 'Expiration Rate',
    unit: '/s',
    color: '#009688',
    chartable: true,
  },
  networkInputKbps: {
    name: 'networkInputKbps',
    title: 'Network Input',
    unit: 'KB/s',
    color: '#8bc34a',
    chartable: true,
  },
  networkOutputKbps: {
    name: 'networkOutputKbps',
    title: 'Network Output',
    unit: 'KB/s',
    color: '#cddc39',
    chartable: true,
  },
};
