'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Alert,
  Typography,
  Box,
} from '@mui/material';
import { ReactNode } from 'react';

export interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  severity?: 'error' | 'warning' | 'info' | 'success';
  icon?: ReactNode;
  alertMessage?: string;
  alertSeverity?: 'error' | 'warning' | 'info' | 'success';
  description?: string;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const ConfirmationDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  severity = 'warning',
  icon,
  alertMessage,
  alertSeverity,
  description,
  maxWidth = 'sm',
}: ConfirmationDialogProps) => {
  const getColor = () => {
    switch (severity) {
      case 'error':
        return 'error.main';
      case 'warning':
        return 'warning.main';
      case 'info':
        return 'info.main';
      case 'success':
        return 'success.main';
      default:
        return 'warning.main';
    }
  };

  const getButtonColor = () => {
    switch (severity) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      case 'success':
        return 'success';
      default:
        return 'warning';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="confirmation-dialog-title"
      maxWidth={maxWidth}
      fullWidth
    >
      <DialogTitle 
        id="confirmation-dialog-title" 
        sx={{ 
          color: getColor(),
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        {icon}
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          {message}
        </DialogContentText>
        
        {alertMessage && (
          <Alert severity={alertSeverity || severity} sx={{ mb: 2 }}>
            {alertMessage}
          </Alert>
        )}
        
        {description && (
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          color="inherit"
        >
          {cancelText}
        </Button>
        <Button 
          onClick={onConfirm}
          variant="contained"
          color={getButtonColor()}
          startIcon={icon}
          autoFocus
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog;
