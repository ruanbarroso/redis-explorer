'use client';

import { Box, Chip, Typography } from '@mui/material';
import { TreeNode } from '@/types/tree';
import { RedisKey } from '@/types/redis';

interface TreeStatsProps {
  keys: RedisKey[];
  treeNodes: TreeNode[];
  separator: string;
}

export default function TreeStats({ keys, treeNodes, separator }: TreeStatsProps) {
  const countNodesByType = (nodes: TreeNode[]): { folders: number; keys: number } => {
    let folders = 0;
    let keyCount = 0;

    const traverse = (nodeList: TreeNode[]) => {
      nodeList.forEach(node => {
        if (node.type === 'folder') {
          folders++;
          if (node.children) {
            traverse(node.children);
          }
        } else {
          keyCount++;
        }
      });
    };

    traverse(nodes);
    return { folders, keys: keyCount };
  };

  const getTypeStats = () => {
    const typeCount: { [key: string]: number } = {};
    keys.forEach(key => {
      typeCount[key.type] = (typeCount[key.type] || 0) + 1;
    });
    return typeCount;
  };

  const { folders, keys: keyCount } = countNodesByType(treeNodes);
  const typeStats = getTypeStats();

  return (
    <Box display="flex" flexWrap="wrap" gap={1} alignItems="center">
      <Chip
        label={`${keyCount} keys`}
        size="small"
        color="primary"
        variant="outlined"
      />
      <Chip
        label={`${folders} folders`}
        size="small"
        color="secondary"
        variant="outlined"
      />
      <Chip
        label={`Separator: "${separator}"`}
        size="small"
        variant="outlined"
      />
      {Object.entries(typeStats).map(([type, count]) => (
        <Chip
          key={type}
          label={`${type}: ${count}`}
          size="small"
          variant="outlined"
        />
      ))}
    </Box>
  );
}
