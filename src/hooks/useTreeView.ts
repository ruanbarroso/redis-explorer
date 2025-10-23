import { useState, useMemo } from 'react';
import { RedisKey } from '@/types/redis';
import { TreeNode } from '@/types/tree';
import { TreeBuilder } from '@/utils/treeBuilder';

export function useTreeView(keys: RedisKey[], initialSeparator?: string) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('tree');
  const [customSeparator, setCustomSeparator] = useState<string | undefined>(initialSeparator);

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
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    const allNodeIds = new Set<string>();
    
    const collectNodeIds = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        if (node.type === 'folder' && node.children) {
          allNodeIds.add(node.id);
          collectNodeIds(node.children);
        }
      });
    };
    
    collectNodeIds(treeNodes);
    setExpandedNodes(allNodeIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const expandToKey = (keyPath: string) => {
    const parts = keyPath.split(activeSeparator);
    const nodesToExpand = new Set<string>();
    
    let currentPath = '';
    parts.slice(0, -1).forEach(part => {
      currentPath = currentPath ? `${currentPath}${activeSeparator}${part}` : part;
      nodesToExpand.add(currentPath);
    });
    
    setExpandedNodes(prev => new Set([...prev, ...nodesToExpand]));
  };

  const expandAllChildren = (parentNodeId: string) => {
    console.log('🌳 Expandindo todos os filhos de:', parentNodeId);
    const childNodeIds = new Set<string>();
    
    const findAndCollectChildren = (nodes: TreeNode[], targetId: string): boolean => {
      for (const node of nodes) {
        if (node.id === targetId) {
          // Encontrou o nó pai, agora coleta todos os filhos
          const collectAllChildren = (childNodes: TreeNode[]) => {
            childNodes.forEach(child => {
              if (child.type === 'folder' && child.children) {
                childNodeIds.add(child.id);
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
    childNodeIds.add(parentNodeId);
    
    console.log('✅ Nós encontrados para expandir (incluindo pai):', Array.from(childNodeIds));
    // Adiciona os novos nós expandidos aos já existentes
    setExpandedNodes(prev => new Set([...prev, ...childNodeIds]));
  };

  const collapseAllChildren = (parentNodeId: string) => {
    console.log('🌳 Colapsando todos os filhos de:', parentNodeId);
    const childNodeIds = new Set<string>();
    
    const findAndCollectChildren = (nodes: TreeNode[], targetId: string): boolean => {
      for (const node of nodes) {
        if (node.id === targetId) {
          // Encontrou o nó pai, agora coleta todos os filhos
          const collectAllChildren = (childNodes: TreeNode[]) => {
            childNodes.forEach(child => {
              if (child.type === 'folder' && child.children) {
                childNodeIds.add(child.id);
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
    childNodeIds.add(parentNodeId);
    
    console.log('✅ Nós encontrados para colapsar (incluindo pai):', Array.from(childNodeIds));
    // Remove os nós filhos dos expandidos
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      childNodeIds.forEach(id => newSet.delete(id));
      return newSet;
    });
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
