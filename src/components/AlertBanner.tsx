'use client';

import { Alert, AlertTitle, Box, Chip, Collapse, IconButton, Typography } from '@mui/material';
import { ExpandMore as ExpandMoreIcon, Error as ErrorIcon, Warning as WarningIcon } from '@mui/icons-material';
import { useState } from 'react';
import { MetricAlert } from '@/types/metrics';

interface AlertBannerProps {
  alerts: MetricAlert[];
  health: 'healthy' | 'warning' | 'critical';
}

export const AlertBanner = ({ alerts, health }: AlertBannerProps) => {
  const [expanded, setExpanded] = useState(true);

  if (alerts.length === 0) {
    return null;
  }

  const criticalAlerts = alerts.filter(a => a.level === 'critical');
  const warningAlerts = alerts.filter(a => a.level === 'warning');
  const infoAlerts = alerts.filter(a => a.level === 'info');

  const severity = health === 'critical' ? 'error' : 'warning';
  const title = health === 'critical' ? 'Alertas Críticos Detectados' : 'Avisos de Monitoramento';

  return (
    <Alert 
      severity={severity}
      sx={{ mb: 2 }}
      action={
        <Box display="flex" alignItems="center" gap={1}>
          {criticalAlerts.length > 0 && (
            <Chip
              icon={<ErrorIcon />}
              label={`${criticalAlerts.length} Crítico${criticalAlerts.length > 1 ? 's' : ''}`}
              color="error"
              size="small"
            />
          )}
          {warningAlerts.length > 0 && (
            <Chip
              icon={<WarningIcon />}
              label={`${warningAlerts.length} Aviso${warningAlerts.length > 1 ? 's' : ''}`}
              color="warning"
              size="small"
            />
          )}
          <IconButton
            size="small"
            onClick={() => setExpanded(!expanded)}
            sx={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s',
            }}
          >
            <ExpandMoreIcon />
          </IconButton>
        </Box>
      }
    >
      <AlertTitle sx={{ fontWeight: 700 }}>{title}</AlertTitle>
      
      <Collapse in={expanded}>
        <Box component="ul" sx={{ m: 0, pl: 2, mt: 1 }}>
          {/* Critical Alerts First */}
          {criticalAlerts.map((alert, index) => (
            <Box component="li" key={`critical-${index}`} sx={{ mb: 0.5 }}>
              <Typography variant="body2" fontWeight={600} color="error.main">
                <strong>{alert.metric}:</strong> {alert.message}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Valor: {alert.value} | Threshold: {alert.threshold}
              </Typography>
            </Box>
          ))}

          {/* Warning Alerts */}
          {warningAlerts.map((alert, index) => (
            <Box component="li" key={`warning-${index}`} sx={{ mb: 0.5 }}>
              <Typography variant="body2" fontWeight={500}>
                <strong>{alert.metric}:</strong> {alert.message}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Valor: {alert.value} | Threshold: {alert.threshold}
              </Typography>
            </Box>
          ))}

          {/* Info Alerts */}
          {infoAlerts.map((alert, index) => (
            <Box component="li" key={`info-${index}`} sx={{ mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>{alert.metric}:</strong> {alert.message}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Valor: {alert.value}
              </Typography>
            </Box>
          ))}
        </Box>
      </Collapse>
    </Alert>
  );
};
