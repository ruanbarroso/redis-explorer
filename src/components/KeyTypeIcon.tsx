'use client';

import {
  TextFields as StringIcon,
  ViewModule as HashIcon,
  FormatListBulleted as ListIcon,
  Category as SetIcon,
  Sort as ZSetIcon,
  Timeline as StreamIcon,
  DataObject as JsonIcon,
  Storage as DefaultIcon,
} from '@mui/icons-material';
import { RedisDataType } from '@/types/redis';

interface KeyTypeIconProps {
  type: RedisDataType;
  fontSize?: 'small' | 'medium' | 'large';
}

export default function KeyTypeIcon({ type, fontSize = 'small' }: KeyTypeIconProps) {
  const getIcon = () => {
    switch (type) {
      case 'string':
        return <StringIcon fontSize={fontSize} color="primary" />;
      case 'hash':
        return <HashIcon fontSize={fontSize} color="secondary" />;
      case 'list':
        return <ListIcon fontSize={fontSize} color="success" />;
      case 'set':
        return <SetIcon fontSize={fontSize} color="warning" />;
      case 'zset':
        return <Sort fontSize={fontSize} color="info" />;
      case 'stream':
        return <StreamIcon fontSize={fontSize} color="error" />;
      case 'json':
        return <JsonIcon fontSize={fontSize} />;
      default:
        return <DefaultIcon fontSize={fontSize} />;
    }
  };

  return getIcon();
}
