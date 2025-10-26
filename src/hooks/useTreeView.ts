import { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RedisKey } from '@/types/redis';
import { TreeNode } from '@/types/tree';
import { TreeBuilder } from '@/utils/treeBuilder';
import { RootState, AppDispatch } from '@/store';
import { toggleTreeNode, expandTreeNodes, collapseTreeNodes, setViewMode as setViewModeAction } from '@/store/slices/keysSlice';

export function useTreeView(keys: RedisKey[], initialSeparator?: string) {
  const dispatch = useDispatch<AppDispatch>();
  const expandedNodesArray = useSelector((state: RootState) => state.keys.treeExpandedNodes);
  const expandedNodes = useMemo(() => new Set(expandedNodesArray), [expandedNodesArray]);
  const viewMode = useSelector((state: RootState) => state.keys.viewMode);
  const [customSeparator, setCustomSeparator] = useState<string | undefined>(initialSeparator);
  
  const setViewMode = (mode: 'list' | 'tree') => {
    dispatch(setViewModeAction(mode));
  };

  // Auto-detect separator if not provided - force recalculation
  const detectedSeparator = useMemo(() => {
    if (keys.length === 0) return ':';
    return TreeBuilder.detectSeparator(keys);
  }, [keys, keys.length]); // Added keys.length to force update

  // Use custom separator if set, otherwise use detected
  const activeSeparator = customSeparator || detectedSeparator;

  // Build tree structure
  const treeNodes = useMemo(() => {
    if (viewMode === 'list') return [];
    
    const builder = new TreeBuilder(activeSeparator);
    return builder.buildTree(keys);
  }, [keys, activeSeparator, viewMode]);

  const toggleExpand = (nodeId: string) => {
    dispatch(toggleTreeNode(nodeId));
  };

  const expandAll = () => {
    const allNodeIds: string[] = [];
    
    const collectNodeIds = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        if (node.type === 'folder' && node.children) {
          allNodeIds.push(node.id);
          collectNodeIds(node.children);
        }
      });
    };
    
    collectNodeIds(treeNodes);
    dispatch(expandTreeNodes(allNodeIds));
  };

  const collapseAll = () => {
    dispatch(collapseTreeNodes(expandedNodesArray));
  };

  const expandToKey = (keyPath: string) => {
    const parts = keyPath.split(activeSeparator);
    const nodesToExpand: string[] = [];
    
    let currentPath = '';
    parts.slice(0, -1).forEach(part => {
      currentPath = currentPath ? `${currentPath}${activeSeparator}${part}` : part;
      nodesToExpand.push(currentPath);
    });
    
    dispatch(expandTreeNodes(nodesToExpand));
  };

  const expandAllChildren = (parentNodeId: string) => {
    console.log('🌳 Expandindo todos os filhos de:', parentNodeId);
    const childNodeIds: string[] = [];
    
    const findAndCollectChildren = (nodes: TreeNode[], targetId: string): boolean => {
      for (const node of nodes) {
        if (node.id === targetId) {
          // Encontrou o nó pai, agora coleta todos os filhos
          const collectAllChildren = (childNodes: TreeNode[]) => {
            childNodes.forEach(child => {
              if (child.type === 'folder' && child.children) {
                childNodeIds.push(child.id);
                collectAllChildren(child.children);
              }
            });
          };
          
          if (node.children) {
            collectAllChildren(node.children);
          }
          return true;
        }
        
        if (node.children && findAndCollectChildren(node.children, targetId)) {
          return true;
        }
      }
      return false;
    };
    
    findAndCollectChildren(treeNodes, parentNodeId);
    
    // Adiciona o próprio nó pai à lista de nós para expandir
    childNodeIds.push(parentNodeId);
    
    console.log('✅ Nós encontrados para expandir (incluindo pai):', childNodeIds);
    dispatch(expandTreeNodes(childNodeIds));
  };

  const collapseAllChildren = (parentNodeId: string) => {
    console.log('🌳 Colapsando todos os filhos de:', parentNodeId);
    const childNodeIds: string[] = [];
    
    const findAndCollectChildren = (nodes: TreeNode[], targetId: string): boolean => {
      for (const node of nodes) {
        if (node.id === targetId) {
          // Encontrou o nó pai, agora coleta todos os filhos
          const collectAllChildren = (childNodes: TreeNode[]) => {
            childNodes.forEach(child => {
              if (child.type === 'folder' && child.children) {
                childNodeIds.push(child.id);
                collectAllChildren(child.children);
              }
            });
          };
          
          if (node.children) {
            collectAllChildren(node.children);
          }
          return true;
        }
        
        if (node.children && findAndCollectChildren(node.children, targetId)) {
          return true;
        }
      }
      return false;
    };
    
    findAndCollectChildren(treeNodes, parentNodeId);
    
    // Adiciona o próprio nó pai à lista de nós para colapsar
    childNodeIds.push(parentNodeId);
    
    console.log('✅ Nós encontrados para colapsar (incluindo pai):', childNodeIds);
    dispatch(collapseTreeNodes(childNodeIds));
  };

  return {
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
    expandAllChildren,
    collapseAllChildren,
  };
}
