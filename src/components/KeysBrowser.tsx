'use client';

import { useEffect, useState, useRef } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Button,
  InputAdornment,
  Alert,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  LinearProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ViewList as ViewListIcon,
  AccountTree as TreeViewIcon,
  ArrowBack as ArrowBackIcon,
  GetApp as LoadAllIcon,
  Key as KeyIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import {
  fetchKeys,
  fetchAllKeys,
  fetchValue,
  setSearchPattern,
  setSelectedKey,
  deleteKey,
  setLoadingProgress,
  resetLoadingProgress,
  setKeys,
  setTotalKeys,
  setLoadedKeysJson,
  clearLoadedKeysJson,
} from '@/store/slices/keysSlice';
import ValueEditor from './ValueEditor';
import TreeView from './TreeView';
import TreeStats from './TreeStats';
import SeparatorSelector from './SeparatorSelector';
import { useTreeView } from '@/hooks/useTreeView';
import { useLoadAllKeysWithProgress } from '@/hooks/useLoadAllKeysWithProgress';
import { useLoadAllKeysWithPolling } from '@/hooks/useLoadAllKeysWithPolling';
import { useSimplePolling } from '@/hooks/useSimplePolling';
import { useConnectionErrorHandler } from '@/hooks/useConnectionErrorHandler';
import { useTTLCountdown } from '@/hooks/useTTLCountdown';
import ErrorModal from './ErrorModal';
import LoadingProgressModal from './LoadingProgressModal';
import VirtualizedKeysList from './VirtualizedKeysList';
import { RedisDataType } from '@/types/redis';
import { formatTTL } from '@/utils/timeFormatter';

