'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useAuthWithModals } from '@/hooks/useAuthWithModals';
import { useCrossTabSync } from '@/hooks/useCrossTabSync';
import { useIsClient } from '@/hooks/useIsClient';
import LoadingScreen from '@/components/LoadingScreen';
import PasswordSetup from '@/components/PasswordSetup';
import LoginForm from '@/components/LoginForm';
import ConnectionSelector from '@/components/ConnectionSelector';

export default function Home() {
  const router = useRouter();
  const isClient = useIsClient();
  const { activeConnection } = useSelector((state: RootState) => state.connection);
  const { 
    isAuthenticated, 
    isLoading, 
    hasPassword, 
    isHydrated, 
    refreshAuth,
  } = useAuthWithModals();

  // Sincronizar mudanças de conexão entre abas
  useCrossTabSync();

  // Redirecionar para dashboard se já estiver autenticado e tiver conexão ativa
  useEffect(() => {
    if (isHydrated && isAuthenticated && activeConnection) {
      router.push('/dashboard');
    }
  }, [isHydrated, isAuthenticated, activeConnection, router]);

  // Mostra loading até que o cliente esteja pronto e a autenticação seja verificada
  if (!isClient || !isHydrated || isLoading) {
    return <LoadingScreen />;
  }

  // Se não tem senha configurada, mostra tela de setup
  if (!hasPassword) {
    return <PasswordSetup onSetupComplete={refreshAuth} />;
  }

  // Se tem senha mas não está autenticado, mostra login
  if (!isAuthenticated) {
    return <LoginForm onLoginSuccess={refreshAuth} />;
  }

  // Se está autenticado, mostra seletor de conexão
  return <ConnectionSelector />;
}
