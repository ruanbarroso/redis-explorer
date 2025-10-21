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
  const {
    keys,
    selectedKey,
    selectedValue,
    searchPattern,
    isLoading,
    isLoadingValue,
    error,
  } = useSelector((state: RootState) => state.keys);
  const { activeConnection } = useSelector((state: RootState) => state.connection);

  const [localSearchPattern, setLocalSearchPattern] = useState(searchPattern);
  
  // Tree view functionality
  const {
    treeNodes,
    expandedNodes,
    viewMode,
    detectedSeparator,
    activeSeparator,
    customSeparator,
    setViewMode,
    setCustomSeparator,
    toggleExpand,
    expandAll,
    collapseAll,
    expandToKey,
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
    
    // Auto-expand tree to show selected key
    if (viewMode === 'tree') {
      expandToKey(keyName);
    }
  };

  const handleKeyDelete = async (keyName: string) => {
    if (confirm(`Are you sure you want to delete key "${keyName}"?`)) {
      await dispatch(deleteKey(keyName));
      handleRefresh();
    }
  };

  const handleBulkKeyDelete = async (keyNames: string[]) => {
    const keyCount = keyNames.length;
    if (confirm(`Are you sure you want to delete ${keyCount} key${keyCount > 1 ? 's' : ''}?`)) {
      try {
        // Deletar chaves em paralelo para melhor performance
        await Promise.all(keyNames.map(keyName => dispatch(deleteKey(keyName))));
        handleRefresh();
      } catch (error) {
        console.error('Error deleting keys:', error);
        // Mesmo com erro, atualizar a lista para refletir o estado atual
        handleRefresh();
      }
    }
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

  return (
    <Box height="100%" display="flex" flexDirection="column">
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ height: '100%' }}>
        <Grid item xs={12} md={3} sx={{ height: '100%' }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
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
                    selectedKey={selectedKey}
                    onKeySelect={handleKeySelect}
                    onKeyDelete={handleKeyDelete}
                    onBulkKeyDelete={handleBulkKeyDelete}
                    expandedNodes={expandedNodes}
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
                          backgroundColor: selectedKey === key.name ? 'rgba(25, 118, 210, 0.12)' : 'transparent',
                          color: selectedKey === key.name ? 'primary.main' : 'inherit',
                          border: selectedKey === key.name ? '1px solid' : '1px solid transparent',
                          borderColor: selectedKey === key.name ? 'primary.main' : 'transparent',
                          '&:hover': {
                            backgroundColor: selectedKey === key.name ? 'rgba(25, 118, 210, 0.16)' : 'action.hover',
                          },
                          '& .MuiChip-root': {
                            backgroundColor: selectedKey === key.name ? 'primary.main' : 'default',
                            color: selectedKey === key.name ? 'white' : 'inherit',
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
        </Grid>

        <Grid item xs={12} md={9} sx={{ height: '100%' }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              {selectedKey ? (
                <>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>
                      {selectedKey}
                    </Typography>
                    {selectedValue && (
                      <Chip
                        label={selectedValue.type}
                        color={getTypeColor(selectedValue.type)}
                      />
                    )}
                  </Box>

                  {isLoadingValue ? (
                    <Box display="flex" justifyContent="center" alignItems="center" flexGrow={1}>
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
                    <Box display="flex" justifyContent="center" alignItems="center" flexGrow={1}>
                      <Typography color="text.secondary">
                        Failed to load value
                      </Typography>
                    </Box>
                  )}
                </>
              ) : (
                <Box display="flex" justifyContent="center" alignItems="center" flexGrow={1}>
                  <Typography variant="h6" color="text.secondary">
                    Select a key to view its value
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default KeysBrowser;
