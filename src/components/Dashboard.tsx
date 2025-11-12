'use client';

import { Box, Grid, Typography, CircularProgress, Divider } from '@mui/material';
import {
  Memory as MemoryIcon,
  Speed as SpeedIcon,
  Timeline as TimelineIcon,
  Psychology as CpuIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  DeleteOutline as DeleteIcon,
  AccessTime as AccessTimeIcon,
  NetworkCheck as NetworkIcon,
  Storage as StorageIcon,
  Sync as SyncIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { MetricCard } from './MetricCard';
import { useMetrics } from '@/contexts/MetricsContext';
import { MetricChartModal } from './MetricChartModal';
import { ChartableMetricName } from '@/types/metrics-history';
import { useState } from 'react';

const Dashboard = () => {
  const { activeConnection } = useSelector((state: RootState) => state.connection);
  const { metrics, isLoading } = useMetrics();
  const [selectedMetric, setSelectedMetric] = useState<ChartableMetricName | null>(null);

  const handleMetricClick = (metricName: ChartableMetricName) => {
    setSelectedMetric(metricName);
  };

  const handleCloseModal = () => {
    setSelectedMetric(null);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (!activeConnection) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100%" gap={2}>
        <Typography variant="h6" color="text.secondary">
          Nenhuma conexão Redis ativa
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Conecte-se a um servidor Redis na aba Connections para visualizar o dashboard.
        </Typography>
      </Box>
    );
  }

  if (isLoading && !metrics) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', overflow: 'auto', p: 3 }}>
      {/* Métricas Críticas (Tier 1) */}
      <Typography variant="h6" fontWeight={600} mb={2} color="error.main">
        Métricas Críticas
      </Typography>
      <Grid container spacing={2} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Cache Hit Ratio"
            value={metrics && metrics.cacheHitRatio != null ? `${metrics.cacheHitRatio.toFixed(1)}%` : '-'}
            subtitle="Eficiência do cache"
            icon={<TrendingUpIcon />}
            color={
              !metrics
                ? 'primary'
                : metrics.cacheHitRatio > 90
                ? 'success'
                : metrics.cacheHitRatio >= 80
                ? 'warning'
                : 'error'
            }
            tooltip="Percentual de requisições atendidas pelo cache. Saudável: >90%. Alerta: 80% - 90%. Crítico: <80%. Clique para ver histórico."
            loading={isLoading}
            metricName="cacheHitRatio"
            onClick={() => handleMetricClick('cacheHitRatio')}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Memory Usage"
            value={metrics ? metrics.memoryUsage.usedHuman : '-'}
            subtitle={
              metrics?.memoryUsage?.max && metrics.memoryUsage.max > 0 && metrics.memoryUsage.percentage != null
                ? `${metrics.memoryUsage.percentage.toFixed(1)}% de ${metrics.memoryUsage.maxHuman}`
                : 'Sem limite configurado'
            }
            icon={<MemoryIcon />}
            color={
              !metrics || !metrics.memoryUsage?.max
                ? 'primary'
                : metrics.memoryUsage.percentage > 90
                ? 'error'
                : metrics.memoryUsage.percentage >= 75
                ? 'warning'
                : 'success'
            }
            tooltip="Uso de memória atual. Saudável: <75%. Alerta: 75% - 90%. Crítico: >90%. Clique para ver histórico."
            loading={isLoading}
            metricName="memoryUsagePercentage"
            onClick={() => handleMetricClick('memoryUsagePercentage')}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Memory Fragmentation"
            value={metrics && metrics.memoryFragmentation?.ratio != null ? metrics.memoryFragmentation.ratio.toFixed(2) : '-'}
            subtitle="Razão RSS/Used"
            icon={<StorageIcon />}
            color={
              !metrics
                ? 'primary'
                : metrics.memoryFragmentation.ratio >= 3
                ? 'error'
                : metrics.memoryFragmentation.ratio > 1.5
                ? 'warning'
                : metrics.memoryFragmentation.ratio >= 1.0
                ? 'success'
                : 'warning'
            }
            tooltip="Razão entre memória física (RSS) e memória usada. Saudável: 1.0 - 1.5. Alerta: >1.5 e <3.0. Crítico: >3.0. Clique para ver histórico."
            loading={isLoading}
            metricName="memoryFragmentationRatio"
            onClick={() => handleMetricClick('memoryFragmentationRatio')}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="CPU Usage"
            value={metrics && metrics.cpu?.percentage != null ? `${metrics.cpu.percentage.toFixed(1)}%` : '-'}
            subtitle="Processo Redis"
            icon={<CpuIcon />}
            color={
              !metrics
                ? 'primary'
                : metrics.cpu.percentage > 80
                ? 'error'
                : metrics.cpu.percentage >= 50
                ? 'warning'
                : 'success'
            }
            tooltip="Uso de CPU do processo Redis. Saudável: <50%. Alerta: 50% - 80%. Crítico: >80%. Clique para ver histórico."
            loading={isLoading}
            metricName="cpuPercentage"
            onClick={() => handleMetricClick('cpuPercentage')}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Latency P50"
            value={metrics?.latency?.p50 !== null && metrics?.latency?.p50 !== undefined ? `${metrics.latency.p50.toFixed(2)}ms` : 'N/A'}
            subtitle="Mediana de latência"
            icon={<TimelineIcon />}
            color={
              !metrics || !metrics.latency || metrics.latency.p50 === null
                ? 'primary'
                : metrics.latency.p50 > 10
                ? 'error'
                : metrics.latency.p50 >= 1
                ? 'warning'
                : 'success'
            }
            tooltip="Mediana de latência (P50). Saudável: <1ms. Alerta: 1ms - 10ms. Crítico: >10ms. Clique para ver histórico."
            loading={isLoading}
            metricName="latencyP50"
            onClick={() => handleMetricClick('latencyP50')}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Latency P95"
            value={metrics?.latency?.p95 !== null && metrics?.latency?.p95 !== undefined ? `${metrics.latency.p95.toFixed(2)}ms` : 'N/A'}
            subtitle="95º percentil"
            icon={<TimelineIcon />}
            color={
              !metrics || !metrics.latency || metrics.latency.p95 === null
                ? 'primary'
                : metrics.latency.p95 > 20
                ? 'error'
                : metrics.latency.p95 >= 5
                ? 'warning'
                : 'success'
            }
            tooltip="Latência P95 das operações. Saudável: <5ms. Alerta: 5ms - 20ms. Crítico: >20ms. Clique para ver histórico."
            loading={isLoading}
            metricName="latencyP95"
            onClick={() => handleMetricClick('latencyP95')}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Métricas de Performance (Tier 2) */}
      <Typography variant="h6" fontWeight={600} mb={2} color="warning.main">
        Performance
      </Typography>
      <Grid container spacing={2} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Operations/sec"
            value={metrics ? formatNumber(metrics.throughput.opsPerSec) : '-'}
            subtitle="Throughput atual"
            icon={<SpeedIcon />}
            color="secondary"
            tooltip="Número de operações por segundo. Indica o throughput atual do Redis. Monitore junto com CPU e latência para identificar gargalos. Clique para ver histórico."
            loading={isLoading}
            metricName="opsPerSec"
            onClick={() => handleMetricClick('opsPerSec')}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Connected Clients"
            value={metrics ? formatNumber(metrics.connections.connected) : '-'}
            subtitle={metrics?.connections?.blocked ? `${metrics.connections.blocked} bloqueados` : 'Nenhum bloqueado'}
            icon={<PeopleIcon />}
            color={metrics?.connections?.blocked ? 'warning' : 'success'}
            tooltip="Número de clientes conectados. Redis suporta até 10.000 por padrão. Clientes bloqueados indicam operações aguardando (BLPOP, BRPOP, etc). Clique para ver histórico."
            loading={isLoading}
            metricName="connectedClients"
            onClick={() => handleMetricClick('connectedClients')}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Evicted Keys"
            value={metrics ? formatNumber(metrics.eviction.evictedKeys) : '-'}
            subtitle={metrics && metrics.eviction?.evictedPerSec != null ? `${metrics.eviction.evictedPerSec.toFixed(1)}/s` : '-'}
            icon={<DeleteIcon />}
            color={metrics?.eviction?.evictedPerSec && metrics.eviction.evictedPerSec > 100 ? 'warning' : 'info'}
            tooltip="Chaves removidas por política de eviction. Taxa alta (>100/s) indica memória insuficiente. Aceitável para workloads de cache. Clique para ver histórico."
            loading={isLoading}
            metricName="evictedPerSec"
            onClick={() => handleMetricClick('evictedPerSec')}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Expired Keys"
            value={metrics ? formatNumber(metrics.expiration.expiredKeys) : '-'}
            subtitle={metrics && metrics.expiration?.expiredPerSec != null ? `${metrics.expiration.expiredPerSec.toFixed(1)}/s` : '-'}
            icon={<AccessTimeIcon />}
            color="info"
            tooltip="Chaves expiradas por TTL. Expiração natural de chaves com time-to-live configurado. Use TTL para controlar crescimento do dataset. Clique para ver histórico."
            loading={isLoading}
            metricName="expiredPerSec"
            onClick={() => handleMetricClick('expiredPerSec')}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Métricas de Atividade (Tier 3) */}
      <Typography variant="h6" fontWeight={600} mb={2} color="info.main">
        Atividade & Recursos
      </Typography>
      <Grid container spacing={2} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Network I/O"
            value={metrics && metrics.network?.inputKbps != null ? `${metrics.network.inputKbps.toFixed(1)} KB/s` : '-'}
            subtitle={metrics && metrics.network?.outputKbps != null ? `↑ ${metrics.network.outputKbps.toFixed(1)} KB/s` : '-'}
            icon={<NetworkIcon />}
            color="info"
            tooltip="Taxa de entrada/saída de rede. Monitore para identificar picos de tráfego ou possíveis gargalos de rede. Clique para ver histórico."
            loading={isLoading}
            metricName="networkInputKbps"
            onClick={() => handleMetricClick('networkInputKbps')}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Keys"
            value={metrics ? formatNumber(metrics.keyspace.totalKeys) : '-'}
            subtitle={metrics ? `${formatNumber(metrics.keyspace.totalExpires)} com TTL` : '-'}
            icon={<StorageIcon />}
            color="info"
            tooltip="Total de chaves no Redis. Chaves com TTL expiram automaticamente. Use TTL para gerenciar crescimento do dataset."
            loading={isLoading}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Uptime"
            value={metrics ? formatUptime(metrics.server.uptime) : '-'}
            subtitle={metrics ? `${metrics.server.uptimeDays} dias` : '-'}
            icon={<AccessTimeIcon />}
            color="info"
            tooltip="Tempo desde o último restart do Redis. Uptime alto é bom, mas fragmentação de memória pode exigir restart periódico."
            loading={isLoading}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Replication"
            value={metrics ? metrics.replication.role : '-'}
            subtitle={
              metrics?.replication?.connectedSlaves
                ? `${metrics.replication.connectedSlaves} replica${metrics.replication.connectedSlaves > 1 ? 's' : ''}`
                : 'Standalone'
            }
            icon={<SyncIcon />}
            color={metrics?.replication?.syncPartialErr ? 'warning' : 'info'}
            tooltip="Status de replicação. Master/Slave ou Standalone. Erros de sync parcial indicam problemas de replicação."
            loading={isLoading}
          />
        </Grid>
      </Grid>

      {/* Modal de Gráfico */}
      <MetricChartModal open={!!selectedMetric} onClose={handleCloseModal} metricName={selectedMetric} />
    </Box>
  );
};

export default Dashboard;
