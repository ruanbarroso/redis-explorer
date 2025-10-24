import { useDispatch } from 'react-redux';
import { useRef, useCallback } from 'react';
import { AppDispatch } from '@/store';
import { setLoadingProgress, resetLoadingProgress } from '@/store/slices/keysSlice';
import { RedisKey } from '@/types/redis';

export const useSimplePolling = () => {
  const dispatch = useDispatch<AppDispatch>();
  const cancelledRef = useRef<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadAllKeysSimple = async (pattern: string = '*'): Promise<RedisKey[]> => {
    return new Promise((resolve, reject) => {
      console.log('🚀 Iniciando carregamento simples...');
      
      // Reset cancellation
      cancelledRef.current = false;
      
      // Set start time immediately
      dispatch(setLoadingProgress({
        isActive: true,
        phase: 'starting',
        message: 'Iniciando carregamento',
        progress: 0,
        total: 0,
        current: 0,
        startTime: Date.now(),
      }));
      
      // Generate unique operation ID
      const operationId = `load-all-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Start the operation
      startSimpleOperation(operationId, pattern, resolve, reject);
    });
  };

  const startSimpleOperation = async (
    operationId: string,
    pattern: string,
    resolve: (keys: RedisKey[]) => void,
    reject: (error: Error) => void
  ) => {
    try {
      // Start the background operation
      const response = await fetch('/api/redis/keys/load-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pattern,
          operationId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start operation');
      }

      // Start simple polling
      pollSimple(operationId, resolve, reject);
      
    } catch (error) {
      console.error('❌ Error starting operation:', error);
      dispatch(resetLoadingProgress());
      reject(error instanceof Error ? error : new Error('Unknown error'));
    }
  };

  const pollSimple = (
    operationId: string,
    resolve: (keys: RedisKey[]) => void,
    reject: (error: Error) => void
  ) => {
    const poll = async () => {
      // Check if cancelled
      if (cancelledRef.current) {
        console.log('🛑 Polling cancelado');
        return;
      }

      try {
        const response = await fetch(`/api/redis/keys/status?id=${operationId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            reject(new Error('Operation not found'));
            return;
          }
          throw new Error('Failed to get status');
        }

        const status = await response.json();
        
        // Check if cancelled again
        if (cancelledRef.current) {
          console.log('🛑 Polling cancelado após receber status');
          return;
        }

        // Update Redux only if not cancelled
        dispatch(setLoadingProgress({
          isActive: status.status === 'running',
          phase: status.phase,
          message: status.message,
          progress: status.progress,
          total: status.total,
          current: status.current,
        }));

        if (status.status === 'complete') {
          console.log('✅ Operação concluída no backend!');
          
          // Clean up backend operation
          fetch(`/api/redis/keys/status?id=${operationId}`, {
            method: 'DELETE',
          }).catch(console.error);
          
          // Resolve immediately - let KeysBrowser handle the "preparing" phase
          resolve(status.keys || []);
          
          return;
        }

        if (status.status === 'error') {
          console.error('❌ Operação falhou:', status.error);
          reject(new Error(status.error || 'Operation failed'));
          return;
        }

        if (status.status === 'cancelled') {
          console.log('🛑 Operação cancelada no backend');
          reject(new Error('Operação cancelada'));
          return;
        }

        // Continue polling if still running
        if (status.status === 'running' && !cancelledRef.current) {
          timeoutRef.current = setTimeout(poll, 1000);
        }

      } catch (error) {
        console.error('❌ Error polling:', error);
        reject(error instanceof Error ? error : new Error('Polling failed'));
      }
    };

    // Start polling
    poll();
  };

  const cancelSimple = useCallback(() => {
    console.log('🛑 Cancelando operação simples...');
    
    // Set cancellation flag
    cancelledRef.current = true;
    
    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Reset Redux immediately
    dispatch(resetLoadingProgress());
  }, [dispatch]);

  return { loadAllKeysSimple, cancelSimple };
};
