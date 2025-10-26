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

    // Criar AbortController para timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos de timeout

    try {
      const response = await fetch('/api/redis/metrics', {
        credentials: 'include',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.log(`Metrics request failed with status ${response.status}, redirecting to connections...`);
        handleConnectionError();
        return;
      }

      const data = await response.json();
      
      if (data.error) {
        console.log('Redis error in response:', data.error);
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
      clearTimeout(timeoutId);
      
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Metrics request timeout after 5 seconds, redirecting to connections...');
        handleConnectionError();
        return;
      }
      
      // Qualquer erro de fetch deve redirecionar para conexões
      console.log('Metrics error, redirecting to connections...');
      handleConnectionError();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const fetchWithDelay = async () => {
      if (!isMounted || !activeConnection?.connected) {
        return;
      }

      await fetchMetrics();
      
      // Agendar próxima chamada apenas após a atual terminar
      if (isMounted && activeConnection?.connected) {
        timeoutId = setTimeout(fetchWithDelay, 2000);
      }
    };

    if (activeConnection?.connected) {
      setIsLoading(true);
      fetchWithDelay();
    } else {
      setAlerts([]);
      setMetrics(null);
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
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
