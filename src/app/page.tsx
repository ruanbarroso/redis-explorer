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
} from '@mui/material';
import {
  Storage as StorageIcon,
  Dashboard as DashboardIcon,
  Terminal as TerminalIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
  Logout as LogoutIcon,
  VpnKey as ChangePasswordIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useIsClient } from '@/hooks/useIsClient';
import { useAuth } from '@/hooks/useAuth';
import LoadingScreen from '@/components/LoadingScreen';
import ClientOnly from '@/components/ClientOnly';
import PasswordSetup from '@/components/PasswordSetup';
import LoginForm from '@/components/LoginForm';
import ChangePasswordDialog from '@/components/ChangePasswordDialog';
import ConnectionManager from '@/components/ConnectionManager';
import KeysBrowser from '@/components/KeysBrowser';
import Dashboard from '@/components/Dashboard';
import Terminal from '@/components/Terminal';

const DRAWER_WIDTH = 240;

type TabType = 'browser' | 'dashboard' | 'terminal' | 'settings';

export default function Home() {
  const theme = useTheme();
  const isClient = useIsClient();
  const [activeTab, setActiveTab] = useState<TabType>('settings');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  
  const { activeConnection } = useSelector((state: RootState) => state.connection);
  const { isAuthenticated, isLoading, hasPassword, isHydrated, logout, refreshAuth } = useAuth();


  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { id: 'settings', label: 'Connections', icon: <SettingsIcon /> },
    { id: 'browser', label: 'Keys Browser', icon: <StorageIcon /> },
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { id: 'terminal', label: 'CLI', icon: <TerminalIcon /> },
  ];

  return (
    <ClientOnly fallback={<LoadingScreen />}>
      {(() => {
        // Mostra loading até que a autenticação seja verificada
        if (!isHydrated || isLoading) {
          return <LoadingScreen />;
        }

        // Se não tem senha configurada, mostra tela de setup
        if (!hasPassword) {
          return <PasswordSetup onSetupComplete={refreshAuth} />;
        }

        // Se tem senha mas não está autenticado, mostra login
        if (!isAuthenticated) {
          return <LoginForm onLoginSuccess={refreshAuth} />;
        }

        // Renderiza a aplicação principal
        return renderMainApp();
      })()}
    </ClientOnly>
  );

  function renderMainApp() {
    const renderContent = () => {
      // Always allow access to settings/connections tab
      if (activeTab === 'settings') {
        return <ConnectionManager onConnectionSuccess={() => setActiveTab('browser')} />;
      }

      // For other tabs, require active connection
      if (!activeConnection) {
        return (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
            flexDirection="column"
            gap={2}
          >
            <StorageIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
            <Typography variant="h5" color="text.secondary">
              No Redis Connection
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Please connect to a Redis instance to start exploring
            </Typography>
          </Box>
        );
      }

      switch (activeTab) {
        case 'browser':
          return <KeysBrowser />;
        case 'dashboard':
          return <Dashboard />;
        case 'terminal':
          return <Terminal />;
        default:
          return <KeysBrowser />;
      }
    };

    const drawer = (
      <Box>
        <Toolbar>
          <Box display="flex" alignItems="center" gap={1}>
            <StorageIcon sx={{ color: theme.palette.primary.main }} />
            <Typography variant="h6" noWrap component="div">
              Redis Explorer
            </Typography>
          </Box>
        </Toolbar>
        <List>
          {menuItems.map((item) => (
            <ListItem
              key={item.id}
              onClick={() => setActiveTab(item.id as TabType)}
              sx={{ 
                cursor: 'pointer',
                backgroundColor: activeTab === item.id ? 'action.selected' : 'transparent',
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
            >
              <ListItemIcon sx={{ color: 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItem>
          ))}
        </List>
        
        <Box sx={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
          {activeConnection && (
            <Box
              sx={{
                p: 2,
                backgroundColor: theme.palette.background.paper,
                borderRadius: 1,
                border: `1px solid ${theme.palette.divider}`,
                mb: 2,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Connected to:
              </Typography>
              <Typography variant="body2" noWrap>
                {activeConnection.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {activeConnection.host}:{activeConnection.port}
              </Typography>
            </Box>
          )}
          
          <Box display="flex" flexDirection="column" gap={1}>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              startIcon={<ChangePasswordIcon />}
              onClick={() => setChangePasswordOpen(true)}
            >
              Trocar Senha
            </Button>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              color="error"
              startIcon={<LogoutIcon />}
              onClick={logout}
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
            <Typography variant="h6" noWrap component="div">
              {menuItems.find(item => item.id === activeTab)?.label}
            </Typography>
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
          {renderContent()}
        </Box>

        <ChangePasswordDialog
          open={changePasswordOpen}
          onClose={() => setChangePasswordOpen(false)}
          onSuccess={() => setChangePasswordOpen(false)}
        />
      </Box>
    );
  }
}
