import { RedisKey, RedisDataType } from './redis';

export interface TreeNode {
  id: string;
  name: string;
  fullPath: string;
  type: 'folder' | 'key';
  children?: TreeNode[];
  keyData?: RedisKey;
  expanded?: boolean;
  level: number;
}

export interface TreeViewProps {
  keys: RedisKey[];
  selectedKey: string | null;
  onKeySelect: (key: string) => void;
  onKeyDelete: (key: string) => void;
  onBulkKeyDelete?: (keys: string[]) => void;
  separator?: string;
}
