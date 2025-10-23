'use client';

import { useState } from 'react';
import { useAuth } from './useAuth';

export const useAuthWithModals = () => {
  const auth = useAuth();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false);

  const showLogoutConfirmation = () => {
    setLogoutDialogOpen(true);
  };

  const handleConfirmLogout = async () => {
    console.log('🚪 Iniciando processo de logout...');
    try {
      await auth.logout();
      console.log('✅ Logout realizado com sucesso');
      setLogoutDialogOpen(false);
      
      // Força um refresh da página após um pequeno delay para garantir que o estado seja atualizado
      setTimeout(() => {
        console.log('🔄 Forçando refresh da página para garantir redirecionamento...');
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error('❌ Erro durante logout:', error);
      // Ainda fecha o dialog mesmo com erro, pois o usuário quer sair
      setLogoutDialogOpen(false);
      
      // Mesmo com erro, força refresh para limpar qualquer estado inconsistente
      setTimeout(() => {
        console.log('🔄 Forçando refresh da página após erro...');
        window.location.reload();
      }, 100);
    }
  };

  const showChangePassword = () => {
    setChangePasswordDialogOpen(true);
  };

  const handleCloseChangePassword = () => {
    setChangePasswordDialogOpen(false);
  };

  return {
    ...auth,
    // Modal states
    logoutDialogOpen,
    changePasswordDialogOpen,
    // Actions
    showLogoutConfirmation,
    handleConfirmLogout,
    showChangePassword,
    handleCloseChangePassword,
    // Close functions
    closeLogoutDialog: () => setLogoutDialogOpen(false),
    closeChangePasswordDialog: () => setChangePasswordDialogOpen(false),
  };
};
