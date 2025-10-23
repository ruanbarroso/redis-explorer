'use client';

import { Box, CircularProgress, Typography } from '@mui/material';
import { Storage as StorageIcon } from '@mui/icons-material';

export default function LoadingScreen() {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: 2,
        backgroundColor: '#0d1117'
      }}
    >
      <StorageIcon sx={{ fontSize: 64, color: '#1976d2', mb: 2 }} />
      <CircularProgress sx={{ color: '#1976d2' }} />
      <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.7)', mt: 2 }}>
        Loading Redis Explorer...
      </Typography>
    </Box>
  );
}
