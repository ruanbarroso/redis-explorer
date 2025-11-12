import { useState, useEffect, useCallback } from 'react';
import { MetricDataPoint, ChartableMetricName, MetricPeriod } from '@/types/metrics-history';

interface UseMetricHistoryResult {
  data: MetricDataPoint[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useMetricHistory = (
  metricName: ChartableMetricName | null,
  period: MetricPeriod = '24h',
  enabled: boolean = true
): UseMetricHistoryResult => {
  const [data, setData] = useState<MetricDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!metricName || !enabled) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/redis/metrics/history/${metricName}?period=${period}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch metric history: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result.data || []);
    } catch (err) {
      console.error('Error fetching metric history:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [metricName, period, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
};
