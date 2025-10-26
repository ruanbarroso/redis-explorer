'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Avatar,
} from '@mui/material';
import {
  Link as LinkIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, usePathname } from 'next/navigation';
import { RootState, AppDispatch } from '@/store';
import { connectToRedis, disconnectFromRedis, clearError, loadConnections } from '@/store/slices/connectionSlice';
import { RedisConnection } from '@/types/redis';
import { useAuth } from '@/hooks/useAuth';
import ErrorDialog from './ErrorDialog';

interface ConnectionSwitcherProps {
  onManageConnections: () => void;
}

const ConnectionSwitcher = ({ onManageConnections }: ConnectionSwitcherProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const pathname = usePathname();
  const { connections, activeConnection, isConnecting } = useSelector(
    (state: RootState) => state.connection
  );
  const { isAuthenticated, isHydrated } = useAuth();

  const [errorDialog, setErrorDialog] = useState<{ open: boolean; message: string }>({
    open: false,
    message: ''
  });

  // Load connections when component mounts
  useEffect(() => {
    if (isHydrated && isAuthenticated && connections.length === 0) {
      dispatch(loadConnections());
    }
  }, [dispatch, isHydrated, isAuthenticated, connections.length]);

  const handleManageConnections = () => {
    router.push('/connections');
  };

  if (!activeConnection) {
    return null;
  }

  return (
    <Box 
      onClick={handleManageConnections}
      sx={{
        cursor: 'pointer',
        '&:hover': {
          opacity: 0.8,
        },
        px: 2,
        py: 1,
      }}
    >
      <Box display="flex" alignItems="center" gap={1}>
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: activeConnection.ssl ? 'success.main' : 'primary.main',
            mr: 1,
          }}
        >
          {activeConnection.ssl ? (
            <LockIcon sx={{ fontSize: 16 }} />
          ) : (
            <LinkIcon sx={{ fontSize: 16 }} />
          )}
        </Avatar>
        <Box textAlign="left">
          <Typography variant="body2" fontWeight="medium">
            {activeConnection.name}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', lineHeight: 1.2 }}>
            {activeConnection.host}:{activeConnection.port}
          </Typography>
        </Box>
      </Box>


      {/* Error Dialog */}
      <ErrorDialog
        open={errorDialog.open}
        message={errorDialog.message}
        onClose={() => setErrorDialog({ open: false, message: '' })}
      />
    </Box>
  );
};

export default ConnectionSwitcher;
