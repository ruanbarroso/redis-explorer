'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip,
  Typography,
} from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

interface SlowLogEntry {
  id: number;
  timestamp: number;
  duration: number;
  command: string[];
  clientAddress: string;
  clientName: string;
}

const SlowLog = () => {
  const { activeConnection } = useSelector((state: RootState) => state.connection);
  const [slowLog, setSlowLog] = useState<SlowLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const observerTarget = useRef<HTMLTableRowElement>(null);
  const hasFetchedRef = useRef<string | null>(null);
  const ITEMS_PER_PAGE = 20;

  const fetchSlowLog = async (page: number) => {
    if (!activeConnection?.connected) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/redis/slowlog?page=${page}&perPage=${ITEMS_PER_PAGE}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch slow log');
      }

      // Formatar dados do slowlog (já vem ordenado do backend)
      const formattedLog = (data.slowLog || []).map((entry: any) => ({
        id: entry[0],
        timestamp: entry[1],
        duration: entry[2],
        command: entry[3],
        clientAddress: entry[4] || 'N/A',
        clientName: entry[5] || 'N/A',
      }));

      // Adicionar novos itens aos existentes
      setSlowLog((prev) => page === 0 ? formattedLog : [...prev, ...formattedLog]);
      setHasMore(data.hasMore);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (!activeConnection?.connected) return;
    
    // Usar ref para evitar chamadas duplicadas em Strict Mode
    if (hasFetchedRef.current !== activeConnection.id) {
      hasFetchedRef.current = activeConnection.id;
      setSlowLog([]);
      setHasMore(true);
      setCurrentPage(0);
      fetchSlowLog(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConnection?.id]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && hasMore) {
          console.log('Infinite scroll triggered, loading page:', currentPage + 1);
          fetchSlowLog(currentPage + 1);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [isLoading, hasMore, currentPage]);

  const formatDuration = (microseconds: number) => {
    if (microseconds < 1000) {
      return `${microseconds}μs`;
    } else if (microseconds < 1000000) {
      return `${(microseconds / 1000).toFixed(2)}ms`;
    } else {
      return `${(microseconds / 1000000).toFixed(2)}s`;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatCommand = (command: string[]) => {
    return command.join(' ');
  };

  const getDurationColor = (microseconds: number) => {
    if (microseconds < 10000) return 'success'; // < 10ms
    if (microseconds < 100000) return 'warning'; // < 100ms
    return 'error'; // >= 100ms
  };

  if (!activeConnection?.connected) {
    return (
      <Box p={3}>
        <Alert severity="info">
          Please connect to a Redis server to view slow log.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {error && (
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
        </Alert>
      )}

      {isLoading && slowLog.length === 0 ? (
        <Box display="flex" justifyContent="center" alignItems="center" flex={1}>
          <CircularProgress />
        </Box>
      ) : slowLog.length === 0 ? (
        <Box p={3}>
          <Alert severity="info">
            No slow log entries found. This is good - your Redis commands are fast!
          </Alert>
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ height: '100%', overflow: 'auto' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Timestamp</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Command</TableCell>
                <TableCell>Client</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {slowLog.map((entry, index) => (
                <TableRow 
                  key={entry.id} 
                  hover
                  ref={index === slowLog.length - 1 ? observerTarget : null}
                >
                  <TableCell>{entry.id}</TableCell>
                  <TableCell>{formatTimestamp(entry.timestamp)}</TableCell>
                  <TableCell>
                    <Chip
                      label={formatDuration(entry.duration)}
                      color={getDurationColor(entry.duration)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: 'monospace',
                        maxWidth: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {formatCommand(entry.command)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {entry.clientAddress}
                      {entry.clientName !== 'N/A' && ` (${entry.clientName})`}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 2 }}>
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default SlowLog;
