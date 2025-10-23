import { useDispatch } from 'react-redux';
import { useRef } from 'react';
import { AppDispatch } from '@/store';
import { setLoadingProgress, resetLoadingProgress } from '@/store/slices/keysSlice';
import { RedisKey } from '@/types/redis';

export const useLoadAllKeysWithPolling = () => {
  const dispatch = useDispatch<AppDispatch>();
  const currentOperationId = useRef<string | null>(null);
  const isGlobalCancelled = useRef<boolean>(false);
  const activePollingRef = useRef<boolean>(false);

  const loadAllKeysWithPolling = async (pattern: string = '*'): Promise<RedisKey[]> => {
    return new Promise((resolve, reject) => {
      console.log('🚀 Iniciando carregamento com polling...');
      
      // Generate unique operation ID
      const operationId = `load-all-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      currentOperationId.current = operationId;
      isGlobalCancelled.current = false; // Reset cancellation flag
      activePollingRef.current = true;
      
      // Reset progress state
      dispatch(resetLoadingProgress());
      
      // Start the operation
      startOperation(operationId, pattern, resolve, reject);
    });
  };

  const startOperation = async (
    operationId: string, 
    pattern: string, 
    resolve: (keys: RedisKey[]) => void, 
    reject: (error: Error) => void
  ) => {
    try {
      console.log(`🔄 Iniciando operação ${operationId}`);
      
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

      console.log('✅ Operação iniciada, começando polling...');
      
      // Start polling for status
      pollOperationStatus(operationId, resolve, reject);
      
    } catch (error) {
      console.error('❌ Error starting operation:', error);
      dispatch(resetLoadingProgress());
      reject(error instanceof Error ? error : new Error('Unknown error'));
    }
  };

  const pollOperationStatus = (
    operationId: string,
    resolve: (keys: RedisKey[]) => void,
    reject: (error: Error) => void
  ) => {
    let pollCount = 0;
    let isCancelled = false;
    const maxPolls = 600; // 10 minutes max (600 * 1000ms)
    
    // Store cancel function globally
    (window as any).__cancelPolling = () => {
      console.log('🛑 Polling cancelado pelo usuário');
      isCancelled = true;
      isGlobalCancelled.current = true; // Set global flag
      currentOperationId.current = null;
      dispatch(resetLoadingProgress());
      reject(new Error('Operação cancelada pelo usuário'));
    };
    
    const poll = async () => {
      if (isCancelled || isGlobalCancelled.current) {
        console.log('🛑 Polling interrompido - operação cancelada');
        return;
      }
      try {
        pollCount++;
        console.log(`📊 Polling status (${pollCount}/${maxPolls})...`);
        
        const response = await fetch(`/api/redis/keys/status?id=${operationId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            console.warn('⚠️ Operation not found, may have been cleaned up');
            dispatch(resetLoadingProgress());
            reject(new Error('Operation not found'));
            return;
          }
          throw new Error('Failed to get status');
        }

        const status = await response.json();
        console.log('📡 Status received:', status);

        // Don't update Redux if globally cancelled
        if (!isGlobalCancelled.current) {
          // Update Redux state
          dispatch(setLoadingProgress({
            isActive: status.status === 'running',
            phase: status.phase,
            message: status.message,
            progress: status.progress,
            total: status.total,
            current: status.current,
          }));
        }

        if (status.status === 'complete') {
          console.log('✅ Operação concluída!');
          
          // Don't resolve if cancelled
          if (isGlobalCancelled.current) {
            console.log('🛑 Operação foi cancelada, ignorando conclusão');
            return;
          }
          
          // Clean up the operation
          fetch(`/api/redis/keys/status?id=${operationId}`, {
            method: 'DELETE',
          }).catch(console.error);
          
          // Clean up cancel function
          if ((window as any).__cancelPolling) {
            delete (window as any).__cancelPolling;
          }
          
          resolve(status.keys || []);
          return;
        }

        if (status.status === 'cancelled') {
          console.log('🛑 Operação foi cancelada no backend');
          
          // Clean up the operation
          fetch(`/api/redis/keys/status?id=${operationId}`, {
            method: 'DELETE',
          }).catch(console.error);
          
          // Clean up cancel function
          if ((window as any).__cancelPolling) {
            delete (window as any).__cancelPolling;
          }
          
          // Don't reject if already cancelled locally (avoid double handling)
          if (!isGlobalCancelled.current) {
            dispatch(resetLoadingProgress());
            reject(new Error('Operação cancelada pelo usuário'));
          }
          return;
        }

        if (status.status === 'error') {
          console.error('❌ Operação falhou:', status.error);
          dispatch(resetLoadingProgress());
          
          // Clean up the operation
          fetch(`/api/redis/keys/status?id=${operationId}`, {
            method: 'DELETE',
          }).catch(console.error);
          
          // Clean up cancel function
          if ((window as any).__cancelPolling) {
            delete (window as any).__cancelPolling;
          }
          
          reject(new Error(status.error || 'Operation failed'));
          return;
        }

        // Continue polling if still running and not cancelled
        if (status.status === 'running' && pollCount < maxPolls && !isGlobalCancelled.current) {
          setTimeout(poll, 1000); // Poll every 1 second
        } else if (pollCount >= maxPolls) {
          console.error('⚠️ Polling timeout reached');
          if (!isGlobalCancelled.current) {
            dispatch(resetLoadingProgress());
            reject(new Error('Timeout'));
          }
        }

      } catch (error) {
        console.error('❌ Error polling status:', error);
        
        // Retry a few times before giving up
        if (pollCount < 5) {
          setTimeout(poll, 2000); // Retry after 2 seconds
        } else {
          dispatch(resetLoadingProgress());
          reject(error instanceof Error ? error : new Error('Polling failed'));
        }
      }
    };

    // Start polling immediately
    poll();
  };

  const cancelLoadAllKeys = async () => {
    console.log('🛑 Cancelando operação de polling...');
    
    // First, stop the polling loop
    if ((window as any).__cancelPolling) {
      (window as any).__cancelPolling();
    }
    
    // Then cancel on backend
    if (currentOperationId) {
      try {
        const response = await fetch('/api/redis/keys/cancel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ operationId: currentOperationId }),
        });

        if (response.ok) {
          console.log('✅ Operação cancelada no backend');
        } else {
          console.warn('⚠️ Falha ao cancelar no backend');
        }
      } catch (error) {
        console.error('❌ Erro ao cancelar operação:', error);
      }
      
      currentOperationId.current = null;
    }
  };

  return { loadAllKeysWithPolling, cancelLoadAllKeys };
};
