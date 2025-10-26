'use client';

import { createContext, useContext, useEffect, useCallback, useRef, ReactNode, useState } from 'react';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  hasPassword: boolean;
  isHydrated: boolean;
}

interface AuthContextType extends AuthState {
  logout: () => Promise<void>;
  refreshAuth: (force?: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  console.log('🚀 [AuthProvider] Inicializando...');
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    hasPassword: false,
    isHydrated: false,
  });

  // Refs para controle de estado assíncrono
  const isMounted = useRef(true);
  const authCheckPromise = useRef<Promise<void> | null>(null);

  // Limpa a referência quando o componente for desmontado
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const checkAuthStatus = useCallback(async (force = false) => {
    console.log('🔄 [AuthContext] Verificando status de autenticação...', { force });
    
    // Se já existe uma verificação em andamento, retorna a mesma promessa
    if (authCheckPromise.current && !force) {
      console.log('⏳ [AuthContext] Já existe uma verificação em andamento, aguardando...');
      return authCheckPromise.current;
    }

    // Cria uma nova promessa para a verificação de autenticação
    authCheckPromise.current = (async () => {
      try {
        if (isMounted.current) {
          setAuthState(prev => ({ ...prev, isLoading: true }));
        }

        // Verifica se já existe senha configurada
        console.log('🔍 [AuthContext] Iniciando chamadas para /api/auth/setup e /api/auth/verify');
        const [setupResponse, verifyResponse] = await Promise.all([
          fetch('/api/auth/setup').then(res => {
            console.log('🔍 [AuthContext] Resposta de /api/auth/setup:', res.status);
            return res;
          }),
          fetch('/api/auth/verify').then(res => {
            console.log('🔍 [AuthContext] Resposta de /api/auth/verify:', res.status);
            return res;
          })
        ]);

        if (!isMounted.current) return;

        const [setupData, verifyData] = await Promise.all([
          setupResponse.json().then(data => {
            console.log('📦 [AuthContext] Dados de setup:', data);
            return data;
          }),
          verifyResponse.json().then(data => {
            console.log('📦 [AuthContext] Dados de verificação:', data);
            return data;
          })
        ]);

        if (!isMounted.current) return;

        const newState = {
          isAuthenticated: verifyData.authenticated || false,
          isLoading: false,
          hasPassword: setupData.hasPassword || false,
          isHydrated: true,
        };

        if (isMounted.current) {
          setAuthState(newState);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        if (isMounted.current) {
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            hasPassword: false,
            isHydrated: true,
          });
        }
      } finally {
        authCheckPromise.current = null;
      }
    })();

    return authCheckPromise.current;
  }, []);

  const logout = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      
      if (!response.ok) {
        throw new Error(`Logout failed: ${response.status} ${response.statusText}`);
      }
      
      await response.json();
      
      if (isMounted.current) {
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: false,
        }));
      }
    } catch (error) {
      console.error('Error during logout:', error);
      // Mesmo com erro na API, desautentica localmente
      if (isMounted.current) {
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: false,
        }));
      }
      throw error;
    }
  }, []);

  const refreshAuth = useCallback(async (force = false) => {
    return checkAuthStatus(force);
  }, [checkAuthStatus]);

  // Verifica a autenticação na montagem do componente
  useEffect(() => {
    console.log('🔍 [AuthProvider] useEffect - Verificando autenticação...');
    if (typeof window !== 'undefined') {
      console.log('🌐 [AuthProvider] Navegador detectado, verificando autenticação...');
      checkAuthStatus().then(() => {
        console.log('✅ [AuthProvider] Verificação de autenticação concluída');
      }).catch(error => {
        console.error('❌ [AuthProvider] Erro ao verificar autenticação:', error);
      });
    } else {
      console.log('⚡ [AuthProvider] Renderização no servidor, pulando verificação de autenticação');
    }
  }, [checkAuthStatus]);

  const value = {
    ...authState,
    logout,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
