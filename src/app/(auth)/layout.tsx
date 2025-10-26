'use client';

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import { theme } from '@/theme';
import EmotionCacheProvider from '@/lib/emotion-cache';
import { useEffect, useState } from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  // Evita a hidratação até que o componente esteja montado no cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.palette.background.default
      }}>
        {/* Pode adicionar um spinner de carregamento aqui se quiser */}
      </div>
    );
  }

  return (
    <div 
      style={{
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '1rem'
      }}
    >
      <EmotionCacheProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Box
            sx={{
              width: '100%',
              maxWidth: 420,
              margin: '0 auto',
              padding: 3,
            }}
          >
            {children}
          </Box>
        </ThemeProvider>
      </EmotionCacheProvider>
    </div>
  );
}
