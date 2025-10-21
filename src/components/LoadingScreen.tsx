'use client';

import { Box, CircularProgress, Typography } from '@mui/material';
import { Storage as StorageIcon } from '@mui/icons-material';

export default function LoadingScreen() {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      height="100vh"
      flexDirection="column"
      gap={2}
      sx={{ backgroundColor: '#0d1117' }}
    >
      <StorageIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
      <CircularProgress color="primary" />
      <Typography variant="h6" color="text.secondary" mt={2}>
        Loading Redis Explorer...
      </Typography>
    </Box>
  );
}
