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
  };
}
