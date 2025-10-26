'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Typography,
  Chip,
  Avatar,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  KeyboardArrowDown as ArrowDownIcon,
  Link as LinkIcon,
  Lock as LockIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, usePathname } from 'next/navigation';
import { RootState, AppDispatch } from '@/store';
import { connectToRedis, disconnectFromRedis, clearError, loadConnections } from '@/store/slices/connectionSlice';
import { RedisConnection } from '@/types/redis';
import { useAuth } from '@/hooks/useAuth';
import ErrorDialog from './ErrorDialog';

interface ConnectionSwitcherProps {
  onManageConnections: () => void;
}

const ConnectionSwitcher = ({ onManageConnections }: ConnectionSwitcherProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const pathname = usePathname();
  const { connections, activeConnection, isConnecting } = useSelector(
    (state: RootState) => state.connection
  );
  const { isAuthenticated, isHydrated } = useAuth();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [errorDialog, setErrorDialog] = useState<{ open: boolean; message: string }>({
    open: false,
    message: ''
  });
  const open = Boolean(anchorEl);

  // Load connections when component mounts
  useEffect(() => {
    if (isHydrated && isAuthenticated && connections.length === 0) {
      dispatch(loadConnections());
    }
  }, [dispatch, isHydrated, isAuthenticated, connections.length]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleConnectionSelect = async (connection: RedisConnection) => {
    if (connection.id !== activeConnection?.id) {
      try {
        // Se estiver na tela de edição de chave, redirecionar para /browser
        if (pathname?.startsWith('/browser/edit/')) {
          router.push('/browser');
        }
        await dispatch(connectToRedis(connection)).unwrap();
      } catch (error) {
        console.error('Failed to switch connection:', error);
        // Clear global error and show user-friendly error message
        dispatch(clearError());
        setErrorDialog({
          open: true,
          message: `Falha ao conectar com "${connection.name}": ${error instanceof Error ? error.message : 'Erro desconhecido'}`
        });
      }
    }
    handleClose();
  };


  const handleManageConnections = async () => {
    handleClose();
    // Disconnect current connection to go back to connection selector
    if (activeConnection) {
      await dispatch(disconnectFromRedis(activeConnection.id));
    }
    // Chamar callback para abrir modal/página de gerenciar conexões
    onManageConnections();
  };

  if (!activeConnection) {
    return null;
  }

  return (
    <Box>
      <Button
        onClick={handleClick}
        endIcon={<ArrowDownIcon />}
        sx={{
          color: 'inherit',
          textTransform: 'none',
          borderRadius: 2,
          px: 2,
          py: 1,
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
        }}
        disabled={isConnecting}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: activeConnection.ssl ? 'success.main' : 'primary.main',
              mr: 1,
            }}
          >
            {activeConnection.ssl ? (
              <LockIcon sx={{ fontSize: 16 }} />
            ) : (
              <LinkIcon sx={{ fontSize: 16 }} />
            )}
          </Avatar>
          <Box textAlign="left">
            <Typography variant="body2" fontWeight="medium">
              {activeConnection.name}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
            </Typography>
          </Box>
        </Box>
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            minWidth: 280,
            mt: 1,
          },
        }}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
      >
        {/* Current Connection Header */}
        <Box px={2} py={1}>
          <Typography variant="caption" color="text.secondary">
            Conexão Atual
          </Typography>
        </Box>

        <MenuItem disabled>
          <ListItemText
            primary={activeConnection.name}
            secondary={`${activeConnection.host}:${activeConnection.port} (DB: ${activeConnection.database || 0})`}
          />
        </MenuItem>

        <Divider />

        {/* Other Connections */}
        {connections.length > 1 && [
          <Box key="other-header" px={2} py={1}>
            <Typography variant="caption" color="text.secondary">
              Outras Conexões
            </Typography>
          </Box>,
          <Box
            key="other-list"
            sx={{
              maxHeight: 200,
              overflowY: 'auto',
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '3px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: 'rgba(255, 255, 255, 0.3)',
              },
            }}
          >
            {connections
              .filter((connection) => connection.id !== activeConnection.id)
              .map((connection) => (
                <MenuItem
                  key={connection.id}
                  onClick={() => handleConnectionSelect(connection)}
                  disabled={isConnecting}
                >
                  <ListItemText
                    primary={connection.name}
                    secondary={`${connection.host}:${connection.port} (DB: ${connection.database || 0})`}
                  />
                </MenuItem>
              ))}
          </Box>,
          <Divider key="other-divider" />
        ]}

        <MenuItem onClick={handleManageConnections} sx={{ mt: 1 }}>
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Gerenciar Conexões" />
        </MenuItem>
      </Menu>

      {/* Error Dialog */}
      <ErrorDialog
        open={errorDialog.open}
        message={errorDialog.message}
        onClose={() => setErrorDialog({ open: false, message: '' })}
      />
    </Box>
  );
};

export default ConnectionSwitcher;
