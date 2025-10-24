'use client';

import { useEffect, useState } from 'react';
import { Box, Grid, Typography, IconButton, Chip, Divider } from '@mui/material';
import {
  Refresh as RefreshIcon,
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
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { MetricCard } from './MetricCard';
import { AlertBanner } from './AlertBanner';
import { RedisMetrics } from '@/types/metrics';
import { useRouter } from 'next/navigation';
import { disconnectFromRedis } from '@/store/slices/connectionSlice';
import { useConnectionErrorHandler } from '@/hooks/useConnectionErrorHandler';
import ErrorModal from './ErrorModal';

const Dashboard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { activeConnection } = useSelector((state: RootState) => state.connection);
  const [metrics, setMetrics] = useState<RedisMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { handleConnectionError, handleFetchError, errorModal, closeErrorModal, isReconnecting } = useConnectionErrorHandler();

  const fetchMetrics = async (): Promise<boolean> => {
    if (!activeConnection?.connected) {
      setIsLoading(false);
      return false;
    }

    try {
      const response = await fetch('/api/redis/metrics', {
        credentials: 'include',
      });

      if (!response.ok) {
        // Erro HTTP 503 - Redis não conectado ou serviço indisponível
        if (response.status === 503) {
          console.error('Redis connection unavailable (503), attempting reconnection...');
          await handleConnectionError(true); // Tentar reconectar
          return false;
        }
        throw new Error(`HTTP ${response.status}: Failed to fetch metrics`);
      }

      const data = await response.json();
      
      // Verificar se há erro na resposta
      if (data.error) {
        console.error('Redis error in response:', data.error);
        await handleConnectionError(true); // Tentar reconectar
        return false;
      }

      setMetrics(data.metrics);
      setError(null);
      return true; // Sucesso
    } catch (err) {
      console.error('Error fetching metrics:', err);
      
      // Erros de rede (fetch failed, timeout, etc)
      if (err instanceof TypeError && err.message.includes('fetch')) {
        console.error('Network error, attempting reconnection...');
        await handleConnectionError(true); // Tentar reconectar
        return false;
      }
      
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeConnection?.connected) {
      // Reset state quando trocar de conexão
      setIsLoading(true);
      setMetrics(null);
      setError(null);
      
      let isMounted = true;

      const fetchLoop = async () => {
        // Fazer primeira chamada sempre
        const success = await fetchMetrics();
        
        // Se falhou na primeira tentativa
        if (!success) {
          // Se está reconectando, aguardar 2 segundos e tentar novamente
          if (isReconnecting) {
            console.log('⏳ Aguardando reconexão...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            const retrySuccess = await fetchMetrics();
            if (!retrySuccess) {
              console.error('❌ Falha ao buscar métricas após reconexão, desligando auto-refresh');
              setAutoRefresh(false);
              return;
            }
          } else {
            console.error('❌ Falha ao buscar métricas, desligando auto-refresh');
            setAutoRefresh(false);
            return;
          }
        }
        
        // Se auto-refresh está desligado, parar aqui
        if (!autoRefresh) {
          return;
        }
        
        // Loop de auto-refresh
        while (isMounted && autoRefresh) {
          // Aguardar 2 segundos antes da próxima chamada
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Se não está mais montado ou auto-refresh foi desligado, parar
          if (!isMounted || !autoRefresh) {
            break;
          }
          
          const success = await fetchMetrics();
          
          // Se falhou, desligar auto-refresh
          if (!success) {
            console.error('❌ Falha ao buscar métricas, desligando auto-refresh');
            setAutoRefresh(false);
            break;
          }
        }
      };

      // Inicia o loop
      fetchLoop();

      // Cleanup: para o loop quando desmontar ou mudar dependências
      return () => {
        isMounted = false;
      };
    } else {
      // Sem conexão ativa, limpar estado
      setIsLoading(false);
      setMetrics(null);
      setError(null);
    }
  }, [activeConnection?.id, autoRefresh, isReconnecting]);

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

  return (
    <Box sx={{ height: '100%', overflow: 'auto', p: 3 }}>
      {/* Indicador de Reconexão */}
      {isReconnecting && (
        <AlertBanner
          severity="info"
          message="Reconectando ao Redis..."
          sx={{ mb: 2 }}
        />
      )}
      
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Redis Dashboard
          </Typography>
          {metrics && (
            <Typography variant="caption" color="text.secondary">
              Última atualização: {new Date(metrics.timestamp).toLocaleTimeString()}
            </Typography>
          )}
        </Box>
        <Box display="flex" gap={1} alignItems="center">
          <Chip
            label={autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            color={autoRefresh ? 'success' : 'default'}
            onClick={() => setAutoRefresh(!autoRefresh)}
            clickable
            size="small"
          />
          <IconButton 
            onClick={fetchMetrics} 
            disabled={isLoading || autoRefresh} 
            size="small"
            title={autoRefresh ? 'Desative o auto-refresh para atualizar manualmente' : 'Atualizar métricas'}
          >
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Alert Banner */}
      {metrics && metrics.alerts.length > 0 && (
        <AlertBanner alerts={metrics.alerts} health={metrics.health} />
      )}

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
                : metrics.cacheHitRatio >= 80
                ? 'success'
                : metrics.cacheHitRatio >= 50
                ? 'warning'
                : 'error'
            }
            tooltip="Percentual de requisições atendidas pelo cache. Ideal: >80%. Crítico: <50%. Um valor baixo indica que o cache está pequeno ou há muitas evictions."
            loading={isLoading}
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
                : metrics.memoryUsage.percentage >= 80
                ? 'error'
                : metrics.memoryUsage.percentage >= 70
                ? 'warning'
                : 'success'
            }
            tooltip="Uso de memória atual. Warning: ≥70%. Critical: ≥80%. Para workloads non-caching, monitore de perto a partir de 80% para evitar OOM."
            loading={isLoading}
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
                : metrics.memoryFragmentation.ratio < 1.0
                ? 'error'
                : metrics.memoryFragmentation.ratio >= 1.5
                ? 'error'
                : metrics.memoryFragmentation.ratio >= 1.4
                ? 'warning'
                : 'success'
            }
            tooltip="Razão entre memória física (RSS) e memória usada. Ideal: 1.0-1.4. <1.0: Redis usando swap (crítico). >1.5: Fragmentação alta, considere restart."
            loading={isLoading}
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
                : metrics.cpu.percentage >= 80
                ? 'error'
                : metrics.cpu.percentage >= 65
                ? 'warning'
                : 'success'
            }
            tooltip="Uso de CPU do processo Redis. Warning: ≥65%. Critical: ≥80%. Redis é single-threaded, valores altos indicam comandos ineficientes ou alto throughput."
            loading={isLoading}
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
                : metrics.latency.p50 < 1
                ? 'success'
                : metrics.latency.p50 < 5
                ? 'warning'
                : 'error'
            }
            tooltip="Latência mediana (P50) das operações. Redis deve operar em sub-millisecond. Valores >1ms indicam possíveis problemas de performance."
            loading={isLoading}
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
                : metrics.latency.p95 >= 10
                ? 'error'
                : metrics.latency.p95 >= 5
                ? 'warning'
                : 'success'
            }
            tooltip="Latência P95 das operações. Warning: ≥5ms. Critical: ≥10ms. Valores altos indicam comandos lentos ou sobrecarga."
            loading={isLoading}
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
            tooltip="Número de operações por segundo. Indica o throughput atual do Redis. Monitore junto com CPU e latência para identificar gargalos."
            loading={isLoading}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Connected Clients"
            value={metrics ? formatNumber(metrics.connections.connected) : '-'}
            subtitle={metrics?.connections?.blocked ? `${metrics.connections.blocked} bloqueados` : 'Nenhum bloqueado'}
            icon={<PeopleIcon />}
            color={metrics?.connections?.blocked ? 'warning' : 'success'}
            tooltip="Número de clientes conectados. Redis suporta até 10.000 por padrão. Clientes bloqueados indicam operações aguardando (BLPOP, BRPOP, etc)."
            loading={isLoading}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Evicted Keys"
            value={metrics ? formatNumber(metrics.eviction.evictedKeys) : '-'}
            subtitle={metrics && metrics.eviction?.evictedPerSec != null ? `${metrics.eviction.evictedPerSec.toFixed(1)}/s` : '-'}
            icon={<DeleteIcon />}
            color={metrics?.eviction?.evictedPerSec && metrics.eviction.evictedPerSec > 100 ? 'warning' : 'info'}
            tooltip="Chaves removidas por política de eviction. Taxa alta (>100/s) indica memória insuficiente. Aceitável para workloads de cache."
            loading={isLoading}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Expired Keys"
            value={metrics ? formatNumber(metrics.expiration.expiredKeys) : '-'}
            subtitle={metrics && metrics.expiration?.expiredPerSec != null ? `${metrics.expiration.expiredPerSec.toFixed(1)}/s` : '-'}
            icon={<AccessTimeIcon />}
            color="info"
            tooltip="Chaves expiradas por TTL. Expiração natural de chaves com time-to-live configurado. Use TTL para controlar crescimento do dataset."
            loading={isLoading}
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
            tooltip="Taxa de entrada/saída de rede. Monitore para identificar picos de tráfego ou possíveis gargalos de rede."
            loading={isLoading}
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

      {/* Server Info */}
      {metrics && (
        <Box mt={4} p={2} bgcolor="background.paper" borderRadius={1}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Server Info
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Redis {metrics.server.version} • {metrics.server.mode} • {metrics.server.os} • PID: {metrics.server.processId}
          </Typography>
        </Box>
      )}

      {/* Error Modal */}
      <ErrorModal
        open={errorModal.open}
        message={errorModal.message}
        details={errorModal.details}
        onClose={closeErrorModal}
      />
    </Box>
  );
};

export default Dashboard;
