'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControlLabel,
  Switch,
  Alert,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import {
  saveConnection,
  updateConnectionOnServer,
  testConnection,
} from '@/store/slices/connectionSlice';
import { RedisConnection } from '@/types/redis';
import { v4 as uuidv4 } from 'uuid';

interface ConnectionDialogProps {
  open: boolean;
  connection?: RedisConnection | null;
  onClose: () => void;
}

const ConnectionDialog = ({ open, connection, onClose }: ConnectionDialogProps) => {
  const dispatch = useDispatch<AppDispatch>();

  const [formData, setFormData] = useState({
    name: '',
    host: 'localhost',
    port: 6379,
    password: '',
    database: 0,
    ssl: false,
  });
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // Reset form when dialog opens/closes or connection changes
  useEffect(() => {
    if (open) {
      if (connection) {
        setFormData({
          name: connection.name,
          host: connection.host,
          port: connection.port,
          password: connection.password || '',
          database: connection.database || 0,
          ssl: connection.ssl || false,
        });
      } else {
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
    }
  }, [open, connection]);

  const handleSave = async () => {
    const connectionData: RedisConnection = {
      id: connection?.id || uuidv4(),
      name: formData.name,
      host: formData.host,
      port: formData.port,
      password: formData.password || undefined,
      database: formData.database,
      ssl: formData.ssl,
    };

    try {
      if (connection) {
        await dispatch(updateConnectionOnServer(connectionData)).unwrap();
      } else {
        await dispatch(saveConnection(connectionData)).unwrap();
      }
      onClose();
    } catch (error) {
      console.error('Failed to save connection:', error);
    }
  };

  const handleTestConnection = async () => {
    const connectionData: RedisConnection = {
      id: 'test',
      name: formData.name,
      host: formData.host,
      port: formData.port,
      password: formData.password || undefined,
      database: formData.database,
      ssl: formData.ssl,
    };

    setIsTestingConnection(true);
    try {
      const result = await dispatch(testConnection(connectionData)).unwrap();
      setTestResult({
        success: result,
        message: result ? 'Conexão bem-sucedida!' : 'Falha na conexão!',
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: `Falha na conexão: ${error}`,
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleClose = () => {
    setTestResult(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {connection ? 'Editar Conexão' : 'Nova Conexão'}
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} mt={1}>
          <TextField
            label="Nome da Conexão"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            fullWidth
            required
            placeholder="Ex: Produção, Desenvolvimento, Local"
          />
          
          <TextField
            label="Host"
            value={formData.host}
            onChange={(e) => setFormData({ ...formData, host: e.target.value })}
            fullWidth
            required
            placeholder="localhost ou IP do servidor"
          />
          
          <TextField
            label="Porta"
            type="number"
            value={formData.port}
            onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 6379 })}
            fullWidth
            required
          />
          
          <TextField
            label="Senha"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            fullWidth
            placeholder="Deixe vazio se não houver senha"
          />
          
          <TextField
            label="Database"
            type="number"
            value={formData.database}
            onChange={(e) => setFormData({ ...formData, database: parseInt(e.target.value) || 0 })}
            fullWidth
            helperText="Número do database (geralmente 0)"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={formData.ssl}
                onChange={(e) => setFormData({ ...formData, ssl: e.target.checked })}
              />
            }
            label="Usar SSL/TLS"
          />
          
          {testResult && (
            <Alert severity={testResult.success ? 'success' : 'error'}>
              {testResult.message}
            </Alert>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={handleTestConnection}
          disabled={!formData.name || !formData.host || isTestingConnection}
        >
          {isTestingConnection ? 'Testando...' : 'Testar Conexão'}
        </Button>
        <Button onClick={handleClose}>
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!formData.name || !formData.host}
        >
          {connection ? 'Atualizar' : 'Adicionar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConnectionDialog;
