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
      await fetch('/api/auth/logout', { method: 'POST' });
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: false,
      }));
    } catch (error) {
      console.error('Error during logout:', error);
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
