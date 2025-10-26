'use client';

import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Stack,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useAlerts } from '@/contexts/MetricsContext';

const Alerts = () => {
  const { activeConnection } = useSelector((state: RootState) => state.connection);
  const { alerts, health, isLoading } = useAlerts();

  const getSeverityIcon = (level: string) => {
    switch (level) {
      case 'critical':
        return <ErrorIcon />;
      case 'warning':
        return <WarningIcon />;
      case 'info':
        return <InfoIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const getSeverityColor = (level: string): 'error' | 'warning' | 'info' => {
    switch (level) {
      case 'critical':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'info';
    }
  };

  // Ordenar alertas: críticos primeiro, depois warnings, depois info
  const sortedAlerts = [...alerts].sort((a, b) => {
    const levelOrder = { critical: 0, warning: 1, info: 2 };
    return levelOrder[a.level as keyof typeof levelOrder] - levelOrder[b.level as keyof typeof levelOrder];
  });

  if (!activeConnection) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100%" gap={2}>
        <Typography variant="h6" color="text.secondary">
          Nenhuma conexão Redis ativa
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Conecte-se a um servidor Redis para visualizar os alertas.
        </Typography>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
      </Box>
    );
  }

  // Empty state - Tudo OK
  if (sortedAlerts.length === 0) {
    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        justifyContent="center" 
        alignItems="center" 
        height="100%" 
        gap={3}
      >
        <CheckCircleIcon sx={{ fontSize: 120, color: 'success.main' }} />
        <Typography variant="h4" fontWeight={700} color="success.main">
          Tudo OK!
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center" maxWidth={500}>
          Nenhum alerta detectado. Seu servidor Redis está operando dentro dos parâmetros normais.
        </Typography>
        <Chip 
          label="Sistema Saudável" 
          color="success" 
          icon={<CheckCircleIcon />}
          sx={{ mt: 2 }}
        />
      </Box>
    );
  }

  const criticalCount = sortedAlerts.filter(a => a.level === 'critical').length;
  const warningCount = sortedAlerts.filter(a => a.level === 'warning').length;
  const infoCount = sortedAlerts.filter(a => a.level === 'info').length;

  return (
    <Box sx={{ height: '100%', overflow: 'auto', p: 3 }}>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Alertas do Sistema
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Monitoramento em tempo real do estado do Redis
        </Typography>
        
        {/* Summary Chips */}
        <Stack direction="row" spacing={1} mt={2}>
          {criticalCount > 0 && (
            <Chip
              icon={<ErrorIcon />}
              label={`${criticalCount} Crítico${criticalCount > 1 ? 's' : ''}`}
              color="error"
              size="small"
            />
          )}
          {warningCount > 0 && (
            <Chip
              icon={<WarningIcon />}
              label={`${warningCount} Aviso${warningCount > 1 ? 's' : ''}`}
              color="warning"
              size="small"
            />
          )}
          {infoCount > 0 && (
            <Chip
              icon={<InfoIcon />}
              label={`${infoCount} Info${infoCount > 1 ? 's' : ''}`}
              color="info"
              size="small"
            />
          )}
        </Stack>
      </Box>

      {/* Alerts List */}
      <Stack spacing={2}>
        {sortedAlerts.map((alert, index) => (
          <Card 
            key={index}
            sx={{ 
              borderLeft: 4,
              borderColor: `${getSeverityColor(alert.level)}.main`,
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="flex-start" gap={2}>
                <Box sx={{ color: `${getSeverityColor(alert.level)}.main`, mt: 0.5 }}>
                  {getSeverityIcon(alert.level)}
                </Box>
                
                <Box flex={1}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Typography variant="h6" fontWeight={600}>
                      {alert.metric}
                    </Typography>
                    <Chip 
                      label={alert.level.toUpperCase()} 
                      color={getSeverityColor(alert.level)}
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="body1" color="text.primary" gutterBottom>
                    {alert.message}
                  </Typography>
                  
                  <Box display="flex" gap={2} mt={1}>
                    <Typography variant="caption" color="text.secondary">
                      <strong>Valor Atual:</strong> {alert.value}
                    </Typography>
                    {alert.threshold && (
                      <Typography variant="caption" color="text.secondary">
                        <strong>Threshold:</strong> {alert.threshold}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
};

export default Alerts;
