import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { setLoadingProgress, resetLoadingProgress } from '@/store/slices/keysSlice';
import { RedisKey } from '@/types/redis';

export const useLoadAllKeysWithProgress = () => {
  const dispatch = useDispatch<AppDispatch>();

  const loadAllKeysWithProgress = async (
    pattern: string = '*',
    onCancel?: () => void
  ): Promise<RedisKey[]> => {
    return new Promise((resolve, reject) => {
      console.log('🚀 Iniciando carregamento com progresso...');
      
      // Force close any existing EventSource connections
      if ((window as any).__activeEventSource) {
        console.log('🔄 Fechando EventSource anterior...');
        (window as any).__activeEventSource.close();
        delete (window as any).__activeEventSource;
      }
      
      // Close any existing connection first
      if ((window as any).__cancelLoadAllKeys) {
        console.log('🔄 Fechando conexão anterior...');
        (window as any).__cancelLoadAllKeys();
        delete (window as any).__cancelLoadAllKeys;
      }
      
      // Reset progress state
      dispatch(resetLoadingProgress());
      
      // Longer delay to ensure complete cleanup
      setTimeout(() => {
        console.log('🔄 Iniciando nova conexão SSE...');
        startSSEConnection();
      }, 500);
      
      function startSSEConnection() {
        // Start progress immediately
        dispatch(setLoadingProgress({
          isActive: true,
          phase: 'starting',
          message: 'Conectando',
          progress: 0,
          total: 0,
          current: 0,
        }));

        const eventSource = new EventSource(
          `/api/redis/keys/stream?pattern=${encodeURIComponent(pattern)}&t=${Date.now()}`
        );

        // Store reference for cleanup
        (window as any).__activeEventSource = eventSource;

        let finalKeys: RedisKey[] = [];
        let isCancelled = false;

        // Cancel function
        const cancel = () => {
          if (!isCancelled) {
            isCancelled = true;
            console.log('🛑 Operação cancelada pelo usuário');
            eventSource.close();
            if ((window as any).__activeEventSource === eventSource) {
              delete (window as any).__activeEventSource;
            }
            dispatch(resetLoadingProgress());
            reject(new Error('Operação cancelada pelo usuário'));
          }
        };

        // Expose cancel function to parent
        (window as any).__cancelLoadAllKeys = cancel;

        // Add connection timeout
        const connectionTimeout = setTimeout(() => {
          if (!isCancelled && eventSource.readyState === EventSource.CONNECTING) {
            console.error('⚠️ Timeout na conexão SSE');
            cancel();
          }
        }, 10000); // 10 seconds timeout for connection

        // Add heartbeat to detect stalled connections
        let lastEventTime = Date.now();
        const heartbeatInterval = setInterval(() => {
          if (isCancelled) {
            clearInterval(heartbeatInterval);
            return;
          }
          
          const timeSinceLastEvent = Date.now() - lastEventTime;
          if (timeSinceLastEvent > 30000) { // 30 seconds without events
            console.warn('⚠️ No events received for 30 seconds, connection may be stalled');
            // Don't cancel automatically, just log for now
          }
        }, 10000);

      eventSource.onopen = (event) => {
        console.log('✅ SSE Connection opened:', event);
        clearTimeout(connectionTimeout);
      };

      eventSource.onmessage = (event) => {
        if (isCancelled) return;

        lastEventTime = Date.now(); // Update heartbeat
        console.log('📡 Raw SSE event received:', event.data);

        try {
          const data = JSON.parse(event.data);
          console.log('📊 Parsed SSE data:', data);

          if (data.type === 'progress') {
            console.log(`🔄 Progress update: ${data.progress}% - ${data.message}`);
            dispatch(setLoadingProgress({
              isActive: true,
              phase: data.phase,
              message: data.message,
              progress: data.progress,
              total: data.total,
              current: data.current,
            }));
          } else if (data.type === 'complete') {
            clearTimeout(connectionTimeout);
            dispatch(setLoadingProgress({
              isActive: false,
              phase: 'complete',
              message: data.message,
              progress: 100,
              total: data.total,
              current: data.current,
            }));
            
            finalKeys = data.keys;
            eventSource.close();
            
            // Clean up references
            clearInterval(heartbeatInterval);
            if ((window as any).__cancelLoadAllKeys) {
              delete (window as any).__cancelLoadAllKeys;
            }
            if ((window as any).__activeEventSource === eventSource) {
              delete (window as any).__activeEventSource;
            }
            
            resolve(finalKeys);
          } else if (data.type === 'error') {
            console.error('❌ Stream error:', data.message);
            dispatch(resetLoadingProgress());
            eventSource.close();
            reject(new Error(data.message));
          }
        } catch (parseError) {
          console.error('❌ Error parsing SSE data:', parseError);
        }
      };

      eventSource.onerror = (error) => {
        if (isCancelled) return;
        
        console.error('❌ EventSource error:', error);
        console.error('❌ EventSource readyState:', eventSource.readyState);
        console.error('❌ EventSource url:', eventSource.url);
        
        // Don't immediately close on error - might be temporary
        if (eventSource.readyState === EventSource.CLOSED) {
          console.error('❌ Connection permanently closed');
          dispatch(resetLoadingProgress());
          reject(new Error('Connection error'));
        } else {
          console.warn('⚠️ Temporary connection issue, waiting...');
        }
      };

      // Cleanup timeout (10 minutes max)
      setTimeout(() => {
        if (eventSource.readyState !== EventSource.CLOSED && !isCancelled) {
          console.warn('⚠️ Timeout reached, closing connection');
          eventSource.close();
          dispatch(resetLoadingProgress());
          reject(new Error('Timeout - operação muito longa'));
        }
      }, 10 * 60 * 1000);
      }
    });
  };

  const cancelLoadAllKeys = () => {
    if ((window as any).__cancelLoadAllKeys) {
      (window as any).__cancelLoadAllKeys();
    }
  };

  return { loadAllKeysWithProgress, cancelLoadAllKeys };
};
