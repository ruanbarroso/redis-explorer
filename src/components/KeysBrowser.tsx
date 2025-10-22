'use client';

import { useEffect, useState } from 'react';
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
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ViewList as ViewListIcon,
  AccountTree as TreeViewIcon,
  ExpandMore as ExpandAllIcon,
  UnfoldLess as CollapseAllIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import {
  fetchKeys,
  fetchValue,
  setSearchPattern,
  setSelectedKey,
  deleteKey,
} from '@/store/slices/keysSlice';
import ValueEditor from './ValueEditor';
import TreeView from './TreeView';
import TreeStats from './TreeStats';
import SeparatorSelector from './SeparatorSelector';
import { useTreeView } from '@/hooks/useTreeView';
import { RedisDataType } from '@/types/redis';
import { formatTTL } from '@/utils/timeFormatter';

const KeysBrowser = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { keys, selectedKey, selectedValue, searchPattern, isLoading, error } = useSelector(
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
  const {
    treeNodes,
    detectedSeparator,
    customSeparator,
    setCustomSeparator,
    activeSeparator,
    expandedNodes: treeExpandedNodes,
    toggleExpand,
    expandAll,
    collapseAll
  } = useTreeView(keys);

  useEffect(() => {
    if (activeConnection) {
      handleRefresh();
    }
  }, [activeConnection]);

  const handleRefresh = () => {
    if (activeConnection) {
      dispatch(fetchKeys({ pattern: searchPattern, count: 1000 }));
    }
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

  const handleKeyDelete = (keyName: string) => {
    setDeleteDialog({
      open: true,
      keyName,
      type: 'single'
    });
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
          alignItems="center" 
          gap={2} 
          mb={2}
          sx={{ flexShrink: 0 }}
        >
          <IconButton onClick={handleBackToNavigation}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {selectedKey}
          </Typography>
          <IconButton 
            onClick={() => handleKeyDelete(selectedKey)} 
            color="error"
            size="small"
          >
            <DeleteIcon />
          </IconButton>
        </Box>

        {/* Conteúdo da chave em tela cheia */}
        <Box sx={{ flexGrow: 1, minHeight: 0 }}>
          {isLoading ? (
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
            />
          ) : (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
              <Typography color="text.secondary">
                Failed to load value for key: {selectedKey}
              </Typography>
            </Box>
          )}
        </Box>
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
              
              {viewMode === 'tree' && (
                <>
                  <Tooltip title="Expand All">
                    <IconButton onClick={expandAll} size="small">
                      <ExpandAllIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Collapse All">
                    <IconButton onClick={collapseAll} size="small">
                      <CollapseAllIcon />
                    </IconButton>
                  </Tooltip>
                </>
              )}
              
              <IconButton onClick={handleRefresh} disabled={isLoading}>
                <RefreshIcon />
              </IconButton>
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

          <Box sx={{ flexGrow: 1, overflow: 'hidden', height: 0 }}>
            {isLoading ? (
              <Box display="flex" justifyContent="center" p={2}>
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
              />
            ) : (
              <List sx={{ height: '100%', overflow: 'auto' }}>
                {keys.map((key) => (
                  <ListItem
                        key={key.name}
                        onClick={() => handleKeySelect(key.name)}
                        divider
                        sx={{ 
                          cursor: 'pointer',
                          borderRadius: 1,
                          mb: 0.5,
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          },
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily: 'monospace',
                                  wordBreak: 'break-all',
                                }}
                              >
                                {key.name}
                              </Typography>
                              <Chip
                                label={key.type}
                                size="small"
                                color={getTypeColor(key.type)}
                              />
                            </Box>
                          }
                          secondary={
                            <span style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                              <Typography variant="caption" component="span">
                                Size: {formatSize(key.size)}
                              </Typography>
                              <Typography variant="caption" component="span">
                                TTL: {formatTTL(key.ttl)}
                              </Typography>
                            </span>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleKeyDelete(key.name);
                            }}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Modal de Confirmação de Delete */}
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
};

export default KeysBrowser;
