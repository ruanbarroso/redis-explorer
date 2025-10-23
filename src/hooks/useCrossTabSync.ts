import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { connectToRedis, disconnectFromRedis } from '@/store/slices/connectionSlice';
import { RedisConnection } from '@/types/redis';

export const useCrossTabSync = () => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // Só processa mudanças no localStorage da conexão ativa
      if (event.key === 'redis-explorer-active-connection') {
        console.log('🔄 Detectada mudança de conexão em outra aba');

        if (event.newValue) {
          // Nova conexão ativa em outra aba
          try {
            const connection: RedisConnection = JSON.parse(event.newValue);
            console.log('📡 Sincronizando nova conexão:', connection.name);
            dispatch(connectToRedis(connection));
          } catch (error) {
            console.error('❌ Erro ao parsear conexão do localStorage:', error);
          }
        } else if (event.oldValue && !event.newValue) {
          // Conexão foi removida em outra aba
          try {
            const oldConnection: RedisConnection = JSON.parse(event.oldValue);
            console.log('📡 Sincronizando desconexão:', oldConnection.name);
            dispatch(disconnectFromRedis(oldConnection.id));
          } catch (error) {
            console.error('❌ Erro ao parsear conexão antiga do localStorage:', error);
          }
        }
      }
    };

    // Adicionar listener para mudanças no localStorage
    window.addEventListener('storage', handleStorageChange);

    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [dispatch]);
};
