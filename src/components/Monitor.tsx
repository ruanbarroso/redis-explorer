'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  List,
  ListItem,
  ListItemText,
  Button,
  Chip,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

interface MonitorCommand {
  command: string;
  timestamp: number;
  source: string;
  database: string;
  id: string;
}

type MonitorState = 'idle' | 'monitoring' | 'viewing';

const Monitor = () => {
  const { activeConnection } = useSelector((state: RootState) => state.connection);
  const [state, setState] = useState<MonitorState>('idle');
  const [commands, setCommands] = useState<MonitorCommand[]>([]);
  const [commandCount, setCommandCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const eventSourceRef = useRef<EventSource | null>(null);

  const startMonitoring = () => {
    if (!activeConnection?.connected) return;

    setState('monitoring');
    setError(null);
    setCommandCount(0);
    setCommands([]);

    const eventSource = new EventSource('/api/redis/monitor');
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const newCommand: MonitorCommand = {
          command: data.command,
          timestamp: data.timestamp,
          source: data.source || 'unknown',
          database: data.database || '0',
          id: `${data.timestamp}-${Math.random()}`,
        };

        // Incrementar contador
        setCommandCount((prev) => prev + 1);
        
        // Armazenar comando
        setCommands((prev) => [...prev, newCommand]);
      } catch (err) {
        console.error('Error parsing monitor data:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('EventSource error:', err);
      setError('Connection to monitor lost');
      stopMonitoring();
    };
  };

  const stopMonitoring = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setState('viewing');
  };

  const reset = () => {
    setState('idle');
    setCommands([]);
    setCommandCount(0);
    setExpandedIds(new Set());
    setError(null);
  };

  // Resetar quando trocar de conexão
  useEffect(() => {
    // Se estiver monitorando ou visualizando, resetar ao trocar de conexão
    if (state !== 'idle') {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      reset();
    }
  }, [activeConnection?.id]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  const exportCommands = () => {
    const data = commands.map((cmd) => ({
      timestamp: new Date(cmd.timestamp).toISOString(),
      source: cmd.source,
      database: cmd.database,
      command: cmd.command,
    }));

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `redis-monitor-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  };

  if (!activeConnection?.connected) {
    return (
      <Box p={3}>
        <Alert severity="info">
          Please connect to a Redis server to use monitor.
        </Alert>
      </Box>
    );
  }

  // Estado: IDLE - Tela inicial
  if (state === 'idle') {
    return (
      <Box p={3}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          <strong>Warning:</strong> MONITOR is a debugging command that streams back every command processed by the Redis server. 
          It can reduce performance. Use it carefully in production environments.
        </Alert>

        <Alert severity="info" sx={{ mb: 3 }}>
          <strong>How to use:</strong>
          <br />
          1. Click "Start Monitoring" to begin capturing commands
          <br />
          2. The counter will show how many commands were captured
          <br />
          3. Click "Stop & View" to stop monitoring and see the captured commands
          <br />
          4. You can then export the data or reset to start over
        </Alert>

        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <Button
            variant="contained"
            color="success"
            size="large"
            startIcon={<PlayIcon />}
            onClick={startMonitoring}
          >
            Start Monitoring
          </Button>
        </Box>
      </Box>
    );
  }

  // Estado: MONITORING - Capturando comandos
  if (state === 'monitoring') {
    return (
      <Box p={3}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="400px" gap={4}>
          <Chip 
            label={`${commandCount} commands captured`} 
            color="success"
            size="large"
            sx={{ fontSize: '1.5rem', padding: '24px 16px' }}
          />
          
          <Button
            variant="contained"
            color="error"
            size="large"
            startIcon={<StopIcon />}
            onClick={stopMonitoring}
          >
            Stop & View Results
          </Button>
        </Box>
      </Box>
    );
  }

  // Estado: VIEWING - Visualizando comandos capturados
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box p={2} display="flex" justifyContent="space-between" alignItems="center" borderBottom={1} borderColor="divider">
        <Typography variant="h6">
          Captured Commands: {commands.length}
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={exportCommands}
            disabled={commands.length === 0}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={reset}
          >
            Reset
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
        </Alert>
      )}

      {commands.length === 0 ? (
        <Box display="flex" justifyContent="center" alignItems="center" flex={1}>
          <Typography color="text.secondary">
            No commands captured
          </Typography>
        </Box>
      ) : (
        <Paper
          sx={{
            flex: 1,
            overflow: 'auto',
            bgcolor: 'background.default',
          }}
        >
          <List dense>
            {commands.map((cmd) => {
              const isExpanded = expandedIds.has(cmd.id);
              return (
                <ListItem
                  key={cmd.id}
                  onClick={() => toggleExpand(cmd.id)}
                  sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    '&:hover': { bgcolor: 'action.hover' },
                    cursor: 'pointer',
                    py: 0.5,
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: '0.875rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: isExpanded ? 'normal' : 'nowrap',
                          wordBreak: isExpanded ? 'break-all' : 'normal',
                        }}
                      >
                        {cmd.command}
                      </Typography>
                    }
                    secondary={
                      <>
                        {formatTimestamp(cmd.timestamp)} • {cmd.source} • DB: {cmd.database}
                      </>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default Monitor;
