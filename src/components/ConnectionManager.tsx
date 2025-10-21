'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as ConnectIcon,
  Stop as DisconnectIcon,
  FileDownload as ExportIcon,
  FileUpload as ImportIcon,
  DeleteSweep as ClearAllIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import {
  addConnection,
  removeConnection,
  updateConnection,
  connectToRedis,
  disconnectFromRedis,
  testConnection,
  loadConnections,
  saveConnection,
  updateConnectionOnServer,
  removeConnectionFromServer,
} from '@/store/slices/connectionSlice';
import { serverConnectionClient } from '@/services/server-connection-client';
import { RedisConnection } from '@/types/redis';
import { v4 as uuidv4 } from 'uuid';

interface ConnectionManagerProps {
  onConnectionSuccess?: () => void;
}

const ConnectionManager = ({ onConnectionSuccess }: ConnectionManagerProps = {}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { connections, activeConnection, isConnecting, error } = useSelector(
    (state: RootState) => state.connection
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<RedisConnection | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    host: 'localhost',
    port: 6379,
    password: '',
    database: 0,
    ssl: false,
  });
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Load connections from server on component mount
  useEffect(() => {
    dispatch(loadConnections());
  }, [dispatch]);

  const handleOpenDialog = (connection?: RedisConnection) => {
    if (connection) {
      setEditingConnection(connection);
      setFormData({
        name: connection.name,
        host: connection.host,
        port: connection.port,
        password: connection.password || '',
        database: connection.database || 0,
        ssl: connection.ssl || false,
      });
    } else {
      setEditingConnection(null);
      setFormData({
        name: '',
        host: 'localhost',
        port: 6379,
        password: '',
        database: 0,
        ssl: false,
      });
    }
    setTestResult(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingConnection(null);
    setTestResult(null);
  };

  const handleSave = async () => {
    const connection: RedisConnection = {
      id: editingConnection?.id || uuidv4(),
      name: formData.name,
      host: formData.host,
      port: formData.port,
      password: formData.password || undefined,
      database: formData.database,
      ssl: formData.ssl,
    };

    try {
      if (editingConnection) {
        await dispatch(updateConnectionOnServer(connection)).unwrap();
      } else {
        await dispatch(saveConnection(connection)).unwrap();
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Failed to save connection:', error);
      // Could show error message to user here
    }
  };

  const handleDelete = async (connectionId: string) => {
    try {
      if (activeConnection?.id === connectionId) {
        await dispatch(disconnectFromRedis(connectionId));
      }
      await dispatch(removeConnectionFromServer(connectionId)).unwrap();
    } catch (error) {
      console.error('Failed to delete connection:', error);
    }
  };

  const handleConnect = async (connection: RedisConnection) => {
    try {
      await dispatch(connectToRedis(connection)).unwrap();
      // Only call callback after successful connection
      if (onConnectionSuccess) {
        onConnectionSuccess();
      }
    } catch (error) {
      // Connection failed, don't redirect
      console.error('Connection failed:', error);
    }
  };

  const handleDisconnect = (connectionId: string) => {
    dispatch(disconnectFromRedis(connectionId));
  };

  const handleExport = async () => {
    try {
      await serverConnectionClient.exportConnections();
    } catch (error) {
      alert('Failed to export connections');
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
        alert(`Successfully imported ${result.importedCount} connection(s)`);
      } else {
        alert(`Failed to import connections: ${result.error}`);
      }
    } catch (error) {
      alert(`Failed to import connections: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to delete all saved connections? This action cannot be undone.')) {
      try {
        await serverConnectionClient.clearAllConnections();
        dispatch(loadConnections()); // Reload to reflect changes
      } catch (error) {
        alert('Failed to clear connections');
      }
    }
  };

  const handleTestConnection = async () => {
    const connection: RedisConnection = {
      id: 'test',
      name: formData.name,
      host: formData.host,
      port: formData.port,
      password: formData.password || undefined,
      database: formData.database,
      ssl: formData.ssl,
    };

    try {
      const result = await dispatch(testConnection(connection)).unwrap();
      setTestResult({
        success: result,
        message: result ? 'Connection successful!' : 'Connection failed!',
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: `Connection failed: ${error}`,
      });
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Redis Connections</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Connection
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Saved Connections
                </Typography>
                <Box display="flex" gap={1}>
                  <Button
                    size="small"
                    startIcon={<ExportIcon />}
                    onClick={handleExport}
                    disabled={connections.length === 0}
                  >
                    Export
                  </Button>
                  <Button
                    size="small"
                    startIcon={<ImportIcon />}
                    component="label"
                  >
                    Import
                    <input
                      type="file"
                      accept=".json"
                      hidden
                      onChange={handleImport}
                    />
                  </Button>
                  <Button
                    size="small"
                    startIcon={<ClearAllIcon />}
                    onClick={handleClearAll}
                    disabled={connections.length === 0}
                    color="error"
                  >
                    Clear All
                  </Button>
                </Box>
              </Box>
              {connections.length === 0 ? (
                <Typography color="text.secondary">
                  No connections configured. Add a connection to get started.
                </Typography>
              ) : (
                <Box
                  sx={{
                    maxHeight: 'calc(100vh - 280px)',
                    overflow: 'auto',
                    '&::-webkit-scrollbar': {
                      width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      background: '#f1f1f1',
                      borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: '#888',
                      borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                      background: '#555',
                    },
                  }}
                >
                  <List>
                    {connections.map((connection, index) => (
                      <ListItem 
                        key={connection.id} 
                        divider={index < connections.length - 1}
                      >
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="subtitle1">
                                {connection.name}
                              </Typography>
                              {connection.connected && (
                                <Chip
                                  label="Connected"
                                  color="success"
                                  size="small"
                                />
                              )}
                              {activeConnection?.id === connection.id && (
                                <Chip
                                  label="Active"
                                  color="primary"
                                  size="small"
                                />
                              )}
                            </Box>
                          }
                          secondary={`${connection.host}:${connection.port} (DB: ${connection.database || 0})`}
                        />
                        <ListItemSecondaryAction>
                          <Box display="flex" gap={1}>
                            {activeConnection?.id === connection.id ? (
                              <IconButton
                                onClick={() => handleDisconnect(connection.id)}
                                color="error"
                                disabled={isConnecting}
                              >
                                <DisconnectIcon />
                              </IconButton>
                            ) : (
                              <IconButton
                                onClick={() => handleConnect(connection)}
                                color="success"
                                disabled={isConnecting}
                              >
                                <ConnectIcon />
                              </IconButton>
                            )}
                            <IconButton
                              onClick={() => handleOpenDialog(connection)}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              onClick={() => handleDelete(connection.id)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingConnection ? 'Edit Connection' : 'Add New Connection'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Connection Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Host"
              value={formData.host}
              onChange={(e) => setFormData({ ...formData, host: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Port"
              type="number"
              value={formData.port}
              onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
              fullWidth
              required
            />
            <TextField
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              fullWidth
            />
            <TextField
              label="Database"
              type="number"
              value={formData.database}
              onChange={(e) => setFormData({ ...formData, database: parseInt(e.target.value) })}
              fullWidth
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.ssl}
                  onChange={(e) => setFormData({ ...formData, ssl: e.target.checked })}
                />
              }
              label="Use SSL"
            />
            
            {testResult && (
              <Alert severity={testResult.success ? 'success' : 'error'}>
                {testResult.message}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleTestConnection}>Test Connection</Button>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!formData.name || !formData.host}
          >
            {editingConnection ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConnectionManager;
