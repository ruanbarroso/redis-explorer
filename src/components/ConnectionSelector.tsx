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
import { useAuth } from '@/hooks/useAuth';
import { serverConnectionClient } from '@/services/server-connection-client';
import ConnectionDialog from './ConnectionDialog';
import ErrorDialog from './ErrorDialog';

interface ConnectionSelectorProps {
  onConnectionSuccess: (connection: RedisConnection) => void;
}

const ConnectionSelector = ({ onConnectionSuccess }: ConnectionSelectorProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { connections, activeConnection, isConnecting, error } = useSelector(
    (state: RootState) => state.connection
  );
  const { isAuthenticated, isHydrated } = useAuth();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<RedisConnection | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [errorDialog, setErrorDialog] = useState<{ open: boolean; message: string }>({
    open: false,
    message: ''
  });

  // Load connections from server only when authenticated
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

  const handleDelete = async (connectionId: string) => {
    if (confirm('Tem certeza que deseja excluir esta conexão?')) {
      try {
        await dispatch(removeConnectionFromServer(connectionId)).unwrap();
      } catch (error) {
        console.error('Failed to delete connection:', error);
      }
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingConnection(null);
  };

  const handleExport = async () => {
    try {
      await serverConnectionClient.exportConnections();
    } catch (error) {
      alert('Falha ao exportar conexões');
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
        alert(`Importadas ${result.importedCount} conexão(ões) com sucesso`);
      } else {
        alert(`Falha ao importar conexões: ${result.error}`);
      }
    } catch (error) {
      alert(`Falha ao importar conexões: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const handleClearAll = async () => {
    if (confirm('Tem certeza que deseja excluir todas as conexões salvas? Esta ação não pode ser desfeita.')) {
      try {
        await serverConnectionClient.clearAllConnections();
        dispatch(loadConnections()); // Reload to reflect changes
      } catch (error) {
        alert('Falha ao limpar conexões');
      }
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}
    >
      <Container maxWidth="lg">
        <Paper
          elevation={8}
          sx={{
            p: 4,
            borderRadius: 2,
            bgcolor: 'background.paper',
          }}
        >
          {/* Header */}
          <Box textAlign="center" mb={4}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                mx: 'auto',
                mb: 2,
                bgcolor: 'primary.main',
              }}
            >
              <StorageIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h3" component="h1" gutterBottom fontWeight="bold" color="text.primary">
              Redis Explorer
            </Typography>
            <Typography variant="h6" color="text.secondary" mb={3}>
              Selecione uma conexão Redis para começar
            </Typography>
            
            <Box display="flex" gap={2} flexWrap="wrap" justifyContent="center">
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
        </Paper>
      </Container>

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
    </Box>
  );
};

export default ConnectionSelector;
