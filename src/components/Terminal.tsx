'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  Paper,
  Chip,
  Alert,
} from '@mui/material';
import {
  Send as SendIcon,
  Clear as ClearIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { redisClientService } from '@/services/redis-client';
import { RedisCommand } from '@/types/redis';

const Terminal = () => {
  const { activeConnection } = useSelector((state: RootState) => state.connection);
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<RedisCommand[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [history]);

  const executeCommand = async () => {
    if (!command.trim() || !activeConnection) return;

    const commandEntry: RedisCommand = {
      command: command.trim(),
      timestamp: Date.now(),
    };

    setHistory(prev => [...prev, commandEntry]);
    setIsExecuting(true);
    setError(null);

    try {
      const startTime = Date.now();
      const result = await redisClientService.executeCommand(command.trim());
      const duration = Date.now() - startTime;

      setHistory(prev => 
        prev.map(cmd => 
          cmd.timestamp === commandEntry.timestamp
            ? { ...cmd, result, duration }
            : cmd
        )
      );
    } catch (err) {
      setHistory(prev => 
        prev.map(cmd => 
          cmd.timestamp === commandEntry.timestamp
            ? { ...cmd, error: String(err) }
            : cmd
        )
      );
    } finally {
      setIsExecuting(false);
      setCommand('');
      setHistoryIndex(-1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const commandHistory = history.map(h => h.command);
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 
          ? commandHistory.length - 1 
          : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCommand(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const commandHistory = history.map(h => h.command);
      if (historyIndex !== -1) {
        const newIndex = Math.min(commandHistory.length - 1, historyIndex + 1);
        if (newIndex === commandHistory.length - 1 && historyIndex === newIndex) {
          setHistoryIndex(-1);
          setCommand('');
        } else {
          setHistoryIndex(newIndex);
          setCommand(commandHistory[newIndex]);
        }
      }
    }
  };

  const clearHistory = () => {
    setHistory([]);
    setHistoryIndex(-1);
  };

  const formatResult = (result: any) => {
    if (result === null) return '(nil)';
    if (typeof result === 'string') return `"${result}"`;
    if (typeof result === 'number') return result.toString();
    if (typeof result === 'boolean') return result ? '1' : '0';
    if (Array.isArray(result)) {
      return result.map((item, index) => `${index + 1}) ${formatResult(item)}`).join('\n');
    }
    if (typeof result === 'object') {
      return JSON.stringify(result, null, 2);
    }
    return String(result);
  };

  const getCommandType = (cmd: string) => {
    const command = cmd.split(' ')[0].toUpperCase();
    const readCommands = ['GET', 'MGET', 'HGET', 'HGETALL', 'LRANGE', 'SMEMBERS', 'ZRANGE', 'EXISTS', 'TTL', 'TYPE'];
    const writeCommands = ['SET', 'MSET', 'HSET', 'LPUSH', 'RPUSH', 'SADD', 'ZADD', 'DEL', 'EXPIRE'];
    const infoCommands = ['INFO', 'PING', 'ECHO', 'TIME', 'CLIENT'];
    
    if (readCommands.includes(command)) return 'read';
    if (writeCommands.includes(command)) return 'write';
    if (infoCommands.includes(command)) return 'info';
    return 'other';
  };

  const getCommandColor = (type: string) => {
    switch (type) {
      case 'read': return 'primary';
      case 'write': return 'warning';
      case 'info': return 'info';
      default: return 'default';
    }
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
    <Box height="100%" display="flex" flexDirection="column">
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Redis CLI</Typography>
        <Box display="flex" gap={1}>
          <IconButton onClick={clearHistory} disabled={history.length === 0}>
            <ClearIcon />
          </IconButton>
        </Box>
      </Box>

      <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 0 }}>
          {/* Command History */}
          <Box
            ref={historyRef}
            sx={{
              flexGrow: 1,
              overflow: 'auto',
              p: 2,
              backgroundColor: '#0d1117',
              fontFamily: 'monospace',
              fontSize: '14px',
            }}
          >
            {history.length === 0 ? (
              <Box textAlign="center" py={4}>
                <HistoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography color="text.secondary">
                  Enter Redis commands below. Use ↑/↓ arrows to navigate history.
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  Examples: GET mykey, SET mykey "value", KEYS *, INFO
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {history.map((entry, index) => (
                  <ListItem key={index} sx={{ flexDirection: 'column', alignItems: 'flex-start', p: 1 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={1} width="100%">
                      <Typography
                        sx={{
                          color: '#58a6ff',
                          fontFamily: 'monospace',
                          fontSize: '14px',
                        }}
                      >
                        redis&gt;
                      </Typography>
                      <Typography
                        sx={{
                          color: '#f0f6fc',
                          fontFamily: 'monospace',
                          fontSize: '14px',
                          flexGrow: 1,
                        }}
                      >
                        {entry.command}
                      </Typography>
                      <Box display="flex" gap={1} alignItems="center">
                        <Chip
                          label={getCommandType(entry.command)}
                          size="small"
                          color={getCommandColor(getCommandType(entry.command)) as any}
                        />
                        {entry.duration && (
                          <Chip
                            label={`${entry.duration}ms`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Box>
                    
                    {entry.result !== undefined && (
                      <Paper
                        sx={{
                          p: 1,
                          backgroundColor: '#161b22',
                          border: '1px solid #30363d',
                          width: '100%',
                          ml: 2,
                        }}
                      >
                        <Typography
                          component="pre"
                          sx={{
                            color: '#7ee787',
                            fontFamily: 'monospace',
                            fontSize: '13px',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-all',
                            m: 0,
                          }}
                        >
                          {formatResult(entry.result)}
                        </Typography>
                      </Paper>
                    )}
                    
                    {entry.error && (
                      <Paper
                        sx={{
                          p: 1,
                          backgroundColor: '#161b22',
                          border: '1px solid #f85149',
                          width: '100%',
                          ml: 2,
                        }}
                      >
                        <Typography
                          sx={{
                            color: '#f85149',
                            fontFamily: 'monospace',
                            fontSize: '13px',
                            m: 0,
                          }}
                        >
                          Error: {entry.error}
                        </Typography>
                      </Paper>
                    )}
                  </ListItem>
                ))}
              </List>
            )}
          </Box>

          {/* Command Input */}
          <Box
            sx={{
              p: 2,
              borderTop: '1px solid #30363d',
              backgroundColor: '#0d1117',
            }}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <Typography
                sx={{
                  color: '#58a6ff',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  minWidth: 'auto',
                }}
              >
                redis&gt;
              </Typography>
              <TextField
                ref={inputRef}
                fullWidth
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter Redis command..."
                disabled={isExecuting}
                variant="outlined"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    backgroundColor: '#161b22',
                    '& fieldset': {
                      border: 'none',
                    },
                  },
                  '& .MuiOutlinedInput-input': {
                    color: '#f0f6fc',
                  },
                }}
              />
              <IconButton
                onClick={executeCommand}
                disabled={!command.trim() || isExecuting}
                color="primary"
              >
                <SendIcon />
              </IconButton>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Terminal;
