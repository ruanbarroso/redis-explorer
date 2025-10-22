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

  const handleConfirmLogout = () => {
    auth.logout();
    setLogoutDialogOpen(false);
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
