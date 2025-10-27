'use client';

import { Box } from '@mui/material';

export default function LoadingScreen() {
  return (
    <Box 
      sx={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw', 
        height: '100vh', 
        backgroundColor: 'background.default',
        zIndex: 9999, // Garante que fique por cima de tudo
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    />
  );
}
