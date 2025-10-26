'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  useTheme,
  Button,
  Badge,
} from '@mui/material';
import {
  Storage as StorageIcon,
  Dashboard as DashboardIcon,
  Terminal as TerminalIcon,
  Menu as MenuIcon,
  Logout as LogoutIcon,
  VpnKey as ChangePasswordIcon,
  Notifications as NotificationsIcon,
  Speed as SlowLogIcon,
  Monitor as MonitorIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useRouter, usePathname } from 'next/navigation';
import { RootState } from '@/store';
import { useAuthWithModals } from '@/hooks/useAuthWithModals';
import { useCrossTabSync } from '@/hooks/useCrossTabSync';
import { useIsClient } from '@/hooks/useIsClient';
import LoadingScreen from '@/components/LoadingScreen';
import AuthModals from '@/components/AuthModals';
import ConnectionSwitcher from '@/components/ConnectionSwitcher';
import ConnectionDialog from '@/components/ConnectionDialog';
import { MetricsProvider, useAlerts } from '@/contexts/MetricsContext';

const DRAWER_WIDTH = 240;

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const isClient = useIsClient();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false);
  
  const { activeConnection } = useSelector((state: RootState) => state.connection);
  const { alertCount } = useAlerts();
  const { 
    isAuthenticated, 
    isLoading, 
    hasPassword, 
    isHydrated,
    logoutDialogOpen,
    changePasswordDialogOpen,
    handleConfirmLogout,
    showChangePassword,
    showLogoutConfirmation,
    closeLogoutDialog,
    closeChangePasswordDialog
  } = useAuthWithModals();

  // Sincronizar mudanças de conexão entre abas
  useCrossTabSync();

  // Redirecionar para home se não estiver autenticado
  useEffect(() => {
    if (isHydrated && !isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isHydrated, isLoading, isAuthenticated, router]);

  // Redirecionar para tela de conexões se não houver conexão ativa
  useEffect(() => {
    if (isHydrated && isAuthenticated && !activeConnection) {
      router.push('/');
    }
  }, [isHydrated, isAuthenticated, activeConnection, router]);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { id: 'alerts', label: 'Alertas', icon: <NotificationsIcon />, badge: alertCount, path: '/alerts' },
    { id: 'slowlog', label: 'Slow Log', icon: <SlowLogIcon />, path: '/slowlog' },
    { id: 'browser', label: 'Keys Browser', icon: <StorageIcon />, path: '/browser' },
    { id: 'monitor', label: 'Monitor', icon: <MonitorIcon />, path: '/monitor' },
    { id: 'terminal', label: 'CLI', icon: <TerminalIcon />, path: '/terminal' },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleManageConnections = () => {
    router.push('/');
  };

  const handleNavigate = (path: string) => {
    router.push(path);
    setMobileOpen(false);
  };

  // Mostra loading até que o cliente esteja pronto
  if (!isClient || !isHydrated || isLoading) {
    return <LoadingScreen />;
  }

  // Se não está autenticado, não renderiza nada (será redirecionado)
  if (!isAuthenticated) {
    return <LoadingScreen />;
  }

  const currentMenuItem = menuItems.find(item => pathname === item.path);

  const drawer = (
    <Box>
      <Toolbar>
        <Box display="flex" alignItems="center" gap={1}>
          <DashboardIcon sx={{ color: theme.palette.primary.main }} />
          <Typography variant="h6" noWrap component="div">
            Redis Explorer
          </Typography>
        </Box>
      </Toolbar>
      <List>
        {menuItems.map((item) => (
          <ListItem
            key={item.id}
            onClick={() => handleNavigate(item.path)}
            sx={{ 
              cursor: 'pointer',
              backgroundColor: pathname === item.path ? 'action.selected' : 'transparent',
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }}
          >
            <ListItemIcon sx={{ color: 'inherit' }}>
              {item.badge !== undefined && item.badge > 0 ? (
                <Badge badgeContent={item.badge} color="error">
                  {item.icon}
                </Badge>
              ) : (
                item.icon
              )}
            </ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
      </List>
      
      <Box sx={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
        <Box display="flex" flexDirection="column" gap={1}>
          <Button
            fullWidth
            variant="outlined"
            size="small"
            startIcon={<ChangePasswordIcon />}
            onClick={showChangePassword}
          >
            Trocar Senha
          </Button>
          <Button
            fullWidth
            variant="outlined"
            size="small"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={showLogoutConfirmation}
          >
            Sair
          </Button>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { sm: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {currentMenuItem?.label || 'Redis Explorer'}
          </Typography>

          {/* Connection Switcher */}
          <ConnectionSwitcher
            key={activeConnection?.id || 'no-connection'}
            onManageConnections={handleManageConnections}
          />
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: 8,
          height: 'calc(100vh - 64px)',
          overflow: 'hidden',
        }}
      >
        {children}
      </Box>

      {/* Auth Modals (Logout + Change Password) */}
      <AuthModals
        logoutDialogOpen={logoutDialogOpen}
        changePasswordDialogOpen={changePasswordDialogOpen}
        onConfirmLogout={handleConfirmLogout}
        onCloseLogoutDialog={closeLogoutDialog}
        onCloseChangePasswordDialog={closeChangePasswordDialog}
      />

      <ConnectionDialog
        open={connectionDialogOpen}
        onClose={() => setConnectionDialogOpen(false)}
      />
    </Box>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <MetricsProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </MetricsProvider>
  );
}
