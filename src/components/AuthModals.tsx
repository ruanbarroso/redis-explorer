'use client';

import { Logout as LogoutIcon, VpnKey as ChangePasswordIcon } from '@mui/icons-material';
import ConfirmationDialog from './ConfirmationDialog';
import ChangePasswordDialog from './ChangePasswordDialog';

interface AuthModalsProps {
  logoutDialogOpen: boolean;
  changePasswordDialogOpen: boolean;
  onConfirmLogout: () => void;
  onCloseLogoutDialog: () => void;
  onCloseChangePasswordDialog: () => void;
  onChangePasswordSuccess?: () => void;
}

const AuthModals = ({
  logoutDialogOpen,
  changePasswordDialogOpen,
  onConfirmLogout,
  onCloseLogoutDialog,
  onCloseChangePasswordDialog,
  onChangePasswordSuccess,
}: AuthModalsProps) => {
  return (
    <>
      {/* Logout Confirmation Dialog */}
      <ConfirmationDialog
        open={logoutDialogOpen}
        onClose={onCloseLogoutDialog}
        onConfirm={onConfirmLogout}
        title="Confirmar Logout"
        message="Tem certeza que deseja sair do Redis Explorer?"
        confirmText="Sair"
        cancelText="Cancelar"
        severity="warning"
        icon={<LogoutIcon />}
        alertMessage="ℹ️ Você será redirecionado para a tela de login."
        alertSeverity="info"
        description="Suas conexões salvas permanecerão seguras e você poderá acessá-las novamente após fazer login."
      />

      {/* Change Password Dialog */}
      <ChangePasswordDialog
        open={changePasswordDialogOpen}
        onClose={onCloseChangePasswordDialog}
        onSuccess={() => {
          onChangePasswordSuccess?.();
          onCloseChangePasswordDialog();
        }}
      />
    </>
  );
};

export default AuthModals;
