'use client';

import { usePathname } from 'next/navigation';
import { Box } from '@mui/material';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAppRoute = pathname.startsWith('/app');

  if (!isAppRoute) {
    return <>{children}</>;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        width: '100%',
        overflow: 'hidden',
      }}
      className={inter.className}
    >
      {children}
    </Box>
  );
}
