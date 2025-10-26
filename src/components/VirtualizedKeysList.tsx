'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Box, List, ListItem, ListItemText, Typography, Chip } from '@mui/material';
import { RedisKey } from '@/types/redis';
import { formatTTL } from '@/utils/timeFormatter';

interface VirtualizedKeysListProps {
  keys: RedisKey[];
  selectedKey?: string;
  onKeySelect: (keyName: string) => void;
  onKeyDelete: (keyName: string) => void;
  height: number; // Height of the container
}

const ITEM_HEIGHT = 72; // Height of each list item
const BUFFER_SIZE = 5; // Number of items to render outside visible area

const VirtualizedKeysList = ({
  keys,
  selectedKey,
  onKeySelect,
  onKeyDelete,
  height,
}: VirtualizedKeysListProps) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const visibleStart = Math.floor(scrollTop / ITEM_HEIGHT);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(height / ITEM_HEIGHT),
      keys.length - 1
    );

    // Add buffer
    const start = Math.max(0, visibleStart - BUFFER_SIZE);
    const end = Math.min(keys.length - 1, visibleEnd + BUFFER_SIZE);

    return { start, end, visibleStart, visibleEnd };
  }, [scrollTop, height, keys.length]);

  // Get visible items
  const visibleItems = useMemo(() => {
    return keys.slice(visibleRange.start, visibleRange.end + 1);
  }, [keys, visibleRange.start, visibleRange.end]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'string':
        return 'primary';
      case 'hash':
        return 'secondary';
      case 'list':
        return 'success';
      case 'set':
        return 'warning';
      case 'zset':
        return 'info';
      default:
        return 'default';
    }
  };

  const totalHeight = keys.length * ITEM_HEIGHT;
  const offsetY = visibleRange.start * ITEM_HEIGHT;

  return (
    <Box
      ref={containerRef}
      sx={{
        height,
        overflow: 'auto',
        position: 'relative',
      }}
      onScroll={handleScroll}
    >
      {/* Virtual spacer for total height */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Visible items container */}
        <div
          style={{
            position: 'absolute',
            top: offsetY,
            left: 0,
            right: 0,
          }}
        >
          <List disablePadding>
            {visibleItems.map((key, index) => {
              const actualIndex = visibleRange.start + index;
              const isSelected = selectedKey === key.name;
              
              return (
                <ListItem
                  key={`${actualIndex}-${key.name}`}
                  sx={{
                    height: ITEM_HEIGHT,
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: isSelected ? 'rgba(25, 118, 210, 0.12)' : 'transparent',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: isSelected 
                        ? 'rgba(25, 118, 210, 0.2)' 
                        : 'rgba(255, 255, 255, 0.05)',
                    },
                  }}
                  onClick={() => onKeySelect(key.name)}
                >
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: 'monospace',
                            flexGrow: 1,
                            wordBreak: 'break-all',
                            overflowWrap: 'break-word',
                          }}
                        >
                          {key.name}
                        </Typography>
                        <Chip
                          label={key.type}
                          size="small"
                          color={getTypeColor(key.type) as any}
                          sx={{ minWidth: 60 }}
                        />
                      </Box>
                    }
                    secondary={
                      <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                          Size: {key.size?.toLocaleString() || 0}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                          TTL: {formatTTL(key.ttl)}
                        </span>
                      </span>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        </div>
      </div>
      
    </Box>
  );
};

export default VirtualizedKeysList;
