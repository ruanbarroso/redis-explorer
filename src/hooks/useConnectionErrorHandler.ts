import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { disconnectFromRedis, connectToRedis } from '@/store/slices/connectionSlice';

export function useConnectionErrorHandler() {
  const dispatch = useDispatch<AppDispatch>();
  const { activeConnection } = useSelector((state: RootState) => state.connection);
  const [errorModal, setErrorModal] = useState<{
    open: boolean;
    message: string;
    details?: string;
  }>({ open: false, message: '' });
  const [isReconnecting, setIsReconnecting] = useState(false);

  const handleConnectionError = async (attemptReconnect = true) => {
    // Se já está tentando reconectar, não fazer nada
    if (isReconnecting) {
      return;
    }

    // Tentar reconectar automaticamente se houver conexão ativa
    if (attemptReconnect && activeConnection) {
      console.log('🔄 Tentando reconectar automaticamente...');
      setIsReconnecting(true);
      
      try {
        await dispatch(connectToRedis(activeConnection)).unwrap();
        console.log('✅ Reconexão bem-sucedida!');
        setIsReconnecting(false);
        return; // Reconexão bem-sucedida, não desconectar
      } catch (error) {
        console.error('❌ Falha na reconexão automática:', error);
        setIsReconnecting(false);
      }
    }

    // Se reconexão falhou ou não foi tentada, desconectar
    if (activeConnection) {
      dispatch(disconnectFromRedis(activeConnection.id));
    }
  };

  const showErrorModal = (message: string, details?: string) => {
    setErrorModal({ open: true, message, details });
  };

  const closeErrorModal = () => {
    setErrorModal({ open: false, message: '' });
  };

  const handleFetchError = async (response: Response) => {
    // Erro 503 - Redis não conectado
    if (response.status === 503) {
      console.error('Redis connection unavailable (503), redirecting to connections...');
      handleConnectionError();
      return true; // Erro tratado
    }

    // Erro 500 - Pode ser erro de conexão ou erro genérico
    if (response.status === 500) {
      try {
        const data = await response.json();
        if (data.error) {
          // Verificar se é erro de conexão
          if (
            data.error.includes('Connection is closed') ||
            data.error.includes('No active Redis connection') ||
            data.error.includes('No session found')
          ) {
            console.error('Redis connection error (500), redirecting to connections...');
            handleConnectionError();
            return true; // Erro tratado
          }
          
          // Erro 500 genérico - mostrar modal
          showErrorModal('Erro interno do servidor', data.error);
          return true; // Erro tratado
        }
      } catch {
        // Não conseguiu parsear JSON - mostrar erro genérico
        showErrorModal('Erro interno do servidor', 'Não foi possível processar a resposta do servidor');
        return true;
      }
    }

    return false; // Erro não tratado
  };

  return {
    handleConnectionError,
    handleFetchError,
    showErrorModal,
    closeErrorModal,
    errorModal,
    isReconnecting,
  };
}
