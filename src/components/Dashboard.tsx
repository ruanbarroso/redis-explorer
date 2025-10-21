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
  Paper,
  Chip,
  IconButton,
  Alert,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Memory as MemoryIcon,
  Speed as SpeedIcon,
  Storage as StorageIcon,
  Timeline as TimelineIcon,
  AccessTime as UptimeIcon,
  NetworkCheck as NetworkIcon,
  Security as SecurityIcon,
  DataUsage as DataIcon,
  Sync as SyncIcon,
  Block as BlockIcon,
  Notifications as PubSubIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { fetchStats, fetchInfo, fetchSlowLog } from '@/store/slices/statsSlice';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

const Dashboard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { stats, info, slowLog, isLoading, error } = useSelector(
    (state: RootState) => state.stats
  );
  const { activeConnection } = useSelector((state: RootState) => state.connection);

  const [metricsHistory, setMetricsHistory] = useState<any[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (activeConnection) {
      handleRefresh();
      
      if (autoRefresh) {
        const interval = setInterval(() => {
          handleRefresh();
        }, 5000);
        
        return () => clearInterval(interval);
      }
    }
  }, [activeConnection, autoRefresh]);

  useEffect(() => {
    if (stats) {
      setMetricsHistory(prev => {
        const newEntry = {
          timestamp: Date.now(),
          time: format(new Date(), 'HH:mm:ss'),
          memory: stats.usedMemory,
          ops: stats.instantaneousOpsPerSec,
          clients: stats.connectedClients,
        };
        
        const updated = [...prev, newEntry];
        return updated.slice(-20); // Keep last 20 entries
      });
    }
  }, [stats]);

  const handleRefresh = () => {
    dispatch(fetchStats());
    dispatch(fetchInfo());
    dispatch(fetchSlowLog(10));
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
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <Typography variant="h6" color="text.secondary">
          No active Redis connection
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
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h5">Redis Dashboard</Typography>
        <Box display="flex" gap={1} alignItems="center">
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
                <Typography variant="h6">Total Commands</Typography>
              </Box>
              <Typography variant="h4" color="warning">
                {formatNumber(stats?.totalCommandsProcessed || 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Since startup
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
                <Typography variant="h6">Network I/O</Typography>
              </Box>
              <Typography variant="body1" color="success">
                ↓ {formatNetworkBytes(stats?.totalNetInputBytes || 0)}
              </Typography>
              <Typography variant="body1" color="error">
                ↑ {formatNetworkBytes(stats?.totalNetOutputBytes || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', minHeight: 140 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 2 }}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <BlockIcon color="warning" />
                <Typography variant="h6">Blocked Clients</Typography>
              </Box>
              <Typography variant="h4" color="warning">
                {formatNumber(stats?.blockedClients || 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Waiting for data
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Chart */}
        <Grid item xs={12} lg={8}>
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

        {/* Hit Rate */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" gutterBottom>
                Cache Hit Rate
              </Typography>
              <Box flex={1} display="flex" flexDirection="column" justifyContent="center">
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Hits</Typography>
                  <Typography variant="body2">
                    {formatNumber(stats?.keyspaceHits || 0)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Misses</Typography>
                  <Typography variant="body2">
                    {formatNumber(stats?.keyspaceMisses || 0)}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={
                    stats?.keyspaceHits && stats?.keyspaceMisses
                      ? (stats.keyspaceHits / (stats.keyspaceHits + stats.keyspaceMisses)) * 100
                      : 0
                  }
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="h4" color="primary" mt={1}>
                  {stats?.keyspaceHits && stats?.keyspaceMisses
                    ? ((stats.keyspaceHits / (stats.keyspaceHits + stats.keyspaceMisses)) * 100).toFixed(1)
                    : '0'}%
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" mb={1}>
                Evicted Keys: {formatNumber(stats?.evictedKeys || 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Expired Keys: {formatNumber(stats?.expiredKeys || 0)}
              </Typography>
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
                  <Typography variant="body2" color={
                    (stats?.memoryFragmentationRatio || 1) > 1.5 ? 'error' : 
                    (stats?.memoryFragmentationRatio || 1) > 1.2 ? 'warning' : 'success'
                  }>
                    {(stats?.memoryFragmentationRatio || 1).toFixed(2)}
                  </Typography>
                </Box>
                {stats?.maxMemory && stats.maxMemory > 0 && (
                  <LinearProgress
                    variant="determinate"
                    value={(stats.usedMemory / stats.maxMemory) * 100}
                    sx={{ height: 8, borderRadius: 4 }}
                    color={
                      (stats.usedMemory / stats.maxMemory) > 0.9 ? 'error' :
                      (stats.usedMemory / stats.maxMemory) > 0.7 ? 'warning' : 'primary'
                    }
                  />
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
      </Grid>
    </Box>
  );
};

export default Dashboard;
