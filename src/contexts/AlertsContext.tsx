'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { MetricAlert, RedisMetrics } from '@/types/metrics';
import { useConnectionErrorHandler } from '@/hooks/useConnectionErrorHandler';

interface MetricsContextType {
  alerts: MetricAlert[];
  alertCount: number;
  health: 'healthy' | 'warning' | 'critical';
  metrics: RedisMetrics | null;
  isLoading: boolean;
}

const MetricsContext = createContext<MetricsContextType | undefined>(undefined);

export function AlertsProvider({ children }: { children: ReactNode }) {
  const { activeConnection } = useSelector((state: RootState) => state.connection);
  const [alerts, setAlerts] = useState<MetricAlert[]>([]);
  const [metrics, setMetrics] = useState<RedisMetrics | null>(null);
  const [health, setHealth] = useState<'healthy' | 'warning' | 'critical'>('healthy');
  const [isLoading, setIsLoading] = useState(true);
  const { handleConnectionError } = useConnectionErrorHandler();

  const fetchMetrics = async () => {
    if (!activeConnection?.connected) {
      setAlerts([]);
      setMetrics(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/redis/metrics', {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 503) {
          console.error('Redis connection unavailable, redirecting to connections...');
          handleConnectionError();
          return;
        }
        console.error('Failed to fetch alerts');
        return;
      }

      const data = await response.json();
      
      if (data.error) {
        console.error('Redis error in response:', data.error);
        handleConnectionError();
        return;
      }
      
      if (data.metrics) {
        const fetchedAlerts = data.metrics.alerts || [];
        setAlerts(fetchedAlerts);
        setMetrics(data.metrics);
        setHealth(data.metrics.health || 'healthy');
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
      
      if (err instanceof TypeError && (err as TypeError).message.includes('fetch')) {
        console.error('Network error, redirecting to connections...');
        handleConnectionError();
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeConnection?.connected) {
      setIsLoading(true);
      fetchMetrics();
      
      // Atualizar métricas a cada 2 segundos
      const interval = setInterval(fetchMetrics, 2000);
      
      return () => clearInterval(interval);
    } else {
      setAlerts([]);
      setMetrics(null);
      setIsLoading(false);
    }
  }, [activeConnection?.id]);

  return (
    <MetricsContext.Provider 
      value={{ 
        alerts, 
        alertCount: alerts.length, 
        health,
        metrics,
        isLoading 
      }}
    >
      {children}
    </MetricsContext.Provider>
  );
}

export function useAlerts() {
  const context = useContext(MetricsContext);
  if (context === undefined) {
    throw new Error('useAlerts must be used within an AlertsProvider');
  }
  return context;
}

export function useMetrics() {
  const context = useContext(MetricsContext);
  if (context === undefined) {
    throw new Error('useMetrics must be used within an AlertsProvider');
  }
  return context;
}
