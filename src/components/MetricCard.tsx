'use client';

import { ReactNode } from 'react';
import { Box, Card, CardContent, Typography, Tooltip, IconButton, Skeleton } from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';
import { ChartableMetricName } from '@/types/metrics-history';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  tooltip: string;
  loading?: boolean;
  badge?: ReactNode;
  metricName?: ChartableMetricName;
  onClick?: () => void;
}

export const MetricCard = ({
  title,
  value,
  subtitle,
  icon,
  color = 'primary',
  tooltip,
  loading = false,
  badge,
  metricName,
  onClick,
}: MetricCardProps) => {
  const isClickable = !!metricName && !!onClick;

  if (loading) {
    return (
      <Card sx={{ height: '100%', minHeight: 140 }}>
        <CardContent sx={{ p: 2 }}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <Skeleton variant="circular" width={24} height={24} />
            <Skeleton variant="text" width="60%" height={24} />
          </Box>
          <Skeleton variant="text" width="80%" height={48} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="50%" height={20} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        height: '100%',
        minHeight: 140,
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'all 0.2s ease-in-out',
        '&:hover': isClickable
          ? {
              transform: 'translateY(-4px)',
              boxShadow: 4,
            }
          : {},
      }}
      onClick={isClickable ? onClick : undefined}
    >
      <CardContent sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          <Box display="flex" alignItems="center" gap={1}>
            <Box color={`${color}.main`}>{icon}</Box>
            <Typography variant="subtitle2" fontWeight={600}>
              {title}
            </Typography>
          </Box>
          <Tooltip title={tooltip} arrow placement="top">
            <IconButton size="small" sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}>
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Box flex={1} display="flex" flexDirection="column" justifyContent="center">
          <Typography variant="h4" color={`${color}.main`} fontWeight={700}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {subtitle}
            </Typography>
          )}
        </Box>

        {badge && <Box mt={1}>{badge}</Box>}
      </CardContent>
    </Card>
  );
};

export const MetricCardSkeleton = () => (
  <Card sx={{ height: '100%', minHeight: 140 }}>
    <CardContent sx={{ p: 2 }}>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <Skeleton variant="circular" width={24} height={24} />
        <Skeleton variant="text" width="60%" height={24} />
      </Box>
      <Skeleton variant="text" width="80%" height={48} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="50%" height={20} />
    </CardContent>
  </Card>
);