const KeysBrowser = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { keys, selectedKey, selectedValue, searchPattern, isLoading, isLoadingValue, isLoadingAllKeys, totalKeys, error, loadingProgress, loadedKeysJson } = useSelector(
    (state: RootState) => state.keys
  );
  const { activeConnection } = useSelector((state: RootState) => state.connection);
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('tree');
  const [localSearchPattern, setLocalSearchPattern] = useState(searchPattern);
  const [currentView, setCurrentView] = useState<'navigation' | 'content'>('navigation');
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    keyName?: string;
    keyNames?: string[];
    type: 'single' | 'bulk';
  }>({ open: false, type: 'single' });
  const [goToKeyDialog, setGoToKeyDialog] = useState<{
    open: boolean;
    keyName: string;
  }>({ open: false, keyName: '' });
  const {
    treeNodes,
    detectedSeparator,
    customSeparator,
    setCustomSeparator,
    activeSeparator,
    expandedNodes: treeExpandedNodes,
    toggleExpand,
    expandAllChildren,
    collapseAllChildren
  } = useTreeView(keys);
  
  const { loadAllKeysWithProgress, cancelLoadAllKeys } = useLoadAllKeysWithProgress();
  const { loadAllKeysWithPolling, cancelLoadAllKeys: cancelPolling } = useLoadAllKeysWithPolling();
  const { loadAllKeysSimple, cancelSimple } = useSimplePolling();
  const { handleFetchError, errorModal, closeErrorModal } = useConnectionErrorHandler();
  
  // TTL Countdown - ativa apenas quando há conexão ativa
  useTTLCountdown(!!activeConnection?.connected);
  
  // Ref para evitar chamadas duplicadas
  const lastConnectionIdRef = useRef<string | null>(null);
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    // Evitar chamada na montagem inicial se não há conexão
    if (!activeConnection?.connected) {
      isInitialLoadRef.current = false;
      return;
    }
    
    // Evitar chamada duplicada para a mesma conexão
    if (lastConnectionIdRef.current === activeConnection.id) {
      return;
    }
    
    lastConnectionIdRef.current = activeConnection.id;
    isInitialLoadRef.current = false;
    
    handleRefresh();
  }, [activeConnection?.id, activeConnection?.connected]);

  const handleRefresh = () => {
    if (activeConnection) {
      dispatch(fetchKeys({ pattern: searchPattern, count: 1000 }));
    }
  };

  const handleLoadAllKeys = async () => {
    if (activeConnection) {
      console.log(' Carregando todas as chaves...');
      try {
        // Use simple polling method
        console.log(' Usando método simples...');
        const keys = await loadAllKeysSimple(searchPattern);
        
        // Update progress to show we're preparing the file
        dispatch(setLoadingProgress({
          isActive: true,
          phase: 'completing',
          message: 'Preparando arquivo JSON...',
          progress: 100,
          total: keys.length,
          current: keys.length,
        }));
        
        // Small delay to show the "preparing" message
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Process JSON data BEFORE marking as complete
        const jsonData = JSON.stringify(keys, null, 2);
        dispatch(setLoadedKeysJson({ 
          json: jsonData, 
          fileName: `redis-keys-${activeConnection.name}-${new Date().toISOString().split('T')[0]}.json` 
        }));
        
        // Wait a bit to ensure Redux state is updated
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Now mark as complete - modal will open with JSON already loaded
        dispatch(setLoadingProgress({
          isActive: false,
          phase: 'complete',
          message: `${keys.length} chaves carregadas com sucesso!`,
          progress: 100,
          total: keys.length,
          current: keys.length,
        }));
        
        console.log(` Carregamento concluído: ${keys.length} chaves`);
        
      } catch (error) {
        console.error(' Erro ao carregar chaves:', error);
        if (error instanceof Error && !error.message.includes('cancelada')) {
          dispatch(resetLoadingProgress());
        }
      }
    }
  };

  const handleCancelLoading = () => {
    console.log(' Usuário solicitou cancelamento...');
    
    // Use simple cancellation
    cancelSimple();
  };

  const handleSearch = () => {
    dispatch(setSearchPattern(localSearchPattern));
    dispatch(fetchKeys({ pattern: localSearchPattern, count: 1000 }));
  };

  const handleKeySelect = (keyName: string) => {
    dispatch(setSelectedKey(keyName));
    dispatch(fetchValue(keyName));
    setCurrentView('content');
  };

  const handleBackToNavigation = () => {
    setCurrentView('navigation');
  };

  const handleGoToKey = () => {
    setGoToKeyDialog({ open: true, keyName: '' });
  };

  const handleConfirmGoToKey = () => {
    const keyName = goToKeyDialog.keyName.trim();
    if (keyName) {
      handleKeySelect(keyName);
      setGoToKeyDialog({ open: false, keyName: '' });
    }
  };

  const handleKeyDelete = (keyName: string) => {
    console.log('🔄 handleKeyDelete chamado para:', keyName);
    console.log('🔄 Estado atual do deleteDialog:', deleteDialog);
    setDeleteDialog({
      open: true,
      keyName,
      type: 'single'
    });
    console.log('✅ Modal de exclusão deve estar aberto agora');
  };

  const handleConfirmDelete = async () => {
    if (deleteDialog.type === 'single' && deleteDialog.keyName) {
      await dispatch(deleteKey(deleteDialog.keyName));
      // Se estamos na visualização de conteúdo, voltar para navegação
      if (currentView === 'content') {
        setCurrentView('navigation');
      }
      handleRefresh();
    } else if (deleteDialog.type === 'bulk' && deleteDialog.keyNames) {
      try {
        // Deletar chaves em paralelo para melhor performance
        await Promise.all(deleteDialog.keyNames.map(keyName => dispatch(deleteKey(keyName))));
        handleRefresh();
      } catch (error) {
        console.error('Bulk delete failed:', error);
      }
    }
    setDeleteDialog({ open: false, type: 'single' });
  };

  const handleBulkKeyDelete = (keyNames: string[]) => {
    setDeleteDialog({
      open: true,
      keyNames,
      type: 'bulk'
    });
  };

  const getTypeColor = (type: RedisDataType) => {
    const colors = {
      string: 'primary',
      hash: 'secondary',
      list: 'success',
      set: 'warning',
      zset: 'info',
      stream: 'error',
      json: 'default',
    } as const;
    return colors[type] || 'default';
  };

  const formatSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!activeConnection) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <Typography variant="h6" color="text.secondary">
          No active Redis connection
        </Typography>
      </Box>
    );
  }

  // Renderização condicional baseada no estado atual
  if (currentView === 'content' && selectedKey) {
    return (
      <Box height="100%" display="flex" flexDirection="column">
        {/* Header da visualização de conteúdo */}
        <Box
          display="flex"
          alignItems="flex-start"
          gap={1}
          mb={2}
          sx={{ flexShrink: 0 }}
        >
          <IconButton onClick={handleBackToNavigation} sx={{ mt: 0.5 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography 
            variant="h6" 
            sx={{ 
              flexGrow: 1, 
              wordBreak: 'break-all',
              overflowWrap: 'break-word',
              lineHeight: 1.4
            }}
          >
            {selectedKey}
          </Typography>
        </Box>

        {/* Conteúdo da chave em tela cheia */}
        <Box sx={{ flexGrow: 1, minHeight: 0 }}>
          {isLoadingValue ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
              <CircularProgress />
            </Box>
          ) : selectedValue ? (
            <ValueEditor 
              keyName={selectedKey}
              value={selectedValue}
              onSave={() => {
                handleRefresh();
                dispatch(fetchValue(selectedKey));
              }}
              onDelete={() => {
                console.log('🗑️ Botão excluir clicado na visualização de conteúdo para:', selectedKey);
                handleKeyDelete(selectedKey);
              }}
            />
          ) : (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
              <Typography color="text.secondary">
                Failed to load value for key: {selectedKey}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Modal de Confirmação de Delete - Sempre renderizado */}
        <Dialog
          open={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, type: 'single' })}
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-description"
        >
          <DialogTitle id="delete-dialog-title" sx={{ color: 'error.main' }}>
            Confirmar Exclusão
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="delete-dialog-description">
              {deleteDialog.type === 'single' && deleteDialog.keyName ? (
                <>Tem certeza que deseja excluir a chave <strong>"{deleteDialog.keyName}"</strong>?</>
              ) : deleteDialog.type === 'bulk' && deleteDialog.keyNames ? (
                <>Tem certeza que deseja excluir <strong>{deleteDialog.keyNames.length} chave{deleteDialog.keyNames.length > 1 ? 's' : ''}</strong>?</>
              ) : null}
              <br /><br />
              Esta ação não pode ser desfeita.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setDeleteDialog({ open: false, type: 'single' })}
              color="inherit"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmDelete}
              color="error"
              variant="contained"
              autoFocus
            >
              Excluir
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  return (
    <Box height="100%" display="flex" flexDirection="column">
      {error && (
        <Alert severity="error" sx={{ mb: 2, flexShrink: 0 }}>
          {error}
        </Alert>
      )}

      {/* Navegação de chaves em tela cheia */}
      <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Keys</Typography>
            <Box display="flex" gap={1} alignItems="center">
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(_, newMode) => newMode && setViewMode(newMode)}
                size="small"
              >
                <ToggleButton value="list">
                  <Tooltip title="List View">
                    <ViewListIcon />
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="tree">
                  <Tooltip title="Tree View">
                    <TreeViewIcon />
                  </Tooltip>
                </ToggleButton>
              </ToggleButtonGroup>
              
              <Tooltip title="Refresh (1000 keys)">
                <IconButton onClick={handleRefresh} disabled={isLoading || loadingProgress.isActive}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Download All Keys">
                <IconButton 
                  onClick={handleLoadAllKeys} 
                  disabled={isLoading || loadingProgress.isActive}
                  color={totalKeys && loadingProgress.phase === 'complete' ? "success" : "default"}
                >
                  <LoadAllIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Go to Key">
                <IconButton 
                  onClick={handleGoToKey} 
                  disabled={isLoading || loadingProgress.isActive}
                >
                  <KeyIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <TextField
            fullWidth
            placeholder="Search pattern (e.g., user:*, *session*)"
            value={localSearchPattern}
            onChange={(e) => setLocalSearchPattern(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={handleSearch} disabled={isLoading}>
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          {viewMode === 'tree' && keys.length > 0 && (
            <Box mb={2}>
              <SeparatorSelector
                detectedSeparator={detectedSeparator}
                customSeparator={customSeparator}
                onSeparatorChange={setCustomSeparator}
              />


            </Box>
          )}

          <Box mb={1}>
            {viewMode === 'tree' && keys.length > 0 ? (
              <TreeStats
                keys={keys}
                treeNodes={treeNodes}
                separator={activeSeparator}
              />
            ) : (
              <Typography variant="body2" color="text.secondary">
                {keys.length} keys found
              </Typography>
            )}
          </Box>

          <Box sx={{ flexGrow: 1, minHeight: 0, overflow: 'hidden' }}>
            {isLoading || isLoadingAllKeys ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <CircularProgress />
              </Box>
            ) : viewMode === 'tree' ? (
              <TreeView
                nodes={treeNodes}
                selectedKey={null}
                onKeySelect={handleKeySelect}
                onKeyDelete={handleKeyDelete}
                onBulkKeyDelete={handleBulkKeyDelete}
                expandedNodes={treeExpandedNodes}
                onToggleExpand={toggleExpand}
                onExpandAllChildren={expandAllChildren}
                onCollapseAllChildren={collapseAllChildren}
              />
            ) : (
              <VirtualizedKeysList
                keys={keys}
                selectedKey={selectedKey}
                onKeySelect={handleKeySelect}
                onKeyDelete={handleKeyDelete}
                height={600} // Fixed height for virtualization
              />
            )}
              </Box>
            </CardContent>
          </Card>

          {/* Modal de Confirmação de Delete - Para visualização de navegação */}
          <Dialog
            open={deleteDialog.open}
            onClose={() => setDeleteDialog({ open: false, type: 'single' })}
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-description"
          >
            <DialogTitle id="delete-dialog-title" sx={{ color: 'error.main' }}>
              Confirmar Exclusão
            </DialogTitle>
            <DialogContent>
              <DialogContentText id="delete-dialog-description">
                {deleteDialog.type === 'single' && deleteDialog.keyName ? (
                  <>Tem certeza que deseja excluir a chave <strong>"{deleteDialog.keyName}"</strong>?</>
                ) : deleteDialog.type === 'bulk' && deleteDialog.keyNames ? (
                  <>Tem certeza que deseja excluir <strong>{deleteDialog.keyNames.length} chave{deleteDialog.keyNames.length > 1 ? 's' : ''}</strong>?</>
                ) : null}
                <br /><br />
                Esta ação não pode ser desfeita.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button 
                onClick={() => setDeleteDialog({ open: false, type: 'single' })}
                color="inherit"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleConfirmDelete}
                color="error"
                variant="contained"
                autoFocus
              >
                Excluir
              </Button>
            </DialogActions>
          </Dialog>

          {/* Loading Progress Modal */}
          <LoadingProgressModal
            open={(loadingProgress.isActive && loadingProgress.phase !== 'cancelled') || loadingProgress.phase === 'complete'}
            phase={loadingProgress.phase}
            message={loadingProgress.message}
            progress={loadingProgress.progress}
            total={loadingProgress.total}
            current={loadingProgress.current}
            startTime={loadingProgress.startTime}
            jsonData={loadedKeysJson.json}
            fileName={loadedKeysJson.fileName}
            onCancel={loadingProgress.phase === 'complete' ? () => {
              dispatch(resetLoadingProgress());
              dispatch(clearLoadedKeysJson());
            } : handleCancelLoading}
          />

          {/* Error Modal */}
          <ErrorModal
            open={errorModal.open}
            message={errorModal.message}
            details={errorModal.details}
            onClose={closeErrorModal}
          />

          {/* Go to Key Modal */}
          <Dialog
            open={goToKeyDialog.open}
            onClose={() => setGoToKeyDialog({ open: false, keyName: '' })}
            aria-labelledby="go-to-key-dialog-title"
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle id="go-to-key-dialog-title">
              Acessar Chave Específica
            </DialogTitle>
            <DialogContent>
              <DialogContentText sx={{ mb: 2 }}>
                Digite o nome exato da chave que deseja visualizar:
              </DialogContentText>
              <TextField
                autoFocus
                fullWidth
                label="Nome da Chave"
                placeholder="ex: user:123"
                value={goToKeyDialog.keyName}
                onChange={(e) => setGoToKeyDialog({ ...goToKeyDialog, keyName: e.target.value })}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleConfirmGoToKey();
                  }
                }}
                sx={{ mt: 1 }}
              />
            </DialogContent>
            <DialogActions>
              <Button 
                onClick={() => setGoToKeyDialog({ open: false, keyName: '' })}
                color="inherit"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleConfirmGoToKey}
                color="primary"
                variant="contained"
                disabled={!goToKeyDialog.keyName.trim()}
              >
                Abrir
              </Button>
            </DialogActions>
          </Dialog>
    </Box>
  );
};

export default KeysBrowser;
