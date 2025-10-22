'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  IconButton,
  Chip,
  Alert,
  Container,
  Paper,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  AppBar,
  Toolbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Storage as StorageIcon,
  Lock as LockIcon,
  Wifi as WifiIcon,
  Storage as DatabaseIcon,
  FileDownload as ExportIcon,
  FileUpload as ImportIcon,
  DeleteSweep as ClearAllIcon,
  Menu as MenuIcon,
  VpnKey as PasswordIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch, store } from '@/store';
import {
  connectToRedis,
  loadConnections,
  migrateFromLocalStorage,
  removeConnectionFromServer,
  clearError,
} from '@/store/slices/connectionSlice';
import { RedisConnection } from '@/types/redis';
import { useAuthWithModals } from '@/hooks/useAuthWithModals';
import { serverConnectionClient } from '@/services/server-connection-client';
import ConnectionDialog from './ConnectionDialog';
import ErrorDialog from './ErrorDialog';
import ConfirmationDialog from './ConfirmationDialog';
import AuthModals from './AuthModals';

interface ConnectionSelectorProps {
  onConnectionSuccess: (connection: RedisConnection) => void;
}

const ConnectionSelector = ({ onConnectionSuccess }: ConnectionSelectorProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    isAuthenticated, 
    isHydrated,
    logoutDialogOpen,
    changePasswordDialogOpen,
    showLogoutConfirmation,
    handleConfirmLogout,
    showChangePassword,
    closeLogoutDialog,
    closeChangePasswordDialog
  } = useAuthWithModals();
  const { connections, error, activeConnection } = useSelector((state: RootState) => state.connection);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [editingConnection, setEditingConnection] = useState<RedisConnection | null>(null);
  const [errorDialog, setErrorDialog] = useState<{ open: boolean; message: string }>({
    open: false,
    message: ''
  });
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    connectionId?: string;
    connectionName?: string;
  }>({ open: false });
  const [clearAllDialog, setClearAllDialog] = useState(false);

  // Garantir que o componente só renderiza no cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isHydrated && isAuthenticated && !hasLoadedOnce) {
      const timeoutId = setTimeout(() => {
        dispatch(loadConnections()).then(() => {
          dispatch(migrateFromLocalStorage()).catch(error => {
            console.warn('Migration failed:', error);
          });
          setHasLoadedOnce(true);
        }).catch(error => {
          console.error('Failed to load connections:', error);
          setHasLoadedOnce(true);
        });
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [dispatch, isHydrated, isAuthenticated, hasLoadedOnce]);

  // Check if there's an active connection after loading and redirect if needed
  useEffect(() => {
    if (hasLoadedOnce && activeConnection) {
      onConnectionSuccess(activeConnection);
    }
  }, [hasLoadedOnce, activeConnection, onConnectionSuccess]);

  // Evita problemas de hidratação - APÓS todos os hooks
  if (!mounted || !isHydrated) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            border: '4px solid',
            borderColor: 'primary.main',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            '@keyframes spin': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' },
            },
          }}
        />
      </Box>
    );
  }

  const handleConnect = async (connection: RedisConnection) => {
    setConnectingId(connection.id);
    try {
      const result = await dispatch(connectToRedis(connection)).unwrap();
      onConnectionSuccess(result);
    } catch (error) {
      console.error('Connection failed:', error);
      // Clear global error and show user-friendly error message
      dispatch(clearError());
      setErrorDialog({
        open: true,
        message: `Falha ao conectar com "${connection.name}": ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      });
    } finally {
      setConnectingId(null);
    }
  };

  const handleEdit = (connection: RedisConnection) => {
    setEditingConnection(connection);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingConnection(null);
    setDialogOpen(true);
  };

  const handleDelete = (connectionId: string) => {
    const connection = connections.find(c => c.id === connectionId);
    setDeleteDialog({
      open: true,
      connectionId,
      connectionName: connection?.name || 'Conexão'
    });
  };

  const handleConfirmDelete = async () => {
    if (deleteDialog.connectionId) {
      try {
        await dispatch(removeConnectionFromServer(deleteDialog.connectionId)).unwrap();
      } catch (error) {
        console.error('Failed to delete connection:', error);
      }
    }
    setDeleteDialog({ open: false });
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingConnection(null);
  };

  const handleExport = async () => {
    try {
      await serverConnectionClient.exportConnections();
    } catch (error) {
      setErrorDialog({
        open: true,
        message: 'Falha ao exportar conexões'
      });
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await serverConnectionClient.importConnectionsFromFile(file);
      
      // Reset file input
      event.target.value = '';
      
      if (result.success) {
        // Reload connections from server
        dispatch(loadConnections());
        setErrorDialog({
          open: true,
          message: `✅ Importadas ${result.importedCount} conexão(ões) com sucesso!`
        });
      } else {
        setErrorDialog({
          open: true,
          message: `Falha ao importar conexões: ${result.error}`
        });
      }
    } catch (error) {
      setErrorDialog({
        open: true,
        message: `Falha ao importar conexões: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      });
    }
  };

  const handleClearAll = () => {
    setClearAllDialog(true);
  };

  const handleConfirmClearAll = async () => {
    try {
      await serverConnectionClient.clearAllConnections();
      dispatch(loadConnections()); // Reload to reflect changes
    } catch (error) {
      setErrorDialog({
        open: true,
        message: 'Falha ao limpar conexões'
      });
    }
    setClearAllDialog(false);
  };

  // As funções de logout e changePassword agora vêm do hook useAuthWithModals

  // Componente do conteúdo do drawer
  const DrawerContent = ({ onChangePassword, onLogout }: { onChangePassword: () => void; onLogout: () => void }) => (
    <Box sx={{ height: '100%', position: 'relative' }}>
      <Toolbar>
        <Box display="flex" alignItems="center" gap={1}>
          <StorageIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h6" noWrap component="div">
            Redis Explorer
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      
      {/* Menu inferior - posicionamento absoluto igual às outras telas */}
      <Box sx={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
        <Box display="flex" flexDirection="column" gap={1}>
          <Button
            fullWidth
            variant="outlined"
            size="small"
            startIcon={<PasswordIcon />}
            onClick={onChangePassword}
          >
            Trocar Senha
          </Button>
          <Button
            fullWidth
            variant="outlined"
            size="small"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={onLogout}
          >
            Sair
          </Button>
        </Box>
      </Box>
    </Box>
  );

  const drawerWidth = 240;

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* AppBar com botão de menu */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={() => setDrawerOpen(!drawerOpen)}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Conexões
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Drawer lateral */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          <DrawerContent onChangePassword={showChangePassword} onLogout={showLogoutConfirmation} />
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          <DrawerContent onChangePassword={showChangePassword} onLogout={showLogoutConfirmation} />
        </Drawer>
      </Box>

      {/* Conteúdo principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        <Toolbar />
        <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', p: 3 }}>
          {/* Header - Fixo */}
          <Box textAlign="center" sx={{ flexShrink: 0, pb: 4 }}>
            <Typography variant="h5" color="text.secondary" mb={3} mt={3}>
              Selecione uma conexão Redis para começar
            </Typography>
            
            <Box display="flex" gap={2} flexWrap="wrap" justifyContent="center" mb={2}>
              <Button
                variant="contained"
                size="large"
                startIcon={<AddIcon />}
                onClick={handleAdd}
                disabled={!hasLoadedOnce}
                sx={{
                  borderRadius: 2,
                  px: 4,
                  py: 1.5,
                }}
              >
                Nova Conexão
              </Button>
              
              <Button
                variant="outlined"
                size="large"
                startIcon={<ExportIcon />}
                onClick={handleExport}
                disabled={!hasLoadedOnce || connections.length === 0}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1.5,
                }}
              >
                Exportar
              </Button>
              
              <Button
                variant="outlined"
                size="large"
                startIcon={<ImportIcon />}
                component="label"
                disabled={!hasLoadedOnce}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1.5,
                }}
              >
                Importar
                <input
                  type="file"
                  accept=".json"
                  hidden
                  onChange={handleImport}
                />
              </Button>
              
              <Button
                variant="outlined"
                size="large"
                color="error"
                startIcon={<ClearAllIcon />}
                onClick={handleClearAll}
                disabled={!hasLoadedOnce || connections.length === 0}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1.5,
                }}
              >
                Limpar Tudo
              </Button>
            </Box>
          </Box>

          {/* Área de conteúdo com scroll */}
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Connections Grid */}
          {!hasLoadedOnce ? (
            <Box textAlign="center" py={6}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    border: '4px solid',
                    borderColor: 'primary.main',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' },
                    },
                  }}
                />
                <Typography variant="h6" color="text.secondary">
                  Carregando conexões...
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Aguarde enquanto buscamos suas conexões salvas
                </Typography>
              </Box>
            </Box>
          ) : connections.length === 0 ? (
            <Box textAlign="center" py={6}>
              <DatabaseIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Nenhuma conexão configurada
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Adicione uma conexão Redis para começar a explorar
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {connections.map((connection) => (
                <Grid item xs={12} sm={6} md={4} key={connection.id}>
                  <Card
                    sx={{
                      height: '100%',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 6,
                      },
                      position: 'relative',
                      overflow: 'visible',
                    }}
                    onClick={() => !connectingId && handleConnect(connection)}
                  >
                    <CardContent sx={{ p: 3 }}>
                      {/* Connection Actions */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          display: 'flex',
                          gap: 0.5,
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(connection);
                          }}
                          sx={{
                            bgcolor: 'background.paper',
                            '&:hover': { bgcolor: 'action.hover' },
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(connection.id);
                          }}
                          sx={{
                            bgcolor: 'background.paper',
                            '&:hover': { bgcolor: 'error.light', color: 'white' },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>

                      {/* Connection Name */}
                      <Typography
                        variant="h6"
                        component="h3"
                        textAlign="center"
                        gutterBottom
                        noWrap
                        sx={{ mt: 3 }}
                      >
                        {connection.name}
                      </Typography>

                      {/* Connection Details */}
                      <Box textAlign="center" mb={2}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {connection.host}:{connection.port}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Database: {connection.database || 0}
                        </Typography>
                      </Box>

                      {/* Connection Status */}
                      <Box display="flex" justifyContent="center" gap={1} flexWrap="wrap">
                        {connection.ssl && (
                          <Chip
                            label="SSL"
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        )}
                        {connection.password && (
                          <Chip
                            label="Auth"
                            size="small"
                            color="warning"
                            variant="outlined"
                          />
                        )}
                      </Box>

                      {/* Loading State */}
                      {connectingId === connection.id && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            bgcolor: 'rgba(0, 0, 0, 0.7)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 1,
                            backdropFilter: 'blur(2px)',
                          }}
                        >
                          <Typography variant="body2" color="primary.main" fontWeight="medium">
                            Conectando...
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
          </Box>
        </Box>
      </Box>

      {/* Connection Dialog */}
      <ConnectionDialog
        open={dialogOpen}
        connection={editingConnection}
        onClose={handleDialogClose}
      />

      {/* Error Dialog */}
      <ErrorDialog
        open={errorDialog.open}
        message={errorDialog.message}
        onClose={() => setErrorDialog({ open: false, message: '' })}
      />

      {/* Delete Connection Dialog */}
      <ConfirmationDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false })}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir a conexão "${deleteDialog.connectionName}"?`}
        confirmText="Excluir Conexão"
        severity="error"
        icon={<DeleteIcon />}
        alertMessage="⚠️ Esta ação não pode ser desfeita!"
        alertSeverity="warning"
        description="Todas as configurações desta conexão serão permanentemente removidas."
      />

      {/* Clear All Connections Dialog */}
      <ConfirmationDialog
        open={clearAllDialog}
        onClose={() => setClearAllDialog(false)}
        onConfirm={handleConfirmClearAll}
        title="Limpar Todas as Conexões"
        message="Tem certeza que deseja excluir todas as conexões salvas?"
        confirmText="Limpar Tudo"
        severity="error"
        icon={<ClearAllIcon />}
        alertMessage="🚨 Esta ação não pode ser desfeita!"
        alertSeverity="error"
        description="Todas as configurações de conexão serão permanentemente removidas e você precisará reconfigurá-las."
      />

      {/* Auth Modals (Logout + Change Password) */}
      <AuthModals
        logoutDialogOpen={logoutDialogOpen}
        changePasswordDialogOpen={changePasswordDialogOpen}
        onConfirmLogout={handleConfirmLogout}
        onCloseLogoutDialog={closeLogoutDialog}
        onCloseChangePasswordDialog={closeChangePasswordDialog}
      />
    </Box>
  );
};

export default ConnectionSelector;
