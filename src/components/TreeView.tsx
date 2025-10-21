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
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  Delete as DeleteIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';
import { TreeNode } from '@/types/tree';
import { RedisDataType } from '@/types/redis';
import { formatTTL } from '@/utils/timeFormatter';
import KeyTypeIcon from './KeyTypeIcon';

interface TreeViewProps {
  nodes: TreeNode[];
  selectedKey: string | null;
  onKeySelect: (key: string) => void;
  onKeyDelete: (key: string) => void;
  onBulkKeyDelete?: (keys: string[]) => void;
  expandedNodes: Set<string>;
  onToggleExpand: (nodeId: string) => void;
}

const TreeView = ({
  nodes,
  selectedKey,
  onKeySelect,
  onKeyDelete,
  onBulkKeyDelete,
  expandedNodes,
  onToggleExpand,
}: TreeViewProps) => {
  
  const handleFolderDelete = (folderNode: TreeNode) => {
    const keysToDelete = collectAllKeys(folderNode);
    const keyCount = keysToDelete.length;
    
    if (keyCount === 0) {
      alert('No keys found in this folder.');
      return;
    }
    
    if (confirm(`Are you sure you want to delete ${keyCount} key${keyCount > 1 ? 's' : ''} in folder "${folderNode.name}"?\n\nThis action cannot be undone.`)) {
      if (onBulkKeyDelete && keyCount > 1) {
        // Use bulk delete for better performance
        onBulkKeyDelete(keysToDelete);
      } else {
        // Fallback to individual deletes
        keysToDelete.forEach(keyPath => {
          onKeyDelete(keyPath);
        });
      }
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
    <List sx={{ width: '100%', height: '100%', overflow: 'auto' }}>
      {nodes.map((node) => renderNode(node))}
    </List>
  );
};

export default TreeView;
