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
  Menu as MenuIcon,
  Logout as LogoutIcon,
  VpnKey as ChangePasswordIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useAuth } from '@/hooks/useAuth';
import LoadingScreen from '@/components/LoadingScreen';
import PasswordSetup from '@/components/PasswordSetup';
import LoginForm from '@/components/LoginForm';
import ChangePasswordDialog from '@/components/ChangePasswordDialog';
import ConnectionSelector from '@/components/ConnectionSelector';
import ConnectionSwitcher from '@/components/ConnectionSwitcher';
import ConnectionDialog from '@/components/ConnectionDialog';
import KeysBrowser from '@/components/KeysBrowser';
import Dashboard from '@/components/Dashboard';
import Terminal from '@/components/Terminal';
import { RedisConnection } from '@/types/redis';

const DRAWER_WIDTH = 240;

type TabType = 'browser' | 'dashboard' | 'terminal';
type AppState = 'connection-selection' | 'main-app';

export default function Home() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('browser');
  const [appState, setAppState] = useState<AppState>('connection-selection');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false);
  
  const { activeConnection } = useSelector((state: RootState) => state.connection);
  const { isAuthenticated, isLoading, hasPassword, isHydrated, logout, refreshAuth } = useAuth();


  // Effect to manage app state based on active connection
  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      if (activeConnection && appState === 'connection-selection') {
        setAppState('main-app');
      } else if (!activeConnection && appState === 'main-app') {
        setAppState('connection-selection');
      }
    }
  }, [activeConnection, appState, isHydrated, isAuthenticated]);

  // Initialize app state based on existing active connection on page load
  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      if (activeConnection) {
        setAppState('main-app');
      } else {
        setAppState('connection-selection');
      }
    }
  }, [isHydrated, isAuthenticated, activeConnection]); // Include activeConnection to react to changes

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleConnectionSuccess = (connection: RedisConnection) => {
    setAppState('main-app');
    setActiveTab('browser');
  };

  const handleManageConnections = () => {
    // This function is no longer needed since we go directly to connection selector
  };

  const menuItems = [
    { id: 'browser', label: 'Keys Browser', icon: <StorageIcon /> },
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { id: 'terminal', label: 'CLI', icon: <TerminalIcon /> },
  ];

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

  // Renderiza baseado no estado da aplicação
  if (appState === 'connection-selection') {
    return (
      <>
        <ConnectionSelector onConnectionSuccess={handleConnectionSuccess} />
        <ConnectionDialog
          open={connectionDialogOpen}
          onClose={() => setConnectionDialogOpen(false)}
        />
      </>
    );
  }

  // Renderiza a aplicação principal
  return renderMainApp();


  function renderMainApp() {
    const renderContent = () => {
      // Require active connection for all tabs
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
              Nenhuma Conexão Redis
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Por favor, conecte-se a uma instância Redis para começar a explorar
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
            
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              {menuItems.find(item => item.id === activeTab)?.label}
            </Typography>

            {/* Connection Switcher */}
            <ConnectionSwitcher
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
          {renderContent()}
        </Box>

        <ChangePasswordDialog
          open={changePasswordOpen}
          onClose={() => setChangePasswordOpen(false)}
          onSuccess={() => setChangePasswordOpen(false)}
        />

        <ConnectionDialog
          open={connectionDialogOpen}
          onClose={() => setConnectionDialogOpen(false)}
        />
      </Box>
    );
  }
}
