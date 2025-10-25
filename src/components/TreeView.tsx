'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Collapse,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Alert,
  CircularProgress,
  Backdrop,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  Delete as DeleteIcon,
  Storage as StorageIcon,
  UnfoldMore as ExpandAllChildrenIcon,
  UnfoldLess as CollapseAllChildrenIcon,
} from '@mui/icons-material';
import { TreeNode } from '@/types/tree';
import { RedisDataType } from '@/types/redis';
import { formatTTL } from '@/utils/timeFormatter';
import KeyTypeIcon from './KeyTypeIcon';
import { useDispatch } from 'react-redux';
import { removeKeysLocally } from '@/store/slices/keysSlice';
import { AppDispatch } from '@/store/store';

interface TreeViewProps {
  nodes: TreeNode[];
  selectedKey: string | null;
  onKeySelect: (key: string) => void;
  onKeyDelete: (key: string) => void;
  onBulkKeyDelete?: (keys: string[]) => void;
  expandedNodes: Set<string>;
  onToggleExpand: (nodeId: string) => void;
  onExpandAllChildren?: (nodeId: string) => void;
  onCollapseAllChildren?: (nodeId: string) => void;
  separator?: string;
}

const TreeView = ({
  nodes,
  selectedKey,
  onKeySelect,
  onKeyDelete,
  onBulkKeyDelete,
  expandedNodes,
  onToggleExpand,
  onExpandAllChildren,
  onCollapseAllChildren,
  separator = '::',
}: TreeViewProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    folderName?: string;
    folderPrefix?: string;
  }>({ open: false });
  const [loading, setLoading] = useState(false);
  const [successDialog, setSuccessDialog] = useState<{
    open: boolean;
    deletedCount?: number;
    folderName?: string;
  }>({ open: false });
  
  const handleFolderDelete = (folderNode: TreeNode) => {
    setDeleteDialog({
      open: true,
      folderName: folderNode.name,
      folderPrefix: folderNode.fullPath,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.folderPrefix) return;
    
    setDeleteDialog({ open: false });
    setLoading(true);
    
    try {
      console.log(`🗑️ Excluindo todas as chaves com prefixo "${deleteDialog.folderPrefix}"`);
      
      const response = await fetch(
        `/api/redis/keys/prefix?prefix=${encodeURIComponent(deleteDialog.folderPrefix)}&separator=${encodeURIComponent(separator)}`,
        { method: 'DELETE' }
      );
      
      if (!response.ok) {
        throw new Error('Falha ao excluir chaves');
      }
      
      const data = await response.json();
      console.log(`✅ ${data.deletedCount} chave(s) excluída(s) com sucesso no Redis`);
      
      // Remover chaves do Redux localmente (sem chamar backend)
      if (deleteDialog.folderPrefix) {
        const prefix = deleteDialog.folderPrefix;
        
        // Coletar todas as chaves da árvore que começam com o prefixo
        const keysToRemove: string[] = [];
        const collectKeysFromNodes = (nodeList: TreeNode[]) => {
          nodeList.forEach(node => {
            // Match exato da pasta ou suas chaves filhas
            // "portal" == "portal" OU "portal::xxx".startsWith("portal::")
            const isExactFolder = node.fullPath === prefix;
            const isChildKey = node.fullPath.startsWith(`${prefix}${separator}`);
            
            if (isExactFolder || isChildKey) {
              if (node.type === 'key') {
                keysToRemove.push(node.fullPath);
              }
              if (node.children) {
                collectKeysFromNodes(node.children);
              }
            } else if (node.children) {
              // CORREÇÃO: Continuar buscando recursivamente mesmo que este nó não corresponda
              // Isso garante que pastas filhas aninhadas sejam encontradas
              collectKeysFromNodes(node.children);
            }
          });
        };
        
        collectKeysFromNodes(nodes);
        
        console.log(`🗑️ Removendo ${keysToRemove.length} chave(s) do Redux (prefixo: "${prefix}")`);
        dispatch(removeKeysLocally(keysToRemove));
      }
      
      setLoading(false);
      setSuccessDialog({
        open: true,
        deletedCount: data.deletedCount,
        folderName: deleteDialog.folderName,
      });
    } catch (error) {
      console.error('❌ Erro ao excluir chaves da pasta:', error);
      setLoading(false);
      alert('Erro ao excluir pasta. Tente novamente.');
    }
  };
  
  const collectAllKeys = (node: TreeNode): string[] => {
    const keys: string[] = [];
    
    if (node.type === 'key') {
      keys.push(node.fullPath);
    } else if (node.children) {
      node.children.forEach(child => {
        keys.push(...collectAllKeys(child));
      });
    }
    
    return keys;
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

  const renderNode = (node: TreeNode, depth: number = 0): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    // Comparação mais robusta, normalizando strings
    const isSelected = selectedKey && node.fullPath && 
      String(selectedKey).trim() === String(node.fullPath).trim();

    return (
      <Box key={node.id}>
        <ListItem
          onClick={() => {
            if (node.type === 'key') {
              onKeySelect(node.fullPath);
            } else {
              onToggleExpand(node.id);
            }
          }}
          sx={{
            pl: 2 + depth * 2,
            cursor: 'pointer',
            borderRadius: 1,
            mb: 0.5,
            backgroundColor: isSelected ? 'rgba(25, 118, 210, 0.12)' : 'transparent',
            color: isSelected ? 'primary.main' : 'inherit',
            border: isSelected ? '1px solid' : '1px solid transparent',
            borderColor: isSelected ? 'primary.main' : 'transparent',
            '&:hover': {
              backgroundColor: isSelected ? 'rgba(25, 118, 210, 0.16)' : 'action.hover',
            },
            '& .MuiListItemIcon-root': {
              color: isSelected ? 'primary.main' : 'inherit',
            },
            '& .MuiChip-root': {
              backgroundColor: isSelected ? 'primary.main' : 'default',
              color: isSelected ? 'white' : 'inherit',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            {node.type === 'folder' ? (
              hasChildren ? (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleExpand(node.id);
                  }}
                  sx={{ p: 0.5 }}
                >
                  {isExpanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                </IconButton>
              ) : (
                <Box sx={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isExpanded ? <FolderOpenIcon fontSize="small" /> : <FolderIcon fontSize="small" />}
                </Box>
              )
            ) : node.keyData ? (
              <KeyTypeIcon type={node.keyData.type} fontSize="small" />
            ) : (
              <StorageIcon fontSize="small" color="primary" />
            )}
          </ListItemIcon>

          <ListItemText
            primary={
              <Box display="flex" alignItems="center" gap={1}>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: node.type === 'key' ? 'monospace' : 'inherit',
                    fontWeight: node.type === 'folder' ? 500 : 400,
                    wordBreak: 'break-all',
                  }}
                >
                  {node.name}
                </Typography>
                {node.type === 'key' && node.keyData && (
                  <Chip
                    label={node.keyData.type}
                    size="small"
                    color={getTypeColor(node.keyData.type)}
                  />
                )}
                {node.type === 'folder' && hasChildren && (
                  <Chip
                    label={`${node.children!.length} items`}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
            }
            secondary={
              node.type === 'key' && node.keyData ? (
                <span style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <Typography variant="caption" component="span">
                    Size: {formatSize(node.keyData.size)}
                  </Typography>
                  <Typography variant="caption" component="span">
                    TTL: {formatTTL(node.keyData.ttl)}
                  </Typography>
                </span>
              ) : null
            }
          />

          <ListItemSecondaryAction>
            <Box display="flex" alignItems="center" gap={0.5}>
              {/* Botões de Expand/Collapse Children para pastas */}
              {node.type === 'folder' && hasChildren && onExpandAllChildren && onCollapseAllChildren && (
                <>
                  <Tooltip title="Expand All Children">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onExpandAllChildren(node.id);
                      }}
                      color="primary"
                    >
                      <ExpandAllChildrenIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Collapse All Children">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCollapseAllChildren(node.id);
                      }}
                      color="primary"
                    >
                      <CollapseAllChildrenIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              )}
              
              {/* Botão de Delete */}
              <Tooltip title={node.type === 'key' ? 'Delete key' : 'Delete all keys in folder'}>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (node.type === 'key') {
                      onKeyDelete(node.fullPath);
                    } else {
                      // Para pastas, deletar todas as chaves dentro
                      handleFolderDelete(node);
                    }
                  }}
                  color="error"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </ListItemSecondaryAction>
        </ListItem>

        {node.type === 'folder' && hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {node.children!.map((child) => renderNode(child, depth + 1))}
            </List>
          </Collapse>
        )}
      </Box>
    );
  };

  return (
    <>
      <List sx={{ width: '100%', height: '100%', overflow: 'auto' }}>
        {nodes.map((node) => renderNode(node))}
      </List>

      {/* Modal de Confirmação de Delete de Pasta */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false })}
        aria-labelledby="delete-folder-dialog-title"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle 
          id="delete-folder-dialog-title" 
          sx={{ 
            color: 'error.main',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <DeleteIcon />
          Confirmar Exclusão de Pasta
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Tem certeza que deseja excluir <strong>todas as chaves</strong> na pasta <strong>"{deleteDialog.folderName}"</strong>?
          </DialogContentText>
          <Alert severity="warning" sx={{ mb: 2 }}>
            ⚠️ Esta ação não pode ser desfeita!
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Todas as chaves dentro desta pasta serão permanentemente removidas do Redis.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={() => setDeleteDialog({ open: false })}
            variant="outlined"
            color="inherit"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            autoFocus
          >
            Excluir Pasta
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Loading */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress color="inherit" size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Excluindo chaves...
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Por favor, aguarde
          </Typography>
        </Box>
      </Backdrop>

      {/* Modal de Sucesso */}
      <Dialog
        open={successDialog.open}
        onClose={() => setSuccessDialog({ open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: 'success.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          ✅ Exclusão Concluída
        </DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 2 }}>
            <strong>{successDialog.deletedCount}</strong> chave{successDialog.deletedCount && successDialog.deletedCount > 1 ? 's foram' : ' foi'} excluída{successDialog.deletedCount && successDialog.deletedCount > 1 ? 's' : ''} com sucesso!
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Todas as chaves da pasta <strong>"{successDialog.folderName}"</strong> foram removidas do Redis.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setSuccessDialog({ open: false })}
            variant="contained"
            color="success"
            autoFocus
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TreeView;
