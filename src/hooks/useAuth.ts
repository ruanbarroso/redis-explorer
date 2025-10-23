import { useState, useEffect } from 'react';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  hasPassword: boolean;
  isHydrated: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    hasPassword: false,
    isHydrated: false,
  });

  const checkAuthStatus = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      // Verifica se já existe senha configurada
      const setupResponse = await fetch('/api/auth/setup');
      const setupData = await setupResponse.json();

      if (!setupData.hasPassword) {
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          hasPassword: false,
          isHydrated: true,
        });
        return;
      }

      // Verifica se está autenticado
      const verifyResponse = await fetch('/api/auth/verify');
      const verifyData = await verifyResponse.json();

      setAuthState({
        isAuthenticated: verifyData.authenticated,
        isLoading: false,
        hasPassword: true,
        isHydrated: true,
      });
    } catch (error) {
      console.error('Error checking auth status:', error);
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        hasPassword: false,
        isHydrated: true,
      });
    }
  };

  const logout = async () => {
    try {
      console.log('🔄 Fazendo requisição para /api/auth/logout...');
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      
      if (!response.ok) {
        throw new Error(`Logout failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📡 Resposta da API logout:', data);
      
      setAuthState(prev => {
        const newState = {
          ...prev,
          isAuthenticated: false,
        };
        console.log('🔄 Atualizando estado de autenticação:', newState);
        return newState;
      });
      
      console.log('✅ Estado de autenticação atualizado para false');
    } catch (error) {
      console.error('❌ Error during logout:', error);
      // Mesmo com erro na API, vamos desautenticar localmente
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: false,
      }));
      throw error; // Re-throw para que o caller possa tratar
    }
  };

  const refreshAuth = () => {
    checkAuthStatus();
  };

  useEffect(() => {
    // Só executa no cliente após hidratação
    if (typeof window !== 'undefined') {
      checkAuthStatus();
    }
  }, []);

  return {
    ...authState,
    logout,
    refreshAuth,
  };
};
