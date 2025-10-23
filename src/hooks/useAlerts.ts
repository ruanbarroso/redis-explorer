import { useMemo } from 'react';
import { RedisStats } from '@/types/redis';

export interface Alert {
  severity: 'critical' | 'warning';
  message: string;
  metric: string;
}

export const useAlerts = (stats: RedisStats | null) => {
  const alerts = useMemo(() => {
    if (!stats) return [];
    
    const alertList: Alert[] = [];
    
    // Memory usage critical
    if (stats.maxMemory && stats.maxMemory > 0) {
      const memPercent = (stats.usedMemory / stats.maxMemory) * 100;
      if (memPercent >= 90) {
        alertList.push({
          severity: 'critical',
          message: `Memory usage at ${memPercent.toFixed(1)}% (critical threshold: 90%)`,
          metric: 'memory'
        });
      } else if (memPercent >= 80) {
        alertList.push({
          severity: 'warning',
          message: `Memory usage at ${memPercent.toFixed(1)}% (warning threshold: 80%)`,
          metric: 'memory'
        });
      }
    }
    
    // Fragmentation ratio
    if (stats.memoryFragmentationRatio) {
      if (stats.memoryFragmentationRatio >= 1.5) {
        alertList.push({
          severity: 'critical',
          message: `High memory fragmentation: ${stats.memoryFragmentationRatio.toFixed(2)}`,
          metric: 'fragmentation'
        });
      } else if (stats.memoryFragmentationRatio >= 1.4) {
        alertList.push({
          severity: 'warning',
          message: `Memory fragmentation elevated: ${stats.memoryFragmentationRatio.toFixed(2)}`,
          metric: 'fragmentation'
        });
      }
    }
    
    // Hit rate
    const totalOps = stats.keyspaceHits + stats.keyspaceMisses;
    if (totalOps > 0) {
      const hitRate = (stats.keyspaceHits / totalOps) * 100;
      if (hitRate < 60) {
        alertList.push({
          severity: 'critical',
          message: `Low cache hit rate: ${hitRate.toFixed(1)}%`,
          metric: 'hitrate'
        });
      } else if (hitRate < 80) {
        alertList.push({
          severity: 'warning',
          message: `Cache hit rate below optimal: ${hitRate.toFixed(1)}%`,
          metric: 'hitrate'
        });
      }
    }
    
    // Evictions
    if (stats.evictedKeys > 0) {
      alertList.push({
        severity: 'warning',
        message: `${stats.evictedKeys} keys evicted (memory pressure detected)`,
        metric: 'evictions'
      });
    }
    
    // Rejected connections
    if (stats.rejectedConnections > 0) {
      alertList.push({
        severity: 'critical',
        message: `${stats.rejectedConnections} connections rejected (maxclients reached)`,
        metric: 'rejected'
      });
    }
    
    return alertList;
  }, [stats]);
  
  const criticalAlerts = useMemo(() => alerts.filter(a => a.severity === 'critical'), [alerts]);
  const warningAlerts = useMemo(() => alerts.filter(a => a.severity === 'warning'), [alerts]);
  
  return {
    alerts,
    hasAlerts: alerts.length > 0,
    criticalCount: criticalAlerts.length,
    warningCount: warningAlerts.length,
    getAlertsBySeverity: (severity: 'critical' | 'warning') => 
      alerts.filter(a => a.severity === severity)
  };
};
