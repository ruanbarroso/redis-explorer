'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Alert,
  Paper,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Memory as MemoryIcon,
  Speed as SpeedIcon,
  Storage as StorageIcon,
  Timeline as TimelineIcon,
  AccessTime as UptimeIcon,
  DataUsage as DataIcon,
  Wifi as NetworkIcon,
  Block as BlockIcon,
  Computer as ServerIcon,
  Code as CommandIcon,
  Save as PersistenceIcon,
  Psychology as CpuIcon,
  AccountTree as ReplicationIcon,
  Folder as DatabaseIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { fetchStats, fetchInfo, fetchSlowLog } from '@/store/slices/statsSlice';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useAlerts } from '@/hooks/useAlerts';

const Dashboard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { stats, info, slowLog, isLoading, error, derivedCpuPercent, lastUpdated, evictionsPerSec, expiredPerSec, rejectedConnPerSec, clientRttP50, clientRttP95 } = useSelector(
    (state: RootState) => state.stats
  );
  const { activeConnection } = useSelector((state: RootState) => state.connection);

  const [metricsHistory, setMetricsHistory] = useState<any[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [keyTypesData, setKeyTypesData] = useState<{type: string; count: number}[]>([]);
  const router = useRouter();
  const { alerts, hasAlerts, criticalCount, warningCount } = useAlerts(stats);

  useEffect(() => {
    if (activeConnection?.connected) {
      // Initial load with a small delay to ensure connection is ready
      const timeoutId = setTimeout(() => {
        handleRefresh();
      }, 100);
      
      if (autoRefresh) {
        const interval = setInterval(() => {
          // Only refresh if still connected
          if (activeConnection?.connected) {
            handleRefresh();
          }
        }, 5000);
        
        return () => {
          clearTimeout(timeoutId);
          clearInterval(interval);
        };
      }
      
      return () => clearTimeout(timeoutId);
    }
  }, [activeConnection?.connected, autoRefresh]);

  useEffect(() => {
    if (error === 'REDIRECT_TO_CONNECTIONS') {
      router.push('/?tab=connections');
    }
  }, [error, router]);

  useEffect(() => {
    if (stats) {
      setMetricsHistory(prev => {
        const newEntry = {
          timestamp: Date.now(),
          time: format(new Date(), 'HH:mm:ss'),
          memory: stats.usedMemory,
          ops: stats.instantaneousOpsPerSec,
          clients: stats.connectedClients,
          evictPerSec: evictionsPerSec || 0,
          rejConnPerSec: rejectedConnPerSec || 0,
        };
        
        const updated = [...prev, newEntry];
        return updated.slice(-20); // Keep last 20 entries
      });
    }
  }, [stats]);
  
  useEffect(() => {
    const fetchKeyTypes = async () => {
      try {
        const response = await fetch('/api/redis/keys?pattern=*&count=200', {
          credentials: 'include',
        });
        if (response.ok) {
          const result = await response.json();
          const keys = result.keys || [];
          
          const typeCounts: Record<string, number> = {};
          keys.forEach((key: any) => {
            const type = key.type || 'unknown';
            typeCounts[type] = (typeCounts[type] || 0) + 1;
          });
          
          const data = Object.entries(typeCounts)
            .map(([type, count]) => ({ type, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6);
          
          const othersCount = Object.values(typeCounts).reduce((sum, count) => sum + count, 0) - 
                             data.reduce((sum, item) => sum + item.count, 0);
          
          if (othersCount > 0) {
            data.push({ type: 'others', count: othersCount });
          }
          
          setKeyTypesData(data);
        }
      } catch (error) {
        console.error('Error fetching key types:', error);
      }
    };
    
    if (activeConnection?.connected && autoRefresh) {
      fetchKeyTypes();
      const interval = setInterval(fetchKeyTypes, 30000);
      return () => clearInterval(interval);
    }
  }, [activeConnection?.connected, autoRefresh]);

  const handleRefresh = async () => {
    if (!activeConnection?.connected) {
      return; // Silently return if no active connection
    }

    try {
      // Dispatch actions with error handling
      const results = await Promise.allSettled([
        dispatch(fetchStats()),
        dispatch(fetchInfo()),
        dispatch(fetchSlowLog(10))
      ]);

      // Only log errors if they're not connection-related (502, 503, etc.)
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const error = result.reason;
          // Only log if it's not a network/connection error
          if (!error?.message?.includes('502') && 
              !error?.message?.includes('503') && 
              !error?.message?.includes('Failed to fetch')) {
            const actions = ['fetchStats', 'fetchInfo', 'fetchSlowLog'];
            console.error(`Error in ${actions[index]}:`, error);
          }
        }
      });
    } catch (error) {
      // Only log unexpected errors
      if (!error?.toString().includes('502') && 
          !error?.toString().includes('Failed to fetch')) {
        console.error('Unexpected error during dashboard refresh:', error);
      }
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatUptime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0m';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const formatNetworkBytes = (bytes: number) => {
    if (!bytes || isNaN(bytes)) return '0 B';
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  if (!activeConnection) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100%" gap={2}>
        <Typography variant="h6" color="text.secondary">
          No active Redis connection
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Please connect to a Redis server from the Connections tab to view the dashboard.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: '100%', 
      overflow: 'auto', 
      display: 'flex', 
      flexDirection: 'column',
      gap: 2
    }}>
      {error && error !== 'REDIRECT_TO_CONNECTIONS' && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {hasAlerts && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Critical Issues Detected
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2 }}>
              {alerts.slice(0, 7).map((alert, index) => (
                <li key={index}>
                  <Typography variant="body2" color="text.secondary">
                    {alert.message}
                  </Typography>
                </li>
              ))}
              {alerts.length > 7 && (
                <Typography variant="body2" color="text.secondary">
                  ... and {alerts.length - 7} more
                </Typography>
              )}
            </Box>
          </Box>
        </Alert>
      )}

      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h5">Redis Dashboard</Typography>
          {hasAlerts && (
            <Box display="flex" gap={1}>
              {criticalCount > 0 && (
                <Chip
                  label={`${criticalCount} Critical`}
                  color="error"
                  size="small"
                  icon={<BlockIcon />}
                />
              )}
              {warningCount > 0 && (
                <Chip
                  label={`${warningCount} Warning`}
                  color="warning"
                  size="small"
                />
              )}
            </Box>
          )}
        </Box>
        <Box display="flex" gap={1} alignItems="center">
          {lastUpdated && (
            <Typography variant="caption" color="text.secondary">
              Last updated {lastUpdated}
            </Typography>
          )}
          <Chip
            label={autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            color={autoRefresh ? 'success' : 'default'}
            onClick={() => setAutoRefresh(!autoRefresh)}
            clickable
          />
          <IconButton onClick={handleRefresh} disabled={isLoading}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Key Metrics */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', minHeight: 140 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 2 }}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <MemoryIcon color="primary" />
                <Typography variant="h6">Memory Usage</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {stats?.usedMemoryHuman || '0B'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatNumber(stats?.usedMemory || 0)} bytes
              </Typography>
              {stats?.maxMemory && stats.maxMemory > 0 && (
                <Box mt={1}>
                  {(() => {
                    const perc = (stats.usedMemory / stats.maxMemory) * 100;
                    const color = perc >= 90 ? 'error' : perc >= 80 ? 'warning' : 'success';
                    return <Chip label={`${perc.toFixed(0)}%`} color={color} size="small" />;
                  })()}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', minHeight: 140 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 2 }}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <SpeedIcon color="secondary" />
                <Typography variant="h6">Operations/sec</Typography>
              </Box>
              <Typography variant="h4" color="secondary">
                {formatNumber(stats?.instantaneousOpsPerSec || 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Current throughput
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', minHeight: 140 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 2 }}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <StorageIcon color="success" />
                <Typography variant="h6">Connected Clients</Typography>
              </Box>
              <Typography variant="h4" color="success">
                {formatNumber(stats?.connectedClients || 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active connections
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', minHeight: 140 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 2 }}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <TimelineIcon color="warning" />
                <Typography variant="h6">Event Latency</Typography>
              </Box>
              <Typography variant="h4" color="warning">
                {clientRttP50 !== null ? `${clientRttP50.toFixed(2)}ms` : 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Client RTT P50: {clientRttP50 !== null ? `${clientRttP50.toFixed(2)}ms` : 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Client RTT P95: {clientRttP95 !== null ? `${clientRttP95.toFixed(2)}ms` : 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Server Info */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', minHeight: 140 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 2 }}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <UptimeIcon color="info" />
                <Typography variant="h6">Uptime</Typography>
              </Box>
              <Typography variant="h4" color="info">
                {stats?.uptimeInDays || 0}d
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatUptime(stats?.uptimeInSeconds || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', minHeight: 140 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 2 }}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <DataIcon color="primary" />
                <Typography variant="h6">Total Keys</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {formatNumber(stats?.totalKeys || 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatNumber(stats?.totalExpires || 0)} with TTL
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', minHeight: 140 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 2 }}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <NetworkIcon color="success" />
                <Typography variant="h6">Network Rate</Typography>
              </Box>
              <Typography variant="body1" color="success">
                ↓ {stats?.instantaneousInputKbps ? `${stats.instantaneousInputKbps.toFixed(1)} KB/s` : '0.0 KB/s'}
              </Typography>
              <Typography variant="body1" color="error">
                ↑ {stats?.instantaneousOutputKbps ? `${stats.instantaneousOutputKbps.toFixed(1)} KB/s` : '0.0 KB/s'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', minHeight: 140 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 2 }}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <CpuIcon color="warning" />
                <Typography variant="h6">CPU Usage</Typography>
              </Box>
              <Typography variant="h4" color="warning.main">
                {derivedCpuPercent !== null ? `${derivedCpuPercent.toFixed(2)}%` : 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Real-time process usage
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Chart */}
        <Grid item xs={12}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" gutterBottom>
                Performance Metrics
              </Typography>
              <Box flex={1} minHeight={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metricsHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="ops"
                      stroke="#f50057"
                      name="Ops/sec"
                      strokeWidth={2}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="clients"
                      stroke="#2196f3"
                      name="Clients"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Key Types Distribution */}
        <Grid item xs={12}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Key Types Distribution
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Sample of up to 200 keys
              </Typography>
              {keyTypesData.length > 0 ? (
                <Box height={250}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={keyTypesData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" style={{ fontSize: '12px' }} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#2196f3" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box display="flex" alignItems="center" justifyContent="center" height={250}>
                  <Typography variant="body2" color="text.secondary">
                    No key type data available
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Infra Signals */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <TrendingUpIcon color="warning" />
                <Typography variant="h6">Infra Signals</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                No critical infrastructure signals detected
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Cache Performance */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" gutterBottom>
                Cache Performance
              </Typography>
              <Box flex={1} display="flex" flexDirection="column" justifyContent="center">
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2">Hits</Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2">
                      {formatNumber(stats?.keyspaceHits || 0)}
                    </Typography>
                    <Chip label={`${stats?.keyspaceHitRate ? stats.keyspaceHitRate.toFixed(1) : '0.0'}%`} color="success" size="small" />
                  </Box>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2">Misses</Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2">
                      {formatNumber(stats?.keyspaceMisses || 0)}
                    </Typography>
                    <Chip label={`${stats?.keyspaceMissRate ? stats.keyspaceMissRate.toFixed(1) : '0.0'}%`} color="error" size="small" />
                  </Box>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={
                    stats?.keyspaceHits && stats?.keyspaceMisses
                      ? (stats.keyspaceHits / (stats.keyspaceHits + stats.keyspaceMisses)) * 100
                      : 0
                  }
                  sx={{ height: 8, borderRadius: 4 }}
                  color="error"
                />
                <Typography variant="h4" color="error.main" mt={1}>
                  {stats?.keyspaceHits && stats?.keyspaceMisses
                    ? ((stats.keyspaceHits / (stats.keyspaceHits + stats.keyspaceMisses)) * 100).toFixed(1)
                    : '0'}%
                </Typography>
              </Box>
              
              <Box mt={2}>
                <Chip label={`Evicted Keys: ${formatNumber(stats?.evictedKeys || 0)}`} color="success" size="small" sx={{ mr: 1 }} />
                <Chip label={`Expired Keys: ${formatNumber(stats?.expiredKeys || 0)}`} color="warning" size="small" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Slow Log */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Slow Log (Last 10 Commands)
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Duration (μs)</TableCell>
                      <TableCell>Command</TableCell>
                      <TableCell>Client</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {slowLog.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography color="text.secondary">
                            No slow commands recorded
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      slowLog.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>{entry.id}</TableCell>
                          <TableCell>
                            {format(new Date(entry.timestamp * 1000), 'HH:mm:ss')}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={formatNumber(entry.duration)}
                              color={entry.duration > 10000 ? 'error' : 'warning'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'monospace' }}>
                            {entry.command.join(' ')}
                          </TableCell>
                          <TableCell>
                            {entry.clientAddress || 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Memory Details */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', minHeight: 280 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Memory Details
              </Typography>
              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Used Memory</Typography>
                  <Typography variant="body2">{stats?.usedMemoryHuman}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Max Memory</Typography>
                  <Typography variant="body2">{stats?.maxMemoryHuman || 'Unlimited'}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Fragmentation Ratio</Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2">
                      {(stats?.memoryFragmentationRatio || 1).toFixed(2)}
                    </Typography>
                    {(stats?.memoryFragmentationRatio || 1) > 1.5 && (
                      <Chip label="High fragmentation" color="error" size="small" />
                    )}
                  </Box>
                </Box>
                {stats?.maxMemory && stats.maxMemory > 0 && (
                  <Box mt={1}>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min((stats.usedMemory / stats.maxMemory) * 100, 100)}
                      sx={{ height: 8, borderRadius: 4 }}
                      color={(() => {
                        const perc = (stats.usedMemory / stats.maxMemory) * 100;
                        return perc >= 90 ? 'error' : perc >= 80 ? 'warning' : 'primary';
                      })()}
                    />
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Replication & Sync */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', minHeight: 280 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Replication & Sync
              </Typography>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Full Syncs</Typography>
                <Typography variant="body2">{formatNumber(stats?.syncFull || 0)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Partial Sync OK</Typography>
                <Typography variant="body2" color="success">{formatNumber(stats?.syncPartialOk || 0)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Partial Sync Errors</Typography>
                <Typography variant="body2" color="error">{formatNumber(stats?.syncPartialErr || 0)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Rejected Connections</Typography>
                <Typography variant="body2" color={stats?.rejectedConnections ? 'error' : 'inherit'}>
                  {formatNumber(stats?.rejectedConnections || 0)}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Latest Fork Time</Typography>
                <Typography variant="body2">
                  {stats?.latestForkUsec ? `${(stats.latestForkUsec / 1000).toFixed(1)}ms` : 'N/A'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Pub/Sub & Client Info */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', minHeight: 280 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Pub/Sub & Clients
              </Typography>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Pub/Sub Channels</Typography>
                <Typography variant="body2">{formatNumber(stats?.pubsubChannels || 0)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Pub/Sub Patterns</Typography>
                <Typography variant="body2">{formatNumber(stats?.pubsubPatterns || 0)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Connected Clients</Typography>
                <Typography variant="body2">{formatNumber(stats?.connectedClients || 0)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Blocked Clients</Typography>
                <Typography variant="body2" color={stats?.blockedClients ? 'warning' : 'inherit'}>
                  {formatNumber(stats?.blockedClients || 0)}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Tracking Clients</Typography>
                <Typography variant="body2">{formatNumber(stats?.trackingClients || 0)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Rejected Connections</Typography>
                <Typography variant="body2" color={stats?.rejectedConnections ? 'error' : 'inherit'}>
                  {formatNumber(stats?.rejectedConnections || 0)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Keyspace Summary */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', minHeight: 280 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Keyspace Summary
              </Typography>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Total Keys</Typography>
                <Typography variant="body2">{formatNumber(stats?.totalKeys || 0)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Keys with TTL</Typography>
                <Typography variant="body2">{formatNumber(stats?.totalExpires || 0)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">TTL Percentage</Typography>
                <Typography variant="body2">
                  {stats?.totalKeys ? ((stats.totalExpires / stats.totalKeys) * 100).toFixed(1) : '0'}%
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Expired Keys</Typography>
                <Typography variant="body2">{formatNumber(stats?.expiredKeys || 0)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Evicted Keys</Typography>
                <Typography variant="body2" color={stats?.evictedKeys ? 'warning' : 'inherit'}>
                  {formatNumber(stats?.evictedKeys || 0)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Server Information */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', minHeight: 280 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
              <Typography variant="h6" gutterBottom>
                <Box display="flex" alignItems="center" gap={1}>
                  <ServerIcon color="primary" />
                  Server Information
                </Box>
              </Typography>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Redis Version</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {stats?.redisVersion || info?.server?.redis_version || 'N/A'}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Mode</Typography>
                <Typography variant="body2">
                  {stats?.redisMode || info?.server?.redis_mode || 'standalone'}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Operating System</Typography>
                <Typography variant="body2">
                  {stats?.os || info?.server?.os || 'N/A'}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Architecture</Typography>
                <Typography variant="body2">
                  {stats?.archBits ? `${stats.archBits} bits` : 
                   info?.server?.arch_bits ? `${info.server.arch_bits} bits` : 'N/A'}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Process ID</Typography>
                <Typography variant="body2" fontFamily="monospace">
                  {stats?.processId || info?.server?.process_id || 'N/A'}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">TCP Port</Typography>
                <Typography variant="body2" fontFamily="monospace">
                  {stats?.tcpPort || info?.server?.tcp_port || 'N/A'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* CPU Usage */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', minHeight: 280 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
              <Typography variant="h6" gutterBottom>
                <Box display="flex" alignItems="center" gap={1}>
                  <CpuIcon color="secondary" />
                  CPU Usage
                </Box>
              </Typography>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">System CPU Time</Typography>
                <Typography variant="body2" color="secondary">
                  {info?.cpu?.used_cpu_sys ? `${parseFloat(info.cpu.used_cpu_sys).toFixed(2)}s` : 
                   stats?.usedCpuSys ? `${stats.usedCpuSys.toFixed(2)}s` : '0s'}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">User CPU Time</Typography>
                <Typography variant="body2" color="primary">
                  {info?.cpu?.used_cpu_user ? `${parseFloat(info.cpu.used_cpu_user).toFixed(2)}s` : 
                   stats?.usedCpuUser ? `${stats.usedCpuUser.toFixed(2)}s` : '0s'}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">CPU Percentage (avg since start)</Typography>
                <Typography variant="body2" color="warning.main" fontWeight="medium">
                  {info?.cpu?.used_cpu_sys && info?.server?.uptime_in_seconds ? 
                    `${Math.min((parseFloat(info.cpu.used_cpu_sys) / parseInt(info.server.uptime_in_seconds)) * 100, 100).toFixed(2)}%` :
                    'N/A (uptime required)'}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Server Uptime</Typography>
                <Typography variant="body2" color="text.secondary">
                  {info?.server?.uptime_in_seconds ? 
                    `${parseInt(info.server.uptime_in_seconds).toLocaleString()}s (${Math.floor(parseInt(info.server.uptime_in_seconds) / 86400)}d)` :
                    'N/A'}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">System CPU (Children)</Typography>
                <Typography variant="body2">
                  {stats?.usedCpuSysChildren ? `${stats.usedCpuSysChildren.toFixed(2)}s` : '0s'}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">User CPU (Children)</Typography>
                <Typography variant="body2">
                  {stats?.usedCpuUserChildren ? `${stats.usedCpuUserChildren.toFixed(2)}s` : '0s'}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Total CPU Time</Typography>
                <Typography variant="body2" fontWeight="medium" color="info.main">
                  {info?.cpu?.used_cpu_sys && info?.cpu?.used_cpu_user 
                    ? `${(parseFloat(info.cpu.used_cpu_sys) + parseFloat(info.cpu.used_cpu_user)).toFixed(2)}s` 
                    : 'N/A'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Command Statistics */}
        <Grid item xs={12}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" gutterBottom>
                <Box display="flex" alignItems="center" gap={1}>
                  <CommandIcon color="secondary" />
                  Top Commands
                </Box>
              </Typography>
              <TableContainer sx={{ flex: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Command</TableCell>
                      <TableCell align="right">Calls</TableCell>
                      <TableCell align="right">% Total</TableCell>
                      <TableCell align="right">Avg Time (μs)</TableCell>
                      <TableCell align="right">Total Time</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats?.commandStats?.length ? (
                      stats.commandStats.map((cmd) => (
                        <TableRow key={cmd.command}>
                          <TableCell sx={{ fontFamily: 'monospace', fontWeight: 'medium' }}>
                            {cmd.command}
                          </TableCell>
                          <TableCell align="right">{formatNumber(cmd.calls)}</TableCell>
                          <TableCell align="right">
                            <Chip 
                              label={`${cmd.percentage.toFixed(1)}%`}
                              color={cmd.percentage > 20 ? 'primary' : cmd.percentage > 5 ? 'secondary' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">{cmd.usecPerCall.toFixed(1)}</TableCell>
                          <TableCell align="right">{formatNumber(cmd.usec)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography color="text.secondary">
                            No command statistics available
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Memory Policy & Status */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', minHeight: 280 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
              <Typography variant="h6" gutterBottom>
                <Box display="flex" alignItems="center" gap={1}>
                  <MemoryIcon color="warning" />
                  Memory Policy & Status
                </Box>
              </Typography>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Eviction Policy</Typography>
                <Chip 
                  label={stats?.maxmemoryPolicy || 'noeviction'}
                  color="error"
                  size="small"
                />
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Evicted Keys</Typography>
                <Typography variant="body2">
                  {formatNumber(stats?.evictedKeys || 0)}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Expired Keys</Typography>
                <Typography variant="body2">
                  {formatNumber(stats?.expiredKeys || 0)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Persistence Status */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', minHeight: 280 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
              <Typography variant="h6" gutterBottom>
                <Box display="flex" alignItems="center" gap={1}>
                  <PersistenceIcon color="success" />
                  Persistence Status
                </Box>
              </Typography>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">RDB Last Save</Typography>
                <Typography variant="body2">
                  {stats?.rdbLastSaveTime 
                    ? format(new Date(stats.rdbLastSaveTime * 1000), 'HH:mm:ss')
                    : 'Never'}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Changes Since Save</Typography>
                <Typography variant="body2" color={stats?.rdbChangesSinceLastSave ? 'warning' : 'inherit'}>
                  {formatNumber(stats?.rdbChangesSinceLastSave || 0)}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Last Bgsave Status</Typography>
                <Chip 
                  label={stats?.rdbLastBgsaveStatus || 'Unknown'}
                  color={stats?.rdbLastBgsaveStatus === 'ok' ? 'success' : 'error'}
                  size="small"
                />
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">AOF Enabled</Typography>
                <Chip 
                  label={stats?.aofEnabled ? 'Yes' : 'No'}
                  color={stats?.aofEnabled ? 'success' : 'default'}
                  size="small"
                />
              </Box>
              {stats?.aofEnabled && (
                <>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">AOF Current Size</Typography>
                    <Typography variant="body2">{formatBytes(stats?.aofCurrentSize || 0)}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">AOF Rewrite</Typography>
                    <Chip 
                      label={stats?.aofRewriteInProgress ? 'In Progress' : 'Idle'}
                      color={stats?.aofRewriteInProgress ? 'warning' : 'success'}
                      size="small"
                    />
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Database Breakdown */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" gutterBottom>
                <Box display="flex" alignItems="center" gap={1}>
                  <DatabaseIcon color="primary" />
                  Database Breakdown
                </Box>
              </Typography>
              {stats?.databases?.length ? (
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                  {stats.databases.map((db) => (
                    <Box key={db.db} sx={{ mb: 2, p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="subtitle2" fontWeight="medium" mb={1}>
                        Database {db.db}
                      </Typography>
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="body2">Keys</Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {formatNumber(db.keys)}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="body2">With TTL</Typography>
                        <Typography variant="body2">
                          {formatNumber(db.expires)} ({db.keys > 0 ? ((db.expires / db.keys) * 100).toFixed(1) : '0'}%)
                        </Typography>
                      </Box>
                      {db.avgTtl > 0 && (
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2">Avg TTL</Typography>
                          <Typography variant="body2">
                            {Math.round(db.avgTtl / 1000)}s
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary" textAlign="center">
                    No database information available
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
