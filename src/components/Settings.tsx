'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Storage as StorageIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { setKeysToScan } from '@/store/slices/browserSettingsSlice';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      style={{ height: '100%', overflow: 'auto' }}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Settings = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { activeConnection } = useSelector((state: RootState) => state.connection);
  const { keysToScan } = useSelector((state: RootState) => state.browserSettings);
  const [localKeysToScan, setLocalKeysToScan] = useState(keysToScan);
  const [tabValue, setTabValue] = useState(0);
  const [config, setConfig] = useState<Record<string, string>>({});
  const [configDisabled, setConfigDisabled] = useState(false);
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [maintenanceCommands, setMaintenanceCommands] = useState({
    bgsave: true,
    bgrewriteaof: true,
    flushdb: true,
    flushall: true,
  });
  const [maintenanceError, setMaintenanceError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    operation: string;
    title: string;
    message: string;
  }>({
    open: false,
    operation: '',
    title: '',
    message: '',
  });

  // Configurações editáveis
  const [editableConfig, setEditableConfig] = useState({
    maxmemory: '',
    'maxmemory-policy': '',
    timeout: '',
    'tcp-keepalive': '',
    'slowlog-log-slower-than': '',
    'slowlog-max-len': '',
  });

  useEffect(() => {
    if (activeConnection?.connected) {
      fetchConfig();
      fetchMaintenanceCommands();
    }
  }, [activeConnection]);

  const fetchConfig = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/redis/config');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch config');
      }

      setConfig(data.config);
      setConfigDisabled(data.configDisabled || false);
      setServerInfo(data.info);

      // Preencher configurações editáveis
      setEditableConfig({
        maxmemory: data.config.maxmemory || '',
        'maxmemory-policy': data.config['maxmemory-policy'] || '',
        timeout: data.config.timeout || '',
        'tcp-keepalive': data.config['tcp-keepalive'] || '',
        'slowlog-log-slower-than': data.config['slowlog-log-slower-than'] || '',
        'slowlog-max-len': data.config['slowlog-max-len'] || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMaintenanceCommands = async () => {
    try {
      const response = await fetch('/api/redis/maintenance');
      const data = await response.json();

      if (response.ok) {
        setMaintenanceCommands(data.commands);
        setMaintenanceError(null);
      } else {
        setMaintenanceError(data.error ?? 'Não foi possível verificar comandos de manutenção.');
      }
    } catch (error) {
      setMaintenanceError('Não foi possível verificar comandos de manutenção.');
    }
  };

  const handleConfigChange = (key: string, value: string) => {
    setEditableConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveConfig = async (key: string, value: string) => {
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/redis/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save config');
      }

      setSuccess(`Configuração ${key} atualizada com sucesso!`);
      await fetchConfig();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleMaintenance = async (operation: keyof typeof maintenanceCommands) => {
    if (!activeConnection?.connected) {
      setError('Nenhuma conexão ativa');
      closeConfirmDialog();
      return;
    }

    if (!maintenanceCommands[operation]) {
      setError('Este comando não está disponível no servidor Redis atual.');
      closeConfirmDialog();
      return;
    }

    setMaintenanceLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/redis/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao executar a operação');
      }

      setSuccess(`Operação ${operation.toUpperCase()} executada com sucesso!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao executar manutenção');
    } finally {
      setMaintenanceLoading(false);
      closeConfirmDialog();
    }
  };

  const openConfirmDialog = (operation: keyof typeof maintenanceCommands, title: string, message: string) => {
    if (!maintenanceCommands[operation]) {
      setError('Este comando não está disponível no servidor Redis atual.');
      return;
    }

    setConfirmDialog({ open: true, operation, title, message });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({ open: false, operation: '', title: '', message: '' });
  };

  const isConnected = activeConnection?.connected;

  if (isLoading && isConnected) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {error && (
        <Alert severity="error" sx={{ m: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ m: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Browser" />
          <Tab label="Servidor" disabled={!isConnected} />
          <Tab label="Manutenção" disabled={!isConnected} />
          <Tab label="Informações" disabled={!isConnected} />
        </Tabs>
      </Box>

      {/* Tab: Browser */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Configurações de Busca
                </Typography>
                <TextField
                  fullWidth
                  label="SCAN COUNT (chaves por iteração)"
                  type="number"
                  value={localKeysToScan}
                  onChange={(e) => setLocalKeysToScan(Math.max(100, parseInt(e.target.value) || 1000))}
                  margin="normal"
                  helperText="Parâmetro COUNT do comando SCAN do Redis. Define quantas chaves o Redis examina por iteração. Valores maiores = mais chaves encontradas por ciclo. Mínimo: 100"
                  inputProps={{ min: 100, step: 100 }}
                />
              </CardContent>
              <CardActions>
                <Button
                  startIcon={<SaveIcon />}
                  variant="contained"
                  onClick={() => {
                    dispatch(setKeysToScan(localKeysToScan));
                    setSuccess('Configuração de busca salva com sucesso!');
                  }}
                >
                  Salvar
                </Button>
              </CardActions>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <InfoIcon sx={{ mr: 1 }} color="info" />
                  <Typography variant="h6">
                    Sobre o SCAN COUNT
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  O comando SCAN do Redis itera sobre as chaves em lotes. O parâmetro COUNT 
                  é uma <strong>dica</strong> para o Redis sobre quantas chaves examinar por iteração.
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  <strong>Valor atual:</strong> {keysToScan}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  <strong>Importante:</strong> O COUNT não garante exatamente esse número de resultados - 
                  é apenas uma sugestão ao Redis. Se você não está encontrando algumas chaves, 
                  aumente este valor para que o SCAN examine mais chaves por iteração.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Valores recomendados: 1.000 (padrão), 10.000 (bases médias), 50.000+ (bases grandes).
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Tab: Servidor */}
      <TabPanel value={tabValue} index={1}>
        {!isConnected ? (
          <Alert severity="info">
            Conecte-se a um servidor Redis para visualizar as configurações do servidor.
          </Alert>
        ) : (
          <>
            {configDisabled && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                <strong>Configurações Desabilitadas:</strong> O comando CONFIG está desabilitado neste servidor Redis. 
                Isso é comum em ambientes gerenciados (AWS ElastiCache, Azure Cache, etc). 
                Apenas a aba "Informações" estará disponível.
              </Alert>
            )}
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Memória
                </Typography>
                <TextField
                  fullWidth
                  label="Max Memory (bytes)"
                  value={editableConfig.maxmemory}
                  onChange={(e) => handleConfigChange('maxmemory', e.target.value)}
                  margin="normal"
                  helperText="0 = sem limite"
                  disabled={configDisabled}
                />
                <TextField
                  fullWidth
                  label="Max Memory Policy"
                  value={editableConfig['maxmemory-policy']}
                  onChange={(e) => handleConfigChange('maxmemory-policy', e.target.value)}
                  margin="normal"
                  helperText="noeviction, allkeys-lru, volatile-lru, etc"
                  disabled={configDisabled}
                />
              </CardContent>
              <CardActions>
                <Button
                  startIcon={<SaveIcon />}
                  onClick={() => handleSaveConfig('maxmemory', editableConfig.maxmemory)}
                  disabled={configDisabled}
                >
                  Salvar Memória
                </Button>
                <Button
                  startIcon={<SaveIcon />}
                  onClick={() => handleSaveConfig('maxmemory-policy', editableConfig['maxmemory-policy'])}
                  disabled={configDisabled}
                >
                  Salvar Policy
                </Button>
              </CardActions>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance
                </Typography>
                <TextField
                  fullWidth
                  label="Timeout (seconds)"
                  value={editableConfig.timeout}
                  onChange={(e) => handleConfigChange('timeout', e.target.value)}
                  margin="normal"
                  helperText="0 = sem timeout"
                  disabled={configDisabled}
                />
                <TextField
                  fullWidth
                  label="TCP Keep-Alive (seconds)"
                  value={editableConfig['tcp-keepalive']}
                  onChange={(e) => handleConfigChange('tcp-keepalive', e.target.value)}
                  margin="normal"
                  disabled={configDisabled}
                />
              </CardContent>
              <CardActions>
                <Button
                  startIcon={<SaveIcon />}
                  onClick={() => handleSaveConfig('timeout', editableConfig.timeout)}
                  disabled={configDisabled}
                >
                  Salvar Timeout
                </Button>
                <Button
                  startIcon={<SaveIcon />}
                  onClick={() => handleSaveConfig('tcp-keepalive', editableConfig['tcp-keepalive'])}
                  disabled={configDisabled}
                >
                  Salvar Keep-Alive
                </Button>
              </CardActions>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Slow Log
                </Typography>
                <TextField
                  fullWidth
                  label="Threshold (microseconds)"
                  value={editableConfig['slowlog-log-slower-than']}
                  onChange={(e) => handleConfigChange('slowlog-log-slower-than', e.target.value)}
                  margin="normal"
                  helperText="Comandos mais lentos que isso serão logados"
                  disabled={configDisabled}
                />
                <TextField
                  fullWidth
                  label="Max Length"
                  value={editableConfig['slowlog-max-len']}
                  onChange={(e) => handleConfigChange('slowlog-max-len', e.target.value)}
                  margin="normal"
                  helperText="Número máximo de entradas no slowlog"
                  disabled={configDisabled}
                />
              </CardContent>
              <CardActions>
                <Button
                  startIcon={<SaveIcon />}
                  onClick={() => handleSaveConfig('slowlog-log-slower-than', editableConfig['slowlog-log-slower-than'])}
                  disabled={configDisabled}
                >
                  Salvar Threshold
                </Button>
                <Button
                  startIcon={<SaveIcon />}
                  onClick={() => handleSaveConfig('slowlog-max-len', editableConfig['slowlog-max-len'])}
                  disabled={configDisabled}
                >
                  Salvar Max Length
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
          </>
        )}
      </TabPanel>

      {/* Tab: Manutenção */}
      <TabPanel value={tabValue} index={2}>
        {!isConnected ? (
          <Alert severity="info">
            Conecte-se a um servidor Redis para acessar as opções de manutenção.
          </Alert>
        ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <StorageIcon sx={{ mr: 1 }} color="primary" />
                  <Typography variant="h6">
                    Salvar Snapshot (BGSAVE)
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Salva um snapshot do banco de dados em background. Não bloqueia o servidor.
                </Typography>
              </CardContent>
              <CardActions>
                <Tooltip title={maintenanceCommands.bgsave ? '' : 'Este comando não está disponível no servidor Redis atual.'}>
                  <span>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      disabled={!maintenanceCommands.bgsave}
                      onClick={() => openConfirmDialog(
                        'bgsave',
                        'Salvar Snapshot',
                        'Deseja salvar um snapshot do banco de dados?'
                      )}
                    >
                      Executar BGSAVE
                    </Button>
                  </span>
                </Tooltip>
              </CardActions>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <RefreshIcon sx={{ mr: 1 }} color="primary" />
                  <Typography variant="h6">
                    Reescrever AOF (BGREWRITEAOF)
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Reescreve o arquivo AOF em background para otimizar o tamanho.
                </Typography>
              </CardContent>
              <CardActions>
                <Tooltip title={maintenanceCommands.bgrewriteaof ? '' : 'Este comando não está disponível no servidor Redis atual.'}>
                  <span>
                    <Button
                      variant="contained"
                      startIcon={<RefreshIcon />}
                      disabled={!maintenanceCommands.bgrewriteaof}
                      onClick={() => openConfirmDialog(
                        'bgrewriteaof',
                        'Reescrever AOF',
                        'Deseja reescrever o arquivo AOF?'
                      )}
                    >
                      Executar BGREWRITEAOF
                    </Button>
                  </span>
                </Tooltip>
              </CardActions>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <DeleteIcon sx={{ mr: 1 }} color="error" />
                  <Typography variant="h6">
                    Limpar Database (FLUSHDB)
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Remove todas as chaves do database atual. Esta operação é irreversível!
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => openConfirmDialog(
                    'flushdb',
                    'Limpar Database',
                    'ATENÇÃO: Esta operação irá remover TODAS as chaves do database atual. Esta ação é IRREVERSÍVEL!'
                  )}
                >
                  Executar FLUSHDB
                </Button>
              </CardActions>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <DeleteIcon sx={{ mr: 1 }} color="error" />
                  <Typography variant="h6">
                    Limpar Tudo (FLUSHALL)
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Remove todas as chaves de TODOS os databases. Esta operação é irreversível!
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => openConfirmDialog(
                    'flushall',
                    'Limpar Tudo',
                    'ATENÇÃO: Esta operação irá remover TODAS as chaves de TODOS os databases. Esta ação é IRREVERSÍVEL!'
                  )}
                >
                  Executar FLUSHALL
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
        )}
      </TabPanel>

      {/* Tab: Informações */}
      <TabPanel value={tabValue} index={3}>
        {!isConnected ? (
          <Alert severity="info">
            Conecte-se a um servidor Redis para visualizar as informações do servidor.
          </Alert>
        ) : (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <InfoIcon sx={{ mr: 1 }} color="primary" />
                  <Typography variant="h6">
                    Servidor
                  </Typography>
                </Box>
                <Box component="pre" sx={{ 
                  whiteSpace: 'pre-wrap', 
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  bgcolor: 'background.default',
                  p: 2,
                  borderRadius: 1,
                }}>
                  {serverInfo?.server || 'N/A'}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <InfoIcon sx={{ mr: 1 }} color="primary" />
                  <Typography variant="h6">
                    Replicação
                  </Typography>
                </Box>
                <Box component="pre" sx={{ 
                  whiteSpace: 'pre-wrap', 
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  bgcolor: 'background.default',
                  p: 2,
                  borderRadius: 1,
                }}>
                  {serverInfo?.replication || 'N/A'}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <InfoIcon sx={{ mr: 1 }} color="primary" />
                  <Typography variant="h6">
                    Persistência
                  </Typography>
                </Box>
                <Box component="pre" sx={{ 
                  whiteSpace: 'pre-wrap', 
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  bgcolor: 'background.default',
                  p: 2,
                  borderRadius: 1,
                }}>
                  {serverInfo?.persistence || 'N/A'}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        )}
      </TabPanel>

      {/* Confirm Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={closeConfirmDialog}
      >
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmDialog.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirmDialog}>
            Cancelar
          </Button>
          <Button 
            onClick={() => handleMaintenance(confirmDialog.operation as keyof typeof maintenanceCommands)}
            color="error"
            variant="contained"
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;
